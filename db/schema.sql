-- ==============================================================================
-- PeoplePay360: HR & Payroll Engine
-- Schema DDL Definitions (PostgreSQL 15+)
-- File: schema.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean-up existing tables and enums in reverse dependency order
DROP TABLE IF EXISTS payslip_lines CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS payruns CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_allocations CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS salary_rules CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS schedule_lines CASCADE;
DROP TABLE IF EXISTS working_schedules CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS computation_type CASCADE;
DROP TYPE IF EXISTS rule_category CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS payrun_status CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 1. ENUMERATIONS
CREATE TYPE user_role AS ENUM (
    'EMPLOYEE', 
    'HR_MANAGER', 
    'HR_PAYROLL_USER', 
    'HR_PAYROLL_MANAGER', 
    'ADMIN'
);

CREATE TYPE contract_status AS ENUM (
    'DRAFT', 
    'RUNNING', 
    'EXPIRED', 
    'CANCELLED'
);

CREATE TYPE payrun_status AS ENUM (
    'DRAFT', 
    'COMPUTED', 
    'VALIDATED', 
    'PAID'
);

CREATE TYPE leave_status AS ENUM (
    'DRAFT', 
    'SUBMITTED', 
    'APPROVED', 
    'REFUSED'
);

CREATE TYPE rule_category AS ENUM (
    'BASIC', 
    'ALLOWANCE', 
    'GROSS', 
    'DEDUCTION', 
    'NET'
);

CREATE TYPE computation_type AS ENUM (
    'FIXED', 
    'PERCENTAGE', 
    'FORMULA'
);

-- 2. HELPER FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CORE IDENTITY & AUTHENTICATION
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. WORKING SCHEDULES
CREATE TABLE working_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    weekly_hours DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_working_schedules_updated_at
BEFORE UPDATE ON working_schedules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE schedule_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES working_schedules(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_hours DECIMAL(4,2) DEFAULT 1.00,
    CONSTRAINT chk_times CHECK (end_time > start_time)
);

-- 5. EMPLOYEE MASTER
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    job_position VARCHAR(100) NOT NULL,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES working_schedules(id) ON DELETE SET NULL,
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. SALARY STRUCTURES & RULES
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_salary_structures_updated_at
BEFORE UPDATE ON salary_structures
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE salary_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category rule_category NOT NULL,
    sequence INT NOT NULL,
    type computation_type NOT NULL,
    fixed_amount DECIMAL(12,2) DEFAULT 0.00,
    percentage_rate DECIMAL(5,2) DEFAULT 0.00,
    base_code VARCHAR(50),
    formula TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_structure_rule_code UNIQUE(structure_id, code)
);

CREATE TRIGGER trg_salary_rules_updated_at
BEFORE UPDATE ON salary_rules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. CONTRACTS
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE RESTRICT,
    wage DECIMAL(12,2) NOT NULL CHECK (wage >= 0.00),
    start_date DATE NOT NULL,
    end_date DATE,
    status contract_status DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TRIGGER trg_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8. ATTENDANCE
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    worked_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    is_manual_edit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_attendance_times CHECK (check_out IS NULL OR check_out >= check_in)
);

-- 9. LEAVES & ALLOCATIONS
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_unpaid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    allocated_days DECIMAL(5,2) NOT NULL CHECK (allocated_days >= 0.00),
    taken_days DECIMAL(5,2) DEFAULT 0.00 CHECK (taken_days >= 0.00),
    status leave_status DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_leave_type UNIQUE (employee_id, leave_type_id)
);

CREATE TRIGGER trg_leave_allocations_updated_at
BEFORE UPDATE ON leave_allocations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days DECIMAL(5,2) NOT NULL CHECK (duration_days > 0.00),
    reason TEXT,
    approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    status leave_status DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE TRIGGER trg_leave_requests_updated_at
BEFORE UPDATE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 10. PAYRUNS & PAYSLIPS
CREATE TABLE payruns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    structure_id UUID REFERENCES salary_structures(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status payrun_status DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payrun_period CHECK (period_end >= period_start)
);

CREATE TRIGGER trg_payruns_updated_at
BEFORE UPDATE ON payruns
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payrun_id UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE RESTRICT,
    worked_days DECIMAL(4,2) NOT NULL,
    unpaid_leave_days DECIMAL(4,2) DEFAULT 0.00,
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    basic DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    gross DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status payrun_status DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payrun_employee UNIQUE(payrun_id, employee_id)
);

CREATE TRIGGER trg_payslips_updated_at
BEFORE UPDATE ON payslips
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payslip_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    category rule_category NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_schedule_lines_schedule_day ON schedule_lines(schedule_id, day_of_week);
CREATE INDEX idx_salary_rules_structure_seq ON salary_rules(structure_id, sequence ASC);
CREATE INDEX idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX idx_contracts_structure_id ON contracts(structure_id);
CREATE INDEX idx_contracts_status_dates ON contracts(status, start_date, end_date);
CREATE INDEX idx_attendances_employee_checkin ON attendances(employee_id, check_in);
CREATE INDEX idx_attendances_checkin_checkout ON attendances(check_in, check_out);
CREATE INDEX idx_leave_allocations_emp_type ON leave_allocations(employee_id, leave_type_id);
CREATE INDEX idx_leave_requests_employee_dates ON leave_requests(employee_id, start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_payruns_period ON payruns(period_start, period_end);
CREATE INDEX idx_payruns_status ON payruns(status);
CREATE INDEX idx_payslips_payrun_id ON payslips(payrun_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX idx_payslips_status ON payslips(status);
CREATE INDEX idx_payslip_lines_payslip_id ON payslip_lines(payslip_id);
CREATE INDEX idx_payslip_lines_rule_code ON payslip_lines(rule_code);
