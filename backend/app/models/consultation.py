from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.db.base import Base
from app.models.enums import ConsultationStatus, enum_column
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Consultation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "consultations"
    __table_args__ = (CheckConstraint("ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at", name="valid_session_times"),)

    appointment_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("appointments.id", ondelete="RESTRICT"), nullable=False, unique=True
    )
    status: Mapped[ConsultationStatus] = mapped_column(
        enum_column(ConsultationStatus, "consultation_status"), nullable=False, default=ConsultationStatus.SCHEDULED
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    appointment: Mapped["Appointment"] = relationship(back_populates="consultation")

    @validates("started_at", "ended_at")
    def validate_utc_timestamp(self, _key: str, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Consultation timestamps must include a timezone.")
        return value.astimezone(timezone.utc)


from app.models.appointment import Appointment  # noqa: E402

