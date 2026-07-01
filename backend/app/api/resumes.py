import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume, ResumeAnalysis
from app.services.gemini import analyze_resume

try:
    from pypdf import PdfReader
except ImportError:
    from PyPDF2 import PdfReader  # fallback

import io

router = APIRouter(prefix="/resumes", tags=["resumes"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class AnalysisOut(BaseModel):
    id: uuid.UUID
    ats_score: int
    strengths: list
    weaknesses: list
    recommendations: list
    analyzed_at: datetime

    class Config:
        from_attributes = True


class ResumeOut(BaseModel):
    id: uuid.UUID
    file_name: str
    uploaded_at: datetime
    analysis: Optional[AnalysisOut] = None

    class Config:
        from_attributes = True


# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF byte stream."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    return "\n".join(text_parts)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF resume, extract text, run Gemini analysis, save to DB."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="File size must be under 5 MB.",
        )

    # Extract text from PDF
    try:
        resume_text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Could not read PDF: {e}",
        )

    if not resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="PDF appears to be empty or image-only (no extractable text).",
        )

    # Save resume record
    resume = Resume(
        id=uuid.uuid4(),
        user_id=current_user.id,
        file_name=file.filename,
        file_url=None,  # No cloud storage yet
        uploaded_at=datetime.utcnow(),
    )
    db.add(resume)
    db.flush()  # get resume.id without committing

    # Run Gemini analysis
    try:
        analysis_data = analyze_resume(resume_text)
    except RuntimeError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )

    analysis = ResumeAnalysis(
        id=uuid.uuid4(),
        resume_id=resume.id,
        ats_score=analysis_data["ats_score"],
        strengths=analysis_data["strengths"],
        weaknesses=analysis_data["weaknesses"],
        recommendations=analysis_data["recommendations"],
        raw_analysis=analysis_data,
        analyzed_at=datetime.utcnow(),
    )
    db.add(analysis)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("/", response_model=List[ResumeOut])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all resumes for the current user, most recent first."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )
    return resumes


@router.get("/{resume_id}", response_model=ResumeOut)
def get_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single resume with its analysis."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a resume and its analysis."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    db.delete(resume)
    db.commit()
