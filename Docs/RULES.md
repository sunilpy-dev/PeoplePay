# RULES.md — PeoplePay360

> **Purpose:** Development and project-governance rules for the PeoplePay360 PERN hackathon project.
>
> **Primary principle:** Build a reliable, understandable solution without over-engineering it. Preserve working code and make the smallest change required to implement or fix a requirement.
>
> **Critical project principle:** The project must maintain a traceable source of truth so that the team and AI agents know what has been built, what has changed, why it changed, and what must not be changed.

---

# 1. Project Goal

PeoplePay360 is an HR & Payroll system built for the Odoo hackathon.

The implementation must prioritize:

1. Correct PostgreSQL database design
2. Correct business logic
3. Working end-to-end workflows
4. Clear and modular code
5. Robust validation and error handling
6. Security and role-based access
7. Live/dynamic data
8. Clean and responsive UI
9. Maintainability and explainability
10. Hackathon feasibility
11. Traceable project documentation
12. Preservation of working team members' code

The project must remain aligned with `PRD.md`.

If a proposed change does not clearly support the PRD or fix an actual problem, **do not add it just because it is technically interesting.**

---

# 2. Project Source-of-Truth System

The project documentation must have clear responsibilities.

```text
PRD.md
   ↓
WHAT the product must do

ARCHITECTURE.md
   ↓
HOW the system is structured

RULES.md
   ↓
HOW the system may be built and modified

docs/MEMORY.md
   ↓
WHAT has actually happened in the project:
current state, completed work, decisions, changes,
known issues, ownership/context, and important history
```

## 2.1 Source-of-truth priority

When resolving uncertainty:

1. **Current working code** — what actually exists and works
2. **PRD.md** — product requirements
3. **ARCHITECTURE.md** — approved technical structure
4. **RULES.md** — implementation/change constraints
5. **docs/MEMORY.md** — project history and current documented state
6. Other notes/prompts/conversations — supporting context only

### Important

`docs/MEMORY.md` is **not permission to override working code**.

If documentation says something exists but the repository does not contain it, do not assume it exists.

If documentation conflicts with working code, **stop and verify before making a destructive or architectural change.**

---

# 3. Project Memory / Change Tracking

`docs/MEMORY.md` should be maintained as the project's **change and state log**.

Its purpose is to reduce:

- AI hallucination
- Repeated work
- accidental rewrites
- conflicting assumptions
- breaking changes
- loss of team members' work
- misunderstanding of what has already been implemented

## 3.1 When MEMORY.md should be updated

Update `docs/MEMORY.md` when a meaningful project state changes, such as:

- A major feature is completed
- A feature is partially implemented
- A bug is fixed
- A significant bug is discovered
- A database schema change is approved
- An API contract changes
- A major architecture decision is approved
- A dependency is intentionally added/removed
- A major workflow changes
- A module is intentionally replaced
- A known limitation is discovered
- A critical integration is completed
- A hackathon implementation milestone is reached

Do **not** create noisy entries for every tiny edit.

---

# 4. MEMORY.md Rules

When updating `docs/MEMORY.md`:

### Record facts, not guesses.

Good:

```text
Payroll draft generation is implemented.
Payslip data is persisted in PostgreSQL.
Employee grievance creation is implemented.
```

Bad:

```text
Payroll should probably be working.
```

### Record what actually happened.

A useful entry should include, where relevant:

```text
Date / milestone
Change
Reason
Files/modules affected
Current status
Important implementation detail
Known limitation
```

Example:

```text
## Payroll Draft Generation

Status: Completed

Changed:
- Added draft payrun generation.
- Payslips are persisted in PostgreSQL.

Affected:
- backend/payroll/...
- frontend/payroll/...

Notes:
- Finalization remains separate from draft generation.
- Do not replace the current calculation flow without approval.
```

---

# 5. First-Prompt / Initialization Rule

When an AI coding agent is initialized for the first time, it must **not assume the project is empty or start rebuilding the application**.

Before making implementation changes, it should inspect:

1. Repository structure
2. Existing source code
3. `PRD.md`
4. `ARCHITECTURE.md`
5. `RULES.md`
6. `docs/MEMORY.md` if present
7. Existing database/migrations
8. Existing package/dependency files
9. Existing working features

Then it should establish:

```text
WHAT EXISTS
WHAT WORKS
WHAT IS PARTIALLY DONE
WHAT IS BROKEN
WHAT IS MISSING
WHAT MUST NOT BE CHANGED
```

