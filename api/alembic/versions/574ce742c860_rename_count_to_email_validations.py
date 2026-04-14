"""rename_count_to_email_validations

Revision ID: 574ce742c860
Revises: 20260125_0001
Create Date: 2026-04-14 08:49:12.412055

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '574ce742c860'
down_revision: Union[str, Sequence[str], None] = '20260414_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("scrub_user_stats", "count", new_column_name="email_validations")


def downgrade() -> None:
    op.alter_column("scrub_user_stats", "email_validations", new_column_name="count")
