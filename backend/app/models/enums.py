from enum import Enum

from sqlalchemy import Enum as SAEnum


class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    REPRESENTATIVE = "representative"
    ADMIN = "admin"


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class ConsultationType(str, Enum):
    IN_PERSON = "in_person"
    ONLINE = "online"


class QueueTokenStatus(str, Enum):
    WAITING = "waiting"
    CALLED = "called"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class QueueStatus(str, Enum):
    OPEN = "open"
    PAUSED = "paused"
    CLOSED = "closed"


class VisitStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ConsultationStatus(str, Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"


def enum_column(enum_class: type[Enum], name: str) -> SAEnum:
    """Persist stable enum values as VARCHAR plus a database CHECK constraint."""
    return SAEnum(
        enum_class,
        name=name,
        native_enum=False,
        create_constraint=True,
        validate_strings=True,
        values_callable=lambda members: [member.value for member in members],
    )
