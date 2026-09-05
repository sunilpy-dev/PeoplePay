ARCHITECTURE.md — PeoplePay360: HR & Payroll EngineSystem Target: Production-Grade HR Operations & Payroll SystemTech Stack: PERN (PostgreSQL, Express.js, React.js, Node.js)Repository Structure: Monorepo / Decoupled Client-ServerDocument Version: 1.0.0 (Hackathon Production Spec)1. Executive Summary & System OverviewPeoplePay360 unifies operational HR data (contracts, schedules, attendance, time off) with a dynamic, formula-driven payroll calculation engine. Instead of static CRUD tables or hardcoded math, the platform computes payslips sequentially using a Directed Acyclic Graph (DAG) rule evaluation engine.                       OPERATIONAL INPUTS                                   PAYROLL ENGINE
┌──────────────────┐   ┌───────────────────┐   ┌─────────────────┐
│ Employee Master  │   │ Active Contracts  │   │ Time & Leaves   │
│  (Profiles/Bank) │   │ (Period-Filtered) │   │(Attendance/LOP) │
└────────┬─────────┘   └─────────┬─────────┘   └────────┬────────┘
         │                       │                      │
         └───────────────────────┼──────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Payrun Scope Setup     │ (Period, Salary Structure)
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Rule Engine (DAG)     │ Topologically Sorted Calculations
                    │   Rules 10 ──► 200      │ Basic -> Allowances -> Gross -> Net
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Pre-Flight Validation   │ Critical Blockers & Warnings Engine[cite: 5]
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Validate & Mark Paid   │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
      ┌─────────────────────┐       ┌────────────────────────┐
      │ Payslip PDF & Email │       │ Live PostgreSQL Dashboard│
      └─────────────────────┘       └────────────────────────┘
2. Technical Stack ArchitectureLayerTechnologyKey Dependencies / UsageFrontend UIReact.js 18+Vite, Tailwind CSS, Lucide Icons, React Router DOM v6State & FetchingReact Query / AxiosAsync state management, cache invalidation, API integrationBackend RuntimeNode.js (v18+)Express.js framework, modular controller-service patternFormula Engineexpr-evalDynamic expression parsing for Salary Rule evaluation[cite: 5]PDF & Mailerpdfkit / nodemailerPDF payslip rendering and bulk async SMTP transmission  DatabasePostgreSQL 15+Relational data, ACID compliance, raw SQL/Kysely/PrismaAuthenticationJWT / Bcrypt.jsStateless bearer token authentication + RBAC middleware  3. Database Schema Design (PostgreSQL)                            ┌────────────────┐
                            │     Users      │
                            └───────┬────────┘
                                    │ 1:1
                            ┌───────┴────────┐
                            │   Employees    │
                            └───────┬────────┘
         ┌──────────────────────────┼──────────────────────────┐
         │ 1:N                      │ 1:N                      │ 1:N
┌────────┴────────┐        ┌────────┴────────┐        ┌────────┴────────┐
│    Contracts    │        │   Attendances   │        │ Leave Alloc/Req │
└────────┬────────┘        └─────────────────┘        └─────────────────┘
         │ N:1
┌────────┴────────┐
│ Salary Structures│
└────────┬────────┘
         │ 1:N
┌────────┴────────┐        ┌─────────────────┐        ┌─────────────────┐
│  Salary Rules   │        │     Payruns     │───────►│    Payslips     │
└─────────────────┘        └─────────────────┘ 1:N    └────────┬────────┘
                                                               │ 1:N
                                                      ┌────────┴────────┐
                                                      │  Payslip Lines  │
                                                      └─────────────────┘
DDL Schema DefinitionsSQL-- Enums
CREATE TYPE user_role AS ENUM ('EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN');
CREATE TYPE contract_status AS ENUM ('DRAFT', 'RUNNING', 'EXPIRED', 'CANCELLED');
CREATE TYPE payrun_status AS ENUM ('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID');
CREATE TYPE leave_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REFUSED');
CREATE TYPE rule_category AS ENUM ('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET');
CREATE TYPE computation_type AS ENUM ('FIXED', 'PERCENTAGE', 'FORMULA');

-- 1. Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Working Schedules
CREATE TABLE working_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    weekly_hours DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schedule_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES working_schedules(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_hours DECIMAL(4,2) DEFAULT 1.00
);

