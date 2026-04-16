from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Column,
    DateTime,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    delete,
    func,
    select,
    update,
)
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

metadata = MetaData()

# SQLAlchemy enum definitions matching the PostgreSQL enums
job_status_enum = PGEnum(
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled",
    name="job_status",
    create_type=False,
)

job_type_enum = PGEnum(
    "bulk_api",
    "listmonk_list",
    "scheduled",
    name="job_type",
    create_type=False,
)

job_source_enum = PGEnum(
    "api",
    "integration",
    "scheduler",
    name="job_source",
    create_type=False,
)

validation_jobs = Table(
    "validation_jobs",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("request_id", String(36), nullable=False, unique=True),
    Column("user_id", Text, nullable=False),
    Column("job_type", job_type_enum, nullable=False),
    Column("source", job_source_enum, nullable=False),
    Column("status", job_status_enum, nullable=False, server_default="pending"),
    # Integration details (nullable for bulk_api jobs)
    Column("integration_id", Integer, nullable=True),
    Column("integration_type", Text, nullable=True),
    # List/target details
    Column("list_id", Integer, nullable=True),
    Column("list_name", Text, nullable=True),
    Column("target_url", Text, nullable=True),
    # Progress tracking
    Column("total_items", Integer, nullable=False, server_default="0"),
    Column("processed_items", Integer, nullable=False, server_default="0"),
    Column("valid_count", Integer, nullable=False, server_default="0"),
    Column("invalid_count", Integer, nullable=False, server_default="0"),
    Column("error_count", Integer, nullable=False, server_default="0"),
    # Metadata
    Column("metadata", Text, nullable=True),  # JSON blob
    Column("error_message", Text, nullable=True),
    # Timestamps
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column("started_at", DateTime, nullable=True),
    Column("completed_at", DateTime, nullable=True),
    Column(
        "updated_at",
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    ),
    Index("ix_validation_jobs_user_id", "user_id"),
    Index("ix_validation_jobs_status", "status"),
    Index("ix_validation_jobs_user_status", "user_id", "status"),
    Index("ix_validation_jobs_created_at", "created_at"),
    Index("ix_validation_jobs_request_id", "request_id"),
)


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobType(str, Enum):
    BULK_API = "bulk_api"
    LISTMONK_LIST = "listmonk_list"
    SCHEDULED = "scheduled"


class JobSource(str, Enum):
    API = "api"
    INTEGRATION = "integration"
    SCHEDULER = "scheduler"


@dataclass
class ValidationJob:
    id: str
    request_id: str
    user_id: str
    job_type: JobType
    source: JobSource
    status: JobStatus
    integration_id: int | None
    integration_type: str | None
    list_id: int | None
    list_name: str | None
    target_url: str | None
    total_items: int
    processed_items: int
    valid_count: int
    invalid_count: int
    error_count: int
    metadata: dict | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    updated_at: datetime


