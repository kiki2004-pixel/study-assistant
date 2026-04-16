"""Add integrations table.

Revision ID: 20260415_0003
Revises: 20260415_0002
Create Date: 2026-04-15
"""

from alembic import op


revision = "20260415_0003"
down_revision = "20260415_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE integration_type AS ENUM ('listmonk')")
    op.execute(
        """
        CREATE TABLE integrations (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER NOT NULL,
            type        integration_type NOT NULL,
            config      JSONB NOT NULL DEFAULT '{}',
            created_at  TIMESTAMP NOT NULL DEFAULT now(),
            updated_at  TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT uq_integrations_user_type UNIQUE (user_id, type)
        )
        """
    )
    op.execute("CREATE INDEX ix_integrations_user_id ON integrations (user_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_integrations_user_id")
    op.execute("DROP TABLE IF EXISTS integrations")
    op.execute("DROP TYPE IF EXISTS integration_type")
