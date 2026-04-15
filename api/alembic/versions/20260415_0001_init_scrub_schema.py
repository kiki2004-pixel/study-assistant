"""Init scrub schema.

Revision ID: 20260415_0001
Revises:
Create Date: 2026-04-15
"""

from alembic import op
import sqlalchemy as sa


revision = "20260415_0001"
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

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("sub", sa.String(255), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "user_stats",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("email_validations", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.UniqueConstraint("user_id", "year", "month", name="uq_user_stats_period"),
    )

    op.create_table(
        "webhook_registrations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("url", sa.Text(), nullable=False, unique=True),
        sa.Column("secret", sa.String(64), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("failure_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )

    op.create_table(
        "validation_history",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("validated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("is_valid", sa.Boolean(), nullable=False),
        sa.Column("quality_score", sa.Integer(), nullable=True),
        sa.Column("checks", sa.Text(), nullable=True),
        sa.Column("attributes", sa.Text(), nullable=True),
        sa.Column("request_id", sa.String(36), nullable=True),
        sa.Column("user_id", sa.Text(), nullable=True),
    )
    op.create_index("ix_validation_history_email", "validation_history", ["email"])
    op.create_index("ix_validation_history_validated_at", "validation_history", ["validated_at"])
    op.create_index("ix_validation_history_request_id", "validation_history", ["request_id"])


def downgrade() -> None:
    op.drop_index("ix_validation_history_request_id", "validation_history")
    op.drop_index("ix_validation_history_validated_at", "validation_history")
    op.drop_index("ix_validation_history_email", "validation_history")
    op.drop_table("validation_history")
    op.drop_table("webhook_registrations")
    op.drop_table("user_stats")
    op.drop_table("users")
    op.drop_table("listmonk_watermark")
