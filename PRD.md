# 📄 Product Requirements Document (PRD)

## **Emploify — AI-Powered Job Search & Application OS**

---

# 🧭 1. Product Overview

**Product Name:** Emploify
**Type:** SaaS Web Application (Monorepo)
**Architecture:** Turborepo + Bun
**Frontend:** Next.js
**Backend:** NestJS

---

## 🎯 Vision

> Emploify is a **Job Search Operating System** that helps users discover, track, and optimize job applications using AI.

---

## ❗ Problem

Job seekers struggle with:

- scattered job listings across platforms
- manual tracking of applications
- unclear job fit (waste of time applying blindly)
- lack of feedback or improvement loop

---

## 💡 Solution

Emploify combines:

- **Job Aggregation**
- **Application Tracking**
- **AI Matching & Guidance**

into one unified platform.

---

# 👤 2. Target Users

### 🎓 Primary: Junior Developers

- 0–2 years experience
- applying to many jobs
- unsure of qualifications

### 🔄 Secondary: Career Shifters

- learning tech
- need guidance

### 🧑‍💼 Tertiary: Active Job Seekers

- need organization + analytics

---

# 🎯 3. Goals & KPIs

## Goals

- Reduce time spent searching for jobs
- Increase quality of applications
- Improve user success rate

## KPIs

- DAU / MAU
- Jobs saved per user
- Applications tracked
- Match score engagement
- Retention (7-day, 30-day)

---

# 🧱 4. System Architecture

## Monorepo Structure (Turborepo)

```
apps/
  web        # Next.js frontend
  api        # NestJS backend
  worker     # background jobs (future)

packages/
  types
  schemas
  config
  sdk
```

---

## Tech Stack

- **Bun** → package manager + runtime
- **Turborepo** → orchestration
- **PostgreSQL** → database
- **Prisma** → ORM
- **Redis** → caching + queues
- **OpenAI API** → AI features

---

# 🚀 5. Core Features (MVP)

---

## 🔐 5.1 Authentication

- Email/password login
- OAuth (Google, GitHub optional)
- JWT-based auth

---

## 👤 5.2 User Profile

- name, location
- skills (tag-based)
- experience level
- resume upload

---

## 🔎 5.3 Job Aggregator

### Sources

- Greenhouse API
- Lever API
- Ashby API

### Features

- search jobs
- filters:
  - role
  - location
  - remote
  - experience level

---

## ⭐ 5.4 Save Jobs

- bookmark jobs
- quick access

---

## 📋 5.5 Application Tracker

Kanban board:

- Saved
- Applied
- Interview
- Offer
- Rejected

Features:

- drag & drop
- notes
- timestamps

---

## 🤖 5.6 AI Match Engine

### Inputs

- user profile
- resume
- job description

### Outputs

- match score (%)
- strengths
- missing skills

---

## 📊 5.7 Analytics Dashboard

- total applications
- interview rate
- offer rate
- funnel visualization

---

## 🧠 5.8 Resume Parsing

- extract:
  - skills
  - experience
  - education

---

# ⚙️ 6. Backend Modules (NestJS)

- AuthModule
- UserModule
- JobModule
- ApplicationModule
- AIModule
- NotificationModule

---

# 🔄 7. Worker System (Phase 2)

**apps/worker**

Handles:

- job ingestion
- deduplication
- AI scoring queue
- email alerts

---

# 🗄️ 8. Database Schema (Simplified)

### Users

- id
- email
- password

### Profiles

- user_id
- skills
- experience_level
- resume_url

### Jobs

- id
- title
- company
- location
- description
- source
- posted_at

### Applications

- id
- user_id
- job_id
- status
- notes

### SavedJobs

- user_id
- job_id

---

# 🔄 9. User Flows

---

## 🔍 Job Discovery Flow

1. user logs in
2. browses jobs
3. filters/searches
4. views job
5. sees AI score
6. saves/applies

---

## 📋 Tracking Flow

1. save job
2. move to "Applied"
3. update status

---

## 🤖 AI Flow

1. upload resume
2. parse data
3. match jobs
4. show insights

---

# 🚀 10. Phase 2 Features

---

## 🔔 Smart Alerts

- personalized job alerts

---

## 🧩 Chrome Extension

- save jobs from external sites

---

## 🧪 Interview Assistant

- generate questions
- simulate interview

---

## 🧠 Skill Gap Analyzer

- detect missing skills
- suggest improvements

---

## 📬 AI Follow-ups

- generate email templates

---

# 🎨 11. UX Principles

- fast search
- minimal friction
- clean dashboard
- responsive design
- developer-focused UI

---

# ⚠️ 12. Risks

- scraping limitations
- duplicate jobs
- AI cost scaling
- API reliability

---

# 🏁 13. MVP Scope (STRICT)

Build ONLY:

- auth
- job aggregator (ATS APIs)
- job search + filters
- save jobs
- tracker (kanban)
- AI match score
- analytics dashboard

---

# 🔮 14. Future Vision

> Emploify evolves into a **full Job OS**:
>
> - discovery
> - tracking
> - optimization
> - career guidance

---

# 💡 Final Positioning

> **"Emploify — Your AI-powered job search and application command center."**

---

## Next Steps

- Design **database schema (Prisma models)**
- Generate **NestJS modules + API routes**
- Create a **week-by-week build plan**