### Initialization must be read-only by default.

The first inspection should not automatically:

- Rewrite files
- Install dependencies
- Change database schema
- Reformat the project
- Refactor modules
- Delete old code
- Replace libraries
- Generate new architecture

The agent should first understand the current state.

---

# 6. Team Member Work Protection

The repository may contain code written by multiple team members.

**Never assume unfamiliar code is unnecessary.**

Before modifying or deleting code:

1. Identify what it does.
2. Check whether another feature depends on it.
3. Check whether it is referenced elsewhere.
4. Check `docs/MEMORY.md` for context.
5. Preserve it if it is working and not directly related to the current task.

### Never delete code because:

- It looks unused
- It is not familiar
- Another implementation looks cleaner
- An AI-generated version seems better
- It does not match the agent's preferred architecture

If removal is genuinely required, **ask before deleting it.**

---

# 7. Change Tracking for AI Agents

Every meaningful implementation task should follow:

```text
Read source of truth
      ↓
Inspect existing implementation
      ↓
Identify exact gap/bug
      ↓
Plan smallest safe change
      ↓
Ask approval if critical
      ↓
Implement
      ↓
Test affected behavior
      ↓
Verify no unrelated breakage
      ↓
Update documentation if state changed
```

After implementation, the agent should be able to state:

```text
Changed:
- ...

Not changed:
- ...

Why:
- ...

Files affected:
- ...

Verification:
- ...

Documentation updated:
- ...
```

This makes future sessions much less likely to hallucinate project state.

---

# 8. Technology Stack — What to Use

Use the existing PERN stack:

- **PostgreSQL** — primary application database
- **Node.js** — backend runtime
- **Express.js** — backend API
- **React** — frontend
- **REST APIs** — client/server communication

Do not replace the stack unless explicitly approved.

---

# 9. Libraries — What to Use

## 9.1 General Rule

**Prefer the existing libraries already present in the repository.**

Before adding a new package:

1. Check whether the required functionality already exists.
2. Check whether an existing dependency can solve the problem.
3. Prefer native JavaScript/Node.js/browser functionality when it is sufficient.
4. Add a new dependency only when there is a clear requirement and the benefit justifies the additional complexity.
5. Ask for approval before installing a new dependency.

### Rule

> **No library is added merely for convenience, trendiness, or because an AI suggested it.**

---

# 10. Libraries — What to Avoid

Do not add libraries for:

- Simple array/object operations
- Basic form handling already supported by existing code
- Simple validation already handled by existing utilities
- Basic calculations
- Simple UI elements
- Generic state management when existing state handling is sufficient
- Unnecessary chart libraries
- Unnecessary table/grid libraries
- AI wrappers
- Blockchain libraries
- Microservice frameworks
- Event-bus infrastructure
- Complex workflow engines
- Infrastructure that is not required by the PRD

### Avoid dependency duplication

Do not have multiple packages performing the same job.

Examples:

```text
Axios + another HTTP client
Prisma + Kysely + custom ORM
Multiple validation libraries
Multiple date libraries
Multiple icon libraries
Multiple state-management libraries
```

unless there is a documented and approved reason.

---

# 11. Third-Party API Policy

The final solution should be primarily self-contained.

Prefer:

```text
React
   ↓
Express API
   ↓
PostgreSQL
```

over:

```text
React
   ↓
Third-party service
   ↓
Third-party database/API
```

## Do not depend on

For core application functionality, do not depend on:

- MongoDB Atlas
- Firebase
- Supabase
- External database-as-a-service products
- External payroll engines
- External HR systems
- External APIs for data that can be stored/calculated locally
- External AI APIs for core payroll decisions

## Limited exceptions

A third-party service may be used only when it directly supports an explicitly required feature and there is no reasonable simple local implementation.

Examples:

- Email delivery for required payslip email workflow
- A library used to generate PDFs locally

Even then:

- Keep the integration isolated.
- Do not make the entire application dependent on it.
- Handle failure gracefully.
- Keep a clear fallback/error state.

---

# 12. Database Rules

PostgreSQL is the source of truth for application data.

## Use

- Relational tables
- Foreign keys
- Primary keys
- Unique constraints
- Appropriate indexes
- Transactions where multiple related records must change together
- Database constraints for important invariants
- Parameterized/safe queries
- Period-aware payroll records

## Avoid

