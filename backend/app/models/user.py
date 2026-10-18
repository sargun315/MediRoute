from sqlalchemy import Boolean, CheckConstraint, Index, String, Uuid, event, func
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.db.base import Base
from app.models.enums import UserRole, enum_column
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email = lower(email)", name="email_normalized"),
        Index("ix_users_role_active", "role", "is_active"),
    )

    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(enum_column(UserRole, "user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    patient_profile: Mapped["PatientProfile | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True, uselist=False
    )
    doctor_profile: Mapped["Doctor | None"] = relationship(back_populates="user", uselist=False)
    representative_profile: Mapped["MedicalRepresentativeProfile | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True, uselist=False
    )

    @validates("email")
    def normalize_email(self, _key: str, value: str) -> str:
        return value.strip().lower()


from app.models.directory import Doctor  # noqa: E402
from app.models.patient import PatientProfile  # noqa: E402
from app.models.representative import MedicalRepresentativeProfile  # noqa: E402

