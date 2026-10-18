from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError, StatementError
from sqlalchemy.orm import configure_mappers

from app.db.base import Base
from app.models import (
    Appointment,
    AppointmentStatus,
    Consultation,
    ConsultationType,
    Doctor,
    DoctorHospital,
    Hospital,
    HospitalQueue,
    PatientProfile,
    QueueToken,
    QueueTokenStatus,
    User,
    UserRole,
)


EXPECTED_TABLES = {
    "users", "patient_profiles", "doctors", "hospitals", "pharmacies",
    "doctor_hospitals", "appointments", "hospital_queues", "queue_tokens",
    "medical_representative_profiles", "doctor_visits", "consultations",
}


def make_patient(session, email="sample.patient@example.test"):
    user = User(email=email, password_hash="test-only-placeholder-hash", role=UserRole.PATIENT)
    user.patient_profile = PatientProfile(full_name="Fictional Sample Patient")
    session.add(user)
    session.flush()
    return user.patient_profile


def test_all_models_registered_and_relationships_configure():
    assert set(Base.metadata.tables) == EXPECTED_TABLES
    configure_mappers()
    assert inspect(User).relationships.patient_profile.uselist is False
    assert inspect(Appointment).relationships.consultation.uselist is False
    assert inspect(Consultation).relationships.appointment.uselist is False


def test_user_email_is_normalized_and_unique(db_session):
    db_session.add(User(email="  SAMPLE@EXAMPLE.TEST ", password_hash="fictional-hash", role=UserRole.PATIENT))
    db_session.flush()
    assert db_session.query(User).one().email == "sample@example.test"
    db_session.add(User(email="sample@example.test", password_hash="fictional-hash", role=UserRole.PATIENT))
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_doctor_hospital_pair_is_unique(db_session):
    doctor = Doctor(display_name="Sample Clinician", specialization="General practice")
    hospital = Hospital(name="Sample Clinic", address="1 Example Rd", city="Sample City")
    db_session.add_all([doctor, hospital])
    db_session.flush()
    db_session.add(DoctorHospital(doctor_id=doctor.id, hospital_id=hospital.id))
    db_session.flush()
    db_session.add(DoctorHospital(doctor_id=doctor.id, hospital_id=hospital.id))
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_appointment_interval_constraint(db_session):
    patient = make_patient(db_session)
    doctor = Doctor(display_name="Sample Clinician", specialization="General practice")
    db_session.add(doctor)
    db_session.flush()
    starts = datetime.now(timezone.utc) + timedelta(days=2)
    invalid = Appointment(
        patient_id=patient.id, doctor_id=doctor.id, starts_at=starts,
        ends_at=starts, consultation_type=ConsultationType.ONLINE,
    )
    db_session.add(invalid)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


def test_appointment_status_constraint(db_session):
    patient = make_patient(db_session)
    doctor = Doctor(display_name="Sample Clinician", specialization="General practice")
    db_session.add(doctor)
    db_session.flush()
    starts = datetime.now(timezone.utc) + timedelta(days=2)
    invalid_status = Appointment(
        patient_id=patient.id, doctor_id=doctor.id, starts_at=starts,
        ends_at=starts + timedelta(minutes=30), consultation_type=ConsultationType.ONLINE,
        status="invented",
    )
    db_session.add(invalid_status)
    with pytest.raises((IntegrityError, LookupError, ValueError, StatementError)):
        db_session.flush()
    assert AppointmentStatus.PENDING.value == "pending"


def test_queue_token_reference_and_number_constraints(db_session):
    patient = make_patient(db_session)
    hospital = Hospital(name="Sample Clinic", address="1 Example Rd", city="Sample City")
    db_session.add(hospital)
    db_session.flush()
    queue = HospitalQueue(hospital_id=hospital.id, department="General", service_date=date.today())
    db_session.add(queue)
    db_session.flush()
    first = QueueToken(
        queue_id=queue.id, patient_id=patient.id, hospital_id=hospital.id,
        department="General", service_date=date.today(), token_number=1,
        token_reference="A" * 40, status=QueueTokenStatus.WAITING,
    )
    db_session.add(first)
    db_session.flush()
    duplicate_reference = QueueToken(
        queue_id=queue.id, patient_id=patient.id, hospital_id=hospital.id,
        department="General", service_date=date.today(), token_number=2,
        token_reference="A" * 40,
    )
    db_session.add(duplicate_reference)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


def test_queue_token_number_unique_in_queue(db_session):
    patient_a = make_patient(db_session)
    patient_b = make_patient(db_session, "other.patient@example.test")
    hospital = Hospital(name="Sample Clinic", address="1 Example Rd", city="Sample City")
    db_session.add(hospital)
    db_session.flush()
    queue = HospitalQueue(hospital_id=hospital.id, department="General", service_date=date.today())
    db_session.add(queue)
    db_session.flush()
    for patient in (patient_a, patient_b):
        db_session.add(QueueToken(
            queue_id=queue.id, patient_id=patient.id, hospital_id=hospital.id,
            department="General", service_date=date.today(), token_number=1,
        ))
        if patient is patient_a:
            db_session.flush()
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_consultation_one_to_one_appointment_relationship(db_session):
    patient = make_patient(db_session)
    doctor = Doctor(display_name="Sample Clinician", specialization="General practice")
    db_session.add(doctor)
    db_session.flush()
    starts = datetime.now(timezone.utc) + timedelta(days=1)
    appointment = Appointment(
        patient=patient, doctor=doctor, starts_at=starts, ends_at=starts + timedelta(minutes=20),
        consultation_type=ConsultationType.ONLINE,
    )
    appointment.consultation = Consultation()
    db_session.add(appointment)
    db_session.flush()
    assert appointment.consultation.appointment_id == appointment.id
    assert appointment.consultation.appointment is appointment


def test_safe_model_creation_and_rollback(db_session):
    make_patient(db_session)
    assert db_session.query(User).count() == 1
    # The fixture rolls back and removes its isolated test schema after this test.


def test_alembic_env_imports_all_model_metadata():
    from pathlib import Path

    env_path = Path(__file__).parents[1] / "app" / "db" / "migrations" / "env.py"
    assert "import app.models" in env_path.read_text(encoding="utf-8")
    assert set(Base.metadata.tables) == EXPECTED_TABLES


@pytest.mark.postgres
def test_postgres_exclusion_constraint_rejects_overlapping_doctor_appointments(db_session, test_engine):
    if test_engine.dialect.name != "postgresql":
        pytest.skip("Requires an explicitly configured isolated PostgreSQL test database.")
    patient_a = make_patient(db_session)
    patient_b = make_patient(db_session, "second.patient@example.test")
    doctor = Doctor(display_name="Sample Clinician", specialization="General practice")
    db_session.add(doctor)
    db_session.flush()
    starts = datetime.now(timezone.utc) + timedelta(days=4)
    for patient in (patient_a, patient_b):
        db_session.add(Appointment(
            patient=patient, doctor=doctor, starts_at=starts, ends_at=starts + timedelta(minutes=30),
            consultation_type=ConsultationType.IN_PERSON,
        ))
        if patient is patient_a:
            db_session.flush()
    with pytest.raises(IntegrityError):
        db_session.flush()
