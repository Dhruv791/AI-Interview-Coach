from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.interview import Interview
from app.models.resume import Resume

router = APIRouter(prefix="/users", tags=["users"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_guest: bool = False
    interviews_remaining: Optional[int] = None
    resumes_remaining: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the profile of the currently authenticated user with quota limits if guest."""
    user_out = UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_guest=current_user.is_guest,
        created_at=current_user.created_at,
    )
    if current_user.is_guest:
        int_count = db.query(Interview).filter(Interview.user_id == current_user.id).count()
        res_count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
        user_out.interviews_remaining = max(0, 2 - int_count)
        user_out.resumes_remaining = max(0, 2 - res_count)
    return user_out


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update name or avatar of the currently authenticated user."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    user_out = UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_guest=current_user.is_guest,
        created_at=current_user.created_at,
    )
    return user_out
