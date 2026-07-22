"""Add audit_logs columns fix

Revision ID: c99999999999
Revises: 8215987b6186
Create Date: 2026-07-22 13:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c99999999999'
down_revision: Union[str, Sequence[str], None] = '8215987b6186'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Safely add missing columns to audit_logs if they do not exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('audit_logs')]
    
    if 'evidence_id' not in columns:
        op.add_column('audit_logs', sa.Column('evidence_id', sa.String(length=36), nullable=True))
    if 'previous_state' not in columns:
        op.add_column('audit_logs', sa.Column('previous_state', sa.String(length=255), nullable=True))
    if 'current_state' not in columns:
        op.add_column('audit_logs', sa.Column('current_state', sa.String(length=255), nullable=True))
    if 'hash_verification_status' not in columns:
        op.add_column('audit_logs', sa.Column('hash_verification_status', sa.String(length=50), nullable=True))

def downgrade() -> None:
    pass
