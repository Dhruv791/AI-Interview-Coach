import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="resumes")
    analysis: Mapped["ResumeAnalysis"] = relationship("ResumeAnalysis", back_populates="resume", uselist=False, cascade="all, delete-orphan")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resume_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False)
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False)
    strengths: Mapped[list | dict] = mapped_column(JSON, nullable=True)  # List of strengths
    weaknesses: Mapped[list | dict] = mapped_column(JSON, nullable=True)  # List of weaknesses
    recommendations: Mapped[list | dict] = mapped_column(JSON, nullable=True)  # List of improvement steps
    raw_analysis: Mapped[dict] = mapped_column(JSON, nullable=True)  # Entire raw JSON from Gemini
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="analysis")
