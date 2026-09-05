# PeoplePay360 --- Project Memory

> **Memory Version:** v1.0\
> **Date:** 2026-09-05\
> **Status:** First project-progress baseline

## 1. Purpose

`MEMORY.md` is the project's **living progress/history file**.

It should contain only information that needs to be remembered between
development sessions:

-   what has actually been completed
-   what is currently in progress
-   important implementation decisions
-   known issues/blockers
-   important changes and their verification

Do **not** duplicate requirements, architecture, business rules, or
development rules already documented elsewhere.

------------------------------------------------------------------------

## 2. Project Source Files

These files are the primary project references:

  File                 Responsibility
  -------------------- --------------------------------------------
  `PRD.md`             What the product must do
  `ARCHITECHTURE.md`   How the system is designed
  `PHASES.md`          Planned development sequence
  `RULES.md`           Development, AI, security and change rules
  `docs/MEMORY.md`     What has actually happened

### Source-of-truth principle

For implementation status:

``` text
Current code
   ↓
Project documents
   ↓
MEMORY.md
```

`MEMORY.md` must never claim that something is implemented unless it has
been verified.

------------------------------------------------------------------------

## 3. Current Project State

### Overall

🟡 **Documentation / Architecture Baseline Established**

The project currently has documented:

-   Product requirements
-   PERN architecture
-   PostgreSQL data model
-   API baseline
-   Payroll engine design
-   RBAC model
-   Development phases
-   Project/AI governance rules

The implementation state of individual modules is **not yet recorded in
this memory** and must be verified from the repository before marking
features complete.

### Current development position

``` text
Project Specification
        ↓
Architecture
        ↓
Development Rules
        ↓
Phase Plan
        ↓
Implementation
        ↑
     CURRENT
```

The planned implementation starts with:

**Phase 1 --- Foundation & Authentication**

followed by:

**Phase 2 --- Employee Master Management**

and:

**Phase 3 --- Contract & Working Schedule Management**

See `PHASES.md` for the complete roadmap.

------------------------------------------------------------------------

## 4. Approved Technical Direction

The project uses the architecture defined in `ARCHITECHTURE.md`:

``` text
Frontend: React + Vite
Backend: Node.js + Express
Database: PostgreSQL
API: REST
```

The documented repository target is:

``` text
peoplepay360/
├── client/
├── server/
├── db/
├── Docs/
└── README.md
```

Payroll-specific backend logic is intended to remain separated under the
backend engine/business-logic area.

**Do not change this direction without following `RULES.md`.**

------------------------------------------------------------------------

## 5. Important Project Decisions

### D1 --- PERN stack

PeoplePay360 is being built with PostgreSQL, Express, React and Node.js.

### D2 --- PostgreSQL as source of truth

Core application data must be persisted in PostgreSQL rather than
static/mock data.

### D3 --- Backend owns payroll logic

Salary calculation, payroll validation and risk calculation must not
depend exclusively on frontend logic.

### D4 --- Period-aware payroll

Payroll must use the contract applicable to the selected payroll period;
historical contracts must remain meaningful.

### D5 --- Salary Rules drive payroll

Payslips should be generated from configured Salary Structures and
ordered Salary Rules rather than employee-specific hardcoded
calculations.

### D6 --- Explainable payroll risk

Payroll Risk Score must be deterministic and explainable from actual
payroll issues.

### D7 --- Complete workflows over feature count

The project prioritizes a smaller number of fully connected workflows
over many incomplete screens.

### D8 --- Preserve existing work

Working team-member code must not be casually rewritten or deleted.

### D9 --- No autonomous critical changes

AI assistance may implement requested work, but critical changes require
approval as defined in `RULES.md`.

------------------------------------------------------------------------

## 6. Planned Feature Sequence

Current phase tracking:

``` text
Phase 1  Foundation & Authentication        ⬜
Phase 2  Employee Master Management         ⬜
Phase 3  Contract & Working Schedule        ⬜
Phase 4  Attendance                         ⬜
Phase 5  Time Off                           ⬜
Phase 6  Payroll Configuration              ⬜
Phase 7  Payrun Management                  ⬜
Phase 8  Payroll Risk Engine                ⬜
Phase 9  Payslip Review & Grievance         ⬜
Phase 10 Payroll Finalization               ⬜
Phase 11 Payslip Generation                 ⬜
Phase 12 Budget & Expense Analytics         ⬜
Phase 13 Executive Dashboard                ⬜
```

> These are **planned phases**, not claims of implementation status.

------------------------------------------------------------------------

## 7. Current Known Gaps

At this baseline, the following still need repository verification:

-   Actual frontend implementation status
-   Actual backend implementation status
-   PostgreSQL setup/migration status
-   Authentication implementation
-   Employee module implementation
-   Contract/schedule implementation
-   Attendance implementation
-   Time Off implementation
-   Payroll implementation
-   Test status
-   End-to-end demo readiness

These should be replaced with verified status as development progresses.

------------------------------------------------------------------------

## 8. Progress Log

### 2026-09-05 --- v1.0 Baseline

**Status:** Documentation baseline established.

**Established:** - `PRD.md` - `ARCHITECHTURE.md` - `PHASES.md` -
`RULES.md` - Initial `MEMORY.md`

**Result:**

The project now has a shared product definition, technical direction,
development roadmap and governance rules.

**Next:**

Verify the repository and begin/update Phase 1 based on actual
implementation state.

------------------------------------------------------------------------

## 9. How to Update This File

Keep future entries short.

Use:

``` md
## YYYY-MM-DD — Feature / Fix

**Status:** Completed / Partial / Blocked

**Changed**
- ...

**Files**
- ...

**Verification**
- ...

**Notes**
- ...
```

Only add an entry when project state materially changes.

### Example

``` md
## 2026-09-05 — Phase 1 Authentication

**Status:** Completed

**Changed**
- Added login and JWT authentication.
- Added protected backend routes.

**Files**
- `server/src/...`
- `client/src/...`

**Verification**
- Login tested successfully.
- Unauthorized request rejected.

**Notes**
- Phase 2 can begin.
```

------------------------------------------------------------------------

## 10. Memory Maintenance Rule

Keep this file **small and current**.

Do not copy from:

-   `PRD.md`
-   `ARCHITECHTURE.md`
-   `PHASES.md`
-   `RULES.md`

unless a specific item represents an important **project decision or
historical change**.

The purpose of this file is:

> **"What should the next AI/developer know about what has happened?"**

not:

> **"What is the entire PeoplePay360 specification?"**

------------------------------------------------------------------------

## 11. Golden Rule

> **Do not guess what has been built. Verify it.**
>
> **Record progress, decisions, issues and changes --- not the whole
> specification.**
>
> **Keep the memory concise so it remains useful throughout the
> hackathon.**
