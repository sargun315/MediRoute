from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class PatientProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "patient_profiles"
    __table_args__ = (Index("ix_patient_profiles_city", "city"),)

    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32))
    city: Mapped[str | None] = mapped_column(String(100))

    user: Mapped["User"] = relationship(back_populates="patient_profile")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient")
    queue_tokens: Mapped[list["QueueToken"]] = relationship(back_populates="patient")


from app.models.appointment import Appointment  # noqa: E402
from app.models.queue import QueueToken  # noqa: E402
from app.models.user import User  # noqa: E402