- Static JSON as the source of truth
- Mock data for final workflows
- Storing everything in one large table
- Duplicate copies of the same business data
- Unnecessary database abstractions
- Database-as-a-service dependencies

If a user performs an operation:

```text
UI
 ↓
API
 ↓
Business Logic
 ↓
PostgreSQL
 ↓
Updated UI
```

The operation must use real persisted data.

---

# 13. Database Change Protection

Database changes are **critical changes**.

Do not automatically:

- Drop tables
- Delete columns
- Rename production-used fields
- Rewrite migrations
- Change relationships
- Change primary/foreign keys
- Change payroll data semantics

without approval.

Prefer additive, backward-compatible changes where practical.

Before a schema change, identify:

```text
Current schema
 ↓
Who/what uses it
 ↓
Required change
 ↓
Migration impact
 ↓
Data-loss risk
```

If data loss is possible, stop and ask.

---

# 14. Payroll Calculation Rules

Payroll calculation is business-critical.

## Must

- Use configured Salary Structures.
- Use configured Salary Rules.
- Respect Salary Rule sequence.
- Use the applicable contract for the payroll period.
- Use relevant attendance and approved leave data.
- Recalculate a payslip when an approved payroll correction changes its inputs.
- Keep calculation logic deterministic and explainable.

## Avoid

- Hardcoding every employee's salary
- Hardcoding a single payroll result
- Random/generated payroll values
- Hidden salary calculations in React components
- Copying calculation logic into multiple controllers

The PS requires Salary Rules to actively drive Payslip generation rather than being static configuration screens.

### Rule-engine complexity boundary

A simple sequential rule evaluator is preferred if it satisfies the PRD.

Do **not** introduce a complex DAG/topological execution system unless it is already working in the repository or there is a demonstrated requirement that cannot be handled by ordered Salary Rules.

---

# 15. Risk Score Rules

The Payroll Risk Score must be:

- Deterministic
- Explainable
- Based on actual database/application conditions
- Recalculable when underlying issues change

It must never be:

- Random
- A black-box prediction
- An unexplained AI score

Example:

```text
Missing Bank Account
Duplicate Payslip
Expiring Contract
Missing Attendance
Open Grievance
        ↓
Risk Contributions
        ↓
Risk Score
```

The UI must show why a Payrun or Employee has a high risk score.

---

# 16. Budget vs Actual Rules

Budget data must be stored in PostgreSQL.

Budget granularity:

```text
Department + Payroll Period
```

Actual payroll cost must come from actual payroll records.

Do not use:

- Hardcoded budget values
- Hardcoded actual values
- Static chart data for final workflows

Variance:

```text
Variance = Actual Payroll Cost - Budget
```

Percentage should be calculated from the selected period's real data.

---

# 17. Grievance Rules

The grievance system is part of the payroll workflow.

Allowed flow:

```text
Draft Payslip
   ↓
Employee Review
   ↓
No Issue
   OR
Raise Grievance
   ↓
HR/Payroll Review
   ↓
Resolve / Reject
   ↓
Recalculate if required
   ↓
Finalization
```

Avoid:

- Automatic deadline engines
- Complex escalation systems
- Background schedulers unless specifically required
- Unnecessary notification infrastructure

Simple in-app notifications are sufficient for the MVP.

---

# 18. Validation Rules

Validation must happen at two levels.

## Frontend

Provide immediate user feedback.

Example:

```text
Invalid email
→ "Please enter a valid email address."
```

## Backend

Never trust frontend validation.

The backend must independently validate:

- Required fields
- Data types
- Date ranges
- Permissions
- Business rules
- Duplicate records
- Payroll state
- Ownership/access
- Numeric ranges

Example:

```text
Frontend:
"Budget must be greater than zero."

Backend:
Reject budget <= 0 even if the request bypasses the frontend.
```

---

# 19. Error Handling

Errors must be handled deliberately and consistently.

## Backend

Use a centralized error-handling approach.

Errors should provide:

- Appropriate HTTP status
- Safe user-facing message
- Useful internal logging information
- Consistent response format

Do not expose:

- Database connection strings
- Passwords
- JWT secrets
- Stack traces in production responses
- Internal filesystem paths
- Sensitive employee information

Recommended categories:

```text
400 → Invalid request / validation error
401 → Not authenticated
403 → Not authorized
404 → Resource not found
409 → Business conflict / duplicate
422 → Valid request format but invalid business data
500 → Unexpected server error
```

