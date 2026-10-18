from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Uuid, func, text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.db.base import Base
from app.models.enums import AppointmentStatus, ConsultationType, enum_column
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


ACTIVE_APPOINTMENT_SQL = "status IN ('pending', 'scheduled', 'confirmed')"


class Appointment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "appointments"
    __table_args__ = (
        CheckConstraint("ends_at > starts_at", name="end_after_start"),
        CheckConstraint("doctor_id IS NOT NULL OR hospital_id IS NOT NULL", name="provider_required"),
        Index("ix_appointments_patient_start", "patient_id", "starts_at"),
        Index("ix_appointments_doctor_start", "doctor_id", "starts_at"),
        Index("ix_appointments_hospital_start", "hospital_id", "starts_at"),
        ExcludeConstraint(
            ("patient_id", "="),
            (text("tstzrange(starts_at, ends_at, '[)')"), "&&"),
            where=text(ACTIVE_APPOINTMENT_SQL),
            using="gist",
            name="excl_appointments_patient_active_time",
        ).ddl_if(dialect="postgresql"),
        ExcludeConstraint(
            ("doctor_id", "="),
            (text("tstzrange(starts_at, ends_at, '[)')"), "&&"),
            where=text(f"doctor_id IS NOT NULL AND {ACTIVE_APPOINTMENT_SQL}"),
            using="gist",
            name="excl_appointments_doctor_active_time",
        ).ddl_if(dialect="postgresql"),
        ExcludeConstraint(
            ("hospital_id", "="),
            (text("tstzrange(starts_at, ends_at, '[)')"), "&&"),
            where=text(f"doctor_id IS NULL AND hospital_id IS NOT NULL AND {ACTIVE_APPOINTMENT_SQL}"),
            using="gist",
            name="excl_appointments_hospital_only_active_time",
        ).ddl_if(dialect="postgresql"),
    )

    patient_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patient_profiles.id", ondelete="RESTRICT"), nullable=False
    )
    doctor_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("doctors.id", ondelete="RESTRICT"))
    hospital_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="RESTRICT")
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consultation_type: Mapped[ConsultationType] = mapped_column(
        enum_column(ConsultationType, "consultation_type"), nullable=False
    )
    status: Mapped[AppointmentStatus] = mapped_column(
        enum_column(AppointmentStatus, "appointment_status"), nullable=False, default=AppointmentStatus.PENDING
    )

    patient: Mapped["PatientProfile"] = relationship(back_populates="appointments")
    doctor: Mapped["Doctor | None"] = relationship(back_populates="appointments")
    hospital: Mapped["Hospital | None"] = relationship(back_populates="appointments")
    consultation: Mapped["Consultation | None"] = relationship(back_populates="appointment", uselist=False)

    @validates("starts_at", "ends_at")
    def validate_utc_datetime(self, _key: str, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Appointment timestamps must include a timezone.")
        return value.astimezone(timezone.utc)


from app.models.consultation import Consultation  # noqa: E402
from app.models.directory import Doctor, Hospital  # noqa: E402
from app.models.patient import PatientProfile  # noqa: E402
