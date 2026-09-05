-- ==============================================================================
-- PeoplePay360: HR & Payroll Engine
-- Production Seed Data (PostgreSQL 15+)
-- File: seed.sql
-- ==============================================================================

DO $$
DECLARE
    v_schedule_id UUID;
    v_structure_id UUID;
    v_user_admin_id UUID;
    v_user_hr_mgr_id UUID;
    v_user_payroll_id UUID;
    v_user_emp1_id UUID;
    v_user_emp2_id UUID;
    v_emp1_id UUID;
    v_emp2_id UUID;
    v_contract1_id UUID;
    v_contract2_id UUID;
    v_leave_annual_id UUID;
    v_leave_sick_id UUID;
    v_leave_unpaid_id UUID;
BEGIN
    -- 1. Standard 40h Working Schedule (Monday to Friday, 9:00 - 18:00, 1h break)
    INSERT INTO working_schedules (id, name, weekly_hours)
    VALUES (gen_random_uuid(), 'Standard 40h Work Schedule', 40.00)
    RETURNING id INTO v_schedule_id;

    INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_hours) VALUES
    (v_schedule_id, 1, '09:00:00', '18:00:00', 1.00), -- Monday
    (v_schedule_id, 2, '09:00:00', '18:00:00', 1.00), -- Tuesday
    (v_schedule_id, 3, '09:00:00', '18:00:00', 1.00), -- Wednesday
    (v_schedule_id, 4, '09:00:00', '18:00:00', 1.00), -- Thursday
    (v_schedule_id, 5, '09:00:00', '18:00:00', 1.00); -- Friday

    -- 2. Standard Salary Structure
    INSERT INTO salary_structures (id, name, code, is_active)
    VALUES (gen_random_uuid(), 'Standard Full-Time Structure', 'STD_MONTHLY', TRUE)
    RETURNING id INTO v_structure_id;

    -- 3. Configured Default Salary Rules (Section 4.B DAG Sequence)
    INSERT INTO salary_rules (structure_id, sequence, code, name, category, type, fixed_amount, percentage_rate, base_code, formula) VALUES
    (v_structure_id, 10,  'BASIC',     'Basic Salary',             'BASIC',     'FORMULA',    0.00,     0.00,  NULL,    '(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)'),
    (v_structure_id, 20,  'HRA',       'House Rent Allowance',     'ALLOWANCE', 'PERCENTAGE', 0.00,    40.00,  'BASIC', NULL),
    (v_structure_id, 30,  'CONV',      'Conveyance Allowance',     'ALLOWANCE', 'FIXED',   3000.00,     0.00,  NULL,    NULL),
    (v_structure_id, 40,  'SPECIAL',   'Special Allowance',        'ALLOWANCE', 'FORMULA',    0.00,     0.00,  NULL,    'CONTRACT_WAGE * 0.10'),
    (v_structure_id, 50,  'OVERTIME',  'Overtime Earnings',        'ALLOWANCE', 'FORMULA',    0.00,     0.00,  NULL,    'OVERTIME_HOURS * (HOURLY_RATE * 1.50)'),
    (v_structure_id, 100, 'GROSS',     'Gross Salary',             'GROSS',     'FORMULA',    0.00,     0.00,  NULL,    'BASIC + HRA + CONV + SPECIAL + OVERTIME'),
    (v_structure_id, 110, 'PF',        'Provident Fund',           'DEDUCTION', 'PERCENTAGE', 0.00,    12.00,  'BASIC', NULL),
    (v_structure_id, 120, 'PT',        'Professional Tax',         'DEDUCTION', 'FORMULA',    0.00,     0.00,  NULL,    'GROSS > 15000 ? 200 : 0'),
    (v_structure_id, 130, 'LOP',       'Loss of Pay',              'DEDUCTION', 'FORMULA',    0.00,     0.00,  NULL,    '(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS'),
    (v_structure_id, 140, 'TOTAL_DED', 'Total Deductions',         'DEDUCTION', 'FORMULA',    0.00,     0.00,  NULL,    'PF + PT + LOP'),
    (v_structure_id, 200, 'NET',       'Net Salary',               'NET',       'FORMULA',    0.00,     0.00,  NULL,    'GROSS - TOTAL_DED');

    -- 4. Leave Types
    INSERT INTO leave_types (id, name, code, is_unpaid)
    VALUES (gen_random_uuid(), 'Paid Annual Leave', 'ANNUAL', FALSE)
    RETURNING id INTO v_leave_annual_id;

    INSERT INTO leave_types (id, name, code, is_unpaid)
    VALUES (gen_random_uuid(), 'Sick Leave', 'SICK', FALSE)
    RETURNING id INTO v_leave_sick_id;

    INSERT INTO leave_types (id, name, code, is_unpaid)
    VALUES (gen_random_uuid(), 'Unpaid Leave / LOP', 'UNPAID', TRUE)
    RETURNING id INTO v_leave_unpaid_id;

    -- 5. System Users (Default password: Password@123)
    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'admin@peoplepay360.com', '$2a$10$YsTujJgCiBfkOcjWW5MTseGiHcS9aALU2MW4PR.3IYS9L5fACjvt.', 'ADMIN')
    RETURNING id INTO v_user_admin_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'payroll.manager@peoplepay360.com', '$2a$10$YsTujJgCiBfkOcjWW5MTseGiHcS9aALU2MW4PR.3IYS9L5fACjvt.', 'HR_PAYROLL_MANAGER')
    RETURNING id INTO v_user_payroll_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'hr.manager@peoplepay360.com', '$2a$10$YsTujJgCiBfkOcjWW5MTseGiHcS9aALU2MW4PR.3IYS9L5fACjvt.', 'HR_MANAGER')
    RETURNING id INTO v_user_hr_mgr_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'sarah.connor@peoplepay360.com', '$2a$10$YsTujJgCiBfkOcjWW5MTseGiHcS9aALU2MW4PR.3IYS9L5fACjvt.', 'EMPLOYEE')
    RETURNING id INTO v_user_emp1_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'alex.chen@peoplepay360.com', '$2a$10$YsTujJgCiBfkOcjWW5MTseGiHcS9aALU2MW4PR.3IYS9L5fACjvt.', 'EMPLOYEE')
    RETURNING id INTO v_user_emp2_id;

    -- 6. Employee Profiles
    INSERT INTO employees (id, user_id, employee_code, first_name, last_name, department, job_position, schedule_id, bank_account_no, bank_ifsc, is_active)
    VALUES (gen_random_uuid(), v_user_emp1_id, 'EMP-1001', 'Sarah', 'Connor', 'Engineering', 'VP of Engineering', v_schedule_id, '112233445566', 'HDFC0001234', TRUE)
    RETURNING id INTO v_emp1_id;

    INSERT INTO employees (id, user_id, employee_code, first_name, last_name, department, job_position, manager_id, schedule_id, bank_account_no, bank_ifsc, is_active)
    VALUES (gen_random_uuid(), v_user_emp2_id, 'EMP-1002', 'Alex', 'Chen', 'Engineering', 'Senior Fullstack Developer', v_emp1_id, v_schedule_id, '998877665544', 'HDFC0001234', TRUE)
    RETURNING id INTO v_emp2_id;

    -- 7. Active Contracts
    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp1_id, v_structure_id, 120000.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract1_id;

    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp2_id, v_structure_id, 75000.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract2_id;

    -- 8. Leave Allocations
    INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, taken_days, status) VALUES
    (v_emp1_id, v_leave_annual_id, 24.00, 2.00, 'APPROVED'),
    (v_emp1_id, v_leave_sick_id,   12.00, 0.00, 'APPROVED'),
    (v_emp2_id, v_leave_annual_id, 20.00, 1.00, 'APPROVED'),
    (v_emp2_id, v_leave_sick_id,   10.00, 0.00, 'APPROVED');

END $$;
