from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class WatermarkState:
    last_successful_created_at: Optional[str]
    last_run_at: Optional[str]
    processed_count: int
    unsubscribed_count: int


class WatermarkStore:
    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self._db_path)

    def _init_db(self) -> None:
        with self._connect() as conn:
            legacy_row = conn.execute(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name='listmonk_watermark'"
            ).fetchone()
            if legacy_row and legacy_row[0] and "CHECK (id = 1)" in legacy_row[0]:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS listmonk_watermark_new (
                        id INTEGER PRIMARY KEY,
                        list_id INTEGER NOT NULL,
                        last_successful_created_at TEXT,
                        last_run_at TEXT,
                        processed_count INTEGER NOT NULL DEFAULT 0,
                        unsubscribed_count INTEGER NOT NULL DEFAULT 0
                    )
                    """
                )
                conn.execute(
                    """
                    INSERT INTO listmonk_watermark_new
                    (list_id, last_successful_created_at, last_run_at, processed_count, unsubscribed_count)
                    SELECT 0, last_successful_created_at, last_run_at, processed_count, unsubscribed_count
                    FROM listmonk_watermark
                    """
                )
                conn.execute("DROP TABLE listmonk_watermark")
                conn.execute("ALTER TABLE listmonk_watermark_new RENAME TO listmonk_watermark")

            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS listmonk_watermark (
                    id INTEGER PRIMARY KEY,
                    list_id INTEGER NOT NULL,
                    last_successful_created_at TEXT,
                    last_run_at TEXT,
                    processed_count INTEGER NOT NULL DEFAULT 0,
                    unsubscribed_count INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            columns = {
                row[1] for row in conn.execute("PRAGMA table_info(listmonk_watermark)")
            }
            if "list_id" not in columns:
                conn.execute(
                    "ALTER TABLE listmonk_watermark ADD COLUMN list_id INTEGER NOT NULL DEFAULT 0"
                )
            conn.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_listmonk_watermark_list_id ON listmonk_watermark(list_id)"
            )
            conn.commit()

    def _ensure_row(self, list_id: int) -> None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT last_successful_created_at, last_run_at, processed_count, unsubscribed_count "
                "FROM listmonk_watermark WHERE list_id = ?",
                (list_id,),
            ).fetchone()
            if row:
                conn.commit()
                return

            legacy = conn.execute(
                "SELECT last_successful_created_at, last_run_at, processed_count, unsubscribed_count "
                "FROM listmonk_watermark WHERE list_id = 0"
            ).fetchone()
            if legacy:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO listmonk_watermark
                    (list_id, last_successful_created_at, last_run_at, processed_count, unsubscribed_count)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (list_id, legacy[0], legacy[1], legacy[2], legacy[3]),
                )
            else:
                conn.execute(
                    "INSERT OR IGNORE INTO listmonk_watermark (list_id) VALUES (?)",
                    (list_id,),
                )
            conn.commit()

    def ensure_list(self, list_id: int) -> None:
        self._ensure_row(list_id)

    def get_state(self, list_id: int) -> WatermarkState:
        self._ensure_row(list_id)
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT last_successful_created_at, last_run_at, processed_count, unsubscribed_count
                FROM listmonk_watermark
                WHERE list_id = ?
                """
                ,
                (list_id,),
            ).fetchone()
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
        self._ensure_row(list_id)
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE listmonk_watermark
                SET last_run_at = ?, processed_count = ?, unsubscribed_count = ?
                WHERE list_id = ?
                """,
                (last_run_at, processed_count, unsubscribed_count, list_id),
            )
            conn.commit()

    def update_successful_run(
        self,
        *,
        list_id: int,
        last_successful_created_at: str,
        last_run_at: str,
        processed_count: int,
        unsubscribed_count: int,
    ) -> None:
        self._ensure_row(list_id)
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE listmonk_watermark
                SET last_successful_created_at = ?,
                    last_run_at = ?,
                    processed_count = ?,
                    unsubscribed_count = ?
                WHERE list_id = ?
                """,
                (
                    last_successful_created_at,
                    last_run_at,
                    processed_count,
                    unsubscribed_count,
                    list_id,
                ),
            )
            conn.commit()
