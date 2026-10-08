import json
import google.generativeai as genai
from typing import List, Dict, Any
from app.core.config import settings


import time
import logging
from google.api_core import exceptions as google_exceptions

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
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt, generation_config=generation_config)
            return response.text.strip()
        except google_exceptions.ResourceExhausted as e:
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
            google_exceptions.ServiceUnavailable,
            google_exceptions.DeadlineExceeded,
            google_exceptions.InternalServerError
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


QUESTIONS_PROMPT = """
You are an expert technical interviewer.
Generate EXACTLY {count} interview questions for a candidate interviewing for a {category} role at a {difficulty} level.

Provide your response in EXACTLY this JSON structure:
{{
  "questions": [
    {{
      "question_text": "<Clear, concise, specific technical question>",
      "suggested_answer": "<A comprehensive, exemplary model answer that covers key terms, techniques, and structures expected from a high-performing candidate>"
    }}
  ]
}}

Guidelines:
- Tailor questions precisely to the category ({category}) and difficulty ({difficulty}).
- Easy: Core definitions, basic syntax, foundational conceptual questions.
- Medium: Real-world scenarios, architectural trade-offs, debugging, optimization.
- Hard: High-scale design, deep internals, advanced algorithms, tricky optimization problems.
- Ensure the suggested_answer is highly detailed (1-2 paragraphs or structured bullet points).

Respond with ONLY valid JSON. No markdown, no code fences.
"""

EVALUATION_PROMPT = """
You are an expert technical interviewer evaluating a candidate's response.

Question: {question}
Model Answer Reference: {suggested_answer}
Candidate's Response: {user_answer}

Grade the response out of 100 points, based on accuracy, depth, keyword coverage, and structure.

Provide your feedback in EXACTLY this JSON structure:
{{
  "score": <integer 0-100>,
  "critique": "<A constructive, professional critique of the candidate's answer. Highlight what they got right, what was missing, and any factual errors.>",
  "suggestions": "<Actionable suggestions on how to improve this answer, including specific keywords, concepts, or code samples to add.>"
}}

Respond with ONLY valid JSON. No markdown, no code fences.
"""


def generate_interview_questions(category: str, difficulty: str, count: int = 5, is_guest: bool = False) -> List[Dict[str, Any]]:
    """
    Generates a set of questions along with their model answers from Gemini.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model_name = "gemini-3.7-flash" if is_guest else (settings.GEMINI_MODEL or "gemini-3.7-flash")
    model = _get_client(model_name=model_name)
    prompt = QUESTIONS_PROMPT.format(category=category, difficulty=difficulty, count=count)

    try:
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,
            response_mime_type="application/json"
        )
        raw_text = _call_gemini_with_retry(model, prompt, generation_config=generation_config)

        # Clean markdown wrappers if any
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        data = json.loads(raw_text)
        if "questions" not in data or not isinstance(data["questions"], list):
            raise ValueError("Invalid format received from Gemini.")

        return data["questions"]

    except Exception as e:
        raise RuntimeError(f"Failed to generate interview questions: {e}")


def evaluate_candidate_response(question: str, suggested_answer: str, user_answer: str, is_guest: bool = False) -> Dict[str, Any]:
    """
    Evaluates a candidate's answer against the model answer and returns score, critique, and suggestions.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model_name = "gemini-3.7-flash" if is_guest else (settings.GEMINI_MODEL or "gemini-3.7-flash")
    model = _get_client(model_name=model_name)
    prompt = EVALUATION_PROMPT.format(
        question=question,
        suggested_answer=suggested_answer,
        user_answer=user_answer
    )

    try:
        generation_config = genai.types.GenerationConfig(
            temperature=0.2,  # Lower temperature for more objective grading
            response_mime_type="application/json"
        )
        raw_text = _call_gemini_with_retry(model, prompt, generation_config=generation_config)

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        data = json.loads(raw_text)
        required_keys = {"score", "critique", "suggestions"}
        if not required_keys.issubset(data.keys()):
            raise ValueError(f"Missing keys in evaluation response: {required_keys - data.keys()}")

        data["score"] = max(0, min(100, int(data["score"])))
        return data

    except Exception as e:
        raise RuntimeError(f"Failed to evaluate response: {e}")