-- 3. Employee Master
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    job_position VARCHAR(100) NOT NULL,
    manager_id UUID REFERENCES employees(id),
    schedule_id UUID REFERENCES working_schedules(id),
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Salary Structures & Rules
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE salary_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID REFERENCES salary_structures(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category rule_category NOT NULL,
    sequence INT NOT NULL,
    type computation_type NOT NULL,
    fixed_amount DECIMAL(12,2) DEFAULT 0.00,
    percentage_rate DECIMAL(5,2) DEFAULT 0.00,
    base_code VARCHAR(50),
    formula TEXT,
    UNIQUE(structure_id, code)
);

-- 5. Contracts (Period-Isolated)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    structure_id UUID REFERENCES salary_structures(id),
    wage DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status contract_status DEFAULT 'DRAFT',
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 6. Attendance
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    worked_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    is_manual_edit BOOLEAN DEFAULT FALSE
);

-- 7. Time Off & Allocations
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    is_unpaid BOOLEAN DEFAULT FALSE
);

CREATE TABLE leave_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    allocated_days DECIMAL(5,2) NOT NULL,
    taken_days DECIMAL(5,2) DEFAULT 0.00,
    status leave_status DEFAULT 'APPROVED'
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days DECIMAL(5,2) NOT NULL,
    status leave_status DEFAULT 'DRAFT'
);

-- 8. Payruns & Payslips
CREATE TABLE payruns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    structure_id UUID REFERENCES salary_structures(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status payrun_status DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payrun_id UUID REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    contract_id UUID REFERENCES contracts(id),
    worked_days DECIMAL(4,2) NOT NULL,
    unpaid_leave_days DECIMAL(4,2) DEFAULT 0.00,
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    basic DECIMAL(12,2) NOT NULL,
    gross DECIMAL(12,2) NOT NULL,
    deductions DECIMAL(12,2) NOT NULL,
    net_salary DECIMAL(12,2) NOT NULL,
    status payrun_status DEFAULT 'DRAFT',
    UNIQUE(payrun_id, employee_id)
);

CREATE TABLE payslip_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id UUID REFERENCES payslips(id) ON DELETE CASCADE,
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    category rule_category NOT NULL,
    amount DECIMAL(12,2) NOT NULL
);
4. Operational Business Logic & Calculation EngineA. The Production Execution Engine (salaryEngine.js)JavaScriptimport { Parser } from 'expr-eval';

