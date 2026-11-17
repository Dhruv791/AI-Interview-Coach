#!/usr/bin/env python3
"""
Diagnostic runner to evaluate Prompt Effect vs Model Effect:
1. Runs all 10 answers with realistic suggested_answer from tests/answers.json.
2. Uses the SAME temperature (0.1) for both prompts.
3. Implements request timeout (30s) and writes results to disk after each answer.
4. Evaluates:
   - Old Prompt (original git version, temp=0.1, 3 runs)
   - Improved Prompt (Technical prompt for Backend, Behavioural STAR prompt for HR, temp=0.1, 3 runs)
5. Never passes expected_range to any prompt.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.chdir(str(BACKEND_DIR))

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from app.core.config import settings
from app.services.interview_service import TECHNICAL_EVALUATION_PROMPT, HR_EVALUATION_PROMPT

if not settings.GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured in backend/.env")

MODEL_NAME = "gemini-3.1-flash-lite"
genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
model = genai.GenerativeModel(MODEL_NAME)

OLD_EVALUATION_PROMPT = """
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


def call_eval_with_timeout(
    prompt_template: str,
    temp: float,
    question: str,
    suggested_answer: str,
    user_answer: str,
    timeout: float = 30.0,
    max_retries: int = 5
) -> Dict[str, Any]:
    prompt = prompt_template.format(
        question=question,
        suggested_answer=suggested_answer,
        user_answer=user_answer
    )
    generation_config = genai.types.GenerationConfig(
        temperature=temp,
        response_mime_type="application/json"
    )

    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                request_options={"timeout": timeout}
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw)
            data["score"] = max(0, min(100, int(data["score"])))
            return data
        except google_exceptions.ResourceExhausted as e:
            sleep_time = (2 ** attempt) * 2 + 2
            print(f"      [429 Rate limit] Attempt {attempt + 1}/{max_retries}. Backing off {sleep_time:.1f}s...")
            time.sleep(sleep_time)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            sleep_time = 2.0
            print(f"      [Retry error {e}] Attempt {attempt + 1}/{max_retries}. Retrying in {sleep_time}s...")
            time.sleep(sleep_time)
    raise RuntimeError("Max retries exceeded")


