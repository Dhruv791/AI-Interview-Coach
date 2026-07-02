# InterviewAI — Project Codebase Overview

This document provides a comprehensive overview of the entire InterviewAI codebase, detailing all folders and files in both the frontend and backend, along with a summary of their purpose. InterviewAI is a full-stack SaaS application that uses AI-powered mock interviews, ATS resume analysis, and performance analytics to help candidates prepare for job interviews.

---

## Frontend (`frontend/`)

### Installed Packages

- **react** & **react-dom**: Core React 18 libraries for building the UI component tree.
- **react-router-dom**: Declarative client-side routing; handles page navigation and protected route guards.
- **typescript** & **@types/react** & **@types/react-dom**: TypeScript type definitions for type-safe development.
- **vite** & **@vitejs/plugin-react**: Ultra-fast build tool and dev server with HMR for the React app.
- **tailwindcss** & **postcss** & **autoprefixer**: Utility-first CSS framework used for all styling and dark/light theming via CSS variables.
- **tailwind-merge**: Merges Tailwind class strings intelligently, avoiding class conflicts in dynamic components.
- **clsx**: Lightweight utility for conditionally joining class names.
- **framer-motion**: Production-ready animation library used for page transitions and tab slide-fade animations.
- **sonner**: Lightweight, accessible toast notification library used for action feedback (upload success, deletion, errors).
- **recharts**: Composable charting library built on React and D3, used for the analytics score trend and category bar charts.
- **lucide-react**: Consistent, clean icon set used throughout the UI (nav icons, action icons, state indicators).
- **zustand**: Minimal, fast global state management used for the authentication store.
- **react-hook-form** & **@hookform/resolvers** & **zod**: Form state management and schema-based validation for login and registration forms.

---

### Root Configuration Files

- **`package.json`**: Lists all project dependencies, devDependencies, and npm scripts (`dev`, `build`, `preview`).
- **`tailwind.config.js`**: Tailwind configuration mapping all `slate` color shades and `white` to CSS variables, enabling automatic light/dark theme switching platform-wide without changing individual component classes.
- **`tsconfig.json`** & **`tsconfig.node.json`**: TypeScript compiler configuration files for the app and the Vite node environment.
- **`index.html`**: Root HTML entry point; mounts the React app at `#root`.

---

### `/src` — Application Source

#### Root Source Files

- **`main.tsx`**: Application entry point. Mounts `<App />` into the DOM and imports global CSS.
- **`App.tsx`**: Top-level component. Initialises `ThemeProvider`, `BrowserRouter`, and `Toaster`, then sets up the full route tree — splitting public routes (`/login`, `/register`) from all protected routes that share the persistent `Layout` wrapper.
- **`index.css`**: Global stylesheet. Declares all CSS custom property variables for both dark (`:root`) and light (`.light`) themes, including the full `slate-50` through `slate-950` palette and `white`. Also defines `body` baseline styles, form element resets (`color: inherit; background-color: transparent`), and `@keyframes fadeIn` animation utilities.

---

#### `/src/api` — API Client Layer

*Thin HTTP client modules that abstract all communication with the FastAPI backend.*

- **`client.ts`**: Configures a shared `axios` instance with `baseURL` pointing to the backend (`http://localhost:8000`), and automatically attaches the JWT `Authorization: Bearer` header on every request by reading from the auth store.
- **`auth.ts`**: Exports `login(email, password)` and `register(fullName, email, password)` — calls `/api/auth/login` and `/api/auth/register`, returning the user object and token.
- **`interviews.ts`**: Exports `startInterview()`, `listInterviews()`, `getInterview(id)`, `submitResponse()`, and `completeInterview()` — covering the complete interview lifecycle API surface.
- **`resumes.ts`**: Exports `uploadResume(file)`, `listResumes()`, and `deleteResume(id)` — wraps multipart file upload and resume CRUD operations.
- **`analytics.ts`**: Exports `getAnalyticsSummary()` — fetches the fully aggregated `AnalyticsSummary` DTO from the backend's single analytics endpoint.

---

#### `/src/components` — Reusable Layout Components

*Structural shell components shared across all authenticated pages.*

