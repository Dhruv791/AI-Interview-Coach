import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from app.core.config import settings


import time
import logging
from google.api_core import exceptions as google_exceptions

logger = logging.getLogger(__name__)


def _get_client(model_name: str = None) -> genai.GenerativeModel:
    genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
    return genai.GenerativeModel(model_name or settings.GEMINI_MODEL or "gemini-3.1-flash-lite")


def _call_gemini_with_retry(
    model: genai.GenerativeModel,
    prompt: str,
    generation_config: genai.types.GenerationConfig,
    max_retries: int = 3,
    timeout: float = 30.0,
) -> str:
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                request_options={"timeout": timeout}
            )
            return response.text.strip()
        except google_exceptions.ResourceExhausted as e:
            if attempt == max_retries - 1:
                logger.error(f"Gemini API quota exhausted after {max_retries} attempts on {model.model_name}: {e}")
                raise RuntimeError(f"Gemini API rate limit or service error: {e}")
            sleep_time = (2 ** attempt) * 2 + 2
            logger.warning(f"Gemini API attempt {attempt + 1} rate limited on {model.model_name}. Retrying in {sleep_time:.1f}s...")
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

TECHNICAL_EVALUATION_PROMPT = """
You are a calibrated, rigorous technical interviewer evaluating a candidate's response.
Your goal is to provide realistic, objective scoring and constructive, highly specific feedback.

Question: {question}
Model Answer Reference: {suggested_answer}
Candidate's Response: {user_answer}

SCORING CALIBRATION RUBRIC (STRICT ANCHORS):
- 0-35 (Weak / Flawed): Superficial, trivial, factually incorrect, or promotes anti-patterns/bad practices. Shows lack of foundational understanding.
- 36-55 (Basic / Novice): Elementary high-level definition; mentions surface terms but lacks depth, mechanisms, or practical trade-offs.
- 56-70 (Average / Competent): Correct fundamental explanation, understandable examples, but remains textbook-level. Misses architectural trade-offs, scalability, edge cases, or operational realities. DO NOT award 80+ to generic or surface-level answers.
- 71-85 (Good / Strong): Comprehensive, structured understanding with accurate terminology, addressing core engineering trade-offs and practical context.
- 86-98 (Exceptional / Staff): Deep technical mastery, nuanced architectural trade-offs (e.g., latency vs. throughput, consistency models, failure modes), precise domain terminology, and concrete production considerations.

MANDATORY FEEDBACK REQUIREMENTS:
1. Grounded Evidence: In "critique", you MUST explicitly cite and quote specific words, phrases, or claims from the candidate's response. Never provide generic feedback that could apply to any candidate.
2. Strengths & Gaps: State clearly what the candidate stated correctly based on their quotes, and pinpoint the exact technical depth, mechanisms, or trade-offs they omitted or misstated.
3. Actionable Improvement: In "suggestions", provide concrete, actionable recommendations bridging the exact gaps in their answer, including specific keywords, concepts, or code patterns to incorporate.

FEW-SHOT EVALUATION EXAMPLES:

--- EXAMPLE 1 (Weak Answer: Superficial, factual flaws) ---
Question: What is an index in a database, and how does it improve query performance?
Model Answer Reference: A database index is a specialized data structure (typically B-Tree or Hash) that enables the engine to locate records without scanning the entire table, reducing read time complexity from O(N) full table scans to O(log N). However, it adds write overhead on INSERT/UPDATE/DELETE and consumes disk/memory space.
Candidate's Response: "Index makes search faster like in a book. It is always good to have indexes on all columns."
Evaluation:
{{
  "score": 20,
  "critique": "The candidate offers a basic analogy ('Index makes search faster like in a book') but displays a critical misconception by asserting that 'It is always good to have indexes on all columns'. In production systems, over-indexing introduces severe write overhead on inserts and updates, bloats storage, and strains buffer pool memory. The answer fails to identify the underlying data structures (e.g., B-Tree) or explain the operational difference between an index lookup and a sequential scan.",
  "suggestions": "Clarify the core data structure by explaining how B-Trees enable O(log N) lookups versus O(N) table scans. Explicitly address write overhead and maintenance costs to correct the assumption about indexing every column. Mention composite indexes, cardinality, and using EXPLAIN plans to index selectively based on query access patterns."
}}

--- EXAMPLE 2 (Average Answer: Correct basics, missing architectural depth & trade-offs) ---
Question: Explain the difference between synchronous and asynchronous programming.
Model Answer Reference: Synchronous programming executes tasks sequentially, where each operation blocks execution until it completes. Asynchronous programming uses an event-driven model (e.g., event loop, worker threads, non-blocking I/O) allowing tasks to run concurrently without blocking the main execution thread, handling completion via callbacks, promises, or async/await.
Candidate's Response: "In synchronous programming, code runs line by line and blocks until each line finishes. In asynchronous programming, tasks run in the background without blocking the main thread, like fetching data from an API using async/await. It makes applications more responsive."
Evaluation:
{{
  "score": 60,
  "critique": "The candidate accurately captures the primary conceptual distinction, noting that synchronous execution 'blocks until each line finishes' while asynchronous tasks run 'without blocking the main thread' using 'async/await'. However, the answer is brief and textbook-level. It omits the internal mechanics (such as the event loop, callback queue, or thread pool), fails to distinguish between I/O-bound and CPU-bound workloads, and does not discuss concurrency challenges such as race conditions or error handling.",
  "suggestions": "Deepen the explanation by describing how the event loop and task queues manage non-blocking I/O. Clarify that asynchronous programming is optimal for I/O-bound operations (network, disk) rather than heavy CPU-bound computations. Discuss structured error handling (try/catch with async/await) and potential synchronization pitfalls."
}}

--- EXAMPLE 3 (Strong Answer: Thorough, structured, clear trade-offs and terminology) ---
Question: How does HTTPS establish a secure connection between a client and a server?
Model Answer Reference: HTTPS relies on TLS/SSL to provide confidentiality, authentication, and integrity. The client and server execute a TLS handshake: cipher suite negotiation, server certificate verification via trusted CAs, asymmetric key exchange (e.g., ECDHE) to establish a shared premaster secret, and derivation of symmetric session keys (e.g., AES-GCM) for encrypted data transport with MAC authentication.
Candidate's Response: "HTTPS wraps HTTP with TLS. The connection begins with a TLS handshake: the client sends supported cipher suites and a random nonce. The server responds with its digital certificate signed by a CA and its chosen cipher. The client verifies the certificate chain against trusted roots. They use asymmetric cryptography (typically ECDHE for forward secrecy) to agree on a shared premaster secret, from which symmetric session keys are derived. Subsequent traffic is encrypted symmetrically using ciphers like AES-256-GCM for efficiency and data integrity, preventing eavesdropping and tampering."
Evaluation:
{{
  "score": 92,
  "critique": "The candidate demonstrates exceptional depth and structure. They correctly walk through the TLS handshake chronologically, distinguishing between asymmetric key exchange for session setup and symmetric encryption ('AES-256-GCM') for bulk data payload transfer. They accurately reference critical security concepts including 'ECDHE for forward secrecy', verifying certificates against 'trusted roots', and cryptographic nonces to prevent replay attacks.",
  "suggestions": "To reach perfection, consider noting the latency optimization in TLS 1.3 (1-RTT handshake and 0-RTT session resumption) compared to TLS 1.2 (2-RTT), or mentioning Application-Layer Protocol Negotiation (ALPN) for HTTP/2."
}}

Provide your feedback in EXACTLY this JSON structure:
{{
  "score": <integer 0-100>,
  "critique": "<A constructive, professional critique quoting candidate statements, identifying specific strengths and gaps>",
  "suggestions": "<Actionable suggestions bridging specific omissions with key terms and concepts to add>"
}}

Respond with ONLY valid JSON. No markdown, no code fences.
"""

