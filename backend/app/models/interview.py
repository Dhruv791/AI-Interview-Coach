import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # DSA, Frontend, Backend, HR, Full Stack
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)  # Easy, Medium, Hard
    overall_score: Mapped[int] = mapped_column(Integer, nullable=True)  # Populates after complete
    overall_feedback: Mapped[str] = mapped_column(Text, nullable=True)  # Overall AI review summary
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="interviews")
    questions: Mapped[list["Question"]] = relationship("Question", back_populates="interview", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    interview_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_answer: Mapped[str] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    interview: Mapped["Interview"] = relationship("Interview", back_populates="questions")
    response: Mapped["Response"] = relationship("Response", back_populates="question", uselist=False, cascade="all, delete-orphan")
