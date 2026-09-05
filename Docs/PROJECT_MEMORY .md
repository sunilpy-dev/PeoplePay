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

### D10 --- Closed authentication model (No public signup)

PeoplePay360 is an enterprise HR/Payroll platform. User accounts are created strictly by Admins/HR Managers in later phases and provisioned with appropriate roles. Public registration/signup is prohibited.

### D11 --- UI integration & preservation strategy

Current UI screens serve as fully functional baseline/demo interfaces with authentic API connections. When refined team UI screens are ready, they must be integrated with the existing backend authentication and business logic without modifying or rebuilding working authentication contracts.

------------------------------------------------------------------------

## 6. Planned Feature Sequence

Current phase tracking:

``` text
Phase 1  Foundation & Authentication        ✅
Phase 2  Employee Master Management         ⬜
Phase 3  Contract & Working Schedule        ✅
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

> These reflect **verified implementation status**.

------------------------------------------------------------------------

## 7. Current Known Gaps

Verified status after Phase 3 completion:

- [x] PostgreSQL database connection & 14-table schema verified
- [x] Express backend foundation, error handling & healthcheck
- [x] JWT authentication & RBAC middleware (5 roles)
- [x] React 18 + Vite + Tailwind CSS frontend foundation
- [x] Login page, AuthContext, Protected routes, and AppLayout shell
- [x] Phase 3: Contract & Working Schedule Management (CRUD, history tracking, renewals, KPI metrics, and enterprise UI matching design)
- [ ] Phase 2: Employee CRUD & Master Management
- [ ] Phase 4: Attendance Management
- [ ] Phase 5: Time Off & Leave Allocations
- [ ] Phase 6: Payroll Calculation Engine & Formula Parser
- [ ] Phase 7: Payrun & Payslip Generation
- [ ] Phase 8: Payroll Risk Engine
- [ ] Phase 9: Pre-Payroll Review & Grievance Workflow
- [ ] Phase 10: Payrun Finalization & Mark Paid
- [ ] Phase 11: PDF Payslips & Emailing
- [ ] Phase 12: Budget Cost Intelligence
- [ ] Phase 13: Executive & Payroll Analytics Dashboard

------------------------------------------------------------------------

## 8. Progress Log

### 2026-09-05 --- Phase 3: Contract & Working Schedule Management Complete

**Status:** Completed & Verified

**Changed:**
- Implemented full Contract CRUD, renewal, and history tracking in backend (`contractService.js`, `contractController.js`, `contractRoutes.js`).
- Implemented Working Schedules and daily schedule lines CRUD (`scheduleService.js`, `scheduleController.js`, `scheduleRoutes.js`).
- Implemented lookup endpoints for employee and salary structure assignment dropdowns (`lookupRoutes.js`).
- Built pixel-accurate Contracts UI in React (`Contracts.jsx`) matching the enterprise design screenshot:
  - Statutory Payroll Lock banner with ISO/IEC 27001 notice and dual authorization rules.
  - 4 KPI metric cards (Active Contracts, Expiring in <= 30 Days, Drafts & Queued, Historical Archived) with live counters, badges, and progress indicators.
  - Filter and search bar (Search by ID/Name, Status, Structure, Department, Export Ledger, New Contract).
  - High-density data table with monospace contract IDs, employee avatars, job positions, color-coded departments, wage calculations (/mo and /yr), structure pills, countdowns (e.g. 18d), validity badges, and contextual action buttons (Renew Now, Complete, Edit, Amend, Delete).
  - Modals for New Contract creation, Contract Renewal, and Compliance Rules.
- Built Working Schedules management view (`WorkingSchedules.jsx`).
- Upgraded `AppLayout.jsx` with light enterprise sidebar and header matching the screenshot.
- Preserved `db/seed.sql` completely intact without disk modifications.

**Files:**
- `Server/src/services/contractService.js`, `Server/src/controllers/contractController.js`, `Server/src/routes/contractRoutes.js`
- `Server/src/services/scheduleService.js`, `Server/src/controllers/scheduleController.js`, `Server/src/routes/scheduleRoutes.js`
- `Server/src/routes/lookupRoutes.js`, `Server/src/app.js`, `Server/src/testContracts.js`
- `Client/src/services/contractService.js`, `Client/src/views/Contracts.jsx`, `Client/src/views/WorkingSchedules.jsx`
- `Client/src/components/Layout/AppLayout.jsx`, `Client/src/App.jsx`

**Verification:**
- Automated backend integration tests in `testContracts.js` passed (auth, metrics, contract listing, create draft, complete/activate, renew, delete, schedules, export ledger).
- Auth regression test suite `testAuth.js` passed 100%.
- Client production build (`npm run build`) completed cleanly with 0 errors.

------------------------------------------------------------------------

### 2026-09-05 --- Phase 1: Foundation & Authentication Complete

**Status:** Completed & Verified

**Changed:**
- Connected backend to PostgreSQL database (`hr_payroll_db`).
- Verified all 14 schema tables and seed data without structural modification.
- Implemented Express backend with JWT auth (`POST /login`, `GET /me`, `POST /logout`, `GET /health`).
- Implemented RBAC middleware with 5 system roles (`ADMIN`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`, `HR_MANAGER`, `EMPLOYEE`).
- Created React frontend with Vite, Tailwind CSS, Lucide Icons, Axios interceptor, AuthContext, Protected Routes, and responsive AppLayout shell.
- Added Login page with quick-fill demo roles for testing.

**Files:**
- `Server/src/config/db.js`, `Server/src/middleware/auth.js`, `Server/src/middleware/rbac.js`, `Server/src/middleware/errorHandler.js`
- `Server/src/services/authService.js`, `Server/src/controllers/authController.js`, `Server/src/routes/authRoutes.js`, `Server/src/app.js`, `Server/src/server.js`
- `Client/src/context/AuthContext.jsx`, `Client/src/services/api.js`, `Client/src/components/ProtectedRoute.jsx`, `Client/src/components/Layout/AppLayout.jsx`
- `Client/src/views/Login.jsx`, `Client/src/views/Dashboard.jsx`, `Client/src/views/Unauthorized.jsx`, `Client/src/App.jsx`
- `.gitignore`, `Server/.env`, `Client/.env`

**Verification:**
- PostgreSQL connection and table count verified via `testDb.js`.
- Automated test suite `testAuth.js` passed (login validation, token verification, role permissions check, logout, 401 guard).

**Notes:**
- Phase 2 (Employee Master Management) is ready to begin.

------------------------------------------------------------------------

### 2026-09-05 --- v1.0 Baseline

**Status:** Documentation baseline established.

**Established:** - `PRD.md` - `ARCHITECHTURE.md` - `PHASES.md` -
`RULES.md` - Initial `MEMORY.md`

**Result:**

The project now has a shared product definition, technical direction,
development roadmap and governance rules.

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
