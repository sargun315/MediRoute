from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.core.security import DUMMY_PASSWORD_HASH, create_access_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.patient import PatientProfile
from app.models.user import User
from app.schemas.auth import AccessTokenResponse, LoginRequest, RegisterRequest, UserPublic

router = APIRouter()


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DbSession) -> User:
    """Public registration creates patient accounts only; staff roles are provisioned separately."""
    if db.scalar(select(User.id).where(User.email == payload.email)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.PATIENT,
        patient_profile=PatientProfile(full_name=payload.full_name, phone=payload.phone),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Also covers the race where concurrent requests pass the pre-check.
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.") from None
    db.refresh(user)
    return user


@router.post("/login", response_model=AccessTokenResponse)
def login(payload: LoginRequest, db: DbSession) -> AccessTokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None:
        verify_password(payload.password, DUMMY_PASSWORD_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        access_token, expires_in = create_access_token(user.id)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is temporarily unavailable.",
        ) from None
    return AccessTokenResponse(access_token=access_token, expires_in=expires_in, user=user)


@router.get("/me", response_model=UserPublic)
def read_current_user(current_user: CurrentUser) -> User:
    return current_user
