import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Response(Base):
    __tablename__ = "responses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    question: Mapped["Question"] = relationship("Question", back_populates="response")
    feedback: Mapped["Feedback"] = relationship("Feedback", back_populates="response", uselist=False, cascade="all, delete-orphan")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    response_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("responses.id", ondelete="CASCADE"), unique=True, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)  # e.g., Score out of 100
    critique: Mapped[str] = mapped_column(Text, nullable=False)  # AI review of the user answer
    suggestions: Mapped[str] = mapped_column(Text, nullable=True)  # How to improve the answer (e.g. code snippets)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    response: Mapped["Response"] = relationship("Response", back_populates="feedback")
