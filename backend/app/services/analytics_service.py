"""
AnalyticsService: All analytics queries use PostgreSQL aggregation (AVG, COUNT, MAX, MIN, GROUP BY).
No application-level aggregation. Returns structured DTOs consumed directly by the API layer.
"""
import uuid
from datetime import datetime
from collections import Counter
from typing import List, Optional

from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.models.interview import Interview, Question
from app.models.feedback import Response, Feedback
from app.models.resume import Resume, ResumeAnalysis


# ── DTOs (data shapes returned to the API layer) ──────────────────────────────

class TrendPoint:
    def __init__(self, date: str, score: int, category: str):
        self.date = date
        self.score = score
        self.category = category


class CategoryStat:
    def __init__(self, category: str, avg_score: float, count: int, best_score: int):
        self.category = category
        self.avg_score = round(avg_score, 1)
        self.count = count
        self.best_score = best_score


class KPISummary:
    def __init__(
        self,
        total_interviews: int,
        completed_interviews: int,
        completion_rate: float,
        avg_score: Optional[float],
        best_score: Optional[int],
        worst_score: Optional[int],
        best_category: Optional[str],
        weakest_category: Optional[str],
        improvement_pct: Optional[float],
        total_resumes: int,
        avg_ats_score: Optional[float],
    ):
        self.total_interviews = total_interviews
        self.completed_interviews = completed_interviews
        self.completion_rate = completion_rate
        self.avg_score = round(avg_score, 1) if avg_score is not None else None
        self.best_score = best_score
        self.worst_score = worst_score
        self.best_category = best_category
        self.weakest_category = weakest_category
        self.improvement_pct = round(improvement_pct, 1) if improvement_pct is not None else None
        self.total_resumes = total_resumes
        self.avg_ats_score = round(avg_ats_score, 1) if avg_ats_score is not None else None


class RecentPerformance:
    def __init__(self, last_3_avg: Optional[float], first_3_avg: Optional[float]):
        self.last_3_avg = round(last_3_avg, 1) if last_3_avg is not None else None
        self.first_3_avg = round(first_3_avg, 1) if first_3_avg is not None else None


class InsightItem:
    def __init__(self, text: str, frequency: int):
        self.text = text
        self.frequency = frequency


class AnalyticsSummary:
    def __init__(
        self,
        kpis: KPISummary,
        trend: List[TrendPoint],
        by_category: List[CategoryStat],
        top_strengths: List[InsightItem],
        top_weaknesses: List[InsightItem],
    ):
        self.kpis = kpis
        self.trend = trend
        self.by_category = by_category
        self.top_strengths = top_strengths
        self.top_weaknesses = top_weaknesses


# ── Service Functions ─────────────────────────────────────────────────────────

def get_analytics_summary(db: Session, user_id: uuid.UUID) -> AnalyticsSummary:
    """
    Main entry point. Runs all sub-queries and assembles the AnalyticsSummary DTO.
    All aggregation is done in PostgreSQL.
    """
    kpis = _compute_kpis(db, user_id)
    trend = _get_score_trend(db, user_id)
    by_category = _get_category_breakdown(db, user_id)
    top_strengths, top_weaknesses = _get_insights(db, user_id)

    return AnalyticsSummary(
        kpis=kpis,
        trend=trend,
        by_category=by_category,
        top_strengths=top_strengths,
        top_weaknesses=top_weaknesses,
    )


def _compute_kpis(db: Session, user_id: uuid.UUID) -> KPISummary:
    # PostgreSQL: Count totals and score aggregates in one query
    result = db.query(
        func.count(Interview.id).label("total"),
        func.count(Interview.completed_at).label("completed"),
        func.avg(Interview.overall_score).label("avg_score"),
        func.max(Interview.overall_score).label("best_score"),
        func.min(Interview.overall_score).label("worst_score"),
    ).filter(Interview.user_id == user_id).one()

    total = result.total or 0
    completed = result.completed or 0
    completion_rate = (completed / total * 100) if total > 0 else 0.0

    # Best/weakest category by average score (PostgreSQL GROUP BY + aggregation)
    cat_rows = (
        db.query(
            Interview.category,
            func.avg(Interview.overall_score).label("cat_avg"),
        )
        .filter(Interview.user_id == user_id, Interview.overall_score.isnot(None))
        .group_by(Interview.category)
        .all()
    )
    best_category = None
    weakest_category = None
    if cat_rows:
        best_row = max(cat_rows, key=lambda r: r.cat_avg)
        worst_row = min(cat_rows, key=lambda r: r.cat_avg)
        best_category = best_row.category
        weakest_category = worst_row.category if len(cat_rows) > 1 else None

    # Improvement: compare earliest 3 vs latest 3 completed interviews
    improvement_pct = _compute_improvement(db, user_id)

    # Resume KPIs
    resume_result = db.query(
        func.count(Resume.id).label("total_resumes"),
        func.avg(ResumeAnalysis.ats_score).label("avg_ats"),
    ).outerjoin(ResumeAnalysis, Resume.id == ResumeAnalysis.resume_id).filter(
        Resume.user_id == user_id
    ).one()

    return KPISummary(
        total_interviews=total,
        completed_interviews=completed,
        completion_rate=round(completion_rate, 1),
        avg_score=float(result.avg_score) if result.avg_score is not None else None,
        best_score=result.best_score,
        worst_score=result.worst_score,
        best_category=best_category,
        weakest_category=weakest_category,
        improvement_pct=improvement_pct,
        total_resumes=resume_result.total_resumes or 0,
        avg_ats_score=float(resume_result.avg_ats) if resume_result.avg_ats is not None else None,
    )


