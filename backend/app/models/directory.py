from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Doctor(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "doctors"
    __table_args__ = (
        CheckConstraint("experience_years IS NULL OR experience_years >= 0", name="experience_nonnegative"),
        Index("ix_doctors_specialization_active", "specialization", "is_active"),
        Index("ix_doctors_display_name", "display_name"),
    )

    user_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), unique=True
    )
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    specialization: Mapped[str] = mapped_column(String(120), nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(240))
    experience_years: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    user: Mapped["User | None"] = relationship(back_populates="doctor_profile")
    hospitals: Mapped[list["DoctorHospital"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan", passive_deletes=True
    )
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")
    visits: Mapped[list["DoctorVisit"]] = relationship(back_populates="doctor")


class Hospital(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "hospitals"
    __table_args__ = (
        Index("ix_hospitals_name", "name"),
        Index("ix_hospitals_city_active", "city", "is_active"),
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(32))
    timezone_name: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC", server_default="UTC")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    doctors: Mapped[list["DoctorHospital"]] = relationship(
        back_populates="hospital", cascade="all, delete-orphan", passive_deletes=True
    )
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="hospital")
    queues: Mapped[list["HospitalQueue"]] = relationship(back_populates="hospital")
    visits: Mapped[list["DoctorVisit"]] = relationship(back_populates="hospital")


class Pharmacy(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "pharmacies"
    __table_args__ = (Index("ix_pharmacies_city_active", "city", "is_active"), Index("ix_pharmacies_name", "name"))

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")


class DoctorHospital(Base):
    __tablename__ = "doctor_hospitals"

    doctor_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), primary_key=True
    )
    hospital_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"), primary_key=True
    )
    department: Mapped[str | None] = mapped_column(String(120))

    doctor: Mapped[Doctor] = relationship(back_populates="hospitals")
    hospital: Mapped[Hospital] = relationship(back_populates="doctors")


from app.models.appointment import Appointment  # noqa: E402
from app.models.queue import HospitalQueue  # noqa: E402
from app.models.representative import DoctorVisit  # noqa: E402
from app.models.user import User  # noqa: E402

