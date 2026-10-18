from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.db.base import Base
from app.models.enums import VisitStatus, enum_column
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class MedicalRepresentativeProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "medical_representative_profiles"

    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    organization_name: Mapped[str] = mapped_column(String(180), nullable=False)
    employee_reference: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    region: Mapped[str] = mapped_column(String(120), nullable=False)

    user: Mapped["User"] = relationship(back_populates="representative_profile")
    visits: Mapped[list["DoctorVisit"]] = relationship(back_populates="representative")


class DoctorVisit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "doctor_visits"
    __table_args__ = (Index("ix_doctor_visits_rep_time", "representative_id", "visited_at"),)

    representative_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("medical_representative_profiles.id", ondelete="RESTRICT"), nullable=False
    )
    doctor_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False
    )
    hospital_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="RESTRICT")
    )
    visited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[VisitStatus] = mapped_column(
        enum_column(VisitStatus, "doctor_visit_status"), nullable=False, default=VisitStatus.SCHEDULED
    )

    representative: Mapped[MedicalRepresentativeProfile] = relationship(back_populates="visits")
    doctor: Mapped["Doctor"] = relationship(back_populates="visits")
    hospital: Mapped["Hospital | None"] = relationship(back_populates="visits")

    @validates("visited_at")
    def validate_utc_timestamp(self, _key: str, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Visit timestamps must include a timezone.")
        return value.astimezone(timezone.utc)


from app.models.directory import Doctor, Hospital  # noqa: E402
from app.models.user import User  # noqa: E402

