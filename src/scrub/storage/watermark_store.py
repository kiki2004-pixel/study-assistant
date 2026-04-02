from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Column,
    Integer,
    MetaData,
    Table,
    Text,
    create_engine,
    select,
    update,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert


@dataclass(frozen=True)
class WatermarkState:
    last_successful_created_at: Optional[str]
    last_run_at: Optional[str]
    processed_count: int
    unsubscribed_count: int


metadata = MetaData()

listmonk_watermark = Table(
    "listmonk_watermark",
    metadata,
    Column("id", BigInteger, primary_key=True),
    Column("list_id", BigInteger, nullable=False, unique=True),
    Column("last_successful_created_at", Text, nullable=True),
    Column("last_run_at", Text, nullable=True),
    Column("processed_count", Integer, nullable=False, server_default="0"),
    Column("unsubscribed_count", Integer, nullable=False, server_default="0"),
)


class WatermarkStore:
    def __init__(self, db_url: str) -> None:
        if not db_url:
            raise ValueError("WATERMARK_DB_URL is required")
        self._engine = create_engine(db_url, future=True)

    def _ensure_row(self, conn, list_id: int) -> None:
        insert_stmt = (
            pg_insert(listmonk_watermark)
            .values(list_id=list_id)
            .on_conflict_do_nothing(index_elements=[listmonk_watermark.c.list_id])
            .returning(listmonk_watermark.c.id)
        )
        result = conn.execute(insert_stmt)
        inserted = result.first() is not None

        if inserted and list_id != 0:
            legacy = conn.execute(
                select(
                    listmonk_watermark.c.last_successful_created_at,
                    listmonk_watermark.c.last_run_at,
                    listmonk_watermark.c.processed_count,
                    listmonk_watermark.c.unsubscribed_count,
                ).where(listmonk_watermark.c.list_id == 0)
            ).first()
            if legacy:
                conn.execute(
                    update(listmonk_watermark)
                    .where(listmonk_watermark.c.list_id == list_id)
                    .values(
                        last_successful_created_at=legacy[0],
                        last_run_at=legacy[1],
                        processed_count=legacy[2],
                        unsubscribed_count=legacy[3],
                    )
                )

    def ensure_list(self, list_id: int) -> None:
        with self._engine.begin() as conn:
            self._ensure_row(conn, list_id)

    def get_state(self, list_id: int) -> WatermarkState:
        with self._engine.begin() as conn:
            self._ensure_row(conn, list_id)
            row = conn.execute(
                select(
                    listmonk_watermark.c.last_successful_created_at,
                    listmonk_watermark.c.last_run_at,
                    listmonk_watermark.c.processed_count,
                    listmonk_watermark.c.unsubscribed_count,
                ).where(listmonk_watermark.c.list_id == list_id)
            ).first()
        if not row:
            return WatermarkState(None, None, 0, 0)
        return WatermarkState(
            last_successful_created_at=row[0],
            last_run_at=row[1],
            processed_count=int(row[2] or 0),
            unsubscribed_count=int(row[3] or 0),
        )

    def record_run(
        self,
        *,
        list_id: int,
        last_run_at: str,
        processed_count: int,
        unsubscribed_count: int,
    ) -> None:
        with self._engine.begin() as conn:
            self._ensure_row(conn, list_id)
            conn.execute(
                update(listmonk_watermark)
                .where(listmonk_watermark.c.list_id == list_id)
                .values(
                    last_run_at=last_run_at,
                    processed_count=processed_count,
                    unsubscribed_count=unsubscribed_count,
                )
            )

    def update_successful_run(
        self,
        *,
        list_id: int,
        last_successful_created_at: str,
        last_run_at: str,
        processed_count: int,
        unsubscribed_count: int,
    ) -> None:
        with self._engine.begin() as conn:
            self._ensure_row(conn, list_id)
            conn.execute(
                update(listmonk_watermark)
                .where(listmonk_watermark.c.list_id == list_id)
                .values(
                    last_successful_created_at=last_successful_created_at,
                    last_run_at=last_run_at,
                    processed_count=processed_count,
                    unsubscribed_count=unsubscribed_count,
                )
            )