- **`Layout.tsx`**: The main authenticated layout wrapper. Renders `Sidebar` + `Topbar` alongside a React Router `<Outlet />` for nested page routes. Implements Framer Motion `AnimatePresence` + `motion.div` for page-level fade-slide transitions on route changes. Also renders the global footer bar (`InterviewAI · v1.0 · Made with React + FastAPI + Gemini`).
- **`Sidebar.tsx`**: Persistent left navigation sidebar. Lists all main nav routes (Dashboard, Mock Interviews, Resume Analyzer, Analytics, Settings) with active route highlighting via `NavLink`. Supports desktop collapse/expand toggle and a mobile slide-out drawer with a backdrop overlay. Contains the Logout button pinned at the bottom.
- **`Topbar.tsx`**: Fixed top header bar. Contains the 3-way theme toggle (☀️ Light / 🌙 Dark / 🖥 System) wired to `ThemeProvider` and an avatar-based dropdown showing the user's initials, full name/email, with links to Profile, Settings, and Logout.
- **`ThemeProvider.tsx`**: React context provider managing theme state (`'dark'`, `'light'`, `'system'`). Persists the user's selection to `localStorage`, applies the `.light` or `.dark` CSS class to `<html>`, and listens for OS-level `prefers-color-scheme` changes when in `'system'` mode.
- **`ProtectedRoute.tsx`**: Route guard HOC. Reads `user` and `token` from the auth store; redirects unauthenticated users to `/login`. Displays a centered spinner while auth state is being hydrated from `localStorage` on page load.

---

#### `/src/pages` — Application Pages

*Full-page view components, each mapped to a route in `App.tsx`.*

- **`LoginPage.tsx`**: Authentication page with email/password form, `react-hook-form` + `zod` validation, inline error display, and a link to registration. Redirects to `/dashboard` on success.
- **`RegisterPage.tsx`**: New account registration form (name, email, password, confirm password) with the same validation stack. Calls `register()` and auto-logs the user in on success.
- **`DashboardPage.tsx`**: Main home page. Features a **time-aware greeting** (`Good Morning/Afternoon/Evening, Name`), **CTA buttons** (Continue Last Interview / Start New Interview with deep-link to in-progress session), **KPI stat cards** with weekly trend badges (`↑ +8% this week`), a **Quick Actions strip** linking to Start Interview, Upload Resume, and View Analytics, a **platform feature card grid**, and a **Recent Sessions list** with animated skeleton loaders during data fetch.
- **`InterviewSetupPage.tsx`**: Interview configuration form. Lets users pick a **category** (Backend, Frontend, Full Stack, DSA, HR) using visually lifted selection cards (scale-up + indigo glow shadow on selected state), and a **difficulty** using emoji-coded buttons (🟢 Easy, 🟡 Medium, 🔴 Hard) with color-matched borders. Shows an **Estimated Duration & Question Count** summary block before the Start button. Calls `startInterview()` and navigates to the session page.
- **`InterviewSessionPage.tsx`**: The live mock interview flow. Displays one AI-generated question at a time with a progress indicator. Contains the answer `textarea` with fixed dark styling (`bg-slate-800`, `text-slate-100`, `caret-slate-200`, `placeholder:text-slate-500`) and selection highlight. Handles submit-per-question, shows per-question AI evaluation loading state, and navigates to feedback on session completion.
- **`InterviewFeedbackPage.tsx`**: Post-interview review report. Shows an overall score ring, an AI evaluation summary paragraph, and a collapsible question-by-question breakdown containing the original question, the user's answer, AI Critique, Improvement Suggestions, and the Ideal Answer Reference for each question.
- **`ResumePage.tsx`**: ATS Resume Analyzer. Two-panel layout: left panel has a **drag-and-drop upload zone** (glows indigo on dragover, shows "Drop Resume Here"), a **Search + Sort (Newest/Oldest)** controlled resume history list; right panel shows an enlarged **ATS score gauge** with match-quality status labels (`Excellent · Top 10% · ATS Ready`), and **Strengths / Weaknesses / Recommendations** tabs with Framer Motion slide-fade transitions between them. Emits sonner toasts on upload success, failure, and deletion.
- **`AnalyticsPage.tsx`**: Performance analytics dashboard. KPI grid (Avg Score, Best Score, Completion Rate, Improvement %), a Recharts `LineChart` for score trend with reference lines and a "Last 30 Days" label badge, a Recharts `BarChart` for category breakdown (with a proper empty-state if fewer than 2 categories have data), and **collapsible Recurring Strengths / Areas to Improve** insight panels with animated frequency progress bars.
- **`SettingsPage.tsx`**: Full user settings page with a side-tab navigation for five sections: **Profile** (display name edit), **Theme** (card-style Light/Dark/System picker wired to `ThemeProvider`), **Password** (3-field update form with show/hide toggle), **Notifications** (animated toggle switches for 3 preferences), and **Danger Zone** (DELETE-typed confirmation input for account deletion).

---

#### `/src/store` — Global State