Do not return `500` for every error.

## Frontend

The UI should:

- Show a useful message
- Preserve user input where possible
- Avoid blank screens
- Avoid technical stack traces
- Provide retry/recovery when appropriate

Example:

```text
Failed to load payroll.

Please try again.
[Retry]
```

---

# 20. Logging Rules

Log important backend failures and business events when useful for debugging.

Log:

- Unexpected server errors
- Failed database operations
- Authentication/authorization failures where appropriate
- Important payroll processing failures
- Payslip calculation failures

Do not log:

- Passwords
- JWT secrets
- Full sensitive employee records
- Bank account credentials
- Unnecessary personal information

Do not add a complex observability stack for the hackathon.

---

# 21. Security Rules

Security must be enforced on the backend.

Required:

- Authentication
- Role-based authorization
- Backend permission checks
- Input validation
- Parameterized/safe database queries
- Password hashing
- Protected sensitive routes
- Employee ownership checks

### Critical rule

Hiding a button in React is **not security**.

The API must also reject unauthorized requests.

---

# 22. AI Boundaries

AI is an **assistant**, not an autonomous product decision-maker.

## AI may

- Inspect existing code
- Explain code
- Find bugs
- Suggest fixes
- Implement explicitly requested features
- Generate repetitive boilerplate when requested
- Suggest improvements
- Write tests for requested behavior
- Explain trade-offs
- Point out risks or inconsistencies
- Ask for clarification when requirements conflict

## AI must not independently

- Delete working code
- Rewrite working modules
- Install packages
- Remove packages
- Change architecture
- Change database schema
- Change payroll calculation rules
- Change business rules
- Change permissions
- Add external services
- Add AI/ML features
- Add schedulers/workers
- Remove existing features
- Change core UI design
- Make product decisions

unless the user explicitly approves the change.

### Golden Rule

> **If a decision can materially change the system, ask before doing it.**

---

# 23. AI and Project Memory Rules

AI agents must use `docs/MEMORY.md` to understand project history, but must not treat memory as unquestionable truth.

Before making a significant change:

1. Read relevant memory entries.
2. Verify the current code.
3. Verify the PRD/architecture where applicable.
4. Identify any conflict.
5. Ask if the conflict requires a critical decision.

### Never hallucinate project state

Do not say:

```text
"The grievance system is complete"
```

unless the current code or documented verified state supports it.

If uncertain, say:

```text
"I found references to the grievance system, but I have not verified the current implementation."
```

Then inspect it.

---

# 24. AI Change Documentation

When an AI agent makes a meaningful change, it should update `docs/MEMORY.md` **if the project state has materially changed**.

The entry should be concise.

Recommended format:

```text
## YYYY-MM-DD — Feature / Fix

Status: Completed / Partial / Blocked

Changed:
- ...

Files:
- ...

Reason:
- ...

Verification:
- ...

Notes:
- ...
```

Do not fill memory with speculative statements.

Do not rewrite old history merely to make it look cleaner.

If an existing memory entry is wrong, correct it carefully and preserve useful historical context.

---

# 25. Existing Working Code — DO NOT BREAK IT

This is one of the most important project rules.

> **Never remove, rewrite, or replace working code without a clear reason.**

If a feature already works:

- Do not refactor it just for style.
- Do not replace its library because another library is "better."
- Do not rewrite the component because a different architecture is "cleaner."
- Do not change its API contract unnecessarily.
- Do not change its database structure unnecessarily.

## Bug Fix Principle

```text
Identify problem
   ↓
Find smallest required change
   ↓
Apply change
   ↓
Test affected behavior
   ↓
Stop
```

Do not turn a bug fix into a full refactor.

---

# 26. Minimal Change Rule

Every implementation task should follow:

> **Change only what is required to satisfy the current requirement or fix the current issue.**

Before changing code, identify:

1. What is broken?
2. Where is it broken?
3. What is the smallest safe fix?
4. What existing behavior could be affected?
5. How will the change be verified?

Avoid unrelated cleanup during feature implementation.

---

# 27. Critical Change Approval Rule

The AI/developer assistant must ask for explicit approval **before making critical changes**.

Critical changes include:

- Installing/removing dependencies
- Changing the technology stack
- Changing PostgreSQL schema or migrations
- Deleting tables/columns
- Changing existing API contracts
- Changing authentication/authorization architecture
- Changing payroll calculation rules
- Replacing a working module
- Major refactoring
- Changing project architecture
- Removing existing features
- Changing core UI structure/design
- Introducing external services
- Adding background workers/schedulers
- Introducing AI into business-critical decisions

