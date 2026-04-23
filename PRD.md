# 📄 Product Requirements Document (PRD)

## Emploify — AI-Powered Job Search & Application OS

---

# 1. Product Overview

**Product Name:** Emploify  
**Type:** SaaS Web Application (Monorepo)  
**Architecture:** Turborepo + Bun  
**Frontend:** Next.js  
**Backend:** NestJS

## Vision

> Emploify is a job search operating system that helps users discover, track, and optimize job applications with AI-assisted guidance.

## Problem

Job seekers struggle with:
- scattered job listings across multiple sources
- manual tracking of applications
- unclear job fit before applying
- weak feedback loops for improving search performance

## Solution

Emploify combines:
- **Job aggregation**
- **Application tracking**
- **AI matching and guidance**
- **Search analytics**

into one workflow-focused application.

---

# 2. Target Users

## Primary: Junior Developers
- 0–2 years of experience
- applying broadly
- unsure which roles are realistic matches

## Secondary: Career Shifters
- transitioning into tech
- need skill and job-fit guidance

## Tertiary: Active Job Seekers
- need an organized pipeline and clear metrics

---

# 3. Product Goals & KPIs

## Goals
- reduce time spent searching for jobs
- improve application quality
- increase follow-through and tracking discipline
- improve user confidence through clearer fit signals

## KPIs
- DAU / MAU
- jobs saved per user
- applications tracked per user
- match score engagement
- 7-day and 30-day retention

---

# 4. Current System Architecture

## Monorepo Structure

```txt
apps/
  web        # Next.js frontend
  api        # NestJS backend

packages/
  ui
  typescript-config
```

## Current Tech Stack
- **Bun** — package manager/runtime
- **Turborepo** — monorepo orchestration
- **Next.js 16** — frontend
- **NestJS 11** — backend
- **PostgreSQL** — primary database
- **Prisma** — ORM
- **Better Auth** — auth (session/cookie-based)
- **OpenAI-compatible or Anthropic provider** — optional AI enrichment
- **Heuristic fallback** — used when no LLM provider is configured

## Planned / Future Infrastructure
- **Redis** — caching / queues (planned, not implemented)
- **Worker app** — scheduled ingestion / async pipelines (planned, not implemented)

---

# 5. Current MVP Scope

Build and ship only:
- authentication
- job aggregation from ATS providers
- job search + filters
- save jobs
- application tracker (kanban)
- AI match scoring
- analytics dashboard
- user profile with resume attachment support

---

# 6. Implemented Features

## 6.1 Authentication
Current implementation:
- email/password authentication
- optional Google / GitHub social login
- Better Auth session/cookie-based auth
- backend-owned auth enforcement in NestJS

## 6.2 User Profile
Current implementation:
- name
- location
- skills
- experience level
- resume URL
- resume text parsing
- resume file upload with stored resume URL

Current upload behavior:
- TXT, PDF, DOC, and DOCX files can be uploaded
- text files are parsed automatically for profile autofill
- PDF / Word files are stored and attached to the profile, with richer extraction planned later

## 6.3 Job Aggregator
Sources:
- Greenhouse
- Lever
- Ashby

Current behavior:
- provider adapters exist
- manual sync endpoint exists
- sync status reporting exists
- seed fallback jobs support local/demo usage

## 6.4 Job Search
Current behavior:
- search jobs
- filter by:
  - keyword / role
  - location
  - source
  - remote
  - experience level

## 6.5 Save Jobs
Current behavior:
- bookmark/save jobs
- reuse saved jobs in tracker and recommendations

## 6.6 Application Tracker
Current behavior:
- kanban stages:
  - Saved
  - Applied
  - Interview
  - Offer
  - Rejected
- notes
- timestamps
- drag-and-drop movement

## 6.7 AI Match Engine
Inputs:
- user profile
- parsed resume/profile data
- job description

Outputs:
- match score
- strengths
- missing skills
- optional AI explanation when LLM is configured

## 6.8 Analytics Dashboard
Current behavior:
- total applications
- saved jobs count
- interview rate
- offer rate
- funnel-style overview

---

# 7. Backend Structure (Current)

Current backend areas:
- auth controller + Better Auth integration
- reusable auth guards and decorators
- user module
- job module
- application module
- AI module
- LLM provider module

Planned but not implemented yet:
- notification module
- worker app / async ingestion pipeline

---

# 8. Database Model Summary

## Users
- id
- name
- email
- auth-related Better Auth fields

## Profiles
- userId
- location
- skills
- experienceLevel
- resumeUrl

## Jobs
- id
- title
- company
- location
- description
- source
- postedAt
- remote
- experienceLevel

## Applications
- id
- userId
- jobId
- status
- notes

## SavedJobs
- userId
- jobId

## Better Auth Tables
- session
- account
- verification

---

# 9. Core User Flows

## Job Discovery Flow
1. user signs in
2. browses or syncs jobs
3. filters/searches roles
4. reviews fit signals
5. saves job or tracks it

## Tracking Flow
1. user saves a job
2. job appears in tracker
3. user moves it across stages
4. user adds notes and monitors updates

## AI Flow
1. user fills profile or uploads/pastes resume
2. system extracts profile signals
3. jobs are scored against profile
4. user sees strengths, missing skills, and optional AI explanation

---

# 10. Gaps Between Current Product and Planned Vision

These are recognized but not fully implemented yet:
- richer resume extraction for PDF / DOCX
- automated scheduled ingestion via worker
- Redis-backed queues / caching
- stronger job deduplication pipeline
- startup config validation and DTO validation
- role-based permissions beyond env-based admin emails
- notifications / smart alerts

---

# 11. Phase 2 / Future Features

Planned future features:
- smart alerts
- Chrome extension for external job saving
- interview assistant
- skill gap analyzer
- AI follow-up message generation
- dedicated worker service for ingestion and AI queues

---

# 12. UX Principles

- fast search
- minimal friction
- responsive layout
- clean dashboard-driven workflow
- practical, developer-focused UI

---

# 13. Risks

- ATS API reliability
- duplicate job ingestion
- LLM cost scaling
- resume parsing quality for non-text formats
- auth/configuration drift across environments

---

# 14. Current Recommended Next Steps

Near-term priorities:
1. improve PRD / implementation alignment continuously
2. strengthen job ingestion reliability and deduplication
3. improve resume upload and richer parsing for PDF / DOCX
4. add DTO validation and startup config validation
5. refine admin UX and permissions
6. continue integration and end-to-end testing

---

# Final Positioning

> **Emploify — your AI-powered job search and application command center.**
