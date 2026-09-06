# PeoplePay360 — HR & Payroll Engine

PeoplePay360 is an integrated **HR Operations and Payroll Processing Platform** built using the **PERN stack**:

* **PostgreSQL** — Database
* **Express.js** — Backend framework
* **React.js** — Frontend
* **Node.js** — Backend runtime

The platform manages employee information, contracts, working schedules, attendance, time-off, salary structures, payroll processing, payslips, and payroll analytics.

Unlike a system that relies on hardcoded salary calculations, PeoplePay360 uses a **dynamic payroll rule engine** based on a **Directed Acyclic Graph (DAG)** to evaluate salary rules sequentially.

---

## Table of Contents

* [Key Features](#key-features)
* [System Architecture](#system-architecture)
* [End-to-End Workflow](#end-to-end-workflow)
* [Technical Stack](#technical-stack)
* [Repository Structure](#repository-structure)
* [Payroll Calculation Engine](#payroll-calculation-engine)
* [Salary Rule Execution](#salary-rule-execution)
* [DAG and Circular Dependency Prevention](#dag-and-circular-dependency-prevention)
* [Pre-Flight Payroll Validation](#pre-flight-payroll-validation)
* [Database Architecture](#database-architecture)
* [Data Integrity and Robustness](#data-integrity-and-robustness)
* [RBAC](#role-based-access-control-rbac)
* [API Endpoints](#api-endpoints)
* [Installation](#installation)
* [Environment Variables](#environment-variables)
* [Running the Application](#running-the-application)

---

# Key Features

### HR Management

* Employee master data
* Employee contracts
* Department and job-position management
* Working schedules
* Manager relationships
* Employee bank information

### Attendance & Time-Off

* Employee clock-in / clock-out
* Worked-hours tracking
* Automatic overtime calculation
* Leave requests
* Leave allocations
* Paid and unpaid leave handling

### Dynamic Payroll

* Salary structures
* Configurable salary rules
* Fixed, percentage, and formula-based calculations
* Sequential rule execution
* DAG-based dependency validation
* Contract-based payroll eligibility
* Mid-period contract proration

### Payroll Safety

* Pre-flight payroll validation
* Critical payroll blockers
* Operational warnings
* Duplicate payslip prevention
* Negative-net-salary detection
* Missing contract detection
* Missing bank information warnings

### Payroll Distribution & Analytics

* Payslip generation
* PDF payslips
* Bulk email distribution
* Department-level payroll analytics
* Budget vs. actual payroll cost tracking
* Executive dashboard

---

# System Architecture

PeoplePay360 follows a **decoupled client-server architecture**.

```text
                         USER
                           │
                           ▼
                ┌─────────────────────┐
                │    React Frontend   │
                │     Client / UI     │
                └──────────┬──────────┘
                           │
                      HTTP / REST
                           │
                           ▼
                ┌─────────────────────┐
                │   Node.js +         │
                │   Express.js API    │
                └──────────┬──────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌───────────────┐      ┌─────────────────┐
        │ Middleware    │      │ Business Logic  │
        │               │      │ / Services      │
        │ JWT / RBAC    │      └────────┬────────┘
        └───────────────┘               │
                                        ▼
                              ┌─────────────────┐
                              │ Payroll Engine  │
                              │                 │
                              │ Salary Rules    │
                              │ DAG Validator   │
                              │ Risk Scanner    │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │    Database     │
                              └─────────────────┘
```

The frontend is responsible for the user interface and API communication.

The backend handles authentication, authorization, business logic, payroll calculations, validation, PDF generation, and email distribution.

PostgreSQL provides persistent relational storage and transactional data integrity.

---

# End-to-End Workflow

The main business flow is:

```text
Employee Creation
       │
       ▼
Contract & Schedule Assignment
       │
       ▼
Attendance & Leave Tracking
       │
       ▼
Salary Structure & Rule Configuration
       │
       ▼
Payrun Scope Definition
       │
       ▼
Eligible Employee Selection
       │
       ▼
Draft Payslip Computation
       │
       ▼
DAG Rule Engine
       │
       ▼
Pre-Flight Risk Scanner
       │
       ▼
Draft Review / Grievance Resolution
       │
       ▼
Recalculation if Required
       │
       ▼
Payrun Validation
       │
       ▼
Mark as Paid
       │
       ├──────────────► Payslip PDF
       │
       ├──────────────► Email Distribution
       │
       └──────────────► Dashboard / Analytics
```

---

# Technical Stack

| Layer             | Technology           | Purpose                             |
| ----------------- | -------------------- | ----------------------------------- |
| Frontend          | React.js + Vite      | User interface                      |
| Styling           | Tailwind CSS         | Responsive UI                       |
| Icons             | Lucide Icons         | UI icons                            |
| Routing           | React Router DOM     | Client-side routing                 |
| State / Fetching  | React Query + Axios  | API calls, caching and invalidation |
| Backend           | Node.js + Express.js | REST API and business logic         |
| Formula Engine    | `expr-eval`          | Dynamic payroll formulas            |
| Database          | PostgreSQL 15+       | Relational data storage             |
| Authentication    | JWT                  | Stateless authentication            |
| Password Security | Bcrypt.js            | Password hashing                    |
| PDF               | PDFKit               | Payslip generation                  |
| Email             | Nodemailer           | SMTP email distribution             |

---

# Repository Structure

```text
peoplepay360/
│
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── views/                  # Application pages
│   │   ├── context/                # Authentication & permissions
│   │   ├── services/               # Axios API client
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server/                         # Node.js + Express backend
│   ├── src/
│   │   ├── config/                 # Database & environment setup
│   │   │
│   │   ├── middleware/             # Authentication & authorization
│   │   │
│   │   ├── controllers/            # HTTP request handlers
│   │   │
│   │   ├── services/               # Core business logic
│   │   │
│   │   ├── engine/                 # Payroll calculation engine
│   │   │   ├── salaryEngine.js
│   │   │   ├── dagValidator.js
│   │   │   └── warningScanner.js
│   │   │
│   │   ├── utils/                  # PDF & email utilities
│   │   │
│   │   └── app.js
│   │
│   └── package.json
│
├── db/
│   ├── schema.sql                  # Database schema
│   └── seed.sql                    # Initial data
│
├── Docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGNS.md
│   ├── PHASES.md
│   ├── PRD.md
│   ├── PROJECT_MEMORY.md
│   └── RULES.md
│
└── README.md
```

---

# Payroll Calculation Engine

The main payroll calculation logic resides in:

```text
server/src/engine/salaryEngine.js
```

For every eligible employee, the engine receives:

```text
Employee
Contract
Schedule
Attendance
Salary Rules
```

It then creates a calculation context.

## Calculation Context

### Daily Hours

```text
Daily Hours = Weekly Hours / 5
```

### Hourly Rate

```text
Hourly Rate =
Contract Wage / (Scheduled Days × Daily Hours)
```

The runtime context contains:

```text
CONTRACT_WAGE
SCHEDULE_DAYS
WORKED_DAYS
UNPAID_LEAVE_DAYS
OVERTIME_HOURS
HOURLY_RATE
```

These variables can then be referenced by salary rules.

---

# Salary Rule Execution

Salary rules are executed in ascending `sequence` order.

Example:

| Sequence | Code        | Category  | Type       | Calculation                                              |
| -------: | ----------- | --------- | ---------- | -------------------------------------------------------- |
|       10 | `BASIC`     | BASIC     | FORMULA    | `(CONTRACT_WAGE × 0.50) × (WORKED_DAYS / SCHEDULE_DAYS)` |
|       20 | `HRA`       | ALLOWANCE | PERCENTAGE | `BASIC × 0.40`                                           |
|       30 | `CONV`      | ALLOWANCE | FIXED      | `3000`                                                   |
|       40 | `SPECIAL`   | ALLOWANCE | FORMULA    | `CONTRACT_WAGE × 0.10`                                   |
|       50 | `OVERTIME`  | ALLOWANCE | FORMULA    | `OVERTIME_HOURS × (HOURLY_RATE × 1.50)`                  |
|      100 | `GROSS`     | GROSS     | FORMULA    | `BASIC + HRA + CONV + SPECIAL + OVERTIME`                |
|      110 | `PF`        | DEDUCTION | PERCENTAGE | `BASIC × 0.12`                                           |
|      120 | `PT`        | DEDUCTION | FORMULA    | `GROSS > 15000 ? 200 : 0`                                |
|      130 | `LOP`       | DEDUCTION | FORMULA    | `(CONTRACT_WAGE / SCHEDULE_DAYS) × UNPAID_LEAVE_DAYS`    |
|      140 | `TOTAL_DED` | DEDUCTION | FORMULA    | `PF + PT + LOP`                                          |
|      200 | `NET`       | NET       | FORMULA    | `GROSS - TOTAL_DED`                                      |

This produces a dependency flow such as:

```text
CONTRACT_WAGE
      │
      ▼
    BASIC
      │
      ├──────────► HRA
      │
      └──────────► PF
      │
      ▼
    GROSS
      │
      ├──────────► PT
      │
      ▼
  TOTAL_DED
      │
      ▼
     NET
```

Each calculated rule is stored in the runtime context so subsequent rules can reference it.

---

# DAG and Circular Dependency Prevention

Salary rules can depend on other salary rules.

For example:

```text
HRA → BASIC
PF  → BASIC
NET → GROSS
NET → TOTAL_DED
```

This creates a dependency graph.

The system must prevent circular dependencies.

### Invalid example

Suppose an administrator creates:

```text
BONUS = NET × 10%
```

while:

```text
NET → GROSS → BONUS
```

The dependency becomes:

```text
BONUS
  │
  ▼
 NET
  │
  ▼
GROSS
  │
  ▼
BONUS
  │
  └─────── Cycle
```

The backend uses **Kahn's Topological Sort Algorithm** to detect such cycles.

If a cycle is detected, the API rejects the salary-rule configuration with:

```text
HTTP 422 Unprocessable Entity
```

This prevents infinite or invalid payroll calculations.

---

# Pre-Flight Payroll Validation

Before a computed payrun can be validated, the system runs a pre-flight risk scanner.

```text
                  PRE-FLIGHT CHECK
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        CRITICAL BLOCKERS       WARNINGS
              │                     │
          Stop Validation       HR Review
```

## Critical Blockers

Examples:

* `NEGATIVE_NET`
* `NO_ACTIVE_CONTRACT`
* `DUPLICATE_PAYSLIP`

These prevent final validation.

## Operational Warnings

Examples:

* `MISSING_BANK_INFO`
* `UNAPPROVED_ATTENDANCE`
* `CONTRACT_EXPIRING`

These require HR attention but are treated separately from critical blockers.

---

# Payrun State Machine

A payrun progresses through controlled states:

```text
DRAFT
  │
  ▼
COMPUTED
  │
  ▼
VALIDATED
  │
  ▼
PAID
```

This prevents payroll from being marked as paid before calculations and validation are completed.

---

# Database Architecture

The system uses a normalized relational PostgreSQL database.

```text
                         ┌──────────────┐
                         │    Users     │
                         └──────┬───────┘
                                │ 1:1
                                ▼
                         ┌──────────────┐
                         │  Employees   │
                         └──────┬───────┘
                                │
             ┌──────────────────┼──────────────────┐
             │ 1:N              │ 1:N              │ 1:N
             ▼                  ▼                  ▼
       ┌───────────┐      ┌────────────┐     ┌──────────────┐
       │ Contracts │      │ Attendance │     │ Leave Data   │
       └─────┬─────┘      └────────────┘     └──────────────┘
             │
             │ N:1
             ▼
     ┌──────────────────┐
     │ Salary Structures│
     └────────┬─────────┘
              │ 1:N
              ▼
       ┌──────────────┐
       │ Salary Rules │
       └──────────────┘


       ┌──────────────┐
       │   Payruns    │
       └──────┬───────┘
              │ 1:N
              ▼
       ┌──────────────┐
       │  Payslips    │
       └──────┬───────┘
              │ 1:N
              ▼
       ┌────────────────┐
       │ Payslip Lines  │
       └────────────────┘
```

---

# Core Database Entities

### Users

Stores authentication information:

* Email
* Password hash
* Role
* Account status

### Employees

Stores HR information:

* Employee code
* Name
* Department
* Position
* Manager
* Schedule
* Bank information

### Contracts

Stores employee employment terms:

* Employee
* Salary structure
* Wage
* Start date
* End date
* Contract status

### Salary Structures

Represents a salary framework.

Example:

```text
Developer Salary Structure
        │
        ├── BASIC
        ├── HRA
        ├── CONVEYANCE
        ├── PF
        └── NET
```

### Salary Rules

Stores the individual calculation rules belonging to a salary structure.

### Attendance

Stores:

* Check-in
* Check-out
* Worked hours
* Overtime hours

### Leave

Stores leave types, allocations and employee requests.

### Payruns

Represents a payroll processing period.

### Payslips

Represents an employee's payroll result for a payrun.

### Payslip Lines

Stores the individual salary components used to produce the payslip.

---

# Data Integrity and Robustness

## Historical Snapshot Isolation

Once a payslip has been calculated, the evaluated salary values are stored in the payslip and payslip lines.

Therefore, changing a future contract does not recalculate historical payslips.

```text
Old Contract
     │
     ▼
September Payslip
     │
     └── Stored historical values

New Contract
     │
     ▼
Future Payroll
```

---

## Database-Level Constraints

The database uses constraints to protect data integrity.

Examples include:

* Native PostgreSQL `ENUM` types
* `NOT NULL`
* `UNIQUE`
* `CHECK`
* Foreign keys
* Referential actions
* Timestamp triggers

Examples:

```text
wage >= 0
```

```text
end_date >= start_date
```

```text
end_time > start_time
```

---

## Duplicate Payslip Protection

A composite unique constraint prevents an employee from receiving multiple payslips within the same payrun:

```text
UNIQUE(payrun_id, employee_id)
```

---

# Role-Based Access Control (RBAC)

Authorization is enforced on the backend using role-based middleware.

| Feature                       | Employee | HR Manager | Payroll User | Payroll Manager | Admin |
| ----------------------------- | :------: | :--------: | :----------: | :-------------: | :---: |
| View Own Dashboard / Payslips |     ✅    |      ✅     |       ✅      |        ✅        |   ✅   |
| Clock-In / Request Time Off   |     ✅    |      ✅     |       ✅      |        ✅        |   ✅   |
| Manage Employees & Contracts  |     ❌    |      ✅     |       ✅      |        ✅        |   ✅   |
| Approve Time-Off Requests     |     ❌    |      ✅     |       ✅      |        ✅        |   ✅   |
| Execute Payruns & Compute     |     ❌    |      ❌     |       ✅      |        ✅        |   ✅   |
| Configure Structures & Rules  |     ❌    |      ❌     |      👁️     |        ✅        |   ✅   |
| Resolve Grievances & Finalize |     ❌    |      ❌     |       ❌      |        ✅        |   ✅   |
| User & Role Administration    |     ❌    |      ❌     |       ❌      |        ❌        |   ✅   |

---

# API Endpoints

## Authentication

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

## Employees & Contracts

```http
GET  /api/v1/employees
POST /api/v1/employees
GET  /api/v1/employees/:id/smart-summary
POST /api/v1/contracts
```

## Attendance & Leave

```http
POST /api/v1/attendance/check-in
POST /api/v1/attendance/check-out

POST  /api/v1/leaves/requests
PATCH /api/v1/leaves/requests/:id/approve
```

## Payroll

```http
POST  /api/v1/payruns/step1-scope
POST  /api/v1/payruns/step2-eligible
POST  /api/v1/payruns

POST  /api/v1/payruns/:id/compute
GET   /api/v1/payruns/:id/warnings
PATCH /api/v1/payruns/:id/validate
PATCH /api/v1/payruns/:id/mark-paid
```

## Payslips

```http
GET /api/v1/payslips/:id/pdf
```

## Email Distribution

```http
POST /api/v1/payruns/:id/send-emails
```

## Dashboard

```http
GET /api/v1/dashboard/metrics
```

---

# Special Payroll Cases

## Mid-Month Joiners and Leavers

If an employee joins or leaves during a payroll period, the engine calculates the eligible working days within the contract window.

```text
Contract Window
       │
       ▼
Eligible Working Days
       │
       ▼
Proration Factor
       │
       ▼
Prorated Salary
```

The calculation is based on:

```text
Proration Factor =
Eligible Working Days / Standard Period Working Days
```

This prevents employees from being paid for days outside their active contract period.

---

# Automatic Overtime

Overtime is derived from attendance and the employee's working schedule.

### Expected Hours

```text
Expected Hours =
(End Time - Start Time) - Break Hours
```

### Daily Overtime

```text
Daily Overtime =
MAX(0, Actual Worked Hours - Expected Hours)
```

This allows overtime to be calculated from attendance data rather than manually entered payroll values.

---

# Payroll Grievance Flow

Employees can review draft payslips before final payroll approval.

```text
Draft Payslip
      │
      ▼
Employee Review
      │
      ├── No Issue ───────────► Continue Validation
      │
      ▼
Payroll Grievance
      │
      ▼
HR Review
      │
      ├── Reject ─────────────► Continue
      │
      └── Approve ────────────► Recalculate
                                      │
                                      ▼
                                Updated Payslip
```

This allows payroll discrepancies such as incorrect overtime or missing leave information to be resolved before finalization.

---

# Department Budget Analytics

The platform compares department payroll costs against allocated budgets.

### Variance Amount

```text
Variance Amount =
Actual Payroll Cost - Budget
```

### Variance Percentage

```text
Variance % =
((Actual Payroll Cost - Budget) / Budget) × 100
```

Budget overruns can then be surfaced on the executive dashboard.

---

# Installation

## Prerequisites

Install the following:

* Node.js `18+`
* PostgreSQL `15+`
* npm `9+`

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd peoplepay360
```

---

## 2. Create the Database

Open PostgreSQL and create the database:

```sql
CREATE DATABASE peoplepay360;
```

---

## 3. Run Database Scripts

Apply the schema:

```bash
psql -U postgres -d peoplepay360 -f db/schema.sql
```

Load the seed data:

```bash
psql -U postgres -d peoplepay360 -f db/seed.sql
```

---

# Environment Variables

Create:

```text
server/.env
```

Add:

```env
PORT=5000

DATABASE_URL=postgres://postgres:password@localhost:5432/peoplepay360

JWT_SECRET=your_super_secret_jwt_key

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

Do **not** commit `.env` files or production secrets to Git.

---

# Running the Application

## Start the Backend

```bash
cd server
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

## Start the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will then be available through the Vite development server.

---

# Application Flow Summary

The complete PeoplePay360 processing pipeline can be summarized as:

```text
                 ┌──────────────────┐
                 │ React Frontend   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Express REST API │
                 └────────┬─────────┘
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
             JWT / RBAC       Business Services
                                   │
                                   ▼
                         ┌──────────────────┐
                         │ PostgreSQL Data  │
                         │ Employee         │
                         │ Contract         │
                         │ Attendance       │
                         │ Leave            │
                         │ Salary Rules     │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Payroll Engine   │
                         │                  │
                         │ Context         │
                         │ Rules           │
                         │ DAG Validation  │
                         └────────┬─────────┘
                                  │
                                  ▼
                           Draft Payslips
                                  │
                                  ▼
                         Pre-Flight Scanner
                                  │
                         ┌────────┴────────┐
                         │                 │
                      Blocker           Valid
                         │                 │
                       STOP                ▼
                                   HR Review
                                        │
                                        ▼
                                   VALIDATED
                                        │
                                        ▼
                                      PAID
                                   /         \
                                  /           \
                                 ▼             ▼
                              PDF/Email     Dashboard
```

---

## Architecture Philosophy

PeoplePay360 is designed around four core principles:

1. **Separation of concerns** — frontend, API, business logic, payroll engine, and database have distinct responsibilities.
2. **Configurable payroll** — salary calculations are represented as database-driven rules instead of hardcoded salary logic.
3. **Data integrity** — PostgreSQL constraints, relationships, transactions, and validation protect payroll data.
4. **Safe payroll processing** — DAG validation, pre-flight checks, grievance resolution, and controlled payrun states reduce payroll errors.
