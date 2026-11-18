# InterviewAI — AI-Powered Interview Preparation & ATS Resume Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

**InterviewAI** is a full-stack, production-style platform designed to help job seekers and software engineers bridge the gap between their resume and the interview room. 

It pairs an **objective 6-dimension ATS resume analyzer** with a **rigorously calibrated mock interview evaluation engine**. Unlike generic AI interview tools that flatter candidates with unearned 90+ scores, InterviewAI enforces anchored scoring bands, dual Technical vs. Behavioural (STAR) rubrics, and grounded quotation evidence to deliver honest, hiring-committee-level preparation.

---

## 🚀 Key Features

### 1. 📄 6-Dimension ATS Resume Analyzer
* **Raw PDF Parsing**: Uses `pypdf` to extract and process resume text.
* **Objective + LLM Scoring**: Computes an ATS compatibility score (0–100) split across 6 granular dimensions:
  * **Contact & Online Links (/15)**: Email, phone, LinkedIn, GitHub.
  * **Section Structure (/10)**: Standard section clarity.
  * **Quantified Metrics (/10)**: Measurable numbers, percentages, and outcomes.
  * **Technical Depth (/25)**: Core frameworks, languages, databases, architectures.
  * **Impact & Experience (/25)**: Ownership, leadership, and production scope.
  * **Action Verbs & Writing Quality (/15)**: Active vs. passive voice detection.
* **Actionable Feedback**: Identifies exact bullet points to rewrite using the STAR method.

### 2. 🎯 Calibrated Mock Interview Engine
* **Dynamic Generation**: Tailors 5 cohesive interview questions per session by category (**Backend**, **Frontend**, **Full Stack**, **DSA**, **HR**) and difficulty (**Easy**, **Medium**, **Hard**) in a single efficient API call.
* **Realistic Reference Answers**: Automatically generates an exemplary model answer for every question to serve as the ground truth for scoring.
* **Anti-Grade-Inflation Rubrics**:
  * **Technical Rubric**: Strict anchors (0–35, 36–55, 56–70, 71–85, 86–98) that bar scores above 80 for surface-level textbook definitions.
  * **Behavioural (STAR) Rubric**: Specifically routes HR and conflict questions through a dedicated competency rubric evaluating Situation, Task, Action, Result, and emotional intelligence.
* **Grounded Quote Evidence**: Critiques must quote candidate words directly (e.g., *"You stated: 'I agreed to avoid problems' — this signals passive conflict avoidance"*).
* **Deterministic Scoring**: Standardized to `temperature=0.1` with a 30s request timeout and exponential backoff retry.

### 3. 📊 PostgreSQL Database-Layer Analytics
* Aggregates session scores, improvement trends, and category strengths/weaknesses entirely inside PostgreSQL queries (`AVG`, `COUNT`, `MAX`, `GROUP BY`) rather than in Python memory.
* Visualized using **Recharts** (performance line charts and category bar charts).

### 4. 🎨 Production-Grade UI / UX
* Built with **Tailwind CSS**, **Framer Motion** page transitions, and a 3-way theme toggle (**Light / Dark / System**) using CSS variables.
* Type-safe form validation with **React Hook Form** and **Zod**.
* Global authentication state managed via **Zustand**.

---

## 🛠 Tech Stack

### Frontend
* **Core**: React 18, TypeScript, Vite
* **Styling & UI**: Tailwind CSS (CSS variables for instant theming), Lucide React
* **Animations**: Framer Motion (page transitions and tab slide-fades)
* **Forms & State**: React Hook Form, Zod, Zustand
* **Charts & Alerts**: Recharts, Sonner toasts

### Backend
* **API Framework**: FastAPI (async ASGI, Python 3.12)
* **Database & ORM**: PostgreSQL (Supabase), SQLAlchemy 2.0, Alembic
* **Security**: JWT authentication (`python-jose`), `bcrypt` password hashing
* **PDF Processing**: `pypdf`
* **AI Model**: Google Gemini API (`gemini-3.1-flash-lite`) via REST transport

---

## 🧪 Evaluation & Benchmark Test Suite (`test_eval/`)

The repository includes a dedicated test harness to verify scoring calibration against baseline runs:

```bash
# Run complete evaluation on all 5 resume PDFs and 10 benchmark answers
python test_eval/run_eval.py

# Run prompt ablation & 3-run variance study (Old Prompt vs Improved Prompt)
python test_eval/retest_prompts.py
```

### Benchmark Results (Ablation Study)
* **Baseline / Old Prompt**: 50%–60% passing rate due to chronic grade inflation (awarded 85–95/100 to generic textbook answers).
* **Improved Calibrated Rubrics**: **90% calibration pass rate** (9/10 within exact target range), with score variance across 3 independent trials bounded within $\le 3$ points.

---

## 🏁 Quick Start Guide

### Prerequisites
* Python 3.10+
* Node.js 18+
* PostgreSQL database (e.g., Supabase or local instance)
* Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure your backend/.env
# DATABASE_URL=postgresql+psycopg2://user:password@host:5432/dbname
# SECRET_KEY=your_secret_key
# GEMINI_API_KEY=your_gemini_api_key
# GEMINI_MODEL=gemini-3.1-flash-lite

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload
```
* Backend API: `http://localhost:8000`
* Swagger API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
* Frontend Web App: `http://localhost:5173`

---

## 🗺 Roadmap (Phase 2 & Beyond)

- [x] Phase 1: Authentication, ATS Resume Analyzer, Question Generator, Calibrated Dual-Rubric Evaluator, Analytics Dashboard.
- [ ] **Phase 2: Real-Time AI Interview Experience**
  - FastAPI WebSockets for live bidirectional question streaming
  - Live typing effect & countdown timers
  - Voice / WebRTC audio interaction
- [ ] **B2B Recruiter Batch Screening**: Bulk ZIP upload with job-description matching and Top-5 candidate ranking leaderboard.

---

## 📄 Project Documentation for Technical Interviews
For a detailed guide on how to discuss this project, its architectural trade-offs, and STAR stories in hiring interviews, refer to [**PROJECT_EXPLANATION.md**](file:///c:/Users/dhruv/OneDrive/Desktop/Interview_platform/PROJECT_EXPLANATION.md).
