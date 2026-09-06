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
    v_emp_liam_id UUID;
    v_emp_marcus_id UUID;
    v_emp_sarah_id UUID;
    v_emp_elena_id UUID;
    v_emp_kavita_id UUID;
    v_contract1_id UUID;
    v_contract2_id UUID;
    v_contract_liam UUID;
    v_contract_marcus UUID;
    v_contract_sarah UUID;
    v_contract_elena UUID;
    v_contract_kavita UUID;
    v_leave_annual_id UUID;
    v_leave_sick_id UUID;
    v_leave_unpaid_id UUID;
    v_payrun_id UUID;
    v_slip_liam UUID;
    v_slip_marcus UUID;
    v_slip_sarah UUID;
    v_slip_elena UUID;
    v_slip_kavita UUID;
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
    VALUES (gen_random_uuid(), 'admin@peoplepay360.com', '$2a$10$T25NXJLx2QyizzVPeP58geFW0lskwuhur7JjhzuBabVMnFGuz/0Im', 'ADMIN')
    RETURNING id INTO v_user_admin_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'payroll.manager@peoplepay360.com', '$2a$10$T25NXJLx2QyizzVPeP58geFW0lskwuhur7JjhzuBabVMnFGuz/0Im', 'HR_PAYROLL_MANAGER')
    RETURNING id INTO v_user_payroll_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'hr.manager@peoplepay360.com', '$2a$10$T25NXJLx2QyizzVPeP58geFW0lskwuhur7JjhzuBabVMnFGuz/0Im', 'HR_MANAGER')
    RETURNING id INTO v_user_hr_mgr_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'sarah.connor@peoplepay360.com', '$2a$10$T25NXJLx2QyizzVPeP58geFW0lskwuhur7JjhzuBabVMnFGuz/0Im', 'EMPLOYEE')
    RETURNING id INTO v_user_emp1_id;

    INSERT INTO users (id, email, password_hash, role)
    VALUES (gen_random_uuid(), 'alex.chen@peoplepay360.com', '$2a$10$T25NXJLx2QyizzVPeP58geFW0lskwuhur7JjhzuBabVMnFGuz/0Im', 'EMPLOYEE')
    RETURNING id INTO v_user_emp2_id;

    -- 6. Employee Profiles
    INSERT INTO employees (id, user_id, employee_code, first_name, last_name, department, job_position, schedule_id, bank_account_no, bank_ifsc, is_active)
    VALUES (gen_random_uuid(), v_user_emp1_id, 'EMP-1001', 'Sarah', 'Connor', 'Engineering', 'VP of Engineering', v_schedule_id, '112233445566', 'HDFC0001234', TRUE)
    RETURNING id INTO v_emp1_id;

    INSERT INTO employees (id, user_id, employee_code, first_name, last_name, department, job_position, manager_id, schedule_id, bank_account_no, bank_ifsc, is_active)
    VALUES (gen_random_uuid(), v_user_emp2_id, 'EMP-1002', 'Alex', 'Chen', 'Engineering', 'Senior Fullstack Developer', v_emp1_id, v_schedule_id, '998877665544', 'HDFC0001234', TRUE)
    RETURNING id INTO v_emp2_id;

    -- Roster Reference Employees
    INSERT INTO employees (id, employee_code, first_name, last_name, department, job_position, schedule_id, is_active)
    VALUES (gen_random_uuid(), 'EMP-08492', 'Marcus', 'Vance', 'Engineering', 'Principal Architect', v_schedule_id, TRUE);

    INSERT INTO employees (id, employee_code, first_name, last_name, department, job_position, schedule_id, is_active)
    VALUES (gen_random_uuid(), 'EMP-07311', 'Elena', 'Rostova', 'Engineering', 'Senior Systems Engineer', v_schedule_id, TRUE);

    INSERT INTO employees (id, employee_code, first_name, last_name, department, job_position, schedule_id, is_active)
    VALUES (gen_random_uuid(), 'EMP-04192', 'Devon', 'Kowalski', 'Operations', 'Operations Manager', v_schedule_id, TRUE);

    INSERT INTO employees (id, employee_code, first_name, last_name, department, job_position, schedule_id, is_active)
    VALUES (gen_random_uuid(), 'EMP-06041', 'Amina', 'Al-Mansoor', 'Finance & Risk', 'Risk & Compliance Lead', v_schedule_id, TRUE);

    INSERT INTO employees (id, employee_code, first_name, last_name, department, job_position, schedule_id, is_active)
    VALUES (gen_random_uuid(), 'EMP-09228', 'Sarah', 'Jenkins', 'Human Resources', 'HR Business Partner', v_schedule_id, TRUE);

    -- 7. Active Contracts
    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp1_id, v_structure_id, 120000.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract1_id;

    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp2_id, v_structure_id, 75000.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract2_id;

    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp_liam_id, v_structure_id, 114000.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract_liam;

    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp_marcus_id, v_structure_id, 134400.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract_marcus;

    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp_sarah_id, v_structure_id, 93600.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract_sarah;

    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp_elena_id, v_structure_id, 77400.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract_elena;

    INSERT INTO contracts (id, employee_id, structure_id, wage, start_date, end_date, status)
    VALUES (gen_random_uuid(), v_emp_kavita_id, v_structure_id, 106800.00, '2024-01-01', NULL, 'RUNNING')
    RETURNING id INTO v_contract_kavita;

    -- 8. Leave Allocations
    INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, taken_days, status) VALUES
    (v_emp1_id, v_leave_annual_id, 24.00, 2.00, 'APPROVED'),
    (v_emp1_id, v_leave_sick_id,   12.00, 0.00, 'APPROVED'),
    (v_emp2_id, v_leave_annual_id, 20.00, 1.00, 'APPROVED'),
    (v_emp2_id, v_leave_sick_id,   10.00, 0.00, 'APPROVED');

    INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, taken_days, status)
    SELECT id, v_leave_annual_id, 25.00, 0.00, 'APPROVED' FROM employees WHERE employee_code IN ('EMP-08492', 'EMP-09228', 'EMP-06041');

    INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, taken_days, status)
    SELECT id, v_leave_sick_id, 12.00, 0.00, 'APPROVED' FROM employees WHERE employee_code IN ('EMP-08492', 'EMP-09228', 'EMP-06041');

    -- 9. Attendance Seed Records (Current Operational Roster)
    INSERT INTO attendances (employee_id, check_in, check_out, worked_hours, overtime_hours)
    SELECT id, CURRENT_DATE + TIME '08:58:00', CURRENT_DATE + TIME '17:04:00', 8.10, 0.00
    FROM employees WHERE employee_code = 'EMP-08492';

    INSERT INTO attendances (employee_id, check_in, check_out, worked_hours, overtime_hours)
    SELECT id, CURRENT_DATE + TIME '09:18:00', CURRENT_DATE + TIME '17:15:00', 7.95, 0.00
    FROM employees WHERE employee_code = 'EMP-07311';

    INSERT INTO attendances (employee_id, check_in, check_out, worked_hours, overtime_hours)
    SELECT id, CURRENT_DATE + TIME '07:54:00', NULL, NULL, 0.00
    FROM employees WHERE employee_code = 'EMP-04192';

    INSERT INTO attendances (employee_id, check_in, check_out, worked_hours, overtime_hours)
    SELECT id, CURRENT_DATE + TIME '08:52:00', CURRENT_DATE + TIME '19:12:00', 10.33, 2.20
    FROM employees WHERE employee_code = 'EMP-06041';

    -- 10. Payruns & Payslips Seed (October 2024 Monthly Payrun matching reference image)
    INSERT INTO payruns (id, name, structure_id, period_start, period_end, status)
    VALUES (gen_random_uuid(), 'October 2024 Monthly Payrun', v_structure_id, '2024-10-01', '2024-10-31', 'DRAFT')
    RETURNING id INTO v_payrun_id;

    -- Liam Henderson (Blocked/Flagged for Tax ID)
    INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
    VALUES (gen_random_uuid(), v_payrun_id, v_emp_liam_id, v_contract_liam, 22.00, 0.00, 0.00, 9500.00, 10700.00, 0.00, 0.00, 'DRAFT')
    RETURNING id INTO v_slip_liam;

    INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
    (v_slip_liam, 'BASIC', 'Basic Salary', 'BASIC', 9500.00),
    (v_slip_liam, 'ALLOWANCES', 'Allowances', 'ALLOWANCE', 1200.00),
    (v_slip_liam, 'GROSS', 'Gross Salary', 'GROSS', 10700.00);

    -- Marcus Sterling (OT Review / Anomaly)
    INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
    VALUES (gen_random_uuid(), v_payrun_id, v_emp_marcus_id, v_contract_marcus, 22.00, 0.00, 42.50, 11200.00, 15025.00, 3906.50, 11118.50, 'COMPUTED')
    RETURNING id INTO v_slip_marcus;

    INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
    (v_slip_marcus, 'BASIC', 'Basic Salary', 'BASIC', 11200.00),
    (v_slip_marcus, 'OVERTIME', 'Overtime Earnings', 'ALLOWANCE', 3825.00),
    (v_slip_marcus, 'GROSS', 'Gross Salary', 'GROSS', 15025.00),
    (v_slip_marcus, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 3906.50),
    (v_slip_marcus, 'NET', 'Net Salary', 'NET', 11118.50);

    -- Sarah Jenkins (Computed with Grievance Pending)
    INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
    VALUES (gen_random_uuid(), v_payrun_id, v_emp_sarah_id, v_contract_sarah, 22.00, 0.00, 0.00, 7800.00, 8250.00, 1980.00, 6270.00, 'COMPUTED')
    RETURNING id INTO v_slip_sarah;

    INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
    (v_slip_sarah, 'BASIC', 'Basic Salary', 'BASIC', 7800.00),
    (v_slip_sarah, 'SPECIAL', 'Special Allowance', 'ALLOWANCE', 450.00),
    (v_slip_sarah, 'GROSS', 'Gross Salary', 'GROSS', 8250.00),
    (v_slip_sarah, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 1980.00),
    (v_slip_sarah, 'NET', 'Net Salary', 'NET', 6270.00);

    -- Elena Rostova (Ready)
    INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
    VALUES (gen_random_uuid(), v_payrun_id, v_emp_elena_id, v_contract_elena, 22.00, 0.00, 0.00, 6450.00, 6750.00, 2160.00, 4590.00, 'COMPUTED')
    RETURNING id INTO v_slip_elena;

    INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
    (v_slip_elena, 'BASIC', 'Basic Salary', 'BASIC', 6450.00),
    (v_slip_elena, 'CONV', 'Conveyance Allowance', 'ALLOWANCE', 300.00),
    (v_slip_elena, 'GROSS', 'Gross Salary', 'GROSS', 6750.00),
    (v_slip_elena, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 2160.00),
    (v_slip_elena, 'NET', 'Net Salary', 'NET', 4590.00);

    -- Kavita Sharma (Ready)
    INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
    VALUES (gen_random_uuid(), v_payrun_id, v_emp_kavita_id, v_contract_kavita, 22.00, 0.00, 0.00, 8900.00, 9700.00, 2619.00, 7081.00, 'COMPUTED')
    RETURNING id INTO v_slip_kavita;

    INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
    (v_slip_kavita, 'BASIC', 'Basic Salary', 'BASIC', 8900.00),
    (v_slip_kavita, 'ALLOWANCE', 'Allowances', 'ALLOWANCE', 800.00),
    (v_slip_kavita, 'GROSS', 'Gross Salary', 'GROSS', 9700.00),
    (v_slip_kavita, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 2619.00),
    (v_slip_kavita, 'NET', 'Net Salary', 'NET', 7081.00);

    -- Sarah Connor (EMP-1001) / Marcus Vance (Matching Reference My Payslips October 2024 Statement)
    INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
    VALUES (gen_random_uuid(), v_payrun_id, v_emp1_id, v_contract1_id, 22.00, 0.00, 0.00, 7500.00, 8500.00, 1650.00, 6850.00, 'PAID')
    RETURNING id INTO v_slip_sarah;

    INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
    (v_slip_sarah, 'BASIC', 'Basic Salary (176 worked hours)', 'BASIC', 7500.00),
    (v_slip_sarah, 'REMOTE_STIPEND', 'Remote Work Stipend (Monthly utilities & ergonomics)', 'ALLOWANCE', 250.00),
    (v_slip_sarah, 'PERF_BONUS', 'Performance Bonus (Enterprise platform milestone)', 'ALLOWANCE', 750.00),
    (v_slip_sarah, 'GROSS', 'Gross Earnings', 'GROSS', 8500.00),
    (v_slip_sarah, 'FIT', 'Federal Income Tax (FIT) (IRS Single / 0 Allowances)', 'DEDUCTION', 720.00),
    (v_slip_sarah, 'SIT_CA', 'State Income Tax (CA) (California EDD)', 'DEDUCTION', 310.00),
    (v_slip_sarah, 'OASDI', 'Social Security (OASDI) (Mandatory federal Old-Age)', 'DEDUCTION', 527.00),
    (v_slip_sarah, 'HEALTHCARE', 'Healthcare Pre-Tax (Premium PPO Medical/Dental)', 'DEDUCTION', 93.00),
    (v_slip_sarah, 'TOTAL_DED', 'Total Pre-Tax & Statutory Deductions', 'DEDUCTION', 1650.00),
    (v_slip_sarah, 'NET', 'Net Take-Home Pay', 'NET', 6850.00);

    -- Alex Chen (EMP-1002)
    INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
    VALUES (gen_random_uuid(), v_payrun_id, v_emp2_id, v_contract2_id, 22.00, 0.00, 0.00, 5000.00, 6250.00, 1150.00, 5100.00, 'PAID')
    RETURNING id INTO v_slip_elena;

    INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
    (v_slip_elena, 'BASIC', 'Basic Salary', 'BASIC', 5000.00),
    (v_slip_elena, 'ALLOWANCES', 'Allowances', 'ALLOWANCE', 1250.00),
    (v_slip_elena, 'GROSS', 'Gross Salary', 'GROSS', 6250.00),
    (v_slip_elena, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 1150.00),
    (v_slip_elena, 'NET', 'Net Salary', 'NET', 5100.00);

    -- 11. Historical Payrun Cycles matching Reference Image
    -- September 2024
    DECLARE v_payrun_sep UUID; v_slip_sep UUID;
    BEGIN
        INSERT INTO payruns (id, name, structure_id, period_start, period_end, status)
        VALUES (gen_random_uuid(), 'September 2024 Monthly Payrun', v_structure_id, '2024-09-01', '2024-09-30', 'PAID')
        RETURNING id INTO v_payrun_sep;

        INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
        VALUES (gen_random_uuid(), v_payrun_sep, v_emp1_id, v_contract1_id, 21.00, 0.00, 0.00, 7000.00, 7750.00, 1518.00, 6232.00, 'PAID')
        RETURNING id INTO v_slip_sep;

        INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
        (v_slip_sep, 'BASIC', 'Basic Salary (168 worked hours)', 'BASIC', 7000.00),
        (v_slip_sep, 'REMOTE_STIPEND', 'Remote Work Stipend', 'ALLOWANCE', 250.00),
        (v_slip_sep, 'SPECIAL', 'Special Allowance', 'ALLOWANCE', 500.00),
        (v_slip_sep, 'GROSS', 'Gross Earnings', 'GROSS', 7750.00),
        (v_slip_sep, 'FIT', 'Federal Income Tax (FIT)', 'DEDUCTION', 660.00),
        (v_slip_sep, 'SIT_CA', 'State Income Tax (CA)', 'DEDUCTION', 285.00),
        (v_slip_sep, 'OASDI', 'Social Security (OASDI)', 'DEDUCTION', 480.50),
        (v_slip_sep, 'HEALTHCARE', 'Healthcare Pre-Tax', 'DEDUCTION', 92.50),
        (v_slip_sep, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 1518.00),
        (v_slip_sep, 'NET', 'Net Salary', 'NET', 6232.00);
    END;

    -- August 2024
    DECLARE v_payrun_aug UUID; v_slip_aug UUID;
    BEGIN
        INSERT INTO payruns (id, name, structure_id, period_start, period_end, status)
        VALUES (gen_random_uuid(), 'August 2024 Monthly Payrun', v_structure_id, '2024-08-01', '2024-08-31', 'PAID')
        RETURNING id INTO v_payrun_aug;

        INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
        VALUES (gen_random_uuid(), v_payrun_aug, v_emp1_id, v_contract1_id, 22.00, 0.00, 0.00, 7000.00, 7750.00, 1518.00, 6232.00, 'PAID')
        RETURNING id INTO v_slip_aug;

        INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
        (v_slip_aug, 'BASIC', 'Basic Salary (176 worked hours)', 'BASIC', 7000.00),
        (v_slip_aug, 'REMOTE_STIPEND', 'Remote Work Stipend', 'ALLOWANCE', 250.00),
        (v_slip_aug, 'SPECIAL', 'Special Allowance', 'ALLOWANCE', 500.00),
        (v_slip_aug, 'GROSS', 'Gross Earnings', 'GROSS', 7750.00),
        (v_slip_aug, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 1518.00),
        (v_slip_aug, 'NET', 'Net Salary', 'NET', 6232.00);
    END;

    -- July 2024
    DECLARE v_payrun_jul UUID; v_slip_jul UUID;
    BEGIN
        INSERT INTO payruns (id, name, structure_id, period_start, period_end, status)
        VALUES (gen_random_uuid(), 'July 2024 Monthly Payrun', v_structure_id, '2024-07-01', '2024-07-31', 'PAID')
        RETURNING id INTO v_payrun_jul;

        INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
        VALUES (gen_random_uuid(), v_payrun_jul, v_emp1_id, v_contract1_id, 22.00, 0.00, 0.00, 7000.00, 7750.00, 1518.00, 6232.00, 'PAID')
        RETURNING id INTO v_slip_jul;

        INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
        (v_slip_jul, 'BASIC', 'Basic Salary (176 worked hours)', 'BASIC', 7000.00),
        (v_slip_jul, 'REMOTE_STIPEND', 'Remote Work Stipend', 'ALLOWANCE', 250.00),
        (v_slip_jul, 'SPECIAL', 'Special Allowance', 'ALLOWANCE', 500.00),
        (v_slip_jul, 'GROSS', 'Gross Earnings', 'GROSS', 7750.00),
        (v_slip_jul, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 1518.00),
        (v_slip_jul, 'NET', 'Net Salary', 'NET', 6232.00);
    END;

    -- June 2024
    DECLARE v_payrun_jun UUID; v_slip_jun UUID;
    BEGIN
        INSERT INTO payruns (id, name, structure_id, period_start, period_end, status)
        VALUES (gen_random_uuid(), 'June 2024 Monthly Payrun', v_structure_id, '2024-06-01', '2024-06-30', 'PAID')
        RETURNING id INTO v_payrun_jun;

        INSERT INTO payslips (id, payrun_id, employee_id, contract_id, worked_days, unpaid_leave_days, overtime_hours, basic, gross, deductions, net_salary, status)
        VALUES (gen_random_uuid(), v_payrun_jun, v_emp1_id, v_contract1_id, 20.00, 0.00, 0.00, 7200.00, 8100.00, 1582.00, 6518.00, 'PAID')
        RETURNING id INTO v_slip_jun;

        INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount) VALUES
        (v_slip_jun, 'BASIC', 'Basic Salary (160 worked hours)', 'BASIC', 7200.00),
        (v_slip_jun, 'REMOTE_STIPEND', 'Remote Work Stipend', 'ALLOWANCE', 250.00),
        (v_slip_jun, 'BONUS', 'Mid-Year Bonus', 'ALLOWANCE', 650.00),
        (v_slip_jun, 'GROSS', 'Gross Earnings', 'GROSS', 8100.00),
        (v_slip_jun, 'TOTAL_DED', 'Total Deductions', 'DEDUCTION', 1582.00),
        (v_slip_jun, 'NET', 'Net Salary', 'NET', 6518.00);
    END;

END $$;