export function computeEmployeePayslip({ employee, contract, schedule, attendance, rules }) {
  const parser = new Parser();
  
  // 1. Establish Calculation Context Variables
  const scheduleDays = attendance.scheduledDays || 22;
  const workedDays = attendance.workedDays || 22;
  const unpaidDays = attendance.unpaidLeaveDays || 0;
  const otHours = attendance.overtimeHours || 0;
  const wage = parseFloat(contract.wage);
  
  const dailyHours = schedule.weekly_hours / 5;
  const hourlyRate = wage / (scheduleDays * dailyHours);

  const context = {
    CONTRACT_WAGE: wage,
    SCHEDULE_DAYS: scheduleDays,
    WORKED_DAYS: workedDays,
    UNPAID_LEAVE_DAYS: unpaidDays,
    OVERTIME_HOURS: otHours,
    HOURLY_RATE: hourlyRate
  };

  const calculatedLines = [];
  
  // Sort rules strictly by Sequence ascending (e.g. 10 -> 20 -> 30 -> 100 -> 110 -> 200)
  const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);

  // 2. Sequentially Execute Rules
  for (const rule of sortedRules) {
    let amount = 0;
    try {
      if (rule.type === 'FIXED') {
        amount = parseFloat(rule.fixed_amount);
      } else if (rule.type === 'PERCENTAGE') {
        const base = context[rule.base_code] || 0;
        amount = (base * parseFloat(rule.percentage_rate)) / 100;
      } else if (rule.type === 'FORMULA') {
        amount = parser.parse(rule.formula).evaluate(context);
      }
    } catch (err) {
      console.error(`Execution error on rule ${rule.code}:`, err);
      amount = 0;
    }

    // Round to 2 Decimal Places
    amount = Math.round(amount * 100) / 100;
    context[rule.code] = amount;

    calculatedLines.push({
      rule_code: rule.code,
      rule_name: rule.name,
      category: rule.category,
      amount: amount
    });
  }

  // 3. Extract Core System Aggregates
  const basic = context['BASIC'] || 0;
  const gross = context['GROSS'] || 0;
  const deductions = context['TOTAL_DED'] || 0;
  const net = context['NET'] || (gross - deductions);

  return {
    employee_id: employee.id,
    contract_id: contract.id,
    worked_days: workedDays,
    unpaid_leave_days: unpaidDays,
    overtime_hours: otHours,
    basic,
    gross,
    deductions,
    net_salary: net,
    lines: calculatedLines
  };
}
B. Default Configured Salary Rules SequenceSequenceCodeNameCategoryTypeFormula / Rule10BASICBasic SalaryBASICFORMULA(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)20HRAHouse Rent AllowanceALLOWANCEPERCENTAGEBASIC * 0.40 (Base: BASIC)30CONVConveyance AllowanceALLOWANCEFIXED3000.0040SPECIALSpecial AllowanceALLOWANCEFORMULACONTRACT_WAGE * 0.1050OVERTIMEOvertime EarningsALLOWANCEFORMULAOVERTIME_HOURS * (HOURLY_RATE * 1.50)100GROSSGross SalaryGROSSFORMULABASIC + HRA + CONV + SPECIAL + OVERTIME110PFProvident FundDEDUCTIONPERCENTAGEBASIC * 0.12 (Base: BASIC)120PTProfessional TaxDEDUCTIONFORMULAGROSS > 15000 ? 200 : 0130LOPLoss of PayDEDUCTIONFORMULA(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS140TOTAL_DEDTotal DeductionsDEDUCTIONFORMULAPF + PT + LOP200NETNet SalaryNETFORMULAGROSS - TOTAL_DED5. Architectural Edge Cases & System SolutionsSolution 1: Mid-Month Joiners & Leavers (Contract Proration)When an employee joins mid-month (e.g., March 18th), running a full monthly payrun causes overpayment.Engine Isolation Algorithm:JavaScriptconst windowStart = new Date(Math.max(periodStart, contractStart));
const windowEnd = new Date(Math.min(periodEnd, contractEnd || periodEnd));
const eligibleWorkingDays = calculateWorkingDays(windowStart, windowEnd, schedule);
const prorationFactor = eligibleWorkingDays / standardPeriodWorkingDays;
Solution 2: Automated Overtime derived from Working SchedulesOvertime is not typed manually; it is derived automatically by comparing timestamps to schedule expectations:$$\text{Expected Hours} = (\text{End Time} - \text{Start Time}) - \text{Break Hours}$$$$\text{Daily Overtime} = \max(0, \text{Actual Worked Hours} - \text{Expected Hours})$$Solution 3: Circular Dependency Guard (DAG Validation)If an HR Admin specifies a formula like $\text{BONUS} = \text{NET} \times 0.10$, an infinite cycle occurs because $\text{NET}$ depends on $\text{BONUS}$.Graph Engine Solution: Upon saving a salary structure, rule formulas are parsed into an adjacency list. Kahn’s Topological Sort Algorithm runs over the rules. If the list contains cycles, the API rejects the HTTP POST request with code 422 Unprocessable Entity.6. Pre-Flight Payroll Warning EngineBefore an HR Payroll Manager can transition a Payrun from COMPUTED to VALIDATED, the backend runs an automated scanner across all candidate payslips:                      PRE-FLIGHT CHECK
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   CRITICAL BLOCKERS                OPERATIONAL WARNINGS
  (Halts Validation)              (Requires HR Confirmation)
   • DUPLICATE_PAYSLIP             • MISSING_BANK_INFO
   • NEGATIVE_NET                  • UNAPPROVED_ATTENDANCE
   • NO_ACTIVE_CONTRACT            • CONTRACT_EXPIRING
JavaScriptexport async function runPreFlightCheck(payrunId) {
  const warnings = [];
  const payslips = await db.getPayslipsByPayrun(payrunId);

  for (const slip of payslips) {
    // Critical Blockers
    if (slip.net_salary < 0) {
      warnings.push({ type: 'BLOCKER', code: 'NEGATIVE_NET', employee_id: slip.employee_id, msg: `Net salary for ${slip.employee_name} is negative (${slip.net_salary}).` });
    }
    if (!slip.contract_id) {
      warnings.push({ type: 'BLOCKER', code: 'NO_ACTIVE_CONTRACT', employee_id: slip.employee_id, msg: `No active contract covering period for ${slip.employee_name}.` });
    }

    // Operational Warnings
    if (!slip.bank_account_no || !slip.bank_ifsc) {
      warnings.push({ type: 'WARNING', code: 'MISSING_BANK_INFO', employee_id: slip.employee_id, msg: `Employee ${slip.employee_name} is missing bank details.` });
    }
  }
  return warnings;
}
7. Role-Based Access Control Matrix (RBAC)Strict middleware checks enforce permission boundaries on both client side and backend endpoints:  Feature ModuleEmployeeHR ManagerHR Payroll UserHR Payroll ManagerAdminView Own Dashboard/Payslips✅  ✅  ✅  ✅  ✅  Clock-In / Request Time Off✅  ✅  ✅  ✅  ✅  Manage Employees & Contracts❌  ✅  ✅  ✅  ✅  Approve Time Off Requests❌  ✅  ✅  ✅  ✅  Execute Payruns & Compute❌  ❌  ✅  ✅  ✅  Configure Structures & Rules❌  ❌  👁️ Read-Only  ✅  ✅  User Role Assignment❌  ❌  ❌  ❌  ✅  8. API Endpoints SpecificationAuthentication & UsersPOST /api/v1/auth/login — Authenticate user and issue JWT.GET /api/v1/auth/me — Return active user session & assigned role permissions.HR Master DataGET /api/v1/employees — List employees (Kanban/List view).  POST /api/v1/employees — Create employee profile.  GET /api/v1/employees/:id/smart-summary — Smart button counters (Contracts, Attendance, Leaves).  POST /api/v1/contracts — Create employee contract with date-range checks.  Time Tracking & LeavesPOST /api/v1/attendance/check-in — Clock in active worker.  POST /api/v1/attendance/check-out — Clock out worker, derive overtime hours automatically.  POST /api/v1/leaves/requests — Submit time off request.  PATCH /api/v1/leaves/requests/:id/approve — Approve request, decrement leave_allocations balance.  Payroll ProcessingPOST /api/v1/payruns/step1-scope — Wizard Step 1: Select Structure & Period.  POST /api/v1/payruns/step2-eligible — Wizard Step 2: Fetch eligible employees.  POST /api/v1/payruns — Create batch Payrun.  POST /api/v1/payruns/:id/compute — Trigger calculation engine for batch.  GET /api/v1/payruns/:id/warnings — Run pre-flight check scanner[cite: 5].PATCH /api/v1/payruns/:id/validate — Validate payrun.  PATCH /api/v1/payruns/:id/mark-paid — Lock payrun, flag status as PAID.  GET /api/v1/payslips/:id/pdf — Stream generated PDF payslip.  POST /api/v1/payruns/:id/send-emails — Trigger async email worker for bulk distribution[cite: 4, 6].Dashboard & AnalyticsGET /api/v1/dashboard/metrics — Aggregate PostgreSQL live metrics (Net Paid, Avg Salary, Attendance Health)[cite: 4, 6].9. Monorepo Directory & Code StructurePlaintextpeoplepay360/
├── client/                     # Frontend (React.js + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI (Kanban, SmartButtons, Modals)
│   │   ├── views/              # Pages (Employees, Contracts, Payruns, Dashboard)
│   │   ├── context/            # AuthContext, PermissionContext
│   │   ├── services/           # Axios API Client
│   │   └── App.jsx
│   └── package.json
│
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Database connection & env setup
│   │   ├── middleware/         # Auth, Role Guard, Error Handler
│   │   ├── engine/             # Payroll Rule Calculation & DAG Engine
│   │   │   ├── salaryEngine.js
│   │   │   ├── dagValidator.js
│   │   │   └── warningScanner.js
│   │   ├── controllers/        # Express Route Handlers
│   │   ├── services/           # Business Logic Layer
│   │   ├── utils/              # PDF Generator & Mailer utilities
│   │   └── app.js
│   └── package.json
│
├── db/                         # PostgreSQL Migrations & Seeders
│   ├── schema.sql              # Table DDL & Enum definitions
│   └── seed.sql                # Production seed data (Employees, Rules, Contracts)
└── README.md