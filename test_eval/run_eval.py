#!/usr/bin/env python3
"""
Evaluation Runner for AI Interview & Resume Platform.

Runs:
1. Every PDF in tests/resumes/ through the resume analyzer.
2. Every answer in tests/answers.json through the answer evaluator.
3. Prints tables with filename/id, score, score breakdown/feedback.
4. Supports saving results to JSON and comparing before/after side by side.
"""

import os
import sys
import json
import argparse
import io
from pathlib import Path
from typing import Dict, Any, List

# Locate repository root and backend directory
REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"

# Ensure backend is on sys.path and backend/.env is accessible
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.chdir(str(BACKEND_DIR))

# Import application services
try:
    from pypdf import PdfReader
except ImportError:
    from PyPDF2 import PdfReader

from app.services.gemini import analyze_resume
from app.services.interview_service import evaluate_candidate_response


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract plain text from a PDF file."""
    with open(pdf_path, "rb") as f:
        reader = PdfReader(io.BytesIO(f.read()))
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n".join(text_parts)


def evaluate_resumes(resumes_dir: Path) -> List[Dict[str, Any]]:
    """Runs all PDF resumes in resumes_dir through analyze_resume."""
    results = []
    pdf_files = sorted([f for f in resumes_dir.glob("*.pdf")])
    if not pdf_files:
        print(f"[!] No PDF files found in {resumes_dir}")
        return results

    print(f"\nEvaluating {len(pdf_files)} resumes in {resumes_dir.name}/...")
    for i, pdf_path in enumerate(pdf_files):
        if i > 0:
            import time
            time.sleep(2.0)
        print(f"  -> Analyzing resume: {pdf_path.name} ...", end="", flush=True)
        try:
            text = extract_text_from_pdf(pdf_path)
            analysis = analyze_resume(text)
            ats_score = analysis.get("ats_score", 0)
            breakdown = analysis.get("score_breakdown", {})
            print(f" Done! Score: {ats_score}/100")
            results.append({
                "filename": pdf_path.name,
                "score": ats_score,
                "score_breakdown": breakdown,
                "strengths": analysis.get("strengths", []),
                "weaknesses": analysis.get("weaknesses", []),
                "recommendations": analysis.get("recommendations", []),
            })
        except Exception as e:
            print(f" FAILED: {e}")
            results.append({
                "filename": pdf_path.name,
                "score": 0,
                "score_breakdown": {},
                "error": str(e),
            })
    return results


def evaluate_answers(answers_file: Path) -> List[Dict[str, Any]]:
    """Runs all answers in answers.json through evaluate_candidate_response."""
    results = []
    if not answers_file.exists():
        print(f"[!] Answers file not found: {answers_file}")
        return results

    with open(answers_file, "r", encoding="utf-8") as f:
        answers_data = json.load(f)

    print(f"\nEvaluating {len(answers_data)} answers in {answers_file.name}...")
    for i, item in enumerate(answers_data):
        if i > 0:
            import time
            time.sleep(2.5)
        ans_id = item.get("id", "unknown")
        question = item.get("question", "")
        answer = item.get("answer", "")
        suggested = item.get("suggested_answer", "")
        expected = item.get("expected_range", [0, 100])
        category = item.get("category", "")
        difficulty = item.get("difficulty", "")

        print(f"  -> Evaluating answer [{ans_id}] ({category} - {difficulty}) ...", end="", flush=True)
        try:
            eval_res = evaluate_candidate_response(
                question=question,
                suggested_answer=suggested,
                user_answer=answer,
                category=category
            )
            score = eval_res.get("score", 0)
            in_range = expected[0] <= score <= expected[1]
            status_str = "IN RANGE" if in_range else f"OUT OF RANGE (exp {expected[0]}-{expected[1]})"
            print(f" Done! Score: {score}/100 [{status_str}]")
            results.append({
                "id": ans_id,
                "category": category,
                "difficulty": difficulty,
                "question": question,
                "answer": answer,
                "expected_range": expected,
                "score": score,
                "in_range": in_range,
                "critique": eval_res.get("critique", ""),
                "suggestions": eval_res.get("suggestions", ""),
            })
        except Exception as e:
            print(f" FAILED: {e}")
            results.append({
                "id": ans_id,
                "category": category,
                "difficulty": difficulty,
                "question": question,
                "answer": answer,
                "expected_range": expected,
                "score": 0,
                "in_range": False,
                "error": str(e),
            })
    return results


def print_resume_table(resume_results: List[Dict[str, Any]]) -> None:
    """Print formatted table for resume evaluation results."""
    print("\n" + "=" * 110)
    print("RESUME ANALYZER EVALUATION RESULTS")
    print("=" * 110)
    header = f"{'Filename':<35} | {'ATS':>4} | {'Contact':>7} | {'Struct':>6} | {'Metric':>6} | {'Tech':>5} | {'Impact':>6} | {'Writing':>7}"
    print(header)
    print("-" * len(header))
    for r in resume_results:
        b = r.get("score_breakdown", {})
        contact = b.get("contact_and_links", 0)
        struct = b.get("section_structure", 0)
        metric = b.get("quantified_metrics", 0)
        tech = b.get("technical_depth", 0)
        impact = b.get("impact_and_experience", 0)
        writing = b.get("action_verbs_and_writing", 0)
        print(f"{r['filename']:<35} | {r['score']:>4} | {contact:>7}/15 | {struct:>6}/10 | {metric:>6}/10 | {tech:>5}/25 | {impact:>6}/25 | {writing:>7}/15")
    print("=" * 110)


def print_answer_table(answer_results: List[Dict[str, Any]]) -> None:
    """Print formatted table for answer evaluation results."""
    print("\n" + "=" * 115)
    print("ANSWER EVALUATOR RESULTS")
    print("=" * 115)
    header = f"{'Answer ID':<18} | {'Category':<8} | {'Diff':<6} | {'Expected':<10} | {'Score':>5} | {'Status':<12} | {'Feedback Critique Preview':<40}"
    print(header)
    print("-" * len(header))
    for a in answer_results:
        exp_str = f"[{a['expected_range'][0]}-{a['expected_range'][1]}]" if a.get("expected_range") else "N/A"
        status_str = "PASS" if a.get("in_range") else "MISS"
        critique = a.get("critique", "").replace("\n", " ")
        if len(critique) > 40:
            critique = critique[:37] + "..."
        print(f"{a['id']:<18} | {a['category']:<8} | {a['difficulty']:<6} | {exp_str:<10} | {a['score']:>5} | {status_str:<12} | {critique:<40}")
    print("=" * 115)


def print_side_by_side_comparison(before_answers: List[Dict[str, Any]], after_answers: List[Dict[str, Any]]) -> None:
    """Print a side-by-side comparison table of answer evaluations before and after."""
    print("\n" + "=" * 125)
    print("BEFORE vs AFTER: ANSWER EVALUATION SIDE-BY-SIDE COMPARISON")
    print("=" * 125)
    header = f"{'Answer ID':<18} | {'Category':<8} | {'Expected':<10} | {'Before':>6} | {'Status':<7} | {'After':>6} | {'Status':<7} | {'Delta':>6} | {'Specific Evidence in Critique?'}"
    print(header)
    print("-" * len(header))

    before_map = {a["id"]: a for a in before_answers}
    after_map = {a["id"]: a for a in after_answers}

    for ans_id in sorted(set(list(before_map.keys()) + list(after_map.keys()))):
        b = before_map.get(ans_id, {})
        a = after_map.get(ans_id, {})
        cat = a.get("category") or b.get("category", "")
        exp = a.get("expected_range") or b.get("expected_range", [0, 100])
        exp_str = f"[{exp[0]}-{exp[1]}]"
        
        b_score = b.get("score", "N/A")
        b_status = "PASS" if b.get("in_range") else "MISS"
        
        a_score = a.get("score", "N/A")
        a_status = "PASS" if a.get("in_range") else "MISS"

        delta = "N/A"
        if isinstance(b_score, (int, float)) and isinstance(a_score, (int, float)):
            diff = a_score - b_score
            delta = f"{diff:+d}"

        # Check if critique quotes or references answer content
        critique = a.get("critique", "")
        evidence_check = "Yes" if ('"' in critique or "'" in critique or any(w in critique.lower() for w in ["candidate noted", "candidate stated", "mentioned", "referenced", "specifically"])) else "General"

        print(f"{ans_id:<18} | {cat:<8} | {exp_str:<10} | {str(b_score):>6} | {b_status:<7} | {str(a_score):>6} | {a_status:<7} | {delta:>6} | {evidence_check}")
    print("=" * 125)


def main():
    parser = argparse.ArgumentParser(description="Evaluate resumes and answers through AI scorers.")
    parser.add_argument("--resumes-dir", type=Path, default=REPO_ROOT / "tests" / "resumes", help="Path to resumes folder")
    parser.add_argument("--answers-file", type=Path, default=REPO_ROOT / "tests" / "answers.json", help="Path to answers.json")
    parser.add_argument("--save", type=Path, default=None, help="Save evaluation output to JSON file")
    parser.add_argument("--compare", type=Path, default=None, help="Compare current run with previous JSON results")
    parser.add_argument("--resumes-only", action="store_true", help="Only run resume evaluations")
    parser.add_argument("--answers-only", action="store_true", help="Only run answer evaluations")
    args = parser.parse_args()

    results = {
        "resumes": [],
        "answers": []
    }

    resumes_dir = args.resumes_dir if args.resumes_dir.is_absolute() else REPO_ROOT / args.resumes_dir
    answers_file = args.answers_file if args.answers_file.is_absolute() else REPO_ROOT / args.answers_file

    if not args.answers_only:
        results["resumes"] = evaluate_resumes(resumes_dir)
        print_resume_table(results["resumes"])

    if not args.resumes_only:
        results["answers"] = evaluate_answers(answers_file)
        print_answer_table(results["answers"])

    if args.save:
        save_path = args.save if args.save.is_absolute() else REPO_ROOT / args.save
        save_path.parent.mkdir(parents=True, exist_ok=True)
        if save_path.exists():
            try:
                with open(save_path, "r", encoding="utf-8") as f:
                    old_data = json.load(f)
                    if not results["resumes"] and old_data.get("resumes"):
                        results["resumes"] = old_data["resumes"]
                    if not results["answers"] and old_data.get("answers"):
                        results["answers"] = old_data["answers"]
            except Exception:
                pass
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"\n[+] Results successfully saved to {save_path}")

    if args.compare:
        comp_path = args.compare if args.compare.is_absolute() else REPO_ROOT / args.compare
        if comp_path.exists():
            with open(comp_path, "r", encoding="utf-8") as f:
                baseline_data = json.load(f)
            if "answers" in baseline_data and results["answers"]:
                print_side_by_side_comparison(baseline_data["answers"], results["answers"])


if __name__ == "__main__":
    main()
