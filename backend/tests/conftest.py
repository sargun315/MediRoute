"""Isolated fixtures: SQLite for fast tests; explicit TEST_DATABASE_URL for PG."""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.base import Base
from app.db.safety import validate_test_database_url
from app.main import app as fastapi_app
import app.models  # noqa: F401 - register all tables


def _validated_test_url() -> str:
    settings = get_settings()
    explicit_url = os.getenv("TEST_DATABASE_URL") or (
        settings.test_database_url if "test_database_url" in settings.model_fields_set else None
    )
    url = explicit_url or settings.test_database_url
    validate_test_database_url(url, settings.database_url)
    if make_url(url).get_backend_name() == "postgresql" and not explicit_url:
        raise ValueError("PostgreSQL integration tests require explicit TEST_DATABASE_URL.")
    return url


@pytest.fixture(scope="session")
def test_engine():
    url = _validated_test_url()
    engine = create_engine(url, pool_pre_ping=True)
    if make_url(url).get_backend_name() == "sqlite":
        @event.listens_for(engine, "connect")
        def enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    if make_url(url).get_backend_name() == "postgresql":
        try:
            with engine.connect() as connection:
                connection.exec_driver_sql("SELECT 1")
        except Exception as exc:
            engine.dispose()
            pytest.skip(f"Configured isolated PostgreSQL test database is unavailable: {exc}")
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def db_session(test_engine):
    """Create and remove tables only on validated test engine, never on app DB."""
    url = _validated_test_url()
    if make_url(url).get_backend_name() == "postgresql":
        # Extension is installed only in the validated *_test database; it is not
        # removed on teardown because PostgreSQL extensions can be shared.
        with test_engine.begin() as connection:
            connection.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS btree_gist")
    Base.metadata.create_all(test_engine)
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, expire_on_commit=False)
    try:
        yield session
    finally:
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()
        Base.metadata.drop_all(test_engine)


@pytest.fixture
def client():
    return TestClient(fastapi_app)
