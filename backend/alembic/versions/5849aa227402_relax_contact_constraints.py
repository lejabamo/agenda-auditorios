"""relax_contact_constraints

Revision ID: 5849aa227402
Revises: a8ba04175e92
Create Date: 2026-02-10 22:13:20.002218

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5849aa227402'
down_revision: Union[str, Sequence[str], None] = 'a8ba04175e92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('eventos', 'responsable_nombre', nullable=True)
    op.alter_column('eventos', 'responsable_telefono', nullable=True)
    op.alter_column('eventos', 'correo_confirmacion', nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('eventos', 'responsable_nombre', nullable=False)
    op.alter_column('eventos', 'responsable_telefono', nullable=False)
    op.alter_column('eventos', 'correo_confirmacion', nullable=False)
