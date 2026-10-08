"""add score_breakdown column to resume_analysis table

Revision ID: 003_add_score_breakdown
Revises: 002_add_is_guest_to_users
Create Date: 2026-10-08 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_score_breakdown'
down_revision: Union[str, None] = '002_add_is_guest_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column(
        'resume_analysis',
        sa.Column('score_breakdown', sa.JSON(), nullable=True)
    )

def downgrade() -> None:
    op.drop_column('resume_analysis', 'score_breakdown')
