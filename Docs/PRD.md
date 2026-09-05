# PRD --- PeoplePay360: HR & Payroll

## 1. What to Build

### 1.1 Product Vision

Build **PeoplePay360**, an integrated HR and Payroll operations platform
that connects the employee lifecycle from employee master data and
attendance through time-off management, payroll computation, payslip
generation, payroll review, grievance resolution, payroll risk
monitoring, budget tracking, and payroll reporting.

The product must go beyond isolated CRUD screens. The core value is a
connected, data-driven operational workflow in which:

-   Employees are the central HR record.
-   Contracts and working schedules provide the correct context for
    attendance and payroll.
-   Attendance captures daily work and exceptions.
-   Time Off manages allocations, requests, approvals, and balances.
-   Salary Structures and Salary Rules drive actual payroll
    calculations.
-   Payruns generate draft Payslips for selected employees and periods.
-   Employees can review draft payslips before payroll is finalized.
-   Payroll grievances can be raised, reviewed, resolved, and reflected
    in payroll.
-   Payroll Risk Score identifies issues before finalization.
-   Department budgets can be compared against actual payroll costs for
    the selected period.
-   Finalized payroll remains available as historical data.

### 1.2 Technology Direction

The implementation will use the **PERN stack**:

-   **Frontend:** React
-   **Backend:** Node.js + Express
-   **Database:** PostgreSQL
-   **API:** REST-based backend APIs

The system should keep business logic primarily in the backend and
persist operational data in PostgreSQL. The application must not depend
on static JSON/mock data for core functionality.

### 1.3 Core Product Principles

1.  Correct relational database design
2.  Real business rules
3.  Accurate payroll computation
4.  Role-based permissions
5.  Historical and period-based data handling
6.  Live dashboard data
7.  Clear, modular architecture
8.  Robust validation and useful user feedback
9.  Clean and responsive UX
10. Complete end-to-end HR-to-payroll workflow
11. Payroll issues should be detected before finalization
12. Payroll decisions should be explainable and traceable

### 1.4 Primary End-to-End Flow

``` text
Employee
   ↓
Contract + Working Schedule
   ↓
Attendance + Time Off
   ↓
Salary Structure + Salary Rules
   ↓
Payrun
   ↓
Employee Selection
   ↓
Draft Payslip Computation
   ↓
Payroll Risk Check + Validation
   ↓
Employee Review
   ↓
Clear / Payroll Grievance
   ↓
HR/Payroll Resolution
   ↓
Recalculate if required
   ↓
Final Validation
   ↓
Validate Payrun
   ↓
Mark Paid
   ↓
Generate Payslip PDF
   ↓
Send Payslips
   ↓
Payroll Dashboard / History
```

### 1.5 Scope Boundary

The product should remain focused on the PeoplePay360 problem statement.

The additional features in this PRD are extensions of the core
HR/payroll workflow. They must not become unrelated modules or introduce
unnecessary infrastructure.

Do not add:

-   Full accounting
-   Recruitment/ATS
-   CRM
-   Inventory
-   Complex financial forecasting
-   Generic AI features that do not directly improve payroll operations
-   Unnecessary third-party integrations

------------------------------------------------------------------------

# 2. Target Users

The platform has five defined user roles.

## 2.1 Employee

Employees use the platform for their own HR information and daily
operational activities.

### Access

-   View own employee details
-   View own attendance records
-   Create attendance entries
-   View own leave balances
-   Create Time Off Requests
-   View request status
-   View draft payslips assigned to them
-   Review salary components before finalization
-   Raise Payroll Grievances against draft payslips
-   View grievance status and resolution

### Restrictions

-   No HR administration
-   No payroll administration
-   No access to other employees' private records
-   Cannot modify payroll configuration

------------------------------------------------------------------------

## 2.2 HR Manager

HR Managers manage employee and day-to-day HR operations.

### Access

-   Employees --- full CRUD
-   Attendance --- full CRUD
-   Contracts --- full CRUD
-   Working Schedules --- full CRUD
-   Time Off --- full CRUD
-   Approve or refuse Time Off Requests
-   View relevant HR reporting/dashboard information
-   View payroll-related employee issues where permitted for resolution