def main():
    answers_path = REPO_ROOT / "tests" / "answers.json"
    baseline_path = REPO_ROOT / "test_eval" / "baseline_results.json"
    out_file = REPO_ROOT / "test_eval" / "prompt_vs_model_comparison.json"

    with open(answers_path, "r", encoding="utf-8") as f:
        answers = json.load(f)

    baseline_data = {}
    if baseline_path.exists():
        with open(baseline_path, "r", encoding="utf-8") as f:
            b_json = json.load(f)
            baseline_data = {a["id"]: a["score"] for a in b_json.get("answers", [])}

    print(f"\n==========================================================================")
    print(f"RUNNING EXPERIMENT ON MODEL: {MODEL_NAME} (transport=rest)")
    print(f"Standardized Temperature: 0.1 for BOTH prompts")
    print(f"Request Timeout: 30.0s")
    print(f"Reference Answers: Passed realistic suggested_answer from tests/answers.json")
    print(f"Separated Prompts: Technical Rubric for Backend, Behavioural (STAR) for HR")
    print(f"Progress: Writing results after each answer")
    print(f"==========================================================================\n")

    results = []

    for idx, item in enumerate(answers):
        ans_id = item["id"]
        cat = item["category"]
        q = item["question"]
        sug = item["suggested_answer"]
        ans = item["answer"]
        exp = item["expected_range"]
        base_score = baseline_data.get(ans_id, "N/A")

        is_hr = (cat.lower() == "hr")
        improved_template = HR_EVALUATION_PROMPT if is_hr else TECHNICAL_EVALUATION_PROMPT
        template_name = "HR (STAR) Rubric" if is_hr else "Technical Rubric"

        print(f"[{idx+1}/10] Evaluating '{ans_id}' ({cat}) [Exp: {exp[0]}-{exp[1]}, Baseline: {base_score}, Prompt: {template_name}]...")

        # 1. Run 3 times with OLD prompt (temp=0.1)
        old_scores = []
        old_critiques = []
        for r in range(3):
            time.sleep(1.5)
            res = call_eval_with_timeout(OLD_EVALUATION_PROMPT, 0.1, q, sug, ans, timeout=30.0)
            old_scores.append(res["score"])
            old_critiques.append(res.get("critique", ""))
            print(f"    -> Old Prompt (Run {r+1}): {res['score']}")

        # 2. Run 3 times with IMPROVED prompt (temp=0.1, separated HR vs Tech)
        imp_scores = []
        imp_critiques = []
        for r in range(3):
            time.sleep(1.5)
            res = call_eval_with_timeout(improved_template, 0.1, q, sug, ans, timeout=30.0)
            imp_scores.append(res["score"])
            imp_critiques.append(res.get("critique", ""))
            print(f"    -> Improved {template_name} (Run {r+1}): {res['score']}")

        record = {
            "id": ans_id,
            "category": cat,
            "difficulty": item["difficulty"],
            "expected_range": exp,
            "baseline_score": base_score,
            "suggested_answer_used": sug[:80] + "...",
            "old_prompt_scores": old_scores,
            "old_prompt_min": min(old_scores),
            "old_prompt_max": max(old_scores),
            "old_prompt_avg": round(sum(old_scores) / len(old_scores), 1),
            "old_prompt_in_range": exp[0] <= (sum(old_scores) / len(old_scores)) <= exp[1],
            "old_critique_sample": old_critiques[0],
            "improved_prompt_scores": imp_scores,
            "improved_prompt_min": min(imp_scores),
            "improved_prompt_max": max(imp_scores),
            "improved_prompt_avg": round(sum(imp_scores) / len(imp_scores), 1),
            "improved_prompt_in_range": exp[0] <= (sum(imp_scores) / len(imp_scores)) <= exp[1],
            "improved_critique_sample": imp_critiques[0]
        }
        results.append(record)

        # Write results after each answer to ensure no progress is lost
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"    [Saved progress to {out_file.name} ({len(results)}/10)]")

    # Print summary table
    print("\n" + "=" * 135)
    print("PROMPT vs MODEL ABLATION: STANDARDIZED TEMP=0.1, REALISTIC REFERENCE ANSWER, SEPARATED HR RUBRIC")
    print("=" * 135)
    header = (
        f"{'Answer ID':<16} | {'Expected':<10} | {'Baseline':<8} | "
        f"{'Old Pmt (3 Runs)':<20} | {'Old Min-Max':<12} | {'Old InR?':<9} | "
        f"{'Imp Pmt (3 Runs)':<20} | {'Imp Min-Max':<12} | {'Imp InR?'}"
    )
    print(header)
    print("-" * len(header))

    for r in results:
        exp_str = f"[{r['expected_range'][0]}-{r['expected_range'][1]}]"
        base_str = str(r["baseline_score"])
        old_runs_str = f"{r['old_prompt_scores']} (avg {r['old_prompt_avg']})"
        old_minmax_str = f"{r['old_prompt_min']}-{r['old_prompt_max']}"
        old_inr = "PASS" if r["old_prompt_in_range"] else "MISS"

        imp_runs_str = f"{r['improved_prompt_scores']} (avg {r['improved_prompt_avg']})"
        imp_minmax_str = f"{r['improved_prompt_min']}-{r['improved_prompt_max']}"
        imp_inr = "PASS" if r["improved_prompt_in_range"] else "MISS"

        print(
            f"{r['id']:<16} | {exp_str:<10} | {base_str:<8} | "
            f"{old_runs_str:<20} | {old_minmax_str:<12} | {old_inr:<9} | "
            f"{imp_runs_str:<20} | {imp_minmax_str:<12} | {imp_inr}"
        )
    print("=" * 135)
    print(f"\n[+] Full results written to {out_file}\n")


if __name__ == "__main__":
    main()