class ValidationJobStore:
    def __init__(self, db_url: str, **engine_kwargs) -> None:
        if not db_url:
            raise ValueError("db_url is required")
        self._engine = create_engine(db_url, future=True, **engine_kwargs)

    def init_schema(self) -> None:
        """Create tables if they don't exist. Call once at app startup."""
        metadata.create_all(self._engine)

    def create(
        self,
        *,
        request_id: str,
        user_id: str,
        job_type: JobType,
        source: JobSource,
        integration_id: Optional[int] = None,
        integration_type: Optional[str] = None,
        list_id: Optional[int] = None,
        list_name: Optional[str] = None,
        target_url: Optional[str] = None,
        total_items: int = 0,
        job_metadata: Optional[dict] = None,
    ) -> ValidationJob:
        """Create a new validation job record."""
        job_id = str(uuid.uuid4())
        with self._engine.begin() as conn:
            conn.execute(
                validation_jobs.insert().values(
                    id=job_id,
                    request_id=request_id,
                    user_id=user_id,
                    job_type=job_type.value,
                    source=source.value,
                    status=JobStatus.PENDING.value,
                    integration_id=integration_id,
                    integration_type=integration_type,
                    list_id=list_id,
                    list_name=list_name,
                    target_url=target_url,
                    total_items=total_items,
                    metadata=json.dumps(job_metadata) if job_metadata else None,
                )
            )
        return self.get_by_id(job_id)

    def get_by_id(self, job_id: str) -> ValidationJob | None:
        """Fetch a job by its primary ID."""
        with self._engine.begin() as conn:
            row = conn.execute(
                select(validation_jobs).where(validation_jobs.c.id == job_id)
            ).first()
        return self._row_to_job(row) if row else None

    def get_by_request_id(self, request_id: str, user_id: str) -> ValidationJob | None:
        """Fetch a job by request_id (scoped to user for security)."""
        with self._engine.begin() as conn:
            row = conn.execute(
                select(validation_jobs).where(
                    validation_jobs.c.request_id == request_id,
                    validation_jobs.c.user_id == user_id,
                )
            ).first()
        return self._row_to_job(row) if row else None

    def list_for_user(
        self,
        user_id: str,
        status: Optional[JobStatus] = None,
        limit: int = 100,
    ) -> list[ValidationJob]:
        """List jobs for a user, optionally filtered by status."""
        stmt = select(validation_jobs).where(validation_jobs.c.user_id == user_id)
        if status:
            stmt = stmt.where(validation_jobs.c.status == status.value)
        stmt = stmt.order_by(validation_jobs.c.created_at.desc()).limit(limit)
        with self._engine.begin() as conn:
            rows = conn.execute(stmt).fetchall()
        return [self._row_to_job(r) for r in rows]

    def list_active_for_user(self, user_id: str) -> list[ValidationJob]:
        """List jobs that are pending or running (not completed/failed)."""
        with self._engine.begin() as conn:
            rows = conn.execute(
                select(validation_jobs)
                .where(
                    validation_jobs.c.user_id == user_id,
                    validation_jobs.c.status.in_(
                        [JobStatus.PENDING.value, JobStatus.RUNNING.value]
                    ),
                )
                .order_by(validation_jobs.c.created_at.desc())
            ).fetchall()
        return [self._row_to_job(r) for r in rows]

    def list_active_by_integration(
        self, user_id: str, integration_id: int
    ) -> list[ValidationJob]:
        """List active jobs for a specific integration, for enriching list responses."""
        with self._engine.begin() as conn:
            rows = conn.execute(
                select(validation_jobs)
                .where(
                    validation_jobs.c.user_id == user_id,
                    validation_jobs.c.integration_id == integration_id,
                    validation_jobs.c.status.in_(
                        [JobStatus.PENDING.value, JobStatus.RUNNING.value]
                    ),
                )
                .order_by(validation_jobs.c.created_at.desc())
            ).fetchall()
        return [self._row_to_job(r) for r in rows]

    def set_start_info(
        self,
        request_id: str,
        total_items: int,
        list_name: str | None = None,
        target_url: str | None = None,
    ) -> None:
        """Set total_items (and optionally list_name/target_url) before the job starts running."""
        values: dict = {"total_items": total_items, "updated_at": func.now()}
        if list_name is not None:
            values["list_name"] = list_name
        if target_url is not None:
            values["target_url"] = target_url
        with self._engine.begin() as conn:
            conn.execute(
                update(validation_jobs)
                .where(validation_jobs.c.request_id == request_id)
                .values(**values)
            )

    def update_progress(
        self,
        request_id: str,
        processed_items: int,
        valid_count: int,
        invalid_count: int,
        error_count: int = 0,
        force_status: Optional[JobStatus] = None,
    ) -> None:
        """Update job progress. Optionally change status."""
        values = {
            "processed_items": processed_items,
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "error_count": error_count,
            "updated_at": func.now(),
        }
        if force_status:
            values["status"] = force_status.value
            if force_status == JobStatus.RUNNING:
                values["started_at"] = func.now()
            if force_status in (
                JobStatus.COMPLETED,
                JobStatus.FAILED,
                JobStatus.CANCELLED,
            ):
                values["completed_at"] = func.now()

        with self._engine.begin() as conn:
            conn.execute(
                update(validation_jobs)
                .where(validation_jobs.c.request_id == request_id)
                .values(**values)
            )

    def start_job(self, request_id: str) -> None:
        """Mark a job as started."""
        with self._engine.begin() as conn:
            conn.execute(
                update(validation_jobs)
                .where(validation_jobs.c.request_id == request_id)
                .values(
                    status=JobStatus.RUNNING.value,
                    started_at=func.now(),
                    updated_at=func.now(),
                )
            )

    def complete_job(
        self,
        request_id: str,
        processed_items: int,
        valid_count: int,
        invalid_count: int,
        error_count: int = 0,
    ) -> None:
        """Mark a job as completed."""
        with self._engine.begin() as conn:
            conn.execute(
                update(validation_jobs)
                .where(validation_jobs.c.request_id == request_id)
                .values(
                    status=JobStatus.COMPLETED.value,
                    processed_items=processed_items,
                    valid_count=valid_count,
                    invalid_count=invalid_count,
                    error_count=error_count,
                    completed_at=func.now(),
                    updated_at=func.now(),
                )
            )

    def fail_job(self, request_id: str, error_message: str) -> None:
        """Mark a job as failed with an error message."""
        with self._engine.begin() as conn:
            conn.execute(
                update(validation_jobs)
                .where(validation_jobs.c.request_id == request_id)
                .values(
                    status=JobStatus.FAILED.value,
                    error_message=error_message,
                    completed_at=func.now(),
                    updated_at=func.now(),
                )
            )

    def delete_old_completed(self, days: int = 30) -> int:
        """Delete completed/failed jobs older than N days."""
        with self._engine.begin() as conn:
            result = conn.execute(
                delete(validation_jobs).where(
                    validation_jobs.c.status.in_(
                        [
                            JobStatus.COMPLETED.value,
                            JobStatus.FAILED.value,
                            JobStatus.CANCELLED.value,
                        ]
                    ),
                    validation_jobs.c.completed_at
                    < func.now() - func.interval(f"{days} days"),
                )
            )
        return result.rowcount

    def _row_to_job(self, row) -> ValidationJob:
        """Convert a database row to a ValidationJob dataclass."""
        return ValidationJob(
            id=row[0],
            request_id=row[1],
            user_id=row[2],
            job_type=JobType(row[3]),
            source=JobSource(row[4]),
            status=JobStatus(row[5]),
            integration_id=row[6],
            integration_type=row[7],
            list_id=row[8],
            list_name=row[9],
            target_url=row[10],
            total_items=row[11],
            processed_items=row[12],
            valid_count=row[13],
            invalid_count=row[14],
            error_count=row[15],
            metadata=json.loads(row[16]) if row[16] else None,
            error_message=row[17],
            created_at=row[18],
            started_at=row[19],
            completed_at=row[20],
            updated_at=row[21],
        )