### Restrictions

-   No payroll administration
-   Cannot configure Salary Structures or Salary Rules
-   Cannot finalize payroll

------------------------------------------------------------------------

## 2.3 HR Payroll User

HR Payroll Users handle payroll operations while retaining HR Manager
capabilities.

### Access

-   All HR Manager permissions
-   Create, Read, and Update Payruns
-   Create, Read, and Update Payslips
-   Read-only Salary Structures
-   Read-only Salary Rules
-   View and manage assigned payroll validation issues
-   View Payroll Risk information
-   View Budget vs Actual payroll information

### Restrictions

-   Cannot modify payroll configuration
-   Cannot fully manage Salary Structures or Salary Rules
-   Cannot perform restricted final payroll administration actions
    unless explicitly authorized

------------------------------------------------------------------------

## 2.4 HR Payroll Manager

HR Payroll Managers have complete control over HR and payroll
operations.

### Access

-   All HR Payroll User permissions
-   Full CRUD Payruns
-   Full CRUD Payslips
-   Full CRUD Salary Structures
-   Full CRUD Salary Rules
-   Full control of payroll validation
-   Review and resolve Payroll Grievances
-   Recalculate affected Payslips
-   Finalize/Validate Payruns
-   Mark payroll as Paid
-   Manage Department Payroll Budgets
-   Review Payrun and Employee Payroll Risk Scores
-   Override or resolve blocking payroll issues according to business
    rules

------------------------------------------------------------------------

## 2.5 Admin

The Admin has complete system-level control.

### Access

-   All modules
-   All records
-   User management
-   Role assignment
-   Permission management
-   System administration

------------------------------------------------------------------------

# 3. Features

## 3.1 Employee Master Management

Employees are the central hub of the platform.

### Required capabilities

-   Employee List View
-   Employee Kanban View
-   Employee Form View
-   Create employee
-   View employee
-   Update employee
-   Delete employee where permitted
-   Employee status management
-   Department
-   Manager
-   Job position
-   Working schedule
-   Employment information
-   Employee email
-   Bank/payment information where required for payroll

### Employee Form

The employee form should show:

-   Identity information
-   Job/role information
-   Department
-   Manager
-   Assigned schedule
-   Employment status
-   Payroll-relevant information
-   Related record counts

### Related Records

The employee form must provide direct navigation to:

-   Contracts
-   Attendance
-   Time Off
-   Allocations
-   Payslips
-   Payroll Grievances

The employee record acts as the operational hub for related HR
information.

------------------------------------------------------------------------

## 3.2 Contract Management

Contracts maintain employment history and provide payroll context.

### Required capabilities

-   Create contracts
-   View contracts
-   Update contracts
-   Delete contracts where permitted
-   Link contracts to employees
-   Contract start date
-   Contract end date
-   Wage
-   Department
-   Position
-   Salary Structure
-   Contract status

### Core Business Rule

Payroll must use **only the contract applicable to the selected payroll
period**.

Historical contracts must remain available.

The system must prevent or flag concurrent active contracts where they
would create ambiguity for payroll processing.

The system should also surface contracts approaching expiry as payroll
risk information.

### Example

``` text
Employee: A

Contract 1
Jan 01 → Jun 30
₹40,000

Contract 2
Jul 01 → Dec 31
₹50,000

Payroll Period: August

Applicable Contract = Contract 2
```

------------------------------------------------------------------------

## 3.3 Working Schedule Management

Working Schedules define expected working patterns.

### Required capabilities

-   List View
-   Form View
-   Schedule name
-   Schedule type
-   Weekly hours
-   Day-by-day configuration
-   Start time
-   End time
-   Break duration
-   Employee/contract assignment

### Core Business Rule

Weekly hours must be **calculated automatically** from the configured
working pattern.

Users should not manually enter the final weekly-hours total.

### Example

``` text
Monday    09:00–18:00  Break 1h
Tuesday   09:00–18:00  Break 1h
...
Weekly Hours = calculated total
```

