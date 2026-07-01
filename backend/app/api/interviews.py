import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.interview import Interview, Question
from app.models.feedback import Response, Feedback
from app.services.interview_service import generate_interview_questions, evaluate_candidate_response

router = APIRouter(prefix="/interviews", tags=["interviews"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class StartInterviewRequest(BaseModel):
    category: str = Field(..., description="e.g. Frontend, Backend, HR, Full Stack, DSA")
    difficulty: str = Field(..., description="e.g. Easy, Medium, Hard")


class FeedbackOut(BaseModel):
    id: uuid.UUID
    score: int
    critique: str
    suggestions: Optional[str]

    class Config:
        from_attributes = True


class ResponseOut(BaseModel):
    id: uuid.UUID
    user_answer: str
    feedback: Optional[FeedbackOut] = None

    class Config:
        from_attributes = True


class QuestionOut(BaseModel):
    id: uuid.UUID
    question_text: str
    suggested_answer: Optional[str] = None
    order_index: int
    response: Optional[ResponseOut] = None

    class Config:
        from_attributes = True


class InterviewOut(BaseModel):
    id: uuid.UUID
    category: str
    difficulty: str
    overall_score: Optional[int]
    overall_feedback: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True


class SubmitResponseRequest(BaseModel):
    user_answer: str = Field(..., min_length=5, description="The answer text provided by candidate")


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/", response_model=InterviewOut, status_code=status.HTTP_201_CREATED)
def start_new_interview(
    payload: StartInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initialize a new mock interview session, bulk generating questions.
    """
    try:
        generated = generate_interview_questions(payload.category, payload.difficulty, count=5)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )

    # 1. Create Interview Session Record
    session = Interview(
        id=uuid.uuid4(),
        user_id=current_user.id,
        category=payload.category,
        difficulty=payload.difficulty,
        created_at=datetime.utcnow()
    )
    db.add(session)
    db.flush()

    # 2. Add Generated Questions
    for index, item in enumerate(generated):
        q = Question(
            id=uuid.uuid4(),
            interview_id=session.id,
            question_text=item["question_text"],
            suggested_answer=item["suggested_answer"],
            order_index=index
        )
        db.add(q)

    db.commit()
    db.refresh(session)
    return session


@router.get("/", response_model=List[InterviewOut])
def get_user_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all interview sessions belonging to the user.
    """
    sessions = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )
    return sessions


@router.get("/{interview_id}", response_model=InterviewOut)
def get_interview_details(
    interview_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch all details of a specific interview session.
    """
    session = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found."
        )

    return session


@router.post("/questions/{question_id}/response", response_model=ResponseOut)
def submit_question_response(
    question_id: uuid.UUID,
    payload: SubmitResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an answer for a specific question, grading it immediately using Gemini.
    Validates session ownership and prevents duplicate submissions.
    """
    # 1. Fetch question and check association/ownership
    question = db.query(Question).join(Interview).filter(
        Question.id == question_id,
        Interview.user_id == current_user.id
    ).first()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found or access denied."
        )

    # 2. Check if a response already exists
    existing_resp = db.query(Response).filter(Response.question_id == question_id).first()
    if existing_resp:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An answer has already been submitted for this question."
        )

    # 3. Call AI evaluation engine
    try:
        evaluation = evaluate_candidate_response(
            question=question.question_text,
            suggested_answer=question.suggested_answer or "",
            user_answer=payload.user_answer
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )

    # 4. Save Response + Feedback records
    user_response = Response(
        id=uuid.uuid4(),
        question_id=question_id,
        user_answer=payload.user_answer,
        created_at=datetime.utcnow()
    )
    db.add(user_response)
    db.flush()

    ai_feedback = Feedback(
        id=uuid.uuid4(),
        response_id=user_response.id,
        score=evaluation["score"],
        critique=evaluation["critique"],
        suggestions=evaluation["suggestions"],
        created_at=datetime.utcnow()
    )
    db.add(ai_feedback)

    db.commit()
    db.refresh(user_response)

    return user_response


@router.post("/{interview_id}/complete", response_model=InterviewOut)
def complete_interview_session(
    interview_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Wrap up the interview, calculate average scores, and mark completion.
    """
    session = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found."
        )

    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview session is already marked completed."
        )

    # Gather all scores
    scores = []
    for q in session.questions:
        if q.response and q.response.feedback:
            scores.append(q.response.feedback.score)

    avg_score = int(sum(scores) / len(scores)) if scores else 0

    session.overall_score = avg_score
    session.completed_at = datetime.utcnow()

    # Dynamic summary generation based on scoring
    if avg_score >= 80:
        session.overall_feedback = "Exceptional performance! You demonstrated clear technical mastery, excellent conceptual structuring, and detailed answers across the board. You are well prepared for actual job interviews."
    elif avg_score >= 60:
        session.overall_feedback = "Solid baseline performance. You display good conceptual grasp but missed key metrics or implementation details in a few areas. Focus on adding direct examples or practical syntax in your answers."
    else:
        session.overall_feedback = "Needs review. There are noticeable gaps in details or terminology. Go through the specific suggestions for each question, optimize your explanations, and try a lower difficulty session to practice."

    db.commit()
    db.refresh(session)
    return session
