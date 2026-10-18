"""Import all mappings so SQLAlchemy and Alembic see the complete schema."""

from app.db.base import Base
from app.models.appointment import Appointment
from app.models.consultation import Consultation
from app.models.directory import Doctor, DoctorHospital, Hospital, Pharmacy
from app.models.enums import (
    AppointmentStatus,
    ConsultationStatus,
    ConsultationType,
    QueueStatus,
    QueueTokenStatus,
    UserRole,
    VisitStatus,
)
from app.models.patient import PatientProfile
from app.models.queue import HospitalQueue, QueueToken
from app.models.representative import DoctorVisit, MedicalRepresentativeProfile
from app.models.user import User

__all__ = [
    "Appointment",
    "AppointmentStatus",
    "Base",
    "Consultation",
    "ConsultationStatus",
    "ConsultationType",
    "Doctor",
    "DoctorHospital",
    "DoctorVisit",
    "Hospital",
    "HospitalQueue",
    "MedicalRepresentativeProfile",
    "PatientProfile",
    "Pharmacy",
    "QueueStatus",
    "QueueToken",
    "QueueTokenStatus",
    "User",
    "UserRole",
    "VisitStatus",
]