------------------------------------------------------------------------

## 3.4 Attendance Management

Attendance captures daily presence and work exceptions.

### Required capabilities

-   Attendance List View
-   Attendance Form View
-   Check-in
-   Check-out
-   Worked hours
-   Attendance status
-   Employee association
-   Date/time information
-   Manual correction by authorized users

### Attendance Status / Exceptions

The system should support operational visibility for:

-   Present
-   Late
-   Absent
-   Overtime
-   Missing check-out
-   Manual edit/correction

### Core Business Rules

-   Worked hours should be calculated from check-in/check-out.
-   Working schedule provides expected work context.
-   Authorized users can correct attendance records.
-   Attendance remains available for dashboard and payroll-related
    insights.
-   Missing attendance relevant to payroll should be surfaced before
    finalization.

------------------------------------------------------------------------

## 3.5 Time Off Management

Time Off manages leave policies, allocations, requests, approvals, and
balances.

### 3.5.1 Time Off Types

Configure:

-   Name
-   Unit: days/hours
-   Whether allocation is required
-   Approval workflow
-   Payroll integration behavior

### 3.5.2 Allocations

Manage:

-   Employee
-   Time Off Type
-   Allocated amount
-   Validity period
-   Approval status
-   Taken amount
-   Remaining amount

### 3.5.3 Time Off Requests

Employees/users can create requests containing:

-   Employee
-   Time Off Type
-   Start date
-   End date
-   Duration
-   Status

### Workflow

``` text
Request
   ↓
Pending
   ↓
HR Manager Review
   ↓
Approved / Refused
```

### Core Business Rule

When a Time Off Request requiring allocation is approved:

``` text
Remaining Balance
=
Allocated Balance
-
Approved/Taken Leave
```

The approved request must automatically consume the appropriate
allocation.

### Payroll Connection

Relevant approved leave should be available as payroll context for
deductions and payroll validation.

------------------------------------------------------------------------

## 3.6 Salary Structure Management

Salary Structures group the salary rules used to calculate payroll.

### Required capabilities

-   Structure List View
-   Structure Form View
-   Structure name
-   Active/inactive status
-   Associated salary rules
-   Rule count
-   Employee usage information
-   Rule execution sequence

### Core Business Rule

The Salary Structure selected for a Payrun determines which Salary Rules
are used during payslip computation.

Salary Structures must be functional configuration, not static UI.

------------------------------------------------------------------------

## 3.7 Salary Rule Management

Salary Rules define actual payroll calculations.

### Required capabilities

Each rule should support:

-   Name
-   Code
-   Category
-   Sequence
-   Calculation type
-   Configuration/value
-   Active status

### Salary Categories

Support at least:

-   Basic
-   Allowances
-   Gross
-   Deductions
-   Net

### Calculation Methods

Support:

-   Fixed amount
-   Percentage
-   Formula

### Core Business Rule

Salary Rules execute in sequence because later rules may depend on
earlier results.

### Example

``` text
1. BASIC
2. HRA
3. ALLOWANCE
4. GROSS
5. DEDUCTION
6. NET
```

The system must calculate payslips using the configured rules rather
than hardcoded salary values.

------------------------------------------------------------------------

# 4. Payroll Features

## 4.1 Payrun Creation

Payrun creation must use a two-step workflow.

### Step 1 --- Define Payroll Scope

The user selects:

-   Salary Structure
-   Payroll Period

Clicking **Continue** must not immediately create the Payrun.

### Step 2 --- Select Employees

The system:

-   Finds eligible employees
-   Applies relevant period/contract context
-   Allows explicit employee selection
-   Prevents accidental inclusion of ineligible employees

Only after employee selection does the system create the Payrun.

------------------------------------------------------------------------

## 4.2 Payrun Processing

A Payrun groups Payslips for a payroll period.

### Payrun information

Display:

-   Run name
-   Salary Structure
-   Payroll period
-   Status
-   Selected employees
-   Payslip count
-   Payroll totals
-   Payroll Risk Score
-   Budget vs Actual information

### Processing Actions

