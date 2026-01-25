"""Create listmonk watermark table.

Revision ID: 20260125_0001
Revises: 
Create Date: 2026-01-25
"""

from alembic import op
import sqlalchemy as sa


revision = "20260125_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "listmonk_watermark",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("list_id", sa.BigInteger(), nullable=False, unique=True),
        sa.Column("last_successful_created_at", sa.Text(), nullable=True),
        sa.Column("last_run_at", sa.Text(), nullable=True),
        sa.Column("processed_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("unsubscribed_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_table("listmonk_watermark")
