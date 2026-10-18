import secrets
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.db.base import Base
from app.models.enums import QueueStatus, QueueTokenStatus, enum_column
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


def create_token_reference() -> str:
    return secrets.token_urlsafe(32)


class HospitalQueue(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "hospital_queues"
    __table_args__ = (
        UniqueConstraint("hospital_id", "department", "service_date", name="uq_queue_hospital_dept_date"),
        UniqueConstraint("id", "hospital_id", "department", "service_date", name="uq_queue_composite_reference"),
        CheckConstraint("last_token_number >= 0", name="last_token_nonnegative"),
        Index("ix_hospital_queues_hospital_date", "hospital_id", "service_date"),
    )

    hospital_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="RESTRICT"), nullable=False
    )
    department: Mapped[str] = mapped_column(String(120), nullable=False)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    last_token_number: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    status: Mapped[QueueStatus] = mapped_column(
        enum_column(QueueStatus, "hospital_queue_status"), nullable=False, default=QueueStatus.OPEN
    )

    hospital: Mapped["Hospital"] = relationship(back_populates="queues")
    tokens: Mapped[list["QueueToken"]] = relationship(back_populates="queue")


class QueueToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "queue_tokens"
    __table_args__ = (
        ForeignKeyConstraint(
            ["queue_id", "hospital_id", "department", "service_date"],
            ["hospital_queues.id", "hospital_queues.hospital_id", "hospital_queues.department", "hospital_queues.service_date"],
            ondelete="RESTRICT",
            name="fk_queue_token_scope",
        ),
        UniqueConstraint("token_number", "queue_id", name="uq_queue_token_number_in_queue"),
        CheckConstraint("token_number > 0", name="token_number_positive"),
        CheckConstraint("length(token_reference) >= 32", name="token_reference_min_length"),
        Index("ix_queue_tokens_patient_created", "patient_id", "created_at"),
        Index("ix_queue_tokens_queue_status", "queue_id", "status"),
        Index(
            "uq_queue_tokens_patient_active_queue",
            "patient_id",
            "queue_id",
            unique=True,
            postgresql_where=text("status IN ('waiting', 'called')"),
            sqlite_where=text("status IN ('waiting', 'called')"),
        ),
    )

    queue_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    patient_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patient_profiles.id", ondelete="RESTRICT"), nullable=False
    )
    hospital_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="RESTRICT"), nullable=False
    )
    department: Mapped[str] = mapped_column(String(120), nullable=False)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    token_reference: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True, default=create_token_reference
    )
    token_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[QueueTokenStatus] = mapped_column(
        enum_column(QueueTokenStatus, "queue_token_status"), nullable=False, default=QueueTokenStatus.WAITING
    )
    called_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    queue: Mapped[HospitalQueue] = relationship(back_populates="tokens")
    patient: Mapped["PatientProfile"] = relationship(back_populates="queue_tokens")
    hospital: Mapped["Hospital"] = relationship(foreign_keys=[hospital_id], viewonly=True)

    @validates("called_at", "completed_at")
    def validate_utc_timestamp(self, _key: str, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Queue timestamps must include a timezone.")
        return value.astimezone(timezone.utc)


from app.models.directory import Hospital  # noqa: E402
from app.models.patient import PatientProfile  # noqa: E402