- **`authStore.ts`**: Zustand store holding `user`, `token`, and `isLoading`. Exports `login()` (stores token + user in state and `localStorage`), `logout()` (clears both), and `hydrate()` (restores auth from `localStorage` on app boot via `useEffect` in `App.tsx`). The API `client.ts` reads the token from this store on every request.

---

#### `/src/types` — TypeScript Declarations

- **`lucide-react.d.ts`**: Minimal ambient type declaration for lucide-react icon imports inside JSX files.

---

## Backend (`backend/`)

### Installed Packages

- **fastapi**: High-performance async Python web framework used to build all REST API endpoints.
- **uvicorn**: ASGI server used to serve the FastAPI application in development (`--reload` mode).
- **sqlalchemy**: Python ORM for defining database models and running queries against PostgreSQL.
- **alembic**: Database migration tool for SQLAlchemy; manages schema versioning and `upgrade`/`downgrade` scripts.
- **psycopg2-binary**: PostgreSQL adapter for Python, used by SQLAlchemy to connect to the database.
- **pydantic** & **pydantic-settings**: Data validation for request/response schemas and environment variable loading from `.env`.
- **python-jose[cryptography]**: JWT token creation and validation for stateless authentication.
- **bcrypt**: Password hashing; used directly (without passlib) to hash and verify user passwords securely.
- **python-multipart**: Enables FastAPI to parse `multipart/form-data` requests required for PDF file uploads.
- **google-auth**: Google authentication utilities used alongside the Gemini API client initialisation.
- **pypdf**: PDF parsing library; extracts raw text content from uploaded resume PDFs before passing to Gemini.
- **google-generativeai**: Official Python client for Google Gemini AI models (`gemini-2.5-flash`); powers all AI features — question generation, answer evaluation, and resume analysis.

---

### Root Configuration Files

