# DESIGN.md — PeoplePay360 UI/UX Design Specification

## 1. Purpose

This document defines the UI/UX direction for PeoplePay360.

The interface must present PeoplePay360 as a focused, production-quality HR and Payroll operations product. The design should make the complete HR-to-payroll workflow easy to understand and operate without adding visual complexity or functionality that is not supported by the PRD.

The product should feel like one connected system, not a collection of unrelated CRUD pages.

---

## 2. Design Principles

### 2.1 Simple

Prefer the clearest possible interface for each task.

- Show only information relevant to the current task.
- Avoid unnecessary decorative elements.
- Avoid excessive controls, badges, icons, or visual noise.
- Do not introduce features that are not required by the PRD.
- Keep important actions obvious.

### 2.2 Clean

The interface should have strong visual hierarchy and predictable structure.

- Clear page titles.
- Clear section headings.
- Consistent spacing.
- Consistent typography.
- Consistent alignment.
- Clear separation between primary information and supporting information.
- Avoid crowded screens.

### 2.3 Professional

The product should look appropriate for real HR and payroll operations.

- Prioritize readability and accuracy.
- Use restrained visual treatment.
- Use precise labels and business terminology.
- Make financial and payroll information easy to scan.
- Keep actions predictable and deliberate.

### 2.4 Workflow-first

The UI should guide users through the actual business workflow.

PeoplePay360's primary experience is:

Employee
→ Contract + Working Schedule
→ Attendance + Time Off
→ Salary Structure + Salary Rules
→ Payrun
→ Employee Selection
→ Draft Payslip
→ Risk Check
→ Employee Review
→ Grievance / Confirmation
→ Resolution / Recalculation
→ Final Validation
→ Mark Paid
→ Payslip
→ Budget / Dashboard / History

The interface should make this progression understandable without requiring users to understand the underlying technical architecture.

### 2.5 Data-first

The UI must represent real application data.

- Do not design screens around static or mock dashboard values.
- Empty states should be intentional.
- Loading states should be explicit.
- Errors should explain what happened and what the user can do next.
- Data relationships should be easy to navigate.

### 2.6 Role-aware

Navigation and actions must reflect the five defined roles:

- Employee
- HR Manager
- HR Payroll User
- HR Payroll Manager
- Admin

Users should see only the modules and actions relevant to their permissions.

Frontend visibility is not a security mechanism; backend authorization remains authoritative.

---

## 3. Overall Application Structure

Use a consistent application shell across authenticated screens.

### Primary Navigation

The primary navigation should expose:

- Employees
- Contracts
- Attendance
- Time Off
- Payroll
- Reports

Payroll contains:

- Payruns
- Payslips
- Salary Structures
- Salary Rules
- Budgets
- Grievances

The navigation should be role-aware.

Employees should not see HR administration or payroll administration controls.

HR Managers should not see restricted payroll finalization actions.

HR Payroll Users can operate payroll within their permitted scope.

HR Payroll Managers receive full HR/payroll operational controls.

Admins receive system-level controls.

---

## 4. Page Layout

Every major page should follow a predictable structure:

1. Page title
2. Short contextual description when useful
3. Primary action
4. Relevant filters/search
5. Main content
6. Contextual secondary actions

Do not force every page to contain every element.

### Page Headers

Page headers should communicate:

- Where the user is.
- What the page is for.
- What the main action is.

Examples:

- Employees — Manage employee records
- Attendance — Monitor daily attendance and exceptions
- Payruns — Process payroll periods
- Salary Structures — Configure payroll calculation structures
- Grievances — Review payroll issues raised against draft payslips

---

## 5. Navigation Behaviour

Navigation should minimize unnecessary page changes.

Related information should be reachable directly from the current record.

For an Employee, provide direct access to related:

- Contracts
- Attendance
- Time Off
- Allocations
- Payslips
- Payroll Grievances

The Employee record is the operational hub for employee-related information.

Warnings and risk items must also support direct navigation to the underlying record.

Examples:

- Missing Bank Details → Employee
- Expiring Contract → Contract
- Missing Attendance → Attendance
- Duplicate Payslip → Payslip
- Open Grievance → Grievance

