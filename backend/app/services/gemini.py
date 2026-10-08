import json
import re
import time
import logging
from typing import Dict, Any, Tuple
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_client(model_name: str = "gemini-3.7-flash") -> genai.GenerativeModel:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(model_name)


def _call_gemini_with_retry(
    model: genai.GenerativeModel,
    prompt: str,
    generation_config: genai.types.GenerationConfig,
    max_retries: int = 3,
) -> str:
    """Execute Gemini API call with exponential backoff for transient errors and fallback for quota limits."""
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt, generation_config=generation_config)
            return response.text.strip()
        except google_exceptions.ResourceExhausted as e:
            err_msg = str(e)
            # If it's a hard daily free tier quota on a specific model, try fallback to gemini-3.7-flash
            if "gemini-3.7-flash" not in model.model_name:
                logger.warning(f"Model {model.model_name} quota exceeded. Falling back to gemini-3.7-flash...")
                fallback_model = _get_client("gemini-3.7-flash")
                return _call_gemini_with_retry(fallback_model, prompt, generation_config, max_retries=2)
            if attempt == max_retries - 1:
                logger.error(f"Gemini API quota exhausted after {max_retries} attempts: {e}")
                raise RuntimeError(f"Gemini API rate limit or service error: {e}")
            sleep_time = (2 ** attempt) * 1.5
            logger.warning(f"Gemini API attempt {attempt + 1} rate limited. Retrying in {sleep_time:.1f}s...")
            time.sleep(sleep_time)
        except (
            google_exceptions.ServiceUnavailable,  # 503
            google_exceptions.DeadlineExceeded,    # 504
            google_exceptions.InternalServerError  # 500
        ) as e:
            if attempt == max_retries - 1:
                logger.error(f"Gemini API failed after {max_retries} attempts: {e}")
                raise RuntimeError(f"Gemini API service error: {e}")
            sleep_time = (2 ** attempt) * 1.5
            logger.warning(f"Gemini API attempt {attempt + 1} failed ({e}). Retrying in {sleep_time:.1f}s...")
            time.sleep(sleep_time)
        except Exception as e:
            logger.error(f"Gemini API unexpected error: {e}")
            raise RuntimeError(f"Gemini API error: {e}")


def calculate_objective_metrics(resume_text: str) -> Tuple[Dict[str, int], Dict[str, Any]]:
    """
    Deterministically computes objective ATS criteria directly in Python:
    1. contact_and_links (Max 15 pts): Email (5), Phone (3), LinkedIn (4), GitHub/Portfolio (3)
    2. section_structure (Max 10 pts): Standard headers (Experience, Education, Skills, Projects, Summary) - 2 pts each
    3. quantified_metrics (Max 10 pts): Percentage of bullet points / lines with numerical impact
    """
    text = resume_text or ""
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # 1. Contact Info & Links (Max 15 pts)
    has_email = bool(re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text))
    has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text))
    has_linkedin = bool(re.search(r'linkedin\.com/(in/)?[a-zA-Z0-9_-]+', text, re.IGNORECASE))
    has_github_portfolio = bool(re.search(
        r'github\.com/[a-zA-Z0-9_-]+|gitlab\.com/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+\.(github\.io|vercel\.app|netlify\.app|dev|io|me)',
        text,
        re.IGNORECASE
    ))

    contact_score = 0
    if has_email:
        contact_score += 5
    if has_phone:
        contact_score += 3
    if has_linkedin:
        contact_score += 4
    if has_github_portfolio:
        contact_score += 3
    contact_score = min(15, contact_score)

    # 2. Section Structure (Max 10 pts - 2 pts each)
    has_summary = bool(re.search(r'(?i)\b(summary|objective|profile|about me|about)\b', text))
    has_experience = bool(re.search(r'(?i)\b(experience|work experience|employment history|work history|professional experience)\b', text))
    has_education = bool(re.search(r'(?i)\b(education|academic background|academics|qualifications)\b', text))
    has_skills = bool(re.search(r'(?i)\b(skills|technical skills|technologies|core competencies|stack|proficiencies)\b', text))
    has_projects = bool(re.search(r'(?i)\b(projects|personal projects|key projects|open source|selected projects)\b', text))

    structure_score = 0
    for section in [has_summary, has_experience, has_education, has_skills, has_projects]:
        if section:
            structure_score += 2
    structure_score = min(10, structure_score)

    # 3. Quantified Metrics (Max 10 pts)
    # Scan bullet points / description lines
    bullet_pattern = re.compile(
        r'(\d+[\d,.]*\s*(%|percent|x|k|m|b|ms|s|users|clients|customers|rps|qps|req/s|queries|gb|tb|mb|usd|\$|€|£|inr|rs\.?))|'
        r'((reduced|increased|improved|scaled|boosted|cut|saved|grew|optimized)\s+.*?\b\d+)|'
        r'(\b\d{2,}\b)',
        re.IGNORECASE
    )

    # Consider lines that look like work/project description items
    bullet_lines = [l for l in lines if l.startswith(('•', '-', '*', '–')) or len(l.split()) > 4]
    total_bullets = len(bullet_lines)
    quantified_count = sum(1 for line in bullet_lines if bullet_pattern.search(line))

    metric_ratio = (quantified_count / total_bullets) if total_bullets > 0 else 0.0

    if metric_ratio >= 0.45:
        metrics_score = 10
    elif metric_ratio >= 0.30:
        metrics_score = 7
    elif metric_ratio >= 0.15:
        metrics_score = 4
    elif quantified_count > 0:
        metrics_score = 2
    else:
        metrics_score = 0

    objective_scores = {
        "contact_and_links": contact_score,
        "section_structure": structure_score,
        "quantified_metrics": metrics_score,
    }

    objective_details = {
        "has_email": has_email,
        "has_phone": has_phone,
        "has_linkedin": has_linkedin,
        "has_github_portfolio": has_github_portfolio,
        "detected_sections": {
            "summary": has_summary,
            "experience": has_experience,
            "education": has_education,
            "skills": has_skills,
            "projects": has_projects,
        },
        "total_bullets_analyzed": total_bullets,
        "quantified_bullets_count": quantified_count,
        "quantified_ratio": round(metric_ratio, 2),
    }

    return objective_scores, objective_details


