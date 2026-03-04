"""add_audit_decision_fields_to_eventos

Revision ID: b1c2d3e4f5a6
Revises: ae9d99ba809a
Create Date: 2026-03-03 13:55:00.000000

Añade los campos de auditoría y decisión admin al modelo Evento:
- observacion: nota libre del admin al aprobar/rechazar
- motivo_rechazo: categoría de rechazo (campo controlado)
- admin_id: ID del administrador que tomó la decisión
- decision_at: timestamp de la decisión
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '5849aa227402'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('eventos', sa.Column('observacion', sa.Text(),          nullable=True))
    op.add_column('eventos', sa.Column('motivo_rechazo', sa.String(100),  nullable=True))
    op.add_column('eventos', sa.Column('admin_id',      sa.Integer(),     nullable=True))
    op.add_column('eventos', sa.Column('decision_at',   sa.DateTime(),    nullable=True))


def downgrade() -> None:
    op.drop_column('eventos', 'decision_at')
    op.drop_column('eventos', 'admin_id')
    op.drop_column('eventos', 'motivo_rechazo')
    op.drop_column('eventos', 'observacion')
