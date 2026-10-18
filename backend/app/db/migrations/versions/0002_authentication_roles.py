"""Allow pharmacy and medical representative account roles."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_authentication_roles"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # role is VARCHAR + CHECK rather than a PostgreSQL native ENUM.
    op.drop_constraint("ck_users_user_role", "users", type_="check")
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(length=14),
        type_=sa.String(length=32),
        existing_nullable=False,
    )
    op.create_check_constraint(
        "user_role",
        "users",
        "role IN ('patient', 'doctor', 'pharmacy', 'medical_representative', 'representative', 'admin')",
    )


def downgrade() -> None:
    # This downgrade is safe only after pharmacy and medical_representative
    # accounts have been migrated or removed by a reviewed data migration.
    op.drop_constraint("ck_users_user_role", "users", type_="check")
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(length=32),
        type_=sa.String(length=14),
        existing_nullable=False,
    )
    op.create_check_constraint(
        "user_role",
        "users",
        "role IN ('patient', 'doctor', 'representative', 'admin')",
    )
