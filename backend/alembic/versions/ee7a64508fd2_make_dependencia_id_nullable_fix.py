"""make_dependencia_id_nullable_fix

Revision ID: ee7a64508fd2
Revises: 94997c245929
Create Date: 2026-03-11 13:22:33.769234

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee7a64508fd2'
down_revision: Union[str, Sequence[str], None] = '94997c245929'
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
