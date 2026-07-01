# InterviewAI — Project Summary

## 1. Tech Stack Overview

This project is built using a modern, scalable, and high-performance tech stack tailored for an excellent developer experience and a production-grade user experience.

### Frontend
- **Framework:** React 18 + Vite (with TypeScript)
- **Styling:** Tailwind CSS with a custom CSS variable–driven theming system (Light / Dark / System)
- **Animations:** Framer Motion (page transitions, tab slide-fades) + custom CSS keyframe utilities
- **State Management:** Zustand (lightweight, hook-based global auth state)
- **Forms & Validation:** React Hook Form + Zod (schema-driven login/register validation)
- **Data Visualization:** Recharts (score trend line chart, category performance bar chart)
- **Notifications:** Sonner (floating toast alerts for upload success, deletion, errors)
- **Icons:** Lucide React
- **HTTP Client:** Axios (with auto-injected JWT Bearer token)

### Backend
- **Framework:** FastAPI (Python, async)
- **Database ORM:** SQLAlchemy 2.0
- **Database Migrations:** Alembic
- **Database:** PostgreSQL (via psycopg2-binary)
- **Authentication & Security:** JWT (python-jose), bcrypt (direct, no passlib)
- **PDF Parsing:** pypdf (text extraction from uploaded resume files)

### AI Integration
- **Model:** Google Gemini 2.5 Flash (via `google-generativeai` SDK)
- **Modes:** Strict JSON-mode for all AI calls (deterministic, parseable responses)

---

## 2. Why We Chose This Tech Stack

- **React + Vite over Next.js:** Since InterviewAI is a pure client-side SaaS dashboard (no SEO-critical public pages), Vite's ultra-fast HMR dev experience and lean build output are a better fit than Next.js's SSR overhead. The app is fully SPA with React Router handling all navigation.

- **Tailwind CSS with CSS Variable Theming:** Instead of maintaining separate class sets per theme, we map the entire `slate` color family and `white` to CSS variables in `tailwind.config.js`. This means every component using `bg-slate-900` or `text-slate-100` automatically adapts when the `.light` class is toggled on `<html>` — zero per-component overrides needed.

- **FastAPI for the Backend:** Python's FastAPI provides async request handling, automatic OpenAPI docs, and first-class Pydantic validation — making it ideal for an AI-heavy backend where most work is waiting on I/O (Gemini API calls, DB queries).

- **Gemini 2.5 Flash with JSON Mode:** We use a single model across all AI tasks (question generation, answer evaluation, resume analysis, overall feedback) with strict JSON-mode responses. This eliminates parsing fragility and ensures the frontend always receives a consistent, typed data structure.

- **Zustand over Redux:** The app's global state needs are minimal — just auth (`user`, `token`). Zustand gives us that in ~30 lines with no boilerplate, no reducers, no action creators.

- **Alembic for Migrations:** As the schema evolves (new fields, relationship changes), Alembic provides version-controlled, reversible migration scripts tied directly to the SQLAlchemy model definitions.

---

## 3. Core Features

InterviewAI delivers a complete, end-to-end AI interview preparation platform:

- **AI Mock Interviews:** Users configure a category (Backend, Frontend, Full Stack, DSA, HR) and difficulty (Easy, Medium, Hard). Gemini generates 5 tailored questions in a single request. Users answer one at a time; each answer is individually evaluated by Gemini with a score, critique, strengths, weaknesses, and improvement suggestions — all stored as structured data.

- **Interview Feedback Report:** After completing a session, users see a full review: an overall score ring, AI-generated session summary, and a collapsible question-by-question breakdown with critique, suggestions, and ideal answer reference for each question.

- **ATS Resume Analyzer:** Users upload a PDF resume via drag-and-drop. The backend extracts raw text using `pypdf`, sends it to Gemini, and returns an ATS compatibility score (0–100) with actionable strengths, weaknesses, and recommendations. Results are stored and browsable in a searchable, sortable history.

- **Performance Analytics Dashboard:** Aggregated metrics computed entirely in PostgreSQL using `AVG`, `COUNT`, `MAX`, `MIN`, and `GROUP BY` — not in Python. Displays avg score, best score, completion rate, improvement trend, strongest/weakest category, avg ATS score, a score-over-time line chart, and a category breakdown bar chart.

- **Settings:** Theme management (Light/Dark/System with localStorage persistence), profile name editing, password update, notification preferences, and danger zone account deletion.

---

## 4. "Wow" Features (AI & Architecture)

What sets InterviewAI apart are its production-quality design decisions and AI capabilities:

- **🤖 Single-Request Question Generation:** All 5 interview questions are generated in one Gemini API call (not 5 separate calls), dramatically reducing latency and cost while keeping questions thematically consistent within the session.

- **📊 Database-Layer Analytics:** All KPIs and chart data are computed with SQL aggregation functions inside PostgreSQL — never in a Python loop. This keeps analytics fast and scalable regardless of how many sessions/resumes a user accumulates.

- **🎨 Platform-Wide Theme Toggle:** A 3-way theme system (☀️ Light / 🌙 Dark / 🖥 System) that propagates instantly across every page, card, sidebar, input, and border in the app — achieved by mapping the entire Tailwind `slate` palette to CSS variables. No page reload required.

- **🔒 Strict JSON-Mode AI Responses:** Every Gemini call uses structured JSON output mode with explicit schema instructions in the prompt. This eliminates hallucinated markdown, prose responses, or broken JSON — the AI always returns exactly the shape the backend expects.

- **⚡ Framer Motion Page Transitions:** Subtle fade + slide transitions between routes using `AnimatePresence`, giving the app a fluid, native-app feel without any perceived navigation lag.

- **🧱 Clean Architecture:** The backend strictly separates concerns — `api/` routers handle HTTP, `services/` contain business logic, `models/` define the schema, and `core/` owns security and config. No business logic leaks into routers, keeping the codebase extensible (e.g., adding WebSocket real-time interviews in Phase 2 requires only a new service + router, no rewrites).

- **📱 Mobile-Responsive Layout:** The sidebar collapses into a slide-out drawer on mobile with a blurred overlay backdrop. All KPI grids, feature cards, quick action strips, and resume history lists stack cleanly at mobile widths via responsive Tailwind grid classes.
