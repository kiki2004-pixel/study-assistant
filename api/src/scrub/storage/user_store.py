from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    create_engine,
    select,
    func,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert


metadata = MetaData()

users = Table(
    "scrub_users",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("sub", String(255), nullable=False, unique=True),
    Column("email", String(255), nullable=True),
    Column("name", String(255), nullable=True),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
)


@dataclass
class User:
    id: int
    sub: str
    email: str | None
    name: str | None
    created_at: datetime


class UserStore:
    def __init__(self, db_url: str) -> None:
        if not db_url:
            raise ValueError("WATERMARK_DB_URL is required")
        self._engine = create_engine(db_url, future=True)

    def init_schema(self) -> None:
        metadata.create_all(self._engine)

    def get_or_create(self, sub: str, email: str | None, name: str | None) -> User:
        """Upsert a user by sub, updating email/name on each login."""
        stmt = (
            pg_insert(users)
            .values(sub=sub, email=email, name=name)
            .on_conflict_do_update(
                index_elements=[users.c.sub],
                set_={"email": email, "name": name},
            )
        )
        with self._engine.begin() as conn:
            conn.execute(stmt)
            row = conn.execute(select(users).where(users.c.sub == sub)).first()
        if row is None:
            raise RuntimeError(f"Failed to upsert user with sub {sub!r}")
        return User(id=row[0], sub=row[1], email=row[2], name=row[3], created_at=row[4])
