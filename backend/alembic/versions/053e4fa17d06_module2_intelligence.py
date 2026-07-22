"""Module 2 – Full schema: evidence, audit, intelligence tables

Revision ID: 053e4fa17d06
Revises: 
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '053e4fa17d06'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema – create all Module 1 and Module 2 tables."""

    # ── audit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('evidence_id', sa.String(length=36), nullable=True),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=36), nullable=False),
        sa.Column('details', sa.String(length=1000), nullable=True),
        sa.Column('performed_by', sa.String(length=100), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_audit_logs_id'), ['id'], unique=False)

    # ── evidence ──────────────────────────────────────────────────────────────
    op.create_table(
        'evidence',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('evidence_id', sa.String(length=36), nullable=True),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('stored_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('source_type', sa.String(length=100), nullable=True),
        sa.Column('sha256_hash', sa.String(length=64), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'UPLOADED', 'QUEUED', 'PROCESSING', 'PROCESSED',
                'FAILED', 'INTEGRITY_FAILED',
                name='evidencestatus',
            ),
            nullable=True,
        ),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('uploaded_by', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stored_filename'),
    )
    with op.batch_alter_table('evidence', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_evidence_evidence_id'), ['evidence_id'], unique=True)
        batch_op.create_index(batch_op.f('ix_evidence_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_evidence_sha256_hash'), ['sha256_hash'], unique=True)
        batch_op.create_index(batch_op.f('ix_evidence_status'), ['status'], unique=False)

    # ── evidence_metadata ─────────────────────────────────────────────────────
    op.create_table(
        'evidence_metadata',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('evidence_id', sa.String(length=36), nullable=False),
        sa.Column('metadata_type', sa.String(length=100), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('extracted_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['evidence_id'], ['evidence.evidence_id']),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('evidence_metadata', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_evidence_metadata_evidence_id'), ['evidence_id'], unique=False)
        batch_op.create_index(
            batch_op.f('ix_evidence_metadata_metadata_type'), ['metadata_type'], unique=False)

    # ── ocr_results ───────────────────────────────────────────────────────────
    op.create_table(
        'ocr_results',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('evidence_id', sa.String(length=36), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('extracted_text', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('bounding_boxes', sa.JSON(), nullable=True),
        sa.Column('language', sa.String(length=50), nullable=True),
        sa.Column(
            'extraction_method',
            sa.Enum('OCR', 'DIRECT_TEXT', name='extractionmethodocr'),
            nullable=False,
        ),
        sa.Column('processing_version', sa.String(length=50), nullable=False),
        sa.Column('extracted_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['evidence_id'], ['evidence.evidence_id']),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('ocr_results', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_ocr_results_evidence_id'), ['evidence_id'], unique=False)

    # ── extracted_entities ────────────────────────────────────────────────────
    op.create_table(
        'extracted_entities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('evidence_id', sa.String(length=36), nullable=False),
        sa.Column(
            'entity_type',
            sa.Enum(
                'PERSON', 'ORG', 'LOC', 'EMAIL', 'PHONE', 'URL', 'DOMAIN',
                'IP', 'USERNAME', 'DATE', 'TIME', 'DEVICE', 'FILE_HASH',
                'SOCIAL_HANDLE', 'CRYPTO_WALLET',
                name='entitytype',
            ),
            nullable=False,
        ),
        sa.Column('entity_value', sa.String(length=500), nullable=False),
        sa.Column('normalized_value', sa.String(length=500), nullable=True),
        sa.Column('context_snippet', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column(
            'extraction_method',
            sa.Enum('SPACY', 'REGEX', name='extractionmethodner'),
            nullable=False,
        ),
        sa.Column('extracted_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['evidence_id'], ['evidence.evidence_id']),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('extracted_entities', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_extracted_entities_evidence_id'), ['evidence_id'], unique=False)
        batch_op.create_index(
            batch_op.f('ix_extracted_entities_entity_type'), ['entity_type'], unique=False)
        batch_op.create_index(
            batch_op.f('ix_extracted_entities_normalized_value'), ['normalized_value'], unique=False)

    # ── processing_logs ───────────────────────────────────────────────────────
    op.create_table(
        'processing_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('evidence_id', sa.String(length=36), nullable=False),
        sa.Column('step', sa.String(length=100), nullable=False),
        sa.Column(
            'status',
            sa.Enum('PENDING', 'SUCCESS', 'FAILED', name='processingstatus'),
            nullable=False,
        ),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('processing_version', sa.String(length=50), nullable=True),
        sa.Column('processing_notes', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['evidence_id'], ['evidence.evidence_id']),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('processing_logs', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_processing_logs_evidence_id'), ['evidence_id'], unique=False)
        batch_op.create_index(
            batch_op.f('ix_processing_logs_step'), ['step'], unique=False)
        batch_op.create_index(
            batch_op.f('ix_processing_logs_status'), ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema – drop all Module 2 tables, then Module 1 tables."""

    with op.batch_alter_table('processing_logs', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_processing_logs_status'))
        batch_op.drop_index(batch_op.f('ix_processing_logs_step'))
        batch_op.drop_index(batch_op.f('ix_processing_logs_evidence_id'))
    op.drop_table('processing_logs')

    with op.batch_alter_table('extracted_entities', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_extracted_entities_normalized_value'))
        batch_op.drop_index(batch_op.f('ix_extracted_entities_entity_type'))
        batch_op.drop_index(batch_op.f('ix_extracted_entities_evidence_id'))
    op.drop_table('extracted_entities')

    with op.batch_alter_table('ocr_results', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_ocr_results_evidence_id'))
    op.drop_table('ocr_results')

    with op.batch_alter_table('evidence_metadata', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_evidence_metadata_metadata_type'))
        batch_op.drop_index(batch_op.f('ix_evidence_metadata_evidence_id'))
    op.drop_table('evidence_metadata')

    with op.batch_alter_table('evidence', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_evidence_status'))
        batch_op.drop_index(batch_op.f('ix_evidence_sha256_hash'))
        batch_op.drop_index(batch_op.f('ix_evidence_id'))
        batch_op.drop_index(batch_op.f('ix_evidence_evidence_id'))
    op.drop_table('evidence')

    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_audit_logs_id'))
    op.drop_table('audit_logs')
