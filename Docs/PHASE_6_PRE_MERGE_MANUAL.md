# PeoplePay360: Phase 6 Pre-Merge Manual & Troubleshooting Guide
> **Document Purpose:** Complete operational manual, database seeding instructions, JWT authentication troubleshooting guide, and code architecture walkthrough before merging Phase 6 into `main`.
> **Audience:** All engineers, DevOps, and team members running or testing PeoplePay360 across different local machines and servers.

---

## Table of Contents
1. [Phase 6 Executive Overview](#1-phase-6-executive-overview)
2. [Database Setup & Seeding Guide](#2-database-setup--seeding-guide)
3. [JWT Authentication & Multi-Server Troubleshooting Guide](#3-jwt-authentication--multi-server-troubleshooting-guide)
4. [Salary Rule Engine & DAG Architecture (Layman Guide)](#4-salary-rule-engine--dag-architecture-layman-guide)
5. [Step-by-Step Pre-Merge Verification Checklist](#5-step-by-step-pre-merge-verification-checklist)

---

## 1. Phase 6 Executive Overview

Phase 6 implements the **Salary Rule Architecture and Compensation Engine** across both the backend engine and the React user interface, faithfully reproducing:
- [`Docs/UI/Salary Rules Architecture.png`](file:///e:/Odoo/ProplePay360/Docs/UI/Salary%20Rules%20Architecture.png)
- [`Docs/UI/Salary Structures.png`](file:///e:/Odoo/ProplePay360/Docs/UI/Salary%20Structures.png)
- [`Docs/UI/DESIGN.md`](file:///e:/Odoo/ProplePay360/Docs/UI/DESIGN.md) (Executive Precision Design System)

### Key Capabilities Built:
1. **Salary Rules Architecture View (`/payroll/rules`)**:
   - Real-time pipeline monitoring (`PAYROLL ENGINE V4.2`, `Strict Sequence Mode`).
   - Executive metric cards (Compiled Rules, Computation Load, Dynamic Formula Rules, Circular References status).
   - High-density rules table with JetBrains Mono formula preview.
   - Visual **Execution Sequence Hierarchy** (5 pipeline stages: Contract & Base → Allowances & Overtime → Gross Foundation → Tax & Pre-tax → Net Disbursed).
2. **Salary Structures Master-Detail View (`/payroll/structures`)**:
   - Registered Schemas list with active status and rule/employee counts.
   - Selected schema detail with **Execution Sequence Graph** table.
   - Bottom **Simulation Sandbox Strip** (`Gross Payable → Deductions → Hourly Rate → Net Pay Result` with `Deterministic Pass`).
3. **Interactive Dry Run Test Sandbox Drawer (`DryRunSandboxDrawer.jsx`)**:
   - Zero-latency sandbox where HR can adjust `CONTRACT_WAGE`, `WORKED_DAYS`, `SCHEDULE_DAYS`, `UNPAID_LEAVE_DAYS`, and `OVERTIME_HOURS` to verify exact formula output before finalizing any payrun.
4. **Backend DAG Engine & Cycle Guard (`dagValidator.js` & `salaryEngine.js`)**:
   - Kahn's algorithm validates rule formulas, ensures strictly ascending sequence order, and detects circular reference loops (rejecting invalid rules with HTTP 422).
   - Mathematical formula engine using `expr-eval` with context variables and 2-decimal rounding.

---

## 2. Database Setup & Seeding Guide

### Step 2.1: PostgreSQL Credentials Configuration
Ensure your PostgreSQL 15+ service is running. By default in `Server/src/config/db.js`:
- Host: `localhost` (or `127.0.0.1`)
- Port: `5432`
- Database: `hr_payroll_db` (or `peoplepay360`)
- User: `postgres`
- Password: Set in `Server/.env` (see Section 3 for configuration)

### Step 2.2: Applying Database Schema
To create all 14 tables, custom enum types, triggers, and performance indexes, run `db/schema.sql`:
```bash
# Using psql command line
psql -U postgres -d hr_payroll_db -f db/schema.sql
```
*What this creates:*
- Enums: `user_role`, `contract_status`, `payrun_status`, `leave_status`, `rule_category`, `computation_type`.
- Tables: `users`, `working_schedules`, `schedule_lines`, `employees`, `salary_structures`, `salary_rules`, `contracts`, `attendances`, `leave_types`, `leave_allocations`, `leave_requests`, `payruns`, `payslips`, `payslip_lines`.

### Step 2.3: Seeding Default Compensation Data
Run `db/seed.sql` to populate initial structures, rules, and demo accounts:
```bash
psql -U postgres -d hr_payroll_db -f db/seed.sql
```
*What this seeds:*
1. **Working Schedule**: `Standard 40h Work Schedule` (Mon-Fri 09:00 - 18:00, 1h break).
2. **Salary Structure**: `Standard Full-Time Structure` (Code: `STD_MONTHLY`).
3. **11 Default Salary Rules**:
   - `010 BASIC`: `(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)`
   - `020 HRA`: `BASIC * 0.40`
   - `030 CONV`: Flat `3000.00`
   - `040 SPECIAL`: `CONTRACT_WAGE * 0.10`
   - `050 OVERTIME`: `OVERTIME_HOURS * (HOURLY_RATE * 1.50)`
   - `100 GROSS`: `BASIC + HRA + CONV + SPECIAL + OVERTIME`
   - `110 PF`: `BASIC * 0.12`
   - `120 PT`: `GROSS > 15000 ? 200 : 0`
   - `130 LOP`: `(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS`
   - `140 TOTAL_DED`: `PF + PT + LOP`
   - `200 NET`: `GROSS - TOTAL_DED`
4. **Demo Users & Roles** (Default password: `Password@123`):
   - Admin: `admin@peoplepay360.com` (`ADMIN`)
   - Payroll Manager: `payroll.manager@peoplepay360.com` (`HR_PAYROLL_MANAGER`)
   - HR Manager: `hr.manager@peoplepay360.com` (`HR_MANAGER`)
   - Employees: `sarah.connor@peoplepay360.com`, `alex.chen@peoplepay360.com` (`EMPLOYEE`)

### Step 2.4: Resetting & Verifying Passwords
If seed password hashes fail to match on different operating systems due to bcrypt salt differences, run the included password repair script:
```bash
cd Server
node src/fixSeedPasswords.js
```
*Expected Output:*
```text
Successfully updated 5 users with valid bcrypt hash for 'Password@123'.
```

---

## 3. JWT Authentication & Multi-Server Troubleshooting Guide

> [!CAUTION]
> **Why JWT authentication errors happen across servers:**
> In distributed development or when running across different local laptops/staging servers, JWT authentication failures are almost always caused by one of these 5 root causes:

### Root Cause 1: Mismatched `JWT_SECRET`
* **The Problem**: If Server A signs a token using one secret, and Server B restarts with a different secret or no `.env` file (falling back to a random string), the token is immediately rejected as `INVALID_TOKEN` (HTTP 401).
* **The Fix**: Standardize `JWT_SECRET` in `Server/.env` on every machine!

### Root Cause 2: Database Connection Drops
* **The Problem**: Our auth middleware [`Server/src/middleware/auth.js`](file:///e:/Odoo/ProplePay360/Server/src/middleware/auth.js) verifies that the user actually exists in the database on every protected request. If PostgreSQL fails or has an invalid password, `/auth/me` will return 401 or 503!
* **The Fix**: Verify `DB_PASSWORD` and database name match in `Server/.env`.

### Root Cause 3: Expired Token in Browser `localStorage`
* **The Problem**: When a team member has an old token saved in `localStorage['peoplepay_token']`, subsequent requests fail with `TOKEN_EXPIRED`.
* **The Fix**: Our frontend Axios interceptor automatically detects 401 errors and clears `localStorage`. If stuck, simply open DevTools Application tab -> Local Storage -> Clear, or visit `http://localhost:5173/login?expired=true`.

### Root Cause 4: Malformed Authorization Header
* **The Problem**: Backend expects exact format: `Authorization: Bearer <token>`. If the string `"Bearer "` is missing or has a double space, JWT verification throws `UNAUTHORIZED`.
* **The Fix**: [`Client/src/services/api.js`](file:///e:/Odoo/ProplePay360/Client/src/services/api.js) handles this automatically:
  ```javascript
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('peoplepay_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```

### Root Cause 5: CORS Header Mismatch
* **The Problem**: The backend rejects requests if `CLIENT_URL` does not match the frontend port (e.g. frontend running on `5174` instead of `5173`).
* **The Fix**: [`Server/src/app.js`](file:///e:/Odoo/ProplePay360/Server/src/app.js) permits origins matching `http://localhost:5173`, `http://127.0.0.1:5173`, or `process.env.CLIENT_URL`.

---

### Standard Environment Files (Copy-Paste Ready)

#### `Server/.env`
Create this file inside the `Server/` directory:
```env
# Server Runtime
PORT=5000
NODE_ENV=development

# Database Connection (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_payroll_db
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password

# Authentication
JWT_SECRET=peoplepay360_production_jwt_shared_secret_2026
JWT_EXPIRES_IN=24h

# Client Application URL
CLIENT_URL=http://localhost:5173
```

#### `Client/.env`
Create this file inside the `Client/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

### Verifying Authentication with the Test Suite
Before committing or merging, run the automated auth test suite:
```bash
cd Server
node src/testAuth.js
```
*Expected Output:*
```text
=== RUNNING BACKEND AUTH VERIFICATION TESTS ===
1. Testing GET /health ... -> 200 healthy
2. Testing POST /auth/login with invalid password ... -> 401
3. Testing POST /auth/login for ADMIN user ... -> 200 (Token received)
4. Testing GET /auth/me with valid Bearer token ... -> 200
5. Testing POST /auth/login for HR_PAYROLL_MANAGER ... -> 200
6. Testing POST /auth/login for EMPLOYEE (Sarah Connor) ... -> 200
7. Testing POST /auth/logout ... -> 200
8. Testing GET /auth/me without token (expect 401) ... -> 401
>>> ALL BACKEND AUTH TESTS PASSED SUCCESSFULLY! <<<
```

---

## 4. Salary Rule Engine & DAG Architecture (Layman Guide)

### What is a DAG (Directed Acyclic Graph)?
In payroll, math calculations must happen in a specific order:
```text
Contract Wage ──► Basic Salary ──► HRA (40% of Basic) ──► Gross Earnings ──► Total Deductions ──► Net Pay
```
If an HR admin accidentally writes:
- Rule A: `BONUS = NET * 0.10`
- Rule B: `NET = GROSS - BONUS`
Then **Rule A needs Rule B**, but **Rule B needs Rule A**! This is a circular reference trap.

### How Kahn's Algorithm Works in PeoplePay360
Our [`dagValidator.js`](file:///e:/Odoo/ProplePay360/Server/src/engine/dagValidator.js) prevents this using **Kahn's Algorithm**:
1. It analyzes all rule formulas and counts how many other rules each rule depends on (called `in-degree`).
2. Rules with `0` dependencies (like `BASIC`) are put into an execution queue first.
3. Once `BASIC` is solved, rules that depend on it (like `HRA` and `PF`) have their dependency count reduced by 1.
4. When their count reaches `0`, they enter the execution queue.
5. If at the end, any rules remain unprocessed, **a circular reference loop exists!**
6. The backend immediately rejects the save with `HTTP 422 Unprocessable Entity` and identifies the exact rules causing the loop!

### Available Context Variables for Formulas
When building custom formulas in the Rule Modal or Dry Run Sandbox, these variables are always injected by the engine:
| Variable Name | Description | Example Value |
|---|---|---|
| `CONTRACT_WAGE` | Agreed monthly compensation | `120000` |
| `SCHEDULE_DAYS` | Standard working days in the month | `22` |
| `WORKED_DAYS` | Days employee was present or on approved paid leave | `22` |
| `UNPAID_LEAVE_DAYS`| Unpaid leaves / Loss of Pay days | `0` |
| `OVERTIME_HOURS` | Daily overtime accumulated | `4.0` |
| `HOURLY_RATE` | Derived hourly pay (`CONTRACT_WAGE / (SCHEDULE_DAYS * 8)`) | `681.82` |
| Upstream Rule Codes | Any rule calculated earlier (e.g. `BASIC`, `GROSS`, `PF`) | `60000` |

---

## 5. Step-by-Step Pre-Merge Verification Checklist

Run these commands on your terminal before issuing `git merge main` or pushing to remote:

```bash
# 1. Check git status to ensure working directory is clean
git status

# 2. Verify Backend Salary Engine & DAG algorithm
cd Server
node src/testSalaryEngine.js
# Verify: ">>> ALL SALARY ENGINE & DAG TESTS PASSED PERFECTLY! <<<"

# 3. Verify Backend Authentication Suite
node src/testAuth.js
# Verify: ">>> ALL BACKEND AUTH TESTS PASSED SUCCESSFULLY! <<<"

# 4. Verify Frontend Production Build
cd ../Client
npm run build
# Verify: "✓ built in X.XXs" with 0 errors
```

### Quick UI Sanity Check:
1. Start frontend: `npm run dev` inside `Client/`.
2. Login with `admin@peoplepay360.com` / `Password@123`.
3. Navigate to **Salary Rules** (`/payroll/rules`):
   - Confirm 4 KPI cards render.
   - Click **Dry Run Test Sandbox**: change Contract Wage to `₹1,50,000`, verify live calculation recalculates Gross and Net Pay.
   - Click **New Salary Rule**: click token chips (`+CONTRACT_WAGE`), verify chips insert cleanly.
4. Navigate to **Salary Structures** (`/payroll/structures`):
   - Click different schemas on the left (e.g. `Executive Tech & Leadership`), verify right table updates instantly.
   - Confirm bottom Simulation Sandbox strip shows `Deterministic Pass`.

Once all steps are green, the branch is ready for merge!
