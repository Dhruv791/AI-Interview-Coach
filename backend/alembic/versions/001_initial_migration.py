"""initial migration

Revision ID: 001_initial_migration
Revises: 
Create Date: 2026-06-28 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.s
revision: str = '001_initial_migration'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Create resumes table
    op.create_table(
        'resumes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=1000), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Create resume_analysis table
    op.create_table(
        'resume_analysis',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('resume_id', sa.UUID(), nullable=False),
        sa.Column('ats_score', sa.Integer(), nullable=False),
        sa.Column('strengths', sa.JSON(), nullable=True),
        sa.Column('weaknesses', sa.JSON(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('raw_analysis', sa.JSON(), nullable=True),
        sa.Column('analyzed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resume_id')
    )

    # 4. Create interviews table
    op.create_table(
        'interviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('difficulty', sa.String(length=50), nullable=False),
        sa.Column('overall_score', sa.Integer(), nullable=True),
        sa.Column('overall_feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Create questions table
    op.create_table(
        'questions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('interview_id', sa.UUID(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('suggested_answer', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['interview_id'], ['interviews.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Create responses table
    op.create_table(
        'responses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('user_answer', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('question_id')
    )

    # 7. Create feedback table
    op.create_table(
        'feedback',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('response_id', sa.UUID(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('critique', sa.Text(), nullable=False),
        sa.Column('suggestions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['response_id'], ['responses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('response_id')
    )

def downgrade() -> None:
    op.drop_table('feedback')
    op.drop_table('responses')
    op.drop_table('questions')
    op.drop_table('interviews')
    op.drop_table('resume_analysis')
    op.drop_table('resumes')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    