HR_EVALUATION_PROMPT = """
You are an expert behavioural and HR interviewer evaluating a candidate's response to a behavioural question.
Your goal is to provide realistic, objective scoring and constructive, highly specific feedback based on behavioural competency and the STAR framework (Situation, Task, Action, Result).

Question: {question}
Model Answer Reference: {suggested_answer}
Candidate's Response: {user_answer}

BEHAVIOURAL SCORING CALIBRATION RUBRIC (STAR-BASED ANCHORS):
- 0-35 (Weak / Flawed): Complete conflict/problem avoidance (e.g., ignoring difficult people or silent hostility), blames teammates, displays unprofessional conduct, or demonstrates absence of self-awareness. Fails to describe an actual professional scenario.
- 36-55 (Basic / Novice): Identifies a conflict or challenge but gives a passive, unilateral, or uncollaborative resolution (e.g., gave in just to stop arguing). Weak or missing STAR structure; lacks objective problem-solving, collaboration, or reflection.
- 56-70 (Average / Competent): Clear situation with a constructive attitude and positive outcome. Shows basic collaboration (e.g., discussing pros/cons or consulting a guide/mentor), but remains high-level. Missing depth on emotional intelligence, listening to the other side's constraints, or measurable outcomes.
- 71-85 (Good / Strong): Well-structured STAR narrative. Proactively identifies the root constraint behind the disagreement, uses active listening and data/compromise to resolve it collaboratively, and shares a clear positive outcome and personal learning.
- 86-98 (Exceptional / Staff): Exemplary leadership and emotional intelligence. Explicitly structures Situation, Task, Action, and measurable Result. Demonstrates deep empathy for stakeholder constraints, establishes objective criteria for decisions, achieves quantifiable impact, and derives mature ongoing team practices.

MANDATORY FEEDBACK REQUIREMENTS:
1. Grounded Evidence: In "critique", you MUST explicitly cite and quote specific words, phrases, or claims from the candidate's response. Ground all feedback in their exact statements.
2. STAR Evaluation: Highlight which STAR elements (Situation, Task, Action, Result) were clear and which were missing, passive, or underdeveloped.
3. Actionable Improvement: In "suggestions", provide concrete coaching on how to reframe their story with stronger STAR elements, active listening techniques, and professional problem-solving frameworks.

FEW-SHOT EVALUATION EXAMPLES:

--- EXAMPLE 1 (Weak Answer: Conflict avoidance / anti-pattern) ---
Question: Tell me about a time you had a conflict with a coworker and how you resolved it.
Model Answer Reference: The candidate should use the STAR method to describe a professional disagreement, explaining how they actively listened to the coworker's perspective, focused on objective project goals, reached a collaborative compromise, and maintained a healthy working relationship.
Candidate's Response: "I had a teammate who was always pushing bad code and missing deadlines. I stopped talking to him and just did his tasks myself so the project wouldn't fail. My manager was happy the work got done."
Evaluation:
{{
  "score": 25,
  "critique": "The candidate admits to a major team collaboration anti-pattern by stating 'I stopped talking to him and just did his tasks myself'. While the intent to ensure 'the project wouldn't fail' is understandable, the candidate completely bypassed conflict resolution, destroyed team communication, and took on heroics rather than addressing the root cause collaboratively or escalating constructively. The response lacks empathy, active listening, or any structured resolution.",
  "suggestions": "Restructure this narrative using the STAR framework. Instead of silently taking over work, describe how you initiated a private, 1-on-1 conversation to understand what obstacles the coworker faced. Highlight collaborative actions: establishing code review guidelines, pair programming, or agreeing on shared sprint commitments to solve the problem together sustainably."
}}

--- EXAMPLE 2 (Strong Answer: Structured STAR with high EQ and measurable impact) ---
Question: Tell me about a time you had a conflict with a coworker and how you resolved it.
Model Answer Reference: The candidate should use the STAR method to describe a professional disagreement, explaining how they actively listened to the coworker's perspective, focused on objective project goals, reached a collaborative compromise, and maintained a healthy working relationship.
Candidate's Response: "During a major release, our lead designer and I clashed over a checkout redesign. She wanted multi-step animations for branding, but I was concerned about mobile conversion drops. Instead of debating in public channels, I set up a 30-minute sync and asked about her design goals. We agreed to test both: we built a quick prototype and ran an A/B test with 500 users. The data showed a streamlined 2-step animation preserved branding while keeping cart completion at 94%. We shipped on time, and the designer later asked me to co-lead the mobile design review."
Evaluation:
{{
  "score": 92,
  "critique": "The candidate delivers an exceptional STAR response. The situation and opposing priorities ('multi-step animations for branding' vs. 'mobile conversion drops') are clearly framed without assigning blame. The candidate demonstrated high emotional intelligence by moving to a private sync to understand 'her design goals' and using an objective data-driven method ('ran an A/B test with 500 users') to resolve the tension. The result is quantified ('cart completion at 94%') and led to lasting trust.",
  "suggestions": "To add even more polish, briefly touch upon how you handled time pressure while running the A/B test or how this decision influenced team-wide design sprint guidelines."
}}

Provide your feedback in EXACTLY this JSON structure:
{{
  "score": <integer 0-100>,
  "critique": "<A constructive, professional critique quoting candidate statements, identifying specific strengths and gaps>",
  "suggestions": "<Actionable suggestions bridging specific omissions with key terms and concepts to add>"
}}

Respond with ONLY valid JSON. No markdown, no code fences.
"""