The Payrun must support:

``` text
Compute Draft Payslips
        ↓
Risk Check
        ↓
Employee Review
        ↓
Resolve Grievances
        ↓
Validate
        ↓
Mark Paid
        ↓
Send Payslips
```

### Validation / Warnings

Before finalization, surface problems such as:

-   Missing required employee information
-   Missing bank details where required
-   Duplicate payslips
-   Missing applicable contract
-   Expiring contract
-   Missing attendance
-   Other payroll data issues
-   Open payroll grievances

Warnings should be visible to the user before the Payrun is finalized.

### Historical Records

Finalized and paid Payruns must remain available as historical payroll
records.

------------------------------------------------------------------------

## 4.3 Payslip & Salary Computation

Payslips are generated from Payruns for selected employees.

### Payslip Information

Display:

-   Employee
-   Salary Structure
-   Payrun
-   Payroll period
-   Status
-   Worked days
-   Attendance context
-   Time Off deductions where applicable
-   Salary computation

### Salary Breakdown

Show individual components such as:

``` text
Basic
Allowances
Gross
Deductions
Net Salary
```

Where applicable, the payslip should make payroll inputs understandable
to the employee, including:

-   Attendance
-   Leave deductions
-   Overtime
-   Allowances

### Core Calculation Rule

Payslip computation must automatically use:

``` text
Applicable Contract
+
Payrun Salary Structure
+
Ordered Salary Rules
+
Relevant payroll context
```

The calculation result must be stored and traceable.

------------------------------------------------------------------------

# 5. Pre-Payroll Payslip Review & Grievance System

## 5.1 Purpose

Allow employees to review a **Draft Payslip before salary is
finalized**, identify potential mistakes, and raise a Payroll Grievance.

This extends the PS's requirement to identify payroll issues before
finalization into a user-facing review workflow.

## 5.2 Draft Payslip Review

After draft payslips are computed:

-   Employee receives an in-app notification
-   Employee can open the draft payslip
-   Employee can review:
    -   Basic Salary
    -   Attendance
    -   Leave Deductions
    -   Overtime
    -   Allowances
    -   Gross Salary
    -   Deductions
    -   Net Salary
-   Employee can select **Raise Grievance** if something appears
    incorrect
-   Employee can select **No Issue / Confirm Review** when satisfied

## 5.3 Payroll Grievance

A grievance should contain:

-   Grievance ID
-   Employee
-   Payslip
-   Payroll period
-   Category
-   Description
-   Status
-   Created date
-   Resolution details
-   Resolved by
-   Resolved date

### Suggested Categories

-   Basic Salary
-   Attendance
-   Leave Deduction
-   Overtime
-   Allowance
-   Deduction
-   Other

### Status Flow

``` text
Open
 ↓
Under Review
 ↓
Resolved / Rejected
```

## 5.4 Resolution Workflow

``` text
Employee
   ↓
Raises Grievance
   ↓
HR/Payroll Review
   ↓
Investigate HR Data / Payroll Calculation
   ↓
Resolve or Reject
   ↓
Recalculate Payslip if Required
   ↓
Employee Sees Resolution
```

If the grievance changes payroll data, the affected payslip must be
recalculated before finalization.

## 5.5 Finalization Rule

The system should not silently finalize a Payrun containing unresolved
blocking payroll grievances.

The HR Payroll Manager must either:

-   Resolve the grievance, or
-   Explicitly use an authorized override/resolution action where the
    business rules allow it.

No automatic deadline-based finalization is required for the MVP.

## 5.6 Notifications

Use simple in-app notifications for the MVP:

-   Draft payslip available
-   New grievance
-   Grievance assigned/under review
-   Grievance resolved/rejected
-   Payslip recalculated

The existing PS's email payslip delivery remains part of the Payrun
workflow.

------------------------------------------------------------------------

# 6. Payroll Risk Score

## 6.1 Purpose

Provide an explainable risk indicator that helps Payroll Managers
identify payroll problems **before salary processing is finalized**.

The feature extends the PS's existing payroll validation/warning
concept.

