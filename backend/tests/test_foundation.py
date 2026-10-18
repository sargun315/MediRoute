from sqlalchemy import text
from sqlalchemy.engine import make_url

from app.core.config import Settings
from app.db.safety import validate_test_database_url


def test_health_reports_process_only(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "MediRoute API"}


def test_test_database_is_separate_from_application_database(test_engine):
    with test_engine.connect() as connection:
        assert connection.execute(text("SELECT 1")).scalar_one() == 1


def test_test_database_url_cannot_equal_application_database():
    database_url = "postgresql+psycopg://localhost:5432/mediroute_test"

    try:
        validate_test_database_url(database_url, database_url)
    except ValueError as error:
        assert "different" in str(error)
    else:
        raise AssertionError("The test URL safety check accepted the application database URL.")


def test_database_safety_compares_target_not_credentials():
    try:
        validate_test_database_url(
            "postgresql+psycopg://test_user:other_password@localhost/mediroute_test",
            "postgresql+psycopg://app_user:app_password@127.0.0.1:5432/mediroute_test",
        )
    except ValueError as error:
        assert "different" in str(error)
    else:
        raise AssertionError("Different credentials were incorrectly treated as a separate database.")


def test_postgres_test_database_requires_test_suffix():
    try:
        validate_test_database_url(
            "postgresql+psycopg://localhost:5432/mediroute",
            "postgresql+psycopg://localhost:5432/mediroute_dev",
        )
    except ValueError as error:
        assert "end with _test" in str(error)
    else:
        raise AssertionError("The test URL safety check accepted a non-test database name.")


def test_cors_origins_are_parsed_from_environment_values():
    settings = Settings(frontend_origins="http://localhost:5173, https://demo.example.test/")

    assert settings.cors_origins == ["http://localhost:5173", "https://demo.example.test"]


def test_short_app_secret_is_rejected():
    try:
        Settings(app_secret_key="short")
    except ValueError as error:
        assert "at least 32 characters" in str(error)
    else:
        raise AssertionError("A short application secret was accepted.")


def test_production_requires_secret_and_postgres_database():
    try:
        Settings(app_env="production", app_secret_key="", database_url="sqlite+pysqlite:///:memory:")
    except ValueError as error:
        assert "APP_SECRET_KEY" in str(error)
    else:
        raise AssertionError("Production settings without a secret were accepted.")


def test_postgres_test_url_has_expected_database_name():
    parsed = make_url("postgresql+psycopg://localhost:5432/mediroute_test")

    assert parsed.database == "mediroute_test"
