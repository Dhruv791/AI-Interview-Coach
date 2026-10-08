"""
Test script to run 4 sample resumes (weak to strong) through the calibrated analyzer
to verify realistic score spread across the spectrum.
"""
import sys
import json
from app.services.gemini import analyze_resume, calculate_objective_metrics

SAMPLE_RESUMES = {
    "1. Barebones / Weak (Expected 30-48)": """
John Doe
Location: New York

Summary
Looking for any software developer job. I want to learn new technologies.

Experience
Helper Intern - Small Shop (2025 - 2026)
- Helped with computer setup and fixed printer issues.
- Worked on simple HTML webpage for local store.
- Assisted with data entry and typing.
- Responsible for fixing some CSS bugs.

Education
High School Diploma (2024)

Skills
HTML, CSS, MS Word, Windows, Typing
""",

    "2. Junior Developer / Basic (Expected 50-64)": """
Alex Rivera
alex.rivera.dev@gmail.com | Phone: (555) 349-2910 | github.com/alexrivera-dev

Objective
Motivated junior software engineer with hands-on experience in Javascript and Python looking for an entry-level position.

Education
B.S. in Computer Science - State University (2022 - 2026)
GPA: 3.6/4.0

Technical Skills
- Languages: JavaScript, Python, HTML, CSS, SQL
- Frameworks & Tools: React, Node.js, Express, Git, MongoDB, Tailwind CSS

Projects
Task Manager Web Application
- Built a task management app with user authentication using React and Node.js.
- Implemented MongoDB CRUD operations for creating and updating tasks.
- Added responsive styling with Tailwind CSS.

Weather Dashboard
- Created a weather dashboard fetching forecasts from OpenWeather API.
- Implemented search bar for city lookups and stored recent queries in localStorage.
""",

    "3. Mid-Level Full Stack Engineer (Expected 68-79)": """
Sarah Chen
sarah.chen@techmail.io | +1 (415) 882-9102 | linkedin.com/in/sarahchen-dev | github.com/sarahchen-eng

Professional Summary
Full Stack Software Engineer with 3+ years of experience building scalable web applications using React, Python FastAPI, and PostgreSQL. Passionate about API design, clean code, and database performance.

Work Experience
Software Engineer - CloudScale Inc. (2024 - Present)
- Developed RESTful APIs in FastAPI serving over 80,000 daily active users with sub-100ms response times.
- Optimized PostgreSQL database queries with composite indexes, reducing average query execution time by 32%.
- Migrated legacy frontend components to React with TypeScript and Zustand, improving Lighthouse performance score from 68 to 92.
- Integrated automated CI/CD pipelines using GitHub Actions and Docker, cutting deployment cycle times by 40%.

Associate Engineer - DataFlow Systems (2023 - 2024)
- Built interactive analytics dashboards in React and Tailwind CSS for enterprise clients.
- Automated ETL ingestion scripts in Python processing 500,000 records weekly.
- Participated in agile sprints, peer code reviews, and unit test coverage maintenance (>85%).

Education
B.S. in Software Engineering - University of Washington (2019 - 2023)

Technical Skills
- Languages: Python, TypeScript, JavaScript, SQL, HTML/CSS
- Frameworks: FastAPI, React, Node.js, Next.js, SQLAlchemy
- Infrastructure: Docker, PostgreSQL, Redis, AWS (S3, EC2), Git, GitHub Actions, Linux
""",

    "4. Senior / Staff Distributed Systems Engineer (Expected 85-95)": """
Marcus Vance
marcus.vance@infrastack.io | +1 (206) 555-0199 | linkedin.com/in/marcus-vance-infra | github.com/marcusvance

Executive Summary
Staff Backend & Distributed Systems Engineer with 8+ years of experience architecting high-throughput microservices, real-time streaming platforms, and low-latency infrastructure handling 15M+ daily requests across AWS and GCP.

Professional Experience
Lead Backend Systems Architect - HyperScale Network (2023 - Present)
- Architected and spearheaded the migration of a monolithic payment processing engine into event-driven Go/gRPC microservices, handling $42M in quarterly transactions with 99.995% uptime.
- Engineered a distributed Redis caching and Kafka message broker cluster, reducing p99 API latency from 380ms to 24ms across 12,000 RPS.
- Spearheaded database partitioning and connection pool optimization across Amazon Aurora PostgreSQL clusters, reducing AWS infrastructure spend by $145,000 annually.
- Mentored a distributed team of 14 senior engineers, championing zero-trust security practices and automated canary deployment strategies.

Senior Software Engineer - DataCore Technologies (2020 - 2023)
- Designed real-time telemetry ingestion pipelines processing 850,000 events/sec using Apache Kafka, Apache Flink, and ClickHouse.
- Implemented distributed tracing and observability using OpenTelemetry, Prometheus, and Grafana, reducing Mean Time to Detection (MTTD) by 65%.
- Authored custom Kubernetes operators in Go for automated cluster autoscaling during traffic surges of up to 400% baseline load.

Education
M.S. in Computer Science (Distributed Systems) - Stanford University (2018 - 2020)
B.S. in Computer Science - UC Berkeley (2014 - 2018)

Core Competencies & Stack
- Architecture: Distributed Systems, High Availability, Microservices, Event-Driven Architecture, CQRS, CDC
- Languages: Go, Python, Rust, SQL, C++
- Data & Storage: PostgreSQL, Redis, Apache Kafka, ClickHouse, Cassandra, ElasticSearch
- Cloud & DevOps: Kubernetes, Docker, Terraform, AWS (EKS, Aurora, SQS, S3), GCP, CI/CD, OpenTelemetry
"""
}


def run_tests():
    print("=" * 80)
    print("RUNNING CALIBRATED ATS RESUME SCORING TESTS")
    print("=" * 80)

    for title, resume_text in SAMPLE_RESUMES.items():
        print(f"\n--- Testing: {title} ---")
        try:
            result = analyze_resume(resume_text, is_guest=False)
            breakdown = result["score_breakdown"]
            print(f"-> FINAL ATS SCORE: {result['ats_score']} / 100")
            print(f"-> Score Breakdown:")
            print(f"   * Contact & Links:        {breakdown['contact_and_links']:2d} / 15")
            print(f"   * Section Structure:      {breakdown['section_structure']:2d} / 10")
            print(f"   * Quantified Metrics:     {breakdown['quantified_metrics']:2d} / 10")
            print(f"   * Technical Depth:        {breakdown['technical_depth']:2d} / 25")
            print(f"   * Impact & Scope:         {breakdown['impact_and_experience']:2d} / 25")
            print(f"   * Action Verbs & Writing: {breakdown['action_verbs_and_writing']:2d} / 15")
            print(f"-> Top Strength: {result['strengths'][0] if result['strengths'] else 'None'}")
            print(f"-> Top Weakness: {result['weaknesses'][0] if result['weaknesses'] else 'None'}")
        except Exception as e:
            print(f"ERROR analyzing resume: {e}")

    print("\n" + "=" * 80)
    print("TEST SUITE COMPLETED")
    print("=" * 80)


if __name__ == "__main__":
    run_tests()