## 6.2 Risk Levels

Example:

``` text
0–24    Low Risk
25–49   Medium Risk
50–74   High Risk
75–100  Critical Risk
```

The exact thresholds may be finalized during implementation.

## 6.3 Risk Inputs

The score should consider issues such as:

-   Missing bank account
-   Expiring contract
-   Excessive leave
-   Missing attendance
-   Duplicate payslip
-   Open payroll grievance
-   Other relevant payroll validation issues

## 6.4 Employee Risk Score

Each employee included in a Payrun can have an individual risk score.

Example:

``` text
Rahul     20 / 100   Low
Amit      65 / 100   High
Priya     10 / 100   Low
```

The Payroll Manager should be able to drill down from the Payrun to the
employees contributing to payroll risk.

## 6.5 Payrun Risk Score

The Payrun should also show an overall risk score.

Example:

``` text
September Payrun

Payroll Risk Score
78 / 100
HIGH RISK
```

The overall score must be derived from actual validation issues and
employee-level payroll risks.

## 6.6 Explainable Risk Breakdown

The system must explain why the score exists.

Example:

``` text
Payroll Risk: 78 / 100

Critical Issues
3 × Missing bank account
1 × Duplicate payslip

Warnings
2 × Expiring contracts
4 × Missing attendance
2 × Open grievances
```

The exact scoring weights should be deterministic and configurable in
code, not random or generated without explanation.

## 6.7 Risk Actions

From the risk panel, authorized payroll users should be able to navigate
directly to the underlying issue.

Examples:

``` text
Missing Bank Accounts → View Employees
Duplicate Payslip → View Payslip
Expiring Contracts → View Contracts
Open Grievances → View Grievances
Missing Attendance → View Attendance
```

------------------------------------------------------------------------

# 7. Payroll Budget vs Actual Tracker

## 7.1 Purpose

Provide department-level payroll budget visibility for each payroll
period.

The feature should answer:

> "Are we spending more or less than the payroll budget for this
> department and period?"

## 7.2 Budget Model

Budgets are maintained at:

``` text
Department + Payroll Period
```

Example:

``` text
IT Department
September 2026
Budget = ₹10,00,000
```

## 7.3 Required Capabilities

Payroll Managers can:

-   Create department payroll budgets
-   View budgets
-   Update budgets
-   Select department
-   Select payroll period
-   Enter budget amount
-   View actual payroll cost
-   View variance
-   View variance percentage
-   Identify budget overruns

## 7.4 Actual Payroll Cost

Actual payroll cost must be calculated from actual payroll records for
the selected department and period.

It must not use static or mock values.

## 7.5 Variance Calculation

``` text
Variance Amount
=
Actual Payroll Cost - Budget
```

``` text
Variance %
=
(Actual Payroll Cost - Budget)
/
Budget
× 100
```

### Example

``` text
IT Department

Budget:       ₹10,00,000
Actual:       ₹11,50,000
Variance:      ₹1,50,000
Variance %:       +15%

⚠ Budget Overrun
```

## 7.6 Budget Alerts

When actual payroll exceeds the configured budget threshold, display a
clear alert.

Example:

``` text
⚠ Payroll Budget Overrun

IT Department
Budget: ₹10L
Actual: ₹11.5L
Overrun: +15%
```

## 7.7 Dashboard Integration

Budget vs Actual should be available from the Payroll Dashboard with:

-   Department
-   Payroll period
-   Budget
-   Actual
-   Variance
-   Variance %
-   Overrun status

It should work with existing dashboard filters such as:

-   Period
-   Department
-   Employee Type

------------------------------------------------------------------------

# 8. Payslip PDF & Bulk Delivery

## 8.1 Payslip PDF

Users must be able to generate a printable PDF for an individual
payslip.

The PDF should contain:

-   Employee information
-   Payroll period
-   Salary Structure
-   Worked days
-   Salary components
-   Gross
-   Deductions
-   Net salary

## 8.2 Bulk Payslip Delivery

The parent Payrun must provide a **Send Payslips** action for bulk
employee delivery.

The workflow should:

