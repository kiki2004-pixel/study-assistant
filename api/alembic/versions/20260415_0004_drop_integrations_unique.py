"""drop integrations unique constraint to allow multiple per type

Revision ID: 20260415_0004
Revises: 20260415_0003
Create Date: 2026-04-15
"""

from alembic import op

revision = "20260415_0004"
down_revision = "20260415_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE integrations DROP CONSTRAINT uq_integrations_user_type"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE integrations ADD CONSTRAINT uq_integrations_user_type "
        "UNIQUE (user_id, type)"
    )
