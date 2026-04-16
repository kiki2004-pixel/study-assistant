from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    MetaData,
    Table,
    func,
    select,
    create_engine,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Enum as SAEnum

metadata = MetaData()


class IntegrationType(str, Enum):
    listmonk = "listmonk"


_integration_type_enum = SAEnum(
    "listmonk",
    name="integration_type",
    create_type=False,
)

integrations = Table(
    "integrations",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, nullable=False),
    Column("type", _integration_type_enum, nullable=False),
    Column("config", JSONB, nullable=False, server_default="{}"),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column("updated_at", DateTime, nullable=False, server_default=func.now()),
)


@dataclass
class Integration:
    id: int
    user_id: int
    type: IntegrationType
    config: dict
    created_at: datetime
    updated_at: datetime


class IntegrationStore:
    def __init__(self, db_url: str, **engine_kwargs) -> None:
        self._engine = create_engine(db_url, future=True, **engine_kwargs)

    def create(self, user_id: int, type: IntegrationType, config: dict) -> Integration:
        stmt = (
            integrations.insert()
            .values(user_id=user_id, type=type.value, config=config)
            .returning(integrations)
        )
        with self._engine.begin() as conn:
            row = conn.execute(stmt).first()
        return _row_to_integration(row)

    def get_by_id(self, integration_id: int) -> Integration | None:
        with self._engine.begin() as conn:
            row = conn.execute(
                select(integrations).where(integrations.c.id == integration_id)
            ).first()
        return _row_to_integration(row) if row else None

    def list_by_type(self, user_id: int, type: IntegrationType) -> list[Integration]:
        with self._engine.begin() as conn:
            rows = conn.execute(
                select(integrations)
                .where(
                    integrations.c.user_id == user_id,
                    integrations.c.type == type.value,
                )
                .order_by(integrations.c.created_at.desc())
            ).fetchall()
        return [_row_to_integration(r) for r in rows]

    def list_for_user(self, user_id: int) -> list[Integration]:
        with self._engine.begin() as conn:
            rows = conn.execute(
                select(integrations)
                .where(integrations.c.user_id == user_id)
                .order_by(integrations.c.created_at.desc())
            ).fetchall()
        return [_row_to_integration(r) for r in rows]

    def update(self, integration_id: int, config: dict) -> Integration | None:
        from sqlalchemy import update

        stmt = (
            update(integrations)
            .where(integrations.c.id == integration_id)
            .values(config=config, updated_at=func.now())
            .returning(integrations)
        )
        with self._engine.begin() as conn:
            row = conn.execute(stmt).first()
        return _row_to_integration(row) if row else None

    def delete_by_id(self, integration_id: int) -> bool:
        from sqlalchemy import delete

        with self._engine.begin() as conn:
            result = conn.execute(
                delete(integrations).where(integrations.c.id == integration_id)
            )
        return result.rowcount > 0


def _row_to_integration(row) -> Integration:
    return Integration(
        id=row[0],
        user_id=row[1],
        type=IntegrationType(row[2]),
        config=row[3] or {},
        created_at=row[4],
        updated_at=row[5],
    )