1.  Identify payslips belonging to the Payrun.
2.  Prepare the employee payslip documents.
3.  Send them to the relevant employee email addresses.
4.  Surface delivery/validation issues to the authorized user.

------------------------------------------------------------------------

# 9. Payroll Dashboard

The Payroll Dashboard provides live operational and analytical
information.

## 9.1 KPI Cards

Include metrics such as:

-   Total Net Salary Paid
-   Payslips Generated
-   Average Salary
-   Approved Time Off
-   Attendance Health
-   Payroll Risk Score
-   Budget vs Actual

## 9.2 Charts

Include:

-   Salary Cost by Department
-   Monthly Net Salary Trends
-   Budget vs Actual by Department

## 9.3 Filters

Dashboard data must support filtering by:

-   Period
-   Department
-   Employee Type

## 9.4 Payroll Risk Panel

Show:

-   Overall Payrun Risk Score
-   Risk level
-   Critical issues
-   Warning issues
-   Employee-level risk drill-down

## 9.5 Budget Panel

Show:

``` text
Department | Budget | Actual | Variance | Variance %
```

Highlight departments exceeding budget.

## 9.6 Operational Alerts

Surface:

-   Payroll status
-   Missing required information
-   Duplicate payslips
-   Contract attention items
-   Missing attendance
-   Open grievances
-   Budget overruns
-   High-risk payrolls

## 9.7 Attendance Overview

Show relevant live information such as:

-   Present
-   Late
-   Absent
-   Overtime
-   Missing check-outs
-   Manual edits
-   Attendance coverage

## 9.8 Time Off Overview

Show:

-   Approved days
-   Pending requests
-   Leave balances

## 9.9 Department Breakdown

Combine:

-   Headcount
-   Total salary expenditure
-   Budget
-   Actual
-   Variance

## 9.10 Core Dashboard Rule

All dashboard metrics and charts must be calculated from **live
application data** in PostgreSQL.

Static/mock chart values must not be used for the final solution.

------------------------------------------------------------------------

# 10. Navigation & UX

The primary navigation should expose:

``` text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

Payroll can contain:

``` text
Payruns
Payslips
Salary Structures
Salary Rules
Budgets
Grievances
```

Navigation should be intuitive and role-aware.

Users should only see or access modules permitted by their role.

## UX Requirements

-   Clean interface
-   Responsive design
-   Consistent spacing
-   Clear status indicators
-   Intuitive forms
-   Useful validation messages
-   Clear empty states
-   Loading states
-   Error states
-   Confirmation for destructive/important actions
-   Fast navigation between related records
-   Drill-down from warnings/risk items to the underlying record
-   Clear review/resolution states for grievances
-   Clear distinction between Draft, Validated, Paid, and historical
    records

------------------------------------------------------------------------

# 11. Authentication & Authorization

The platform must implement authentication and role-based authorization.

## Requirements

-   Secure login
-   Authenticated sessions/tokens
-   Role-based access control
-   Backend permission checks
-   Frontend route/menu protection
-   Record-level ownership restrictions where required

## Important Rule

Frontend hiding of a button is **not sufficient security**.

Every protected operation must also be authorized by the backend.

Examples:

-   Employee can access only their own payslip/grievance
-   HR Manager cannot finalize payroll
-   Payroll User cannot modify payroll configuration
-   Payroll Manager can resolve grievances and finalize payroll
-   Admin has complete access

------------------------------------------------------------------------

# 12. Input Validation

All important inputs must be validated.

Examples:

``` text
Invalid email
→ "Please enter a valid email address."

Invalid date range
→ "End date cannot be before start date."

Missing required field
→ "Department is required."

Invalid salary rule
→ "Percentage must be within the configured range."

Duplicate payroll
→ "A payslip already exists for this employee and period."

Invalid budget
→ "Budget amount must be greater than zero."

