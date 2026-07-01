import json
import google.generativeai as genai
from app.core.config import settings


def _get_client() -> genai.GenerativeModel:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-2.5-flash")


ANALYSIS_PROMPT = """
You are an expert ATS (Applicant Tracking System) resume reviewer.
Analyze the resume text provided at the end. 

CRITICAL CONTEXT:
- Today's date is June 30, 2026. Therefore, dates up to June 2026 (including March 2026) are in the PAST and are completely valid. Do NOT flag any dates before or equal to June 2026 as "future dates" or "invalid dates".

Provide your analysis in EXACTLY this JSON structure:
{{
  "ats_score": <integer 0-100>,
  "strengths": [<list of 3-5 specific, high-quality strengths>],
  "weaknesses": [<list of 3-5 constructive weaknesses based on actual missing details>],
  "recommendations": [<list of 4-6 actionable recommendations>]
}}

SCORING RUBRIC (Use this to calculate a stable, objective score):
- Start at 100 points.
- Deduct up to 15 points if there are no quantified metrics or results (e.g. percentages, dollar amounts, time saved).
- Deduct up to 10 points if the layout feels text-heavy or lacks a clear structure (summary, experience, education, skills).
- Deduct up to 10 points if key modern skills (relevant to the developer role, if applicable) are missing.
- Deduct up to 10 points if descriptions use passive verbs instead of active action verbs.
- Deduct up to 10 points if contact info, LinkedIn, or GitHub link is missing.

Resume text:
---
{resume_text}
---

Respond with ONLY valid JSON. No markdown formatting, no code fences, and no conversational text.
"""


def analyze_resume(resume_text: str) -> dict:
    """
    Send resume text to Gemini and return structured analysis.
    Returns a dict with: ats_score, strengths, weaknesses, recommendations.
    Raises RuntimeError if the API call fails.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model = _get_client()
    prompt = ANALYSIS_PROMPT.format(resume_text=resume_text[:12000])  # cap at ~12k chars

    try:
        # Set temperature to 0.1 for high determinism (consistent scores)
        generation_config = genai.types.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json"
        )
        response = model.generate_content(prompt, generation_config=generation_config)
        raw_text = response.text.strip()

        # Strip markdown code fences if Gemini wraps with them anyway
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        result = json.loads(raw_text)

        # Validate required keys
        required = {"ats_score", "strengths", "weaknesses", "recommendations"}
        if not required.issubset(result.keys()):
            raise ValueError(f"Missing keys in Gemini response: {required - result.keys()}")

        # Clamp score to valid range
        result["ats_score"] = max(0, min(100, int(result["ats_score"])))

        return result

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Gemini returned invalid JSON: {e}")
    except Exception as e:
        raise RuntimeError(f"Gemini analysis failed: {e}")
