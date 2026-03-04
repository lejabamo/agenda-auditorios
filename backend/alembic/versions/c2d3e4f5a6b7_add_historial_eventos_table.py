"""add_historial_eventos_table

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-03-03 14:00:00.000000

Crea la tabla historial_eventos para el registro de auditoría
de acciones del administrador sobre las solicitudes.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c2d3e4f5a6b7'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'historial_eventos',
        sa.Column('id',         sa.Integer(),     nullable=False, primary_key=True),
        sa.Column('evento_id',  sa.Integer(),     nullable=False),
        sa.Column('accion',     sa.String(50),    nullable=False),
        sa.Column('admin_id',   sa.Integer(),     nullable=True),
        sa.Column('fecha',      sa.DateTime(),    nullable=True),
        sa.Column('observacion',sa.Text(),        nullable=True),
        sa.Column('motivo',     sa.String(100),   nullable=True),
        sa.ForeignKeyConstraint(['evento_id'], ['eventos.id']),
        sa.ForeignKeyConstraint(['admin_id'],  ['admin_users.id']),
    )


def downgrade() -> None:
    op.drop_table('historial_eventos')