Duplicate grievance
→ "An open grievance already exists for this payslip and category."
```

Validation should exist on both:

-   Frontend for immediate feedback
-   Backend for actual enforcement

------------------------------------------------------------------------

# 13. Data Integrity & Business Rules

The system must protect relational and payroll data integrity.

Important rules include:

-   Payroll uses the correct period-specific contract.
-   Salary Structures determine the Salary Rules applied to a Payrun.
-   Salary Rules execute in sequence.
-   Approved leave consumes allocations.
-   Worked hours derive from attendance.
-   Weekly schedule hours are calculated from schedule entries.
-   Duplicate payslips for the same employee and payroll period are
    prevented or flagged.
-   Incomplete employee/payroll data is surfaced before finalization.
-   Missing bank details are surfaced before finalization where
    required.
-   Expiring contracts are surfaced as payroll risk.
-   Relevant attendance issues are surfaced before finalization.
-   Open blocking grievances are surfaced before finalization.
-   Payslips can be recalculated when approved payroll data changes.
-   Finalized payroll history remains preserved.
-   Budget actuals come from actual payroll records.
-   Budget variance is calculated from stored budget and actual payroll
    data.
-   Risk scores are deterministic and explainable.
-   Employees cannot access another employee's payroll information.
-   Payroll status transitions follow the defined workflow.

------------------------------------------------------------------------

# 14. Core Module Structure

``` text
Authentication & RBAC
        │
        ├── Employees
        │
        ├── Contracts
        │
        ├── Working Schedules
        │
        ├── Attendance
        │
        ├── Time Off
        │
        └── Payroll
              ├── Salary Structures
              ├── Salary Rules
              ├── Payruns
              ├── Payslips
              ├── Payroll Grievances
              ├── Payroll Risk
              └── Payroll Budgets

Reports / Payroll Dashboard
```

------------------------------------------------------------------------

# 15. Primary Business Workflows

## 15.1 Employee to Payslip

``` text
Create/View Employee
        ↓
Assign Contract
        ↓
Assign Working Schedule
        ↓
Record Attendance
        ↓
Configure Salary Structure
        ↓
Configure Salary Rules
        ↓
Create Payrun
        ↓
Select Employee
        ↓
Compute Draft Payslip
        ↓
Run Risk & Validation Checks
        ↓
Employee Reviews Payslip
        ↓
No Issue OR Raise Grievance
        ↓
Resolve / Recalculate if Required
        ↓
Validate Payrun
        ↓
Mark Paid
        ↓
Generate PDF
        ↓
Send Payslip
```

## 15.2 Time Off Allocation to Request

``` text
Create Time Off Type
        ↓
Create Allocation
        ↓
Approve Allocation
        ↓
Employee Creates Request
        ↓
HR Manager Reviews
        ↓
Approve Request
        ↓
Leave Balance Updates
        ↓
Payroll Context Updates
        ↓
Dashboard Reflects Updated Data
```

## 15.3 Payroll Risk Resolution

``` text
Create Payrun
      ↓
Compute Draft Payslips
      ↓
Run Validation Checks
      ↓
Calculate Risk Scores
      ↓
Show Risk Breakdown
      ↓
Resolve Underlying Issues
      ↓
Recalculate if Required
      ↓
Risk Score Updates
      ↓
Ready for Finalization
```

## 15.4 Budget vs Actual

``` text
Create Department Budget
        ↓
Select Payroll Period
        ↓
Process Payroll
        ↓
Calculate Actual Payroll Cost
        ↓
Compare Budget vs Actual
        ↓
Calculate Variance %
        ↓
Show Overrun Alert if Applicable
        ↓
Dashboard / Department Analysis
```

## 15.5 Payslip Grievance

``` text
Draft Payslip
      ↓
Employee Review
      ↓
┌───────────────────┐
│ No Issue          │ → Ready for Finalization
└───────────────────┘

┌───────────────────┐
│ Raise Grievance   │
└────────┬──────────┘
         ↓
     Open Grievance
         ↓
    Payroll Review
         ↓
 Resolve / Reject
         ↓
 Recalculate if Needed
         ↓
Employee Sees Resolution
         ↓
Ready for Finalization
```

------------------------------------------------------------------------

# 16. Definition of a Successful MVP

The MVP is successful when a judge can perform complete real workflows
using PostgreSQL-backed data.

## Scenario A --- Employee to Payslip

``` text
Create/View Employee
        ↓
