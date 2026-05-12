# Technical Approach

**Project:** Application Portal (South Africa)  
**Audience:** Stakeholders + Technical Review  
**Date:** 12 May 2026  

---

## 1) Context Alignment (from latest feedback)

- **POPIA Officer:** The client will handle governance, enforcement, and training via a designated POPIA/compliance officer. We will implement the **technical POPIA controls** end-to-end.
- **Target Usage Date:** Applicants typically start using the portal **mid-September**. Admin staff training and final technical handover must happen **before** the application opening window.
- **Peak Load (rough):** The brief indicates **500+ applicants**. The staff side is expected to be **~5 internal staff** using the system concurrently.

---

## 2) Proposed Architecture & Tech Stack

### Application Stack (recommended)

- **Frontend:** Next.js (TypeScript) for the public applicant portal + staff dashboard UI
- **Backend API:** .NET 8 (ASP.NET Core Web API)
- **Database:** PostgreSQL (RDS/Azure Database for PostgreSQL equivalent)
- **File storage:** Object storage (S3/Azure Blob) for uploads/exports, with encryption
- **Authentication:** Managed identity provider (AWS Cognito / Azure AD B2C) or ASP.NET Identity (depending on client preference)
- **Emails:** Transactional email service (SES / SendGrid equivalent)
- **Monitoring:** Centralized logs/alerts (CloudWatch / Application Insights)

This stack is a strong fit for multi-role workflow enforcement, audit trails, and policy-based authorization.

---

## 3) Backend Architecture (answers to revised technical questions)

### 3.1 Backend language/framework

- **.NET 8 / ASP.NET Core** for the API and workflow engine.
- Clean separation: **API** (endpoints) → **Application layer** (workflow/services) → **Domain** (rules/states) → **Infrastructure** (DB/storage/email/audit).

### 3.2 Database choice

- **PostgreSQL** for transactional workflow data, scoring, and audit reporting.

### 3.3 Cloud provider

- **AWS** recommended for a lean but secure setup (RDS, S3, KMS, WAF, CloudFront, SES).
- Azure is also viable if the client standardizes there; the architecture and controls remain the same.

### 3.4 Role-based access control (RBAC)

We implement RBAC as **policy-based authorization**:

- Roles mapped to capabilities (e.g., `EssayReviewer`, `AcademicReviewer`, `DocumentChecker`, `Screener`, `InterviewAdmin`, `FinalDecisionMaker`, `SystemAdmin`).
- API enforces access on **every endpoint**, not only UI visibility.
- Roles are scoped so each role only sees the information needed:
  - Essay reviewers cannot see academic scores or other reviewers’ scores.
  - Academic reviewers cannot see essay reviewers’ scoring.
  - Screeners and final decision makers see consolidated totals at the correct stage.

### 3.5 Workflow enforcement (state machine)

The portal behaves as a **strict workflow state machine**, preventing out-of-order actions:

- Submission must be complete before any scoring.
- Shortlisting blocked until essay + academics + document verification are complete.
- Interview scoring only allowed for shortlisted applicants.
- Final decisions blocked until interview scoring is completed.

### 3.6 Preventing race conditions and duplicate actions

We prevent two staff members from editing/scoring the same record at the same time by combining:

- **Optimistic concurrency** on application records.
- **Task assignment locking** (who is currently handling a review step).
- Unique constraints for “one score per reviewer per applicant per stage”.
- Idempotency keys for sensitive actions (submit/export) to avoid duplicates.

---

## 4) POPIA Technical Controls (required from day one)

### 4.1 Encryption (in transit and at rest)

- **HTTPS everywhere** (HSTS, secure cookies).
- Database encryption at rest (managed service encryption).
- File storage encryption at rest (server-side encryption with managed keys).
- Secure password hashing (industry standard, salted) and hardened session management.

### 4.2 Consent capture

- Explicit consent step before collecting and processing personal information.
- Consent records stored with timestamp, policy version, and IP/user agent.

### 4.3 Audit logging (full audit trail)

Every sensitive action is logged:

- authentication events (login / failed login)
- application create/update/submit
- document upload/download/delete
- each stage action (essay scoring, academic scoring, document verification, shortlist, interview scoring, final decision)
- exports and deletion actions
- role/permission changes

Each audit record stores: **who**, **what**, **when**, **where (IP/device)**, and **what changed**.

### 4.4 Data export

- Applicants can request an export of their information.
- Export is generated server-side and delivered via a time-limited link.
- Export action is audited.

### 4.5 Data deletion and retention

- Deletion capability after the application cycle completes (policy-driven retention).
- Where legal retention is required, we can apply **anonymization** rather than full purge, while preserving an audit trail.

### 4.6 Breach notification procedures (technical readiness)

- Logging + alerting for suspicious activity.
- Documented incident runbook handover for the compliance officer to execute organisational procedures.

---

## 5) Database & Core Data Model (high-level)

Core entities typically include:

- Applicants, Applications, Application Cycles
- Eligibility answers (and eligibility fail reason)
- Documents + verification checklist
- Essay reviews (scored, timestamped, reviewer ID)
- Academic score sheets + per-subject grades + computed average
- Interview scores + computed average + notes
- Shortlist decisions + final decisions
- Audit logs (append-only)

---

## 6) Master Scorecard (critical component)

We build a **comparative scoring dashboard** that:

- Auto-calculates point values from the applicant profile
- Pulls stage scores (essay, academics, interview)
- Produces totals, ranking, filtering, and export to Excel
- Enforces that only authorized roles see the consolidated totals at the correct stage

---

## 7) Handover (what “handover” includes)

- Source code + repository handover
- Database schema and migrations
- Deployment instructions and environment variables list
- Admin/staff user guide
- Technical runbook (backup/restore, audit, incident response basics)
- Training session for staff users (and/or recorded walkthrough)