def _compute_improvement(db: Session, user_id: uuid.UUID) -> Optional[float]:
    """Compare earliest 3 vs most recent 3 completed interview scores."""
    completed = (
        db.query(Interview.overall_score)
        .filter(Interview.user_id == user_id, Interview.overall_score.isnot(None))
        .order_by(Interview.completed_at.asc())
        .all()
    )
    scores = [r.overall_score for r in completed]
    if len(scores) < 4:
        return None
    first_3_avg = sum(scores[:3]) / 3
    last_3_avg = sum(scores[-3:]) / 3
    if first_3_avg == 0:
        return None
    return round(((last_3_avg - first_3_avg) / first_3_avg) * 100, 1)


def _get_score_trend(db: Session, user_id: uuid.UUID) -> List[TrendPoint]:
    """Return each completed interview as a trend data point, ordered by time."""
    rows = (
        db.query(
            Interview.completed_at,
            Interview.overall_score,
            Interview.category,
        )
        .filter(Interview.user_id == user_id, Interview.overall_score.isnot(None))
        .order_by(Interview.completed_at.asc())
        .all()
    )
    return [
        TrendPoint(
            date=row.completed_at.strftime("%b %d"),
            score=row.overall_score,
            category=row.category,
        )
        for row in rows
    ]


def _get_category_breakdown(db: Session, user_id: uuid.UUID) -> List[CategoryStat]:
    """PostgreSQL GROUP BY + AVG/COUNT/MAX per category."""
    rows = (
        db.query(
            Interview.category,
            func.avg(Interview.overall_score).label("avg_score"),
            func.count(Interview.id).label("count"),
            func.max(Interview.overall_score).label("best_score"),
        )
        .filter(Interview.user_id == user_id, Interview.overall_score.isnot(None))
        .group_by(Interview.category)
        .order_by(func.avg(Interview.overall_score).desc())
        .all()
    )
    return [
        CategoryStat(
            category=row.category,
            avg_score=float(row.avg_score),
            count=row.count,
            best_score=row.best_score,
        )
        for row in rows
    ]


def _get_insights(db: Session, user_id: uuid.UUID):
    """
    Aggregate recurring strength/weakness keywords across all feedback records
    for the user. Joins interviews -> questions -> responses -> feedback.
    Returns top 5 most common items each.
    """
    feedback_rows = (
        db.query(Feedback.critique)
        .join(Response, Feedback.response_id == Response.id)
        .join(Question, Response.question_id == Question.id)
        .join(Interview, Question.interview_id == Interview.id)
        .filter(Interview.user_id == user_id)
        .all()
    )

    # Aggregate resume strengths and weaknesses from JSON columns
    resume_analyses = (
        db.query(ResumeAnalysis.strengths, ResumeAnalysis.weaknesses)
        .join(Resume, ResumeAnalysis.resume_id == Resume.id)
        .filter(Resume.user_id == user_id)
        .all()
    )

    strength_phrases = []
    weakness_phrases = []

    for ra in resume_analyses:
        if ra.strengths and isinstance(ra.strengths, list):
            strength_phrases.extend(ra.strengths)
        if ra.weaknesses and isinstance(ra.weaknesses, list):
            weakness_phrases.extend(ra.weaknesses)

    # Extract common themes from interview feedback critique text
    STRENGTH_KEYWORDS = [
        "good", "strong", "excellent", "clear", "well-structured",
        "accurate", "detailed", "comprehensive", "solid", "thorough",
    ]
    WEAKNESS_KEYWORDS = [
        "missing", "lacks", "vague", "incomplete", "could improve",
        "needs", "weak", "unclear", "shallow", "no mention",
    ]

    strength_hits: Counter = Counter()
    weakness_hits: Counter = Counter()

    for row in feedback_rows:
        text_lower = row.critique.lower()
        for kw in STRENGTH_KEYWORDS:
            if kw in text_lower:
                strength_hits[kw] += 1
        for kw in WEAKNESS_KEYWORDS:
            if kw in text_lower:
                weakness_hits[kw] += 1

    # Combine with resume insights; resume items are more readable
    # Cap resume phrases at 20 each before freq counting
    strength_counter = Counter(strength_phrases[:40])
    weakness_counter = Counter(weakness_phrases[:40])
    strength_counter.update(strength_hits)
    weakness_counter.update(weakness_hits)

    top_strengths = [
        InsightItem(text=text, frequency=count)
        for text, count in strength_counter.most_common(5)
    ]
    top_weaknesses = [
        InsightItem(text=text, frequency=count)
        for text, count in weakness_counter.most_common(5)
    ]

    return top_strengths, top_weaknesses