SUBJECTIVE_ANALYSIS_PROMPT = """
You are a calibrated, rigorous ATS (Applicant Tracking System) and hiring manager evaluator.
Your goal is to provide realistic, critical, non-inflated scoring for the subjective quality of this resume.

CRITICAL CONTEXT:
- The current year is 2026. Dates through 2026 are completely valid current or past dates.

OBJECTIVE DATA ALREADY COMPUTED BY THE SYSTEM:
- Contact & Links Score: {contact_score}/15 (Email: {has_email}, Phone: {has_phone}, LinkedIn: {has_linkedin}, GitHub/Portfolio: {has_github})
- Section Structure Score: {structure_score}/10
- Quantified Metrics Score: {metrics_score}/10 ({quantified_count}/{total_bullets} bullets contain metrics)

YOUR TASK:
Evaluate ONLY the 3 subjective dimensions below using the strict calibration anchors. Do NOT default everyone to high scores.

SUBJECTIVE CATEGORIES & CALIBRATION ANCHORS:

1. technical_depth (Integer 0 to 25):
   - 0-8 (Weak): Surface-level buzzwords listed in isolation, generic tools only (e.g. "HTML, MS Word"), no clear architectural context or depth.
   - 9-16 (Moderate): Standard stack listed with basic usage (e.g. "Used React and Express for REST API"), but lacks specialized frameworks, cloud deployment, concurrency, or advanced tools.
   - 17-21 (Strong): Rich, modern technical stack with clear architectural patterns (e.g., PostgreSQL indexing, Redis caching, Docker, CI/CD pipelines, state management).
   - 22-25 (Exceptional / Staff): Deep distributed systems, latency optimization, microservices, complex engineering trade-offs, or specialized domain mastery.

2. impact_and_experience (Integer 0 to 25):
   - 0-8 (Weak): Passive task listing ("responsible for bug fixing", "assisted team"), no demonstrated ownership, school-only trivial exercises.
   - 9-16 (Moderate): Explains what features were built, but focuses on routine duties rather than high-leverage outcomes or business impact.
   - 17-21 (Strong): Demonstrates end-to-end ownership, solving difficult engineering challenges, and shipping impactful features with clear scope.
   - 22-25 (Exceptional / Staff): High-scale production ownership, cross-team technical leadership, substantial efficiency or revenue impact.

3. action_verbs_and_writing (Integer 0 to 15):
   - 0-5 (Weak): Frequent passive phrasing ("worked on", "helped with"), grammatical awkwardness, run-on sentences, or generic fluff.
   - 6-10 (Moderate): Understandable phrasing, occasional strong verbs, but repetitive sentence structures.
   - 11-15 (Exceptional): Crisp, punchy bullets starting with strong active verbs (e.g., "Architected", "Spearheaded", "Optimized", "Engineered"), zero fluff.

CALIBRATION ANCHORS FOR TOTAL PROFILE SPREAD:
- A weak junior / barebones resume SHOULD score in the 30-50 total range.
- A typical mid-level resume SHOULD score in the 60-75 total range.
- Only a truly top-tier, highly detailed senior resume SHOULD score 85+.

Provide your response in EXACTLY this JSON structure:
{{
  "technical_depth": <integer 0-25>,
  "impact_and_experience": <integer 0-25>,
  "action_verbs_and_writing": <integer 0-15>,
  "strengths": [<list of 3-5 specific, genuine strengths with evidence from text>],
  "weaknesses": [<list of 3-5 critical, constructive weaknesses pointing out missing details or vague claims>],
  "recommendations": [<list of 4-6 high-impact, actionable steps to improve the resume>]
}}

Resume text:
---
{resume_text}
---

Respond with ONLY valid JSON. No markdown formatting, no code fences.
"""


