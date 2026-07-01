"""
Analytics API router.
Single endpoint returning the complete AnalyticsSummary DTO.
All heavy lifting is done by AnalyticsService using PostgreSQL aggregation.
Scoped securely to the authenticated user via JWT dependency.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── Response Schemas (Pydantic) ────────────────────────────────────────────────

class TrendPointSchema(BaseModel):
    date: str
    score: int
    category: str


class CategoryStatSchema(BaseModel):
    category: str
    avg_score: float
    count: int
    best_score: int


class KPISummarySchema(BaseModel):
    total_interviews: int
    completed_interviews: int
    completion_rate: float
    avg_score: Optional[float] = None
    best_score: Optional[int] = None
    worst_score: Optional[int] = None
    best_category: Optional[str] = None
    weakest_category: Optional[str] = None
    improvement_pct: Optional[float] = None
    total_resumes: int
    avg_ats_score: Optional[float] = None


class InsightItemSchema(BaseModel):
    text: str
    frequency: int


class AnalyticsSummarySchema(BaseModel):
    kpis: KPISummarySchema
    trend: List[TrendPointSchema]
    by_category: List[CategoryStatSchema]
    top_strengths: List[InsightItemSchema]
    top_weaknesses: List[InsightItemSchema]


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=AnalyticsSummarySchema)
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the complete analytics summary for the authenticated user.
    This is the single source of truth for the Performance Analytics dashboard.
    All queries are user-scoped via JWT and delegated to AnalyticsService.
    """
    summary = get_analytics_summary(db, current_user.id)

    return AnalyticsSummarySchema(
        kpis=KPISummarySchema(
            total_interviews=summary.kpis.total_interviews,
            completed_interviews=summary.kpis.completed_interviews,
            completion_rate=summary.kpis.completion_rate,
            avg_score=summary.kpis.avg_score,
            best_score=summary.kpis.best_score,
            worst_score=summary.kpis.worst_score,
            best_category=summary.kpis.best_category,
            weakest_category=summary.kpis.weakest_category,
            improvement_pct=summary.kpis.improvement_pct,
            total_resumes=summary.kpis.total_resumes,
            avg_ats_score=summary.kpis.avg_ats_score,
        ),
        trend=[
            TrendPointSchema(date=p.date, score=p.score, category=p.category)
            for p in summary.trend
        ],
        by_category=[
            CategoryStatSchema(
                category=c.category,
                avg_score=c.avg_score,
                count=c.count,
                best_score=c.best_score,
            )
            for c in summary.by_category
        ],
        top_strengths=[
            InsightItemSchema(text=i.text, frequency=i.frequency)
            for i in summary.top_strengths
        ],
        top_weaknesses=[
            InsightItemSchema(text=i.text, frequency=i.frequency)
            for i in summary.top_weaknesses
        ],
    )