- **`requirements.txt`**: Lists all Python package dependencies with minimum version constraints for the backend.
- **`.env`**: Environment variables file (gitignored). Contains `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, and `GEMINI_API_KEY`.
- **`alembic.ini`**: Alembic configuration pointing to the database URL and migration script directory locations.

---

### `/alembic` — Database Migrations

- **`env.py`**: Alembic environment script. Imports all SQLAlchemy model classes so `Base.metadata` contains the full schema, configures the migration context with the live `DATABASE_URL`, and runs migrations in online mode.
- **`script.py.mako`**: Mako template used by Alembic to auto-generate new migration revision files.
- **`versions/`**: Contains timestamped migration scripts recording every schema change applied to the PostgreSQL database (table creations, column additions, relationship changes).

---

### `/app` — Main Application Module

- **`main.py`**: The FastAPI application factory. Creates the `app` instance, configures CORS middleware allowing the React dev server origin, and registers all API routers (`auth`, `interviews`, `resumes`, `analytics`, `users`) under the `/api` prefix.

---

#### `/app/core` — Core Utilities

- **`config.py`**: Pydantic `Settings` class that reads all required environment variables (`DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`) from the `.env` file at startup. Exports a singleton `settings` object used throughout the app.
- **`database.py`**: Creates the SQLAlchemy `engine` and `SessionLocal` factory from `settings.DATABASE_URL`. Exports the `Base` declarative class for all ORM models and a `get_db` generator dependency that yields a DB session per request and closes it afterward.
- **`security.py`**: Security utilities — `hash_password(plain)` and `verify_password(plain, hashed)` (using bcrypt directly), `create_access_token(data, expires_delta)` and `decode_access_token(token)` (using python-jose / HS256 JWT).

---

#### `/app/models` — SQLAlchemy ORM Models

*Define the PostgreSQL database schema as Python dataclasses.*

- **`__init__.py`**: Imports all model classes so that when Alembic imports `Base.metadata`, it auto-detects the complete schema for migration generation.
- **`user.py`**: `User` table — `id` (UUID PK), `email` (unique, indexed), `hashed_password`, `full_name`, `created_at`. Has one-to-many relationships to `InterviewSession` and `Resume`.
- **`interview.py`**: `InterviewSession` table — `id` (UUID PK), `user_id` (FK → User), `category`, `difficulty`, `overall_score`, `overall_feedback`, `created_at`, `completed_at`. Has a one-to-many relationship to `InterviewQuestion`.
- **`feedback.py`**: `InterviewQuestion` table — `id`, `session_id` (FK → InterviewSession), `question_text`, `suggested_answer`, `order_index`. Has a one-to-one relationship to `QuestionResponse`. `QuestionResponse` table — `id`, `question_id`, `user_answer`, and a JSON column storing the structured AI `EvaluationFeedback` (score, critique, strengths, weaknesses, suggestions).
- **`resume.py`**: `Resume` table — `id` (UUID PK), `user_id` (FK → User), `file_name`, `raw_text`, `uploaded_at`. Has a one-to-one relationship to `ResumeAnalysis`. `ResumeAnalysis` table — stores the full Gemini output: `ats_score` (int), `strengths` (JSON array), `weaknesses` (JSON array), `recommendations` (JSON array), `raw_ai_response`.

---

#### `/app/api` — Route Handlers (Routers)

*FastAPI `APIRouter` modules mapping HTTP endpoints to service-layer calls, using `Depends()` for DI.*

- **`deps.py`**: Shared FastAPI dependencies. `get_db` yields a SQLAlchemy `Session` per request. `get_current_user` decodes the Bearer JWT, looks up the user in the database, and raises `HTTP 401` if the token is invalid or the user doesn't exist.
- **`auth.py`**: `/api/auth/register` (POST) and `/api/auth/login` (POST). Handles new user creation with bcrypt hashing, prevents duplicate email registration, and returns a signed JWT access token alongside the user object on success.
- **`interviews.py`**: Full interview lifecycle API:
  - `POST /api/interviews/start` — Creates a session record, calls `interview_service` to generate all 5 questions via a single Gemini request, persists them with `order_index`, and returns the session.
  - `GET /api/interviews/` — Lists all sessions for the authenticated user (newest first).
  - `GET /api/interviews/{id}` — Returns a single session with all questions, responses, and feedback (validates user ownership).
  - `POST /api/interviews/{id}/respond` — Accepts `question_id` + `answer`, calls Gemini to evaluate it, stores structured feedback, and prevents duplicate submissions for the same question.
  - `POST /api/interviews/{id}/complete` — Marks session as `completed_at`, computes overall score (mean of per-question scores), generates a final summary via Gemini, and returns the updated session.
- **`resumes.py`**: Resume management API:
  - `POST /api/resumes/upload` — Accepts a PDF `UploadFile`, extracts text via `pypdf`, sends to Gemini for ATS analysis, persists the `Resume` and `ResumeAnalysis` records.
  - `GET /api/resumes/` — Lists all resumes for the current user (newest first).
  - `DELETE /api/resumes/{id}` — Validates ownership and deletes the resume and its analysis.
- **`analytics.py`**: `GET /api/analytics/summary` — Single aggregation endpoint that delegates entirely to `AnalyticsService` and returns a structured `AnalyticsSummary` DTO containing KPIs, trend data, category breakdown, and insight arrays.
- **`users.py`**: `GET /api/users/me` — Returns the authenticated user's profile data. Used by the frontend `hydrate()` function to restore the user object from a stored token on app load.

---

#### `/app/services` — Business Logic Layer

*Service modules containing complex orchestration logic, keeping routers thin and independently testable.*

- **`gemini.py`**: Wrapper around the `google-generativeai` SDK. Initialises the `gemini-2.5-flash` model with strict **JSON-mode** response configuration for deterministic, parseable outputs. Exports:
  - `generate_interview_questions(category, difficulty, count)` — Single Gemini call producing all questions and ideal answers as a typed JSON array.
  - `evaluate_answer(question, answer)` — Per-question evaluation returning `score`, `critique`, `strengths`, `weaknesses`, and `suggestions` as structured JSON.
  - `generate_overall_feedback(session_data)` — Produces the final session-level feedback summary from all question/answer pairs.
  - `analyze_resume(text)` — Sends extracted resume text to Gemini and returns `ats_score`, `strengths[]`, `weaknesses[]`, and `recommendations[]` as structured JSON.
- **`interview_service.py`**: Orchestrates the interview workflow on top of `gemini.py`. Handles bulk question creation from a single generation response, per-question response submission logic with duplicate-answer prevention, and final score computation (arithmetic mean of all per-question scores).
- **`analytics_service.py`**: Contains the `AnalyticsService` class. All aggregation runs directly in PostgreSQL using SQLAlchemy's `func.avg()`, `func.count()`, `func.max()`, `func.min()`, and `GROUP BY` — not in Python. Computes and returns: **KPIs** (`avg_score`, `best_score`, `completion_rate`, `improvement_pct`, `best_category`, `weakest_category`, `total_resumes`, `avg_ats_score`), **score trend** (ordered list of session scores for the line chart), **category breakdown** (avg/best score and count per category for the bar chart), and **insight arrays** (aggregated recurring strength and weakness keywords from all stored evaluations).

## To Start 

Activate the venv : venv\Scripts\activate
Start the backend :  uvicorn app.main:app --reload --port 8000
start the frontend: npm run dev