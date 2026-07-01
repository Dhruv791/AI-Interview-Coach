InterviewAI — Project Summary
Project Overview
InterviewAI is a production-style AI-powered interview preparation platform designed to help students and job seekers improve their interview skills through personalized AI assistance. The platform combines resume analysis, AI-generated mock interviews, intelligent answer evaluation, and performance analytics into a single modern web application.

The project follows a scalable full-stack architecture with a React + TypeScript frontend and a FastAPI backend powered by PostgreSQL and Google Gemini AI.

Tech Stack
Frontend
React 18

TypeScript

Vite

Tailwind CSS

Framer Motion

React Hook Form

Zod

Zustand

Recharts

Axios

Sonner

Lucide React

Backend
FastAPI

SQLAlchemy

Alembic

PostgreSQL

JWT Authentication

bcrypt

Pydantic

pypdf

AI
Google Gemini 2.5 Flash API

Deployment
Frontend → Vercel

Backend → Render

Database → Supabase PostgreSQL

Implemented Features (Phase 1)
Authentication
User Registration

User Login

JWT Authentication

Protected Routes

Persistent Login using Local Storage

ATS Resume Analyzer
PDF Resume Upload

Resume Text Extraction

AI-powered ATS Analysis

ATS Score Generation

Strengths Identification

Weakness Detection

Resume Improvement Suggestions

Resume History

Search & Sort Uploaded Resumes

AI Mock Interviews
Users can configure interviews by:

Backend

Frontend

Full Stack

DSA

HR

Difficulty Levels:

Easy

Medium

Hard

Features:

AI-generated interview questions

Sequential interview flow

Answer submission

AI evaluation

Per-question score

AI feedback

Suggested answers

Overall interview score

Final interview summary

Interview history

Performance Analytics
Interactive dashboard displaying:

Average Interview Score

Highest Score

Total Interviews

ATS Average

Score Trend Chart

Category Performance Chart

Strong Areas

Weak Areas

Performance Insights

Dashboard
Personalized greeting

Quick Actions

Recent Interview Sessions

Resume Statistics

Analytics Summary

Navigation Cards

Settings
Profile Management

Password Update

Theme Settings

Notification Preferences

Danger Zone (Account Management)

Backend Architecture
The backend follows a modular architecture:

app/
│
├── api/
├── core/
├── models/
├── schemas/
├── services/
└── main.py
This separation keeps business logic independent from API routes and makes the application scalable and maintainable.

Database
PostgreSQL stores:

Users

Resumes

Resume Analysis

Interview Sessions

Questions

Responses

AI Feedback

AI Features
Google Gemini powers:

ATS Resume Analysis

Interview Question Generation

Answer Evaluation

Interview Summary Generation

Improvement Recommendations

All AI responses are requested in structured JSON format for reliable parsing.

UI Highlights
Modern SaaS Dashboard

Fully Responsive Layout

Light / Dark / System Theme

Smooth Framer Motion Animations

Interactive Charts

Clean Sidebar Navigation

Toast Notifications

Loading States

Premium Card-based Design

Development Practices
Type-safe frontend with TypeScript

Modular FastAPI backend

RESTful API design

JWT Authentication

SQLAlchemy ORM

Alembic Migrations

Reusable React Components

Centralized API Layer

Global State with Zustand

Responsive Design

Production-ready project structure

Future Roadmap (Phase 2)
Planned enhancements include:

Real-time AI interviews using FastAPI WebSockets

Live AI typing effect

Question timer

Session timer

Live progress tracking

Live score updates

Voice-based interviews

Google OAuth

Deployment optimization

Admin dashboard

Interview sharing

Learning Outcomes
Through this project, I gained hands-on experience in:

Full Stack Web Development

TypeScript

FastAPI

PostgreSQL

SQLAlchemy

JWT Authentication

AI API Integration

Prompt Engineering

REST API Design

Database Design

State Management

Responsive UI Development

Data Visualization

Production-ready Software Architecture

Project Status
Current Status: ✅ Phase 1 Complete

Completed Modules:

Authentication

Resume Analyzer

AI Mock Interviews

Performance Analytics

Dashboard

Settings

Responsive UI

GitHub Repository

Next Milestone: Phase 2 – Real-time AI Interview Experience using FastAPI WebSockets.