---

## 6. List Views

List views should prioritize fast scanning and operational actions.

Use:

- Search
- Relevant filters
- Sorting where useful
- Clear status values
- Row-level actions only when necessary
- Pagination when required by data volume

Avoid putting every possible field into the list.

### Employee List

Prioritize:

- Employee
- Employee Code
- Department
- Job Position
- Manager
- Employment Status
- Relevant payroll/HR status

The employee list must support both List and Kanban views because both are part of the product requirements.

### Attendance List

Prioritize:

- Employee
- Date
- Check-in
- Check-out
- Worked Hours
- Overtime
- Attendance Status

Operational exceptions should be easy to identify.

### Contract List

Prioritize:

- Employee
- Contract period
- Wage
- Salary Structure
- Status

Contracts approaching expiry should be discoverable through payroll risk information.

### Time Off List

Prioritize:

- Employee
- Time Off Type
- Date range
- Duration
- Status

Approval actions should be available only to authorized users.

### Payrun List

Prioritize:

- Run name
- Payroll period
- Salary Structure
- Employee count
- Payslip count
- Status
- Payroll total
- Risk state

The status must clearly distinguish:

- Draft
- Computed
- Validated
- Paid

Historical paid records must remain accessible.

---

## 7. Record / Form Views

Forms should be task-oriented rather than visually dense.

Group fields according to their business meaning.

### Employee Form

Organize information around:

- Identity
- Job / Role
- Department
- Manager
- Working Schedule
- Employment Status
- Payroll-relevant information

Related record navigation should be immediately accessible.

### Contract Form

Show:

- Employee
- Start Date
- End Date
- Wage
- Salary Structure
- Status

The UI should make the contract period explicit because payroll uses the contract applicable to the selected payroll period.

### Working Schedule Form

Show the day-by-day schedule:

- Day
- Start Time
- End Time
- Break Duration

Weekly hours should be calculated from the configured working pattern rather than manually entered.

### Salary Rule Form

Show:

- Name
- Code
- Category
- Sequence
- Calculation Type
- Configuration / Value
- Active Status

Calculation types:

- Fixed
- Percentage
- Formula

The execution sequence must be visually understandable because later rules can depend on earlier results.

---

## 8. Dashboard Design

The Payroll Dashboard should be operational first and analytical second.

It should help a Payroll Manager answer:

- What is happening with payroll?
- What requires attention?
- Is payroll safe to finalize?
- What is the current cost?
- Are departments within budget?

Dashboard information must come from live PostgreSQL-backed application data.

### Dashboard Sections

Use a clear hierarchy for:

1. Payroll summary
2. Payroll risk
3. Operational alerts
4. Budget vs Actual
5. Attendance overview
6. Time Off overview
7. Department breakdown
8. Trends / analytical views

Required metrics include:

- Total Net Salary Paid
- Payslips Generated
- Average Salary
- Approved Time Off
- Attendance Health
- Payroll Risk Score
- Budget vs Actual

Required analytical views include:

- Salary Cost by Department
- Monthly Net Salary Trends
- Budget vs Actual by Department

Dashboard filters:

- Period
- Department
- Employee Type

Do not use decorative charts when they do not provide operational value.

---

## 9. Payroll Risk Experience

Payroll Risk is one of the product's differentiating features and should receive strong visual hierarchy without becoming visually overwhelming.

The user must immediately understand:

- Overall risk score
- Risk level
- Critical issues
- Warnings
- Employees contributing to risk

Risk levels:

- 0–24: Low Risk
- 25–49: Medium Risk
- 50–74: High Risk
- 75–100: Critical Risk

The exact thresholds may be finalized during implementation.

### Explainability

Never show only a score.

Show the reasons behind the score.

Example structure:

Payroll Risk: 78 / 100

Critical Issues
- Missing bank account
- Duplicate payslip

Warnings
- Expiring contracts
- Missing attendance
- Open grievances

Each issue should provide a direct route to the underlying record.

---

## 10. Payrun Experience

Payrun creation must be presented as a two-step workflow.

### Step 1 — Define Payroll Scope

