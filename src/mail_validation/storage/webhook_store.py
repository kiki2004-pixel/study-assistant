from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    select,
    update,
    delete,
)
from sqlalchemy import insert


metadata = MetaData()

webhook_registrations = Table(
    "webhook_registrations",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("url", Text, nullable=False, unique=True),
    Column("secret", String(64), nullable=False),
    Column("active", Boolean, nullable=False, server_default="true"),
    Column("failure_count", Integer, nullable=False, server_default="0"),
)


@dataclass
class WebhookRegistration:
    id: int
    url: str
    secret: str
    active: bool
    failure_count: int


class WebhookStore:
    MAX_FAILURES = 5

    def __init__(self, db_url: str) -> None:
        if not db_url:
            raise ValueError("WATERMARK_DB_URL is required")
        self._engine = create_engine(db_url, future=True)
        metadata.create_all(self._engine)

    def register(self, url: str) -> WebhookRegistration:
        """Register a new webhook URL, generating a signing secret."""
        secret = secrets.token_hex(32)
        with self._engine.begin() as conn:
            # Check if URL already exists
            existing = conn.execute(
                select(webhook_registrations).where(
                    webhook_registrations.c.url == url
                )
            ).first()

            if existing:
                conn.execute(
                    update(webhook_registrations)
                    .where(webhook_registrations.c.url == url)
                    .values(active=True, failure_count=0, secret=secret)
                )
            else:
                conn.execute(
                    insert(webhook_registrations).values(
                        url=url, secret=secret, active=True, failure_count=0
                    )
                )

            row = conn.execute(
                select(webhook_registrations).where(
                    webhook_registrations.c.url == url
                )
            ).first()

        return WebhookRegistration(
            id=row[0], url=row[1], secret=row[2], active=row[3], failure_count=row[4]
        )

    def list_active(self) -> list[WebhookRegistration]:
        """Return all active webhook registrations."""
        stmt = select(webhook_registrations).where(
            webhook_registrations.c.active == True  # noqa: E712
        )
        with self._engine.begin() as conn:
            rows = conn.execute(stmt).fetchall()
        return [
            WebhookRegistration(
                id=r[0], url=r[1], secret=r[2], active=r[3], failure_count=r[4]
            )
            for r in rows
        ]

    def record_failure(self, webhook_id: int) -> None:
        """Increment failure count; deactivate if threshold exceeded."""
        with self._engine.begin() as conn:
            row = conn.execute(
                select(webhook_registrations.c.failure_count).where(
                    webhook_registrations.c.id == webhook_id
                )
            ).first()
            if not row:
                return
            new_count = (row[0] or 0) + 1
            conn.execute(
                update(webhook_registrations)
                .where(webhook_registrations.c.id == webhook_id)
                .values(
                    failure_count=new_count,
                    active=new_count < self.MAX_FAILURES,
                )
            )

    def record_success(self, webhook_id: int) -> None:
        """Reset failure count on successful delivery."""
        with self._engine.begin() as conn:
            conn.execute(
                update(webhook_registrations)
                .where(webhook_registrations.c.id == webhook_id)
                .values(failure_count=0, active=True)
            )

    def deregister(self, url: str) -> bool:
        """Remove a webhook registration by URL."""
        with self._engine.begin() as conn:
            result = conn.execute(
                delete(webhook_registrations).where(
                    webhook_registrations.c.url == url
                )
            )
        return result.rowcount > 0

    @staticmethod
    def sign_payload(secret: str, body: bytes) -> str:
        """Generate HMAC-SHA256 signature for a payload."""
        return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()