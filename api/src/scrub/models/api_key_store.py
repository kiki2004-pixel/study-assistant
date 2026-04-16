from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    func,
    select,
    update,
    create_engine,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert

metadata = MetaData()

api_keys = Table(
    "api_keys",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("key_hash", String(64), nullable=False, unique=True),
    Column("name", String(255), nullable=False),
    Column("user_id", Integer, nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column("last_used_at", DateTime, nullable=True),
    Column("active", Boolean, nullable=False, server_default="true"),
)


@dataclass
class ApiKey:
    id: int
    key_hash: str
    name: str
    user_id: int
    created_at: datetime
    last_used_at: datetime | None
    active: bool


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class ApiKeyStore:
    def __init__(self, db_url: str) -> None:
        self._engine = create_engine(db_url, future=True)

    def create(self, user_id: int, name: str) -> tuple[ApiKey, str]:
        """Generate a new API key for a user.

        Returns (ApiKey, raw_key). The raw key is shown once — only the hash
        is persisted. Prefix 'sk_' makes keys easy to identify in logs/configs.
        """
        raw = "sk_" + secrets.token_urlsafe(32)
        key_hash = _hash(raw)
        stmt = (
            pg_insert(api_keys)
            .values(key_hash=key_hash, name=name, user_id=user_id)
            .returning(api_keys)
        )
        with self._engine.begin() as conn:
            row = conn.execute(stmt).first()
        return _row_to_key(row), raw

    def lookup(self, raw: str) -> ApiKey | None:
        """Find an active key by its raw value. Updates last_used_at."""
        key_hash = _hash(raw)
        with self._engine.begin() as conn:
            row = conn.execute(
                select(api_keys).where(
                    api_keys.c.key_hash == key_hash,
                    api_keys.c.active == True,  # noqa: E712
                )
            ).first()
            if row is None:
                return None
            conn.execute(
                update(api_keys)
                .where(api_keys.c.id == row[0])
                .values(last_used_at=func.now())
            )
        return _row_to_key(row)

    def list_for_user(self, user_id: int) -> list[ApiKey]:
        with self._engine.begin() as conn:
            rows = conn.execute(
                select(api_keys)
                .where(api_keys.c.user_id == user_id)
                .order_by(api_keys.c.created_at.desc())
            ).fetchall()
        return [_row_to_key(r) for r in rows]

    def revoke(self, key_id: int, user_id: int) -> bool:
        """Deactivate a key. Returns False if not found or not owned by user."""
        with self._engine.begin() as conn:
            result = conn.execute(
                update(api_keys)
                .where(api_keys.c.id == key_id, api_keys.c.user_id == user_id)
                .values(active=False)
            )
        return result.rowcount > 0


def _row_to_key(row) -> ApiKey:
    return ApiKey(
        id=row[0],
        key_hash=row[1],
        name=row[2],
        user_id=row[3],
        created_at=row[4],
        last_used_at=row[5],
        active=row[6],
    )