Example:

> "The current database layer works. Changing to Prisma would require changing existing data-access code. This is a significant architectural change. Do you want me to make that change?"

---

# 28. Frontend Rules

Use React for:

- Pages
- Forms
- Tables
- Kanban/list views
- Dashboards
- Role-aware navigation
- User interaction
- API result presentation

Avoid putting core business logic exclusively in React.

The backend owns authoritative payroll calculation.

The frontend displays results and provides user interaction.

---

# 29. Backend Rules

Keep backend responsibilities understandable.

Preferred flow:

```text
Route
 ↓
Controller
 ↓
Service / Business Logic
 ↓
Database Access
 ↓
Response
```

Do not create abstractions only to make the folder structure look "enterprise."

A small module with clear code is better than unnecessary layers such as:

```text
Controller
Service
Manager
Factory
Adapter
Strategy
Provider
Resolver
Orchestrator
```

when the feature does not need them.

---

# 30. API Rules

APIs should be:

- Predictable
- Consistent
- Validated
- Authorized
- REST-oriented
- Easy for the frontend team to understand

Do not create an endpoint for every tiny UI interaction if an existing endpoint can reasonably support the operation.

Do not change existing API contracts without approval when the frontend already depends on them.

---

# 31. UI Rules

The UI must be:

- Clean
- Responsive
- Interactive
- Consistent
- Intuitive

Do not redesign working screens unless explicitly requested.

Do not add:

- Decorative animations everywhere
- Excessive gradients
- Unnecessary modals
- Complex navigation
- Features that do not support the workflow

Business states should be obvious:

```text
Draft
Pending
Approved
Under Review
Resolved
Validated
Paid
```

---

# 32. Performance Rules

Prioritize practical performance.

Use:

- Database indexes where queries need them
- Pagination for genuinely large lists
- Efficient queries
- Backend aggregation for dashboard metrics
- Avoid repeated unnecessary API calls
- Avoid loading unrelated large datasets

Avoid premature optimization.

Do not introduce:

- Redis
- Caching infrastructure
- Message queues
- Microservices
- WebSockets

unless there is a demonstrated requirement that cannot reasonably be solved with the current architecture.

---

# 33. Testing Rules

Test the most important business logic first.

Priority:

1. Payroll calculations
2. Contract selection
3. Salary Rule execution
4. Leave allocation/balance
5. Attendance calculations
6. Risk scoring
7. Budget variance
8. Grievance/recalculation workflow
9. Authorization
10. Input validation

Do not spend the hackathon creating a huge testing framework.

A small number of meaningful tests is better than large amounts of superficial coverage.

---

# 34. Code Quality Rules

Code must be:

- Readable
- Modular
- Consistent
- Explicit
- Easy to debug

Prefer:

```javascript
calculateNetSalary()
```

over:

```javascript
doThing()
```

Avoid:

- Giant functions
- Copy-pasted payroll logic
- Hidden side effects
- Magic numbers without explanation
- Unused imports
- Dead code
- Unnecessary comments
- Unnecessary abstractions

Comments should explain **why**, not restate obvious code.

---

# 35. No Over-Engineering Rule

Before adding a technical solution, ask:

> "Can this be solved simply with the current PERN architecture?"

If yes, use the simpler solution.

Do not introduce unless justified:

- Microservices
- Event-driven architecture
- Message brokers
- Redis
- Kubernetes
- Complex CI/CD
- Distributed tracing
- Complex workflow engines
- AI agents
- Blockchain
- Advanced caching
- Background job infrastructure
- Complex rule-DAG frameworks

The goal is a **working, scalable, understandable monolith**, not an enterprise infrastructure showcase.

---

# 36. Feature Completion Rule

A feature is considered complete when:

```text
UI
 ↓
API
 ↓
Validation
 ↓
Authorization
 ↓
Business Logic
 ↓
PostgreSQL
 ↓
Live Result
 ↓
Error Handling
```

works correctly.

A feature is not complete if it is only:

- A UI mockup
- Static JSON
- Hardcoded output
- Frontend-only logic
- An API without database persistence
- A database table without usable workflow

---

# 37. Verification Before Declaring Success

Never claim a fix or feature is complete only because code was written.

Verify the relevant behavior.

For example:

```text
Changed:
Payroll grievance creation

Verify:
✓ Employee can create grievance
✓ Unauthorized user cannot create for another employee
✓ Grievance persists in PostgreSQL
✓ Payroll user can review it
✓ Resolution updates status
✓ Recalculation works where required
```

If verification could not be performed, explicitly state:

```text
Implementation completed, but verification could not be fully performed.
```

Do not fabricate test results.

---

# 38. Decision Priority

When two approaches are possible, use this priority:

```text
1. PRD requirement
2. Correct business behavior
3. Existing working code
4. Data integrity
5. Security
6. Project documentation / approved decisions
7. Simplicity
8. Maintainability
9. Performance
10. Developer convenience
11. Novelty
```

Novel technology should never outrank correctness.

---

# 39. Final Golden Rules

### Rule 1
**Do not break working code.**

### Rule 2
**Make the smallest change required.**

### Rule 3
**Ask before critical architectural, database, dependency, security, UI, or business-rule changes.**

### Rule 4
**Do not make product decisions on behalf of the team.**

### Rule 5
**PostgreSQL is the source of truth for application data.**

### Rule 6
**Core payroll logic belongs in the backend.**

### Rule 7
**Every important operation must be validated and authorized on the backend.**

### Rule 8
**Use existing libraries before adding new ones.**

### Rule 9
**Do not add technology just to make the project look advanced.**

### Rule 10
**AI may assist development, but it must not autonomously change critical parts of the project.**

### Rule 11
**Payroll calculations and risk scoring must be deterministic and explainable.**

### Rule 12
**Prefer a smaller number of complete, connected workflows over many incomplete features.**

### Rule 13
**If something is unclear or has multiple valid architectural choices, stop and ask rather than guessing.**

### Rule 14
**The final product must remain understandable enough that the team can explain every important part to the judges.**

### Rule 15
**Verify current code before trusting documentation or memory.**

### Rule 16
**Update project memory after meaningful state changes so future AI sessions do not have to guess what happened.**

### Rule 17
**Never overwrite a team member's working implementation simply because a different implementation is preferred.**

### Rule 18
**No autonomous critical changes. Ask first.**

---

# 40. Short AI Operating Protocol

For every future coding request, the AI should internally follow this checklist:

```text
[ ] Read the relevant PRD requirement
[ ] Read relevant architecture rules
[ ] Read RULES.md
[ ] Read relevant MEMORY.md entries
[ ] Inspect the current implementation
[ ] Identify existing working code
[ ] Identify exact requested change
[ ] Avoid unrelated changes
[ ] Check whether a new library is actually needed
[ ] Check whether a database/API/architecture change is required
[ ] Ask before any critical change
[ ] Implement the smallest safe change
[ ] Test/verify the affected behavior
[ ] Check for regressions
[ ] Update MEMORY.md if project state materially changed
[ ] Report exactly what changed and what did not
```

If any critical decision is unresolved:

```text
STOP → ASK THE USER
```

Do not guess.

---

# 41. Document Maintenance Boundary

The documentation files themselves must also be treated as project assets.

Do not rewrite all documentation after every change.

Update **only the document(s) that actually need to change**.

Examples:

```text
New product feature
→ PRD.md may need update

Approved architectural change
→ ARCHITECTURE.md may need update

New implementation rule
→ RULES.md may need update

Completed feature / bug fix / project state
→ docs/MEMORY.md may need update
```

If a change affects more than one document, update only the affected sections.

Do not modify documentation merely to make it look different.

---

# 42. Conflict Protocol

If the AI discovers:

```text
PRD says A
CODE does B
MEMORY says C
ARCHITECTURE says D
```

it must **not silently choose one** when the conflict can materially affect implementation.

Instead:

1. Identify the conflict.
2. Inspect the current implementation.
3. Explain the discrepancy.
4. Identify the safest interpretation.
5. Ask for approval if a critical decision is required.

### Never "fix" documentation by changing it to match an assumption.

Documentation should be updated only after the actual intended state is confirmed.

---

# 43. Final Project Philosophy

PeoplePay360 is a 24-hour hackathon project.

The goal is not to build the largest possible system.

The goal is to build:

```text
A complete
     +
Correct
     +
Secure
     +
Dynamic
     +
Well-structured
     +
Explainable
     +
Database-driven
     +
Demo-ready
```

solution that the team can confidently explain and defend.

> **Build less, but make what we build work completely.**