def analyze_resume(resume_text: str, is_guest: bool = False) -> dict:
    """
    Analyzes resume text using a hybrid approach:
    1. Deterministic Python evaluation for objective items (links, sections, metrics ratio).
    2. Calibrated Gemini evaluation for subjective depth, impact, and writing quality.
    3. Backend calculates the final ATS score by summing the clamped breakdown categories.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    # 1. Compute objective metrics in code
    objective_scores, details = calculate_objective_metrics(resume_text)

    # 2. Select model (Guests always use Flash, registered users use configured GEMINI_MODEL)
    model_name = "gemini-3.7-flash" if is_guest else (settings.GEMINI_MODEL or "gemini-3.7-flash")
    model = _get_client(model_name=model_name)

    prompt = SUBJECTIVE_ANALYSIS_PROMPT.format(
        contact_score=objective_scores["contact_and_links"],
        has_email=details["has_email"],
        has_phone=details["has_phone"],
        has_linkedin=details["has_linkedin"],
        has_github=details["has_github_portfolio"],
        structure_score=objective_scores["section_structure"],
        metrics_score=objective_scores["quantified_metrics"],
        quantified_count=details["quantified_bullets_count"],
        total_bullets=details["total_bullets_analyzed"],
        resume_text=resume_text[:12000]
    )

    try:
        generation_config = genai.types.GenerationConfig(
            temperature=0.1,  # Strict determinism, fixing rubric not randomness
            response_mime_type="application/json"
        )
        raw_text = _call_gemini_with_retry(model, prompt, generation_config, max_retries=3)

        # Strip markdown code fences if wrapped
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        gemini_result = json.loads(raw_text)

        # Validate required subjective keys
        required_subjective = {"technical_depth", "impact_and_experience", "action_verbs_and_writing", "strengths", "weaknesses", "recommendations"}
        if not required_subjective.issubset(gemini_result.keys()):
            raise ValueError(f"Missing keys in Gemini response: {required_subjective - gemini_result.keys()}")

        # Clamp subjective scores to category limits
        tech_score = max(0, min(25, int(gemini_result["technical_depth"])))
        impact_score = max(0, min(25, int(gemini_result["impact_and_experience"])))
        verbs_score = max(0, min(15, int(gemini_result["action_verbs_and_writing"])))

        # Construct full additive score breakdown
        score_breakdown = {
            "contact_and_links": objective_scores["contact_and_links"],      # Max 15
            "section_structure": objective_scores["section_structure"],      # Max 10
            "quantified_metrics": objective_scores["quantified_metrics"],    # Max 10
            "technical_depth": tech_score,                                   # Max 25
            "impact_and_experience": impact_score,                           # Max 25
            "action_verbs_and_writing": verbs_score,                         # Max 15
        }

        # Calculate final total ATS score by summing clamped breakdown fields
        total_ats_score = sum(score_breakdown.values())
        total_ats_score = max(0, min(100, total_ats_score))

        return {
            "ats_score": total_ats_score,
            "score_breakdown": score_breakdown,
            "strengths": gemini_result.get("strengths", []),
            "weaknesses": gemini_result.get("weaknesses", []),
            "recommendations": gemini_result.get("recommendations", []),
            "objective_details": details,
        }

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Gemini returned invalid JSON: {e}")
    except Exception as e:
        raise RuntimeError(f"Gemini analysis failed: {e}")

