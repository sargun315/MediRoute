from sqlalchemy.engine import make_url


def validate_test_database_url(test_url: str, application_url: str) -> None:
    """Reject obvious production DB targets before test fixtures connect.

    In-memory SQLite is permitted for isolated unit tests. PostgreSQL integration
    tests must use a database name ending with `_test` and differ from the app DB.
    """
    test = make_url(test_url)
    application = make_url(application_url)

    def target(url):
        backend = url.get_backend_name()
        default_port = 5432 if backend == "postgresql" else None
        host = (url.host or "localhost").lower()
        if host in {"localhost", "127.0.0.1", "::1"}:
            host = "loopback"
        port = url.port or default_port
        database = url.database or ":memory:"
        return backend, host, port, database

    if target(test) == target(application):
        raise ValueError("TEST_DATABASE_URL must be different from DATABASE_URL.")

    if test.get_backend_name() == "sqlite":
        if test.database not in {None, "", ":memory:"} and not test.database.lower().endswith(("_test.db", "_test.sqlite")):
            raise ValueError("File-based SQLite test databases must have a _test.db or _test.sqlite suffix.")
        return

    if test.get_backend_name() != "postgresql":
        raise ValueError("Tests support only isolated SQLite or PostgreSQL test databases.")

    database_name = (test.database or "").lower()
    if not database_name.endswith("_test"):
        raise ValueError("PostgreSQL TEST_DATABASE_URL database name must end with _test.")
