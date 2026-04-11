from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    UniqueConstraint,
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

user_stats = Table(
    "scrub_user_stats",
    metadata,
    Column("user_id", Integer, nullable=False),
    Column("year", Integer, nullable=False),
    Column("month", Integer, nullable=False),
    Column("count", Integer, nullable=False, server_default="0"),
    UniqueConstraint("user_id", "year", "month", name="uq_user_stats_period"),
)


@dataclass
class User:
    id: int
    sub: str
    email: str | None
    name: str | None
    created_at: datetime


@dataclass
class UserStats:
    total_validations: int
    validations_this_month: int


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

    def get_stats(self, user_id: int) -> UserStats:
        """Return total and current-month validation counts for a user."""
        now = datetime.now(timezone.utc)
        with self._engine.begin() as conn:
            total = conn.execute(
                select(func.coalesce(func.sum(user_stats.c.count), 0)).where(
                    user_stats.c.user_id == user_id
                )
            ).scalar()

            monthly = conn.execute(
                select(func.coalesce(func.sum(user_stats.c.count), 0)).where(
                    user_stats.c.user_id == user_id,
                    user_stats.c.year == now.year,
                    user_stats.c.month == now.month,
                )
            ).scalar()

        return UserStats(
            total_validations=int(total or 0),
            validations_this_month=int(monthly or 0),
        )

    def record_validation(self, user_id: int, count: int = 1) -> None:
        """Increment the validation counter for the current month."""
        now = datetime.now(timezone.utc)
        stmt = (
            pg_insert(user_stats)
            .values(user_id=user_id, year=now.year, month=now.month, count=count)
            .on_conflict_do_update(
                constraint="uq_user_stats_period",
                set_={"count": user_stats.c.count + count},
            )
        )
        with self._engine.begin() as conn:
            conn.execute(stmt)
