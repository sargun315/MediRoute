from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.api.deps import ensure_owner, require_roles
from app.core.security import JWT_ALGORITHM, JWT_ISSUER, verify_password
from app.models.enums import UserRole
from app.models.user import User


def registration_payload(**overrides):
    payload = {
        "email": "Sample.Patient@example.test",
        "full_name": "Fictional Patient",
        "password": "not-a-real-password-123",
        "phone": "+1-555-0100",
    }
    payload.update(overrides)
    return payload


def test_registration_hashes_password_and_returns_public_fields(auth_client, db_session):
    response = auth_client.post("/api/auth/register", json=registration_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "sample.patient@example.test"
    assert body["role"] == "patient"
    assert "password" not in body and "password_hash" not in body
    user = db_session.scalar(select(User).where(User.email == body["email"]))
    assert user is not None
    assert user.password_hash != registration_payload()["password"]
    assert verify_password(registration_payload()["password"], user.password_hash)
    assert user.patient_profile.full_name == "Fictional Patient"


def test_duplicate_email_is_case_insensitive(auth_client):
    assert auth_client.post("/api/auth/register", json=registration_payload()).status_code == 201
    response = auth_client.post(
        "/api/auth/register", json=registration_payload(email=" SAMPLE.PATIENT@EXAMPLE.TEST ")
    )
    assert response.status_code == 409


def test_public_registration_cannot_choose_admin_role(auth_client):
    response = auth_client.post("/api/auth/register", json=registration_payload(role="admin"))
    assert response.status_code == 422
    assert "not-a-real-password-123" not in response.text


def test_registration_validation_does_not_echo_bad_password(auth_client):
    submitted_password = "x"
    response = auth_client.post(
        "/api/auth/register", json=registration_payload(password=submitted_password)
    )
    assert response.status_code == 422
    assert submitted_password not in response.text


def test_valid_login_returns_short_lived_bearer_and_me(auth_client, auth_secret):
    auth_client.post("/api/auth/register", json=registration_payload())
    response = auth_client.post(
        "/api/auth/login",
        json={"email": "SAMPLE.PATIENT@example.test", "password": registration_payload()["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == auth_secret.access_token_expire_minutes * 60
    assert "password" not in body["user"] and "password_hash" not in body["user"]
    claims = jwt.decode(
        body["access_token"], auth_secret.app_secret_key.get_secret_value(),
        algorithms=[JWT_ALGORITHM], issuer=JWT_ISSUER,
    )
    assert claims["token_type"] == "access" and "email" not in claims
    me = auth_client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["id"] == body["user"]["id"]


@pytest.mark.parametrize("email,password", [
    ("sample.patient@example.test", "wrong-password"),
    ("unknown@example.test", "wrong-password"),
])
def test_invalid_login_uses_generic_response(auth_client, email, password):
    auth_client.post("/api/auth/register", json=registration_payload())
    response = auth_client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


@pytest.mark.parametrize("authorization", [None, "Bearer not-a-jwt", "Basic abc"])
def test_current_user_rejects_missing_or_invalid_token(auth_client, authorization):
    headers = {} if authorization is None else {"Authorization": authorization}
    assert auth_client.get("/api/auth/me", headers=headers).status_code == 401


def test_current_user_rejects_expired_token(auth_client, auth_secret):
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {"sub": str(uuid4()), "iss": JWT_ISSUER, "iat": now - timedelta(minutes=2),
         "exp": now - timedelta(minutes=1), "jti": "fictional-test-id", "token_type": "access"},
        auth_secret.app_secret_key.get_secret_value(), algorithm=JWT_ALGORITHM,
    )
    response = auth_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_role_dependency_allows_only_configured_roles():
    patient = User(id=uuid4(), email="patient@example.test", password_hash="hash", role=UserRole.PATIENT)
    admin = User(id=uuid4(), email="admin@example.test", password_hash="hash", role=UserRole.ADMIN)
    admin_gate = require_roles(UserRole.ADMIN)
    assert admin_gate(admin) is admin
    with pytest.raises(HTTPException) as denied:
        admin_gate(patient)
    assert denied.value.status_code == 403


def test_private_record_owner_check_hides_cross_user_existence():
    owner_id = uuid4()
    owner = User(id=owner_id, email="owner@example.test", password_hash="hash", role=UserRole.PATIENT)
    stranger = User(id=uuid4(), email="stranger@example.test", password_hash="hash", role=UserRole.PATIENT)
    assert ensure_owner(owner_id, owner) is None
    with pytest.raises(HTTPException) as denied:
        ensure_owner(owner_id, stranger)
    assert denied.value.status_code == 404


def test_supported_staff_roles_are_present():
    values = {role.value for role in UserRole}
    assert {"patient", "doctor", "pharmacy", "medical_representative", "admin"}.issubset(values)
