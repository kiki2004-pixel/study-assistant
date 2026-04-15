from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean,
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
)

metadata = MetaData()

validation_history = Table(
    "validation_history",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("email", Text, nullable=False),
    Column("validated_at", DateTime, nullable=False, server_default=func.now()),
    Column("is_valid", Boolean, nullable=False),
    Column("quality_score", Integer, nullable=True),
    Column("checks", Text, nullable=True),  # JSON blob
    Column("attributes", Text, nullable=True),  # JSON blob
    Column("request_id", String(36), nullable=True),
    Column("user_id", Text, nullable=True),
    Index("ix_validation_history_email", "email"),
    Index("ix_validation_history_validated_at", "validated_at"),
    Index("ix_validation_history_request_id", "request_id"),
)


@dataclass
class HistoryRecord:
    id: str
    email: str
    validated_at: datetime
    is_valid: bool
    quality_score: int | None
    checks: dict | None
    attributes: dict | None
    request_id: str | None
    user_id: str | None


class HistoryStore:
    def __init__(self, db_url: str) -> None:
        if not db_url:
            raise ValueError("SCRUB_DB_URL is required")
        self._engine = create_engine(db_url, future=True)

    def init_schema(self) -> None:
        """Create tables if they don't exist. Call once at app startup."""
        metadata.create_all(self._engine)

    def save(
        self,
        *,
        email: str,
        is_valid: bool,
        quality_score: Optional[int] = None,
        checks: Optional[dict] = None,
        attributes: Optional[dict] = None,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        validated_at: Optional[datetime] = None,
    ) -> None:
        """Persist a single validation result."""
        record_id = str(uuid.uuid4())
        ts = validated_at or datetime.now(timezone.utc)
        with self._engine.begin() as conn:
            conn.execute(
                validation_history.insert().values(
                    id=record_id,
                    email=email,
                    validated_at=ts,
                    is_valid=is_valid,
                    quality_score=quality_score,
                    checks=json.dumps(checks) if checks is not None else None,
                    attributes=json.dumps(attributes)
                    if attributes is not None
                    else None,
                    request_id=request_id,
                    user_id=user_id,
                )
            )

    def get_history(
        self,
        *,
        page: int = 1,
        page_size: int = 100,
        is_valid: Optional[bool] = None,
        email: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> tuple[list[HistoryRecord], int]:
        """Return paginated validation history, newest first."""
        stmt = select(validation_history).order_by(
            validation_history.c.validated_at.desc()
        )
        count_stmt = select(func.count()).select_from(validation_history)
        if is_valid is not None:
            stmt = stmt.where(validation_history.c.is_valid == is_valid)
            count_stmt = count_stmt.where(validation_history.c.is_valid == is_valid)
        if email is not None:
            stmt = stmt.where(validation_history.c.email == email)
            count_stmt = count_stmt.where(validation_history.c.email == email)
        if request_id is not None:
            stmt = stmt.where(validation_history.c.request_id == request_id)
            count_stmt = count_stmt.where(validation_history.c.request_id == request_id)
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        with self._engine.begin() as conn:
            total = conn.execute(count_stmt).scalar() or 0
            rows = conn.execute(stmt).fetchall()
        return [self._row_to_record(r) for r in rows], int(total)

    def get_by_email(self, email: str) -> list[HistoryRecord]:
        """Return all history for a specific email address, newest first."""
        stmt = (
            select(validation_history)
            .where(validation_history.c.email == email)
            .order_by(validation_history.c.validated_at.desc())
        )
        with self._engine.begin() as conn:
            rows = conn.execute(stmt).fetchall()
        return [self._row_to_record(r) for r in rows]

    def get_by_request_id(self, request_id: str) -> list[HistoryRecord]:
        """Return all results for a bulk job identified by request_id."""
        stmt = (
            select(validation_history)
            .where(validation_history.c.request_id == request_id)
            .order_by(validation_history.c.validated_at.asc())
        )
        with self._engine.begin() as conn:
            rows = conn.execute(stmt).fetchall()
        return [self._row_to_record(r) for r in rows]

    def save_many(self, entries: list[dict]) -> None:
        """Persist multiple validation results in a single transaction."""
        if not entries:
            return
        rows = []
        for e in entries:
            ts = e.get("validated_at") or datetime.now(timezone.utc)
            checks = e.get("checks")
            attributes = e.get("attributes")
            rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "email": e["email"],
                    "validated_at": ts,
                    "is_valid": e["is_valid"],
                    "quality_score": e.get("quality_score"),
                    "checks": json.dumps(checks) if checks is not None else None,
                    "attributes": json.dumps(attributes)
                    if attributes is not None
                    else None,
                    "request_id": e.get("request_id"),
                    "user_id": e.get("user_id"),
                }
            )
        with self._engine.begin() as conn:
            conn.execute(validation_history.insert(), rows)

    def delete_by_email(self, email: str) -> int:
        """Delete all history for an email address. Returns rows deleted."""
        with self._engine.begin() as conn:
            result = conn.execute(
                delete(validation_history).where(validation_history.c.email == email)
            )
        return result.rowcount

    def _row_to_record(self, row) -> HistoryRecord:
        return HistoryRecord(
            id=row[0],
            email=row[1],
            validated_at=row[2],
            is_valid=row[3],
            quality_score=row[4],
            checks=json.loads(row[5]) if row[5] else None,
            attributes=json.loads(row[6]) if row[6] else None,
            request_id=row[7],
            user_id=row[8],
        )
