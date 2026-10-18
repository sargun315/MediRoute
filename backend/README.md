# MediRoute backend

FastAPI backend foundation for the MediRoute healthcare platform. The schema and the first password-based authentication endpoints are implemented. Domain APIs and frontend integration remain future work; the existing frontend and its clearly labelled demo mode are unchanged.

## Technology and layout

- Python 3.11+
- FastAPI, Pydantic Settings
- SQLAlchemy 2, PostgreSQL via psycopg
- Alembic migrations
- Pytest
- pwdlib with Argon2 password hashing
- PyJWT access-token signing and validation

Important folders: `app/core` contains environment-backed settings; `app/db` contains SQLAlchemy base/session, URL safety, and Alembic; `app/models` contains the relational schema; `tests` contains isolated model and safety checks.

## Schema overview

- `users` has normalized unique email, a `password_hash` field, role, active flag, and timestamps. Plaintext passwords are never modeled.
- `patient_profiles` is a one-to-one extension of a user with only name and optional phone/city. Appointments and queue tokens reference this profile.
- `doctors`, `hospitals`, and `pharmacies` contain directory-level information and active flags. `doctor_hospitals` associates doctors and hospitals with a composite primary key.
- `appointments` references one patient and an optional doctor and/or hospital, with a required provider, time interval, consultation type, status, and timestamps.
- `hospital_queues` identifies the hospital, department, and service date. `queue_tokens` references that exact queue scope, its patient, opaque token reference, number, state, and timestamps.
- `medical_representative_profiles` extends a user with organization, employee reference, and region. `doctor_visits` records representative, doctor, optional hospital, visit time, and status.
- `consultations` has a one-to-one relationship to an appointment and records status and session timestamps.

Foreign keys use restrictive deletion for records that must retain history; user-owned profile rows cascade with user deletion, and doctor/hospital association rows cascade with either directory record. These relationships do not enforce authorization: future service/API code must scope private queries to the authenticated user and role.

Status and consultation-type columns use string-backed database CHECK constraints. Appointment intervals must have end after start. Token references are unique and have at least 32 characters. Token numbers are unique within a `hospital_queues` row (hospital + department + service date); token generation must lock that queue row and increment `last_token_number` in one transaction. The database constraint prevents duplicate numbers, but allocation/concurrency handling is not implemented or verified in this stage.

Appointment overlap protection uses PostgreSQL GiST exclusion constraints for active patient, doctor, and hospital-only appointments. The migration explicitly requests `CREATE EXTENSION IF NOT EXISTS btree_gist`; the database role applying migrations must be permitted to create/use this extension. Downgrade does not remove the extension, since it may be shared. These constraints are PostgreSQL-specific and have not been exercised against PostgreSQL in this environment. No concurrency-safety claim is made until isolated PostgreSQL integration tests run.

All event timestamps use SQL `TIMESTAMP WITH TIME ZONE` (`DateTime(timezone=True)`). Python writes require timezone-aware datetime values and normalize them to UTC. PostgreSQL normalizes `timestamptz` storage internally; return values should be serialized in UTC. `hospital_queues.service_date` is a calendar date in the hospital's configured `timezone_name`, which the future service layer must resolve explicitly.

## Local setup

From the repository root in PowerShell:

```powershell
cd backend
py -3.13 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set local-only `DATABASE_URL` and `TEST_DATABASE_URL` in `backend/.env`. Create the development database and a separate test database yourself; never point either at production. Do not commit `.env` or place credentials in frontend variables. `DATABASE_URL` is used by application/Alembic configuration. PostgreSQL tests require an explicitly configured `TEST_DATABASE_URL` whose database name ends in `_test`, and safety checks reject a target equal to the application database even if loopback hostname spelling or credentials differ.

Example local placeholders (replace with your own local database settings):

```dotenv
DATABASE_URL=postgresql+psycopg://localhost:5432/mediroute
TEST_DATABASE_URL=postgresql+psycopg://localhost:5432/mediroute_test
```

The ordinary model tests default to an in-memory SQLite database when no test URL is set. SQLite checks do not verify PostgreSQL-specific exclusion constraints, extension behavior, or concurrency.

## Migrations (manual only)

Inspect the revision chain and SQL before applying anything:

```powershell
python -m alembic history
python -m alembic heads
python -m alembic upgrade head --sql
```

To apply to your explicitly selected local development database, first verify `.env`'s `DATABASE_URL` is the intended non-production target, then run:

```powershell
python -m alembic upgrade head
python -m alembic current
```

This project stage did not execute `upgrade` against any database. `Base.metadata.create_all()` is used only for isolated tests, never as a replacement for production migrations. Review every future autogenerated revision before applying it. Downgrade of this initial revision drops the schema tables and therefore their data; use it only against a disposable database after a separate backup/target review.

## Run and test

```powershell
python -m uvicorn app.main:app --reload
python -m pytest
python -m pytest -m postgres
python -m compileall -q app tests
```

The health route only reports process health. PostgreSQL integration tests require a reachable, explicitly configured, isolated test database. The test fixture validates the target, creates schema only in that test database, and removes only its test tables afterward; it never drops a database. It creates `btree_gist` only in the validated test database if needed. A missing/unreachable configured PostgreSQL test server is reported as skipped; SQLite results are not PostgreSQL integration results.

## Limitations and deferred controls

## Authentication and authorization

Implemented endpoints:

- `POST /api/auth/register` accepts `email`, `full_name`, `password` (12–128 characters), and optional `phone`. It normalizes email, creates a patient account and profile, stores only an Argon2 password hash, and returns public account fields. Staff/admin role fields are not accepted; public registration cannot assign admin.
- `POST /api/auth/login` accepts `email` and `password`, returns a short-lived bearer access token (15 minutes by default), expiry seconds, and public account fields. Unknown email and wrong password share the same 401 response.
- `GET /api/auth/me` requires an `Authorization: Bearer <token>` header and returns the current active user from the database.

JWTs use HS256 with an allow-listed algorithm, issuer, required claims, expiry, random token ID, and only the user UUID as subject. No email, role, password, or patient details are embedded. Role authorization (`require_roles`) reads the current role from the database rather than trusting token claims. `ensure_owner` provides a 404-style cross-owner check for future private-record routes. No domain resource endpoints exist yet, so these primitives still need to be applied at every future service/API boundary. Supported roles are `patient`, `doctor`, `pharmacy`, `medical_representative`, `admin`, plus legacy `representative` for compatibility. Public registration creates patients only; staff accounts must be provisioned through a future trusted workflow.

Set `APP_SECRET_KEY` to a random value of at least 32 characters. Generate a local development key with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Put the generated value only in ignored `backend/.env` or a deployment secret manager. `ACCESS_TOKEN_EXPIRE_MINUTES` is restricted to 1–60 and defaults to 15. Do not expose this key through Vite variables. The login endpoint currently has no built-in distributed rate limiter, refresh tokens, token revocation, email verification, password reset, or login audit trail; add these before production. Stateless access tokens remain valid until expiry after logout or account role change, although inactive accounts are rejected on each authenticated request. Production deployments need TLS, edge/app-level rate limiting, secure secret rotation, monitoring, and a carefully designed token/session strategy.

Password hashing uses `pwdlib`'s recommended Argon2 configuration; PyJWT verifies tokens with a fixed algorithm allow-list. Login performs a dummy hash verification for unknown email to reduce obvious timing differences. Request validation responses omit raw submitted values so passwords are not echoed in errors. Database/email records used in tests are fictional.

### Try it in `/docs`

```powershell
cd backend
Copy-Item .env.example .env
# Set APP_SECRET_KEY to a locally generated key and DATABASE_URL to a local database.
python -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`. Register with a fictional example such as:

```json
{"email":"demo.patient@example.test","full_name":"Fictional Patient","password":"fictional-demo-password-123"}
```

Then call `/api/auth/login`, copy `access_token`, select **Authorize** in Swagger UI and enter the bearer token. Call `/api/auth/me`. This flow requires the Stage 4 schema to be applied to your local development database first. Review the configured `DATABASE_URL` before manually running `python -m alembic upgrade head`; no migration is applied by application startup.

## Limitations and deferred controls

Authentication is backend-backed but not production-complete. There are no appointments, QR-token, directory, medical-representative, or admin domain API endpoints yet. Model relationships alone do not prevent cross-patient access; future queries must enforce ownership and role authorization. Role checks in the frontend remain presentation-only. The exclusion constraints protect appointment overlaps at the PostgreSQL schema level when installed; queue allocation still needs a transactional row-locking service. Do not use real patient information in tests. Consultations store session metadata only and no media.

Frontend demo services remain the current user-facing data source; this stage does not change frontend authentication or connect frontend services to these endpoints.