Assign Contract
        ↓
Assign Working Schedule
        ↓
Record Attendance
        ↓
Configure Salary Structure
        ↓
Configure Salary Rules
        ↓
Create Payrun
        ↓
Select Employee
        ↓
Compute Draft Payslip
        ↓
Show Salary Breakdown
        ↓
Show Risk / Validation Warnings
        ↓
Employee Reviews Payslip
        ↓
Raise and Resolve Grievance OR Confirm Review
        ↓
Recalculate if Required
        ↓
Validate
        ↓
Mark Paid
        ↓
Generate PDF
```

## Scenario B --- Leave Allocation to Request

``` text
Create Time Off Type
        ↓
Create Allocation
        ↓
Approve Allocation
        ↓
Employee Creates Request
        ↓
HR Manager Reviews
        ↓
Approve Request
        ↓
Allocation Balance Updates
        ↓
Dashboard Reflects Updated Data
```

## Scenario C --- Budget Monitoring

``` text
Create Department Budget
        ↓
Run Payroll
        ↓
Actual Payroll Cost Calculated
        ↓
Compare Against Budget
        ↓
Variance Calculated
        ↓
Overrun Alert
        ↓
Dashboard Shows Department Impact
```

## Scenario D --- Payroll Risk

``` text
Create Payrun
        ↓
Run Validation
        ↓
Risk Score Generated
        ↓
Manager Opens Risk Breakdown
        ↓
Fix Payroll Issues
        ↓
Risk Score Recalculated
        ↓
Payroll Ready for Finalization
```

------------------------------------------------------------------------

# 17. Out of Scope

To keep the solution focused on the PS and feasible for the hackathon,
the following are not core requirements:

-   Full accounting system
-   Recruitment/ATS
-   Performance management
-   CRM
-   Inventory management
-   Complex benefits administration
-   Complex tax compliance for a specific country
-   Biometric hardware integrations
-   Complex financial forecasting
-   Multi-year financial planning
-   Generic AI chatbot added only for novelty
-   Blockchain
-   Static/mock dashboards
-   Unnecessary third-party APIs
-   Automatic deadline-based grievance finalization
-   Complex escalation/scheduler infrastructure
-   Unrelated ERP features

The priority is **correctness, integration, database design, business
logic, security, usability, performance, and a complete working
HR-to-payroll workflow**.

------------------------------------------------------------------------

# 18. Product Success Criteria

The final system should demonstrate:

-   Strong PostgreSQL relational database design
-   Modular PERN architecture
-   Real/live data
-   Correct payroll calculations
-   Functional Salary Rules
-   Period-based contract selection
-   Working leave allocation logic
-   Attendance calculations
-   Role-based access control
-   Robust input validation
-   Payroll warnings and validation
-   Explainable Payroll Risk Scores
-   Employee-level and Payrun-level risk visibility
-   Pre-payroll payslip review
-   Functional Payroll Grievance workflow
-   Payslip recalculation after approved correction
-   Department-period Budget vs Actual tracking
-   Budget variance calculations and alerts
-   Payslip PDF generation
-   Bulk payslip delivery
-   Live dashboard aggregation
-   Historical payroll records
-   Clean responsive UI
-   Complete end-to-end workflows

The product should feel like a **real HR and Payroll operations
system**, not a collection of disconnected CRUD pages.

------------------------------------------------------------------------

# 19. Hackathon Implementation Principle

The solution should favor **depth over breadth**.

A feature is considered complete only when:

``` text
UI
 ↓
API
 ↓
Business Logic
 ↓
PostgreSQL
 ↓
Validation
 ↓
Role Authorization
 ↓
Live Result
```

The team should prioritize a smaller number of fully connected workflows
over a large number of partially implemented screens.

The three differentiating extensions --- **Payroll Risk Score, Budget vs
Actual, and Pre-Payroll Payslip Review & Grievance** --- should
strengthen the existing PeoplePay360 workflow rather than become
separate products.