User selects:

- Salary Structure
- Payroll Period

The UI should clearly communicate that the Payrun has not yet been created.

### Step 2 — Select Employees

Show:

- Eligible employees
- Relevant contract context
- Selection state
- Eligibility problems where applicable

The user explicitly selects employees before the Payrun is created.

### Payrun Processing

The Payrun detail experience should make the processing sequence clear:

Compute Draft Payslips
→ Risk Check
→ Employee Review
→ Resolve Grievances
→ Validate
→ Mark Paid
→ Send Payslips

The current Payrun status should always be visible.

Actions must be constrained by role and current Payrun state.

---

## 11. Draft Payslip Review

The draft payslip is an important employee-facing workflow.

Employees should be able to understand how their salary was calculated before finalization.

Show:

- Employee
- Payroll Period
- Salary Structure
- Worked Days
- Attendance Context
- Leave Deductions
- Overtime
- Allowances
- Basic Salary
- Gross Salary
- Deductions
- Net Salary

The employee should have two clear outcomes:

- Confirm Review / No Issue
- Raise Grievance

Do not expose another employee's payroll information.

---

## 12. Payroll Grievance Experience

A grievance must clearly communicate its lifecycle:

Open
→ Under Review
→ Resolved / Rejected

The grievance view should show:

- Grievance ID
- Employee
- Payslip
- Payroll Period
- Category
- Description
- Status
- Created Date
- Resolution Details
- Resolved By
- Resolved Date

Suggested categories:

- Basic Salary
- Attendance
- Leave Deduction
- Overtime
- Allowance
- Deduction
- Other

For HR/Payroll users, the interface should make the investigation path obvious:

Grievance
→ Related Payslip
→ Related HR Data
→ Resolution
→ Recalculation if required

An unresolved blocking grievance must remain visible before finalization.

---

## 13. Payslip Calculation Presentation

The payslip UI should explain the result without exposing unnecessary implementation details.

Present salary components in a logical sequence:

Basic
→ Allowances
→ Gross
→ Deductions
→ Net Salary

Where useful, provide the underlying payroll context:

- Contract
- Worked Days
- Attendance
- Unpaid Leave
- Overtime
- Salary Structure
- Applied Salary Rules

The calculated result must remain traceable.

---

## 14. Budget vs Actual

Budget monitoring should make comparison immediately understandable.

For each department and payroll period show:

- Department
- Budget
- Actual
- Variance
- Variance %
- Overrun Status

Variance:

Actual Payroll Cost − Budget

Variance %:

(Actual Payroll Cost − Budget) / Budget × 100

Budget information should connect naturally to Payroll Dashboard and department analysis.

When actual payroll exceeds the configured budget threshold, surface a clear operational alert.

---

## 15. Status System

Statuses must be consistent throughout the product.

### Payroll

- Draft
- Computed
- Validated
- Paid

### Contracts

- Draft
- Running
- Expired
- Cancelled

### Time Off

- Draft
- Submitted
- Approved
- Refused

### Grievances

- Open
- Under Review
- Resolved
- Rejected

Do not rely on color alone to communicate status.

Status labels should remain understandable without visual styling.

---

## 16. Forms and Validation

Forms should provide immediate and understandable feedback.

Validation messages should describe the problem and, where possible, how to fix it.

Examples:

- Invalid email → "Please enter a valid email address."
- Invalid date range → "End date cannot be before start date."
- Missing required field → "Department is required."
- Invalid salary rule → "Percentage must be within the configured range."
- Duplicate payroll → "A payslip already exists for this employee and period."
- Invalid budget → "Budget amount must be greater than zero."
- Duplicate grievance → "An open grievance already exists for this payslip and category."

Important validation must exist in both frontend and backend.

---

## 17. Loading, Empty, and Error States

Every data-driven screen must account for three states.

### Loading

Use a restrained loading treatment that preserves the page structure and prevents confusing layout jumps.

### Empty

Empty states should explain:

- What is missing.
- Why the screen is empty when useful.
- The relevant next action.

Do not fill empty states with fabricated data.

### Error

Errors should:

