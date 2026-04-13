"""Create validation_history table.

Revision ID: 20260413_0002
Revises: 20260125_0001
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260413_0002"
down_revision = "20260125_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "validation_history",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column(
            "validated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("is_valid", sa.Boolean(), nullable=False),
        sa.Column("quality_score", sa.Integer(), nullable=True),
        sa.Column("checks", sa.Text(), nullable=True),
        sa.Column("attributes", sa.Text(), nullable=True),
        sa.Column("request_id", sa.String(36), nullable=True),
        sa.Column("user_id", sa.Text(), nullable=True),
    )
    op.create_index("ix_validation_history_email", "validation_history", ["email"])
    op.create_index(
        "ix_validation_history_validated_at", "validation_history", ["validated_at"]
    )
    op.create_index(
        "ix_validation_history_request_id", "validation_history", ["request_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_validation_history_request_id", "validation_history")
    op.drop_index("ix_validation_history_validated_at", "validation_history")
    op.drop_index("ix_validation_history_email", "validation_history")
    op.drop_table("validation_history")
