import uuid
import time
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


# ── In-Memory IP Rate Limiter for Guest Creation ──────────────────────────────
class IPRateLimiter:
    """Thread-safe sliding-window rate limiter by client IP address."""
    def __init__(self, max_requests: int = 5, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = Lock()

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        with self.lock:
            # Drop timestamps older than the sliding window
            self.requests[ip] = [t for t in self.requests[ip] if now - t < self.window_seconds]
            if len(self.requests[ip]) >= self.max_requests:
                return False
            self.requests[ip].append(now)
            return True

guest_rate_limiter = IPRateLimiter(max_requests=5, window_seconds=3600)

def get_client_ip(request: Request) -> str:
    """Extract real client IP from headers or connection."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


# ── Schemas ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class ConvertGuestRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_guest: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email + password."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must be at least 8 characters.",
        )

    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_guest=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.post("/guest", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def continue_as_guest(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Creates an anonymous guest user and issues a 24-hour JWT token.
    Rate-limited by IP address (max 5 accounts per hour) to prevent abuse.
    """
    client_ip = get_client_ip(request)
    if not guest_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Guest creation limit reached for your IP address (max 5 per hour). Please sign in or register.",
        )

    guest_hex = uuid.uuid4().hex[:6]
    guest_user = User(
        id=uuid.uuid4(),
        email=f"guest_{guest_hex}@{guest_hex}.guest.local",
        hashed_password=None,
        full_name=f"Guest-{guest_hex.upper()}",
        is_guest=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(guest_user)
    db.commit()
    db.refresh(guest_user)

    # Issue a 24-hour JWT token aligned with data expiry
    token = create_access_token(
        subject=str(guest_user.id),
        expires_delta=timedelta(hours=24),
    )
    return TokenResponse(access_token=token)


@router.post("/convert-guest", response_model=TokenResponse)
def convert_guest_to_registered(
    payload: ConvertGuestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Converts an active guest account into a permanent registered account,
    preserving all previous mock interview records, resumes, and scores.
    """
    if not current_user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current account is already a registered account.",
        )

    # Check if target email is already taken by another account
    existing = db.query(User).filter(
        User.email == payload.email,
        User.id != current_user.id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must be at least 8 characters.",
        )

    # Update user record in-place to preserve foreign key linkages
    current_user.email = payload.email
    current_user.hashed_password = hash_password(payload.password)
    if payload.full_name:
        current_user.full_name = payload.full_name
    current_user.is_guest = False
    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)

    # Issue permanent long-lived token
    token = create_access_token(subject=str(current_user.id))
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login with email + password (OAuth2 form). Returns JWT."""
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)
