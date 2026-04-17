"""merge heads

Revision ID: 036b508973f6
Revises: 20260415_0004, 20260416_0003
Create Date: 2026-04-16 20:52:05.753489

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '036b508973f6'
down_revision: Union[str, Sequence[str], None] = ('20260415_0004', '20260416_0003')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
