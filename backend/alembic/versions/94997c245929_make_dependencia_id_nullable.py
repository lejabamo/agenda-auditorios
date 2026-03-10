"""make_dependencia_id_nullable

Revision ID: 94997c245929
Revises: a11563d26567
Create Date: 2026-03-10 21:54:14.184305

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94997c245929'
down_revision: Union[str, Sequence[str], None] = 'a11563d26567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('eventos', 'dependencia_id',
               existing_type=sa.INTEGER(),
               nullable=True)

def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('eventos', 'dependencia_id',
               existing_type=sa.INTEGER(),
               nullable=False)