- Clearly state the failure.
- Preserve useful context where possible.
- Provide a recovery action when available.
- Avoid technical implementation details unless useful to an authorized technical user.

---

## 18. Important Actions

Important or destructive actions require deliberate confirmation.

Examples:

- Delete employee
- Delete contract
- Delete configuration
- Validate Payrun
- Mark Payrun as Paid
- Reject grievance
- Resolve grievance
- Send Payslips

The interface must make the consequence clear before confirmation.

Final payroll actions should never feel accidental.

---

## 19. Responsive Design

The interface must remain usable across desktop, tablet, and smaller screens.

Priority:

1. Desktop productivity
2. Tablet usability
3. Mobile readability

On smaller screens:

- Preserve primary actions.
- Avoid horizontal overflow where possible.
- Allow dense tables to adapt without hiding critical information.
- Keep forms readable.
- Preserve status and workflow context.

---

## 20. Accessibility and Clarity

The design should not depend exclusively on visual differences.

- Status must have text labels.
- Icons should support meaning rather than replace labels for important actions.
- Form labels must be explicit.
- Interactive controls must have clear states.
- Text must remain readable.
- Focus states must remain visible.
- Important warnings must be understandable without relying on color alone.

---

## 21. Visual Consistency

Establish one reusable design language across the application.

Maintain consistency in:

- Typography hierarchy
- Spacing
- Field sizing
- Button hierarchy
- Table density
- Form structure
- Status treatment
- Icon usage
- Navigation behaviour
- Modal/dialog behaviour
- Empty states
- Loading states
- Error states

Do not create a different visual language for each module.

---

## 22. Information Hierarchy

Use hierarchy deliberately.

### Highest priority

- Current workflow state
- Primary action
- Critical payroll issues
- Net salary / payroll totals
- Validation blockers

### Medium priority

- Supporting payroll context
- Employee information
- Attendance and leave context
- Budget variance
- Operational warnings

### Lower priority

- Secondary metadata
- Historical details
- Technical identifiers

Do not give every piece of information equal visual weight.

---

## 23. Avoid Visual Noise

Do not add UI elements simply to make a screen look populated.

Avoid:

- Unnecessary decorative sections
- Excessive badges
- Excessive icons
- Repeated information
- Large decorative illustrations
- Unnecessary animations
- Unrelated quick actions
- Fake activity feeds
- Fake analytics
- Placeholder business data presented as real
- Generic AI features unrelated to payroll operations

The product should feel calm, precise, and operational.

---

## 24. Do Not Expand Product Scope

The UI must remain inside the PeoplePay360 product boundary.

Do not introduce screens or navigation for:

- Full accounting
- Recruitment / ATS
- CRM
- Inventory
- Complex financial forecasting
- Generic AI chatbot
- Blockchain
- Unnecessary third-party integrations
- Unrelated ERP functionality

The additional features must strengthen the existing HR-to-payroll workflow rather than become separate products.

---

## 25. Demo-First UX

The interface should support the complete hackathon demonstration flow:

Employee
→ Attendance
→ Leave Request
→ Contract
→ Salary Structure
→ Payrun
→ Draft Payslip
→ Payroll Risk Check
→ Employee Review
→ Payroll Grievance
→ HR Resolution
→ Recalculation
→ Final Approval
→ Mark Paid
→ Payslip PDF
→ Budget Dashboard
→ Executive Dashboard

A judge should be able to understand where they are, what has happened, what requires attention, and what the next action is at every stage.

---

## 26. Definition of Done for UI

A screen is not considered complete merely because it exists.

A feature should provide a connected experience:

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

The UI must accurately represent the real state returned by the system.

No screen should imply functionality that the backend does not actually support.

---

## 27. Final Design Rule

PeoplePay360 should look like a mature HR and Payroll operations product:

- Simple
- Clean
- Professional
- Consistent
- Responsive
- Data-driven
- Role-aware
- Workflow-focused
- Explainable
- Operational

When deciding between a visually impressive interface and a clearer interface, choose clarity.

When deciding between adding another feature and improving an existing workflow, improve the existing workflow.

When a UI element is not necessary to complete or understand the workflow, do not add it.