# Alias for backwards compatibility
EVALUATION_PROMPT = TECHNICAL_EVALUATION_PROMPT


def generate_interview_questions(category: str, difficulty: str, count: int = 5, is_guest: bool = False) -> List[Dict[str, Any]]:
    """
    Generates a set of questions along with their model answers from Gemini.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model_name = settings.GEMINI_MODEL or "gemini-3.1-flash-lite"
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


def evaluate_candidate_response(
    question: str,
    suggested_answer: str,
    user_answer: str,
    is_guest: bool = False,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates a candidate's answer against the model answer and returns score, critique, and suggestions.
    Routes to HR_EVALUATION_PROMPT for behavioural questions, and TECHNICAL_EVALUATION_PROMPT for technical questions.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    # Determine whether to use behavioural HR rubric or technical rubric
    is_hr = False
    if category and any(c in category.lower() for c in ["hr", "behavioral", "behavioural", "culture", "fit", "soft skills"]):
        is_hr = True
    elif any(phrase in question.lower() for phrase in [
        "tell me about a time",
        "conflict in a team",
        "conflict with a",
        "disagreement with",
        "difficult coworker",
        "leadership experience",
        "greatest weakness",
        "failure and how you handled"
    ]):
        is_hr = True

    eval_prompt_template = HR_EVALUATION_PROMPT if is_hr else TECHNICAL_EVALUATION_PROMPT

    model_name = settings.GEMINI_MODEL or "gemini-3.1-flash-lite"
    model = _get_client(model_name=model_name)
    prompt = eval_prompt_template.format(
        question=question,
        suggested_answer=suggested_answer,
        user_answer=user_answer
    )

    try:
        generation_config = genai.types.GenerationConfig(
            temperature=0.1,  # Strict calibration determinism, fixing rubric not randomness
            response_mime_type="application/json"
        )
        raw_text = _call_gemini_with_retry(model, prompt, generation_config=generation_config, timeout=30.0)

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
