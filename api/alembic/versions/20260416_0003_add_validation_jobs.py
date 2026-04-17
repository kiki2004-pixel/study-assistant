"""Add validation_jobs table.

Revision ID: 20260416_0003
Revises: 20260415_0002
Create Date: 2026-04-16
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "20260416_0003"
down_revision = "20260415_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types only if they don't already exist.
    # Using DO block because CREATE TYPE does not support IF NOT EXISTS.
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
                CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
                CREATE TYPE job_type AS ENUM ('bulk_api', 'listmonk_list', 'scheduled');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_source') THEN
                CREATE TYPE job_source AS ENUM ('api', 'integration', 'scheduler');
            END IF;
        END $$;
    """)

    # Create the table via raw SQL to avoid SQLAlchemy re-emitting CREATE TYPE
    # for enum columns even when create_type=False is set.
    op.execute("""
        CREATE TABLE validation_jobs (
            id              VARCHAR(36) PRIMARY KEY,
            request_id      VARCHAR(36) NOT NULL UNIQUE,
            user_id         TEXT NOT NULL,
            job_type        job_type NOT NULL,
            source          job_source NOT NULL,
            status          job_status NOT NULL DEFAULT 'pending',
            integration_id  INTEGER,
            integration_type TEXT,
            list_id         INTEGER,
            list_name       TEXT,
            target_url      TEXT,
            total_items     INTEGER NOT NULL DEFAULT 0,
            processed_items INTEGER NOT NULL DEFAULT 0,
            valid_count     INTEGER NOT NULL DEFAULT 0,
            invalid_count   INTEGER NOT NULL DEFAULT 0,
            error_count     INTEGER NOT NULL DEFAULT 0,
            metadata        TEXT,
            error_message   TEXT,
            created_at      TIMESTAMP NOT NULL DEFAULT now(),
            started_at      TIMESTAMP,
            completed_at    TIMESTAMP,
            updated_at      TIMESTAMP NOT NULL DEFAULT now()
        )
    """)

    op.create_index("ix_validation_jobs_user_id", "validation_jobs", ["user_id"])
    op.create_index("ix_validation_jobs_status", "validation_jobs", ["status"])
    op.create_index("ix_validation_jobs_user_status", "validation_jobs", ["user_id", "status"])
    op.create_index("ix_validation_jobs_created_at", "validation_jobs", ["created_at"])
    op.create_index("ix_validation_jobs_request_id", "validation_jobs", ["request_id"])


def downgrade() -> None:
    op.drop_index("ix_validation_jobs_request_id", "validation_jobs")
    op.drop_index("ix_validation_jobs_created_at", "validation_jobs")
    op.drop_index("ix_validation_jobs_user_status", "validation_jobs")
    op.drop_index("ix_validation_jobs_status", "validation_jobs")
    op.drop_index("ix_validation_jobs_user_id", "validation_jobs")
    op.drop_table("validation_jobs")
    op.execute("DROP TYPE IF EXISTS job_status")
    op.execute("DROP TYPE IF EXISTS job_type")
    op.execute("DROP TYPE IF EXISTS job_source")
