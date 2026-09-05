/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY CALCULATION ENGINE
 * ==============================================================================
 * 
 * WHAT THIS FILE DOES IN SIMPLE WORDS:
 * This is the financial math calculator of PeoplePay360.
 * 
 * When a payroll is run (or simulated), this engine:
 * 1. Takes the employee's agreed wage from their Contract (e.g. ₹1,20,000 / month).
 * 2. Takes their Attendance (e.g. worked 22 days out of 22 scheduled, 4 hours overtime, 0 unpaid leave).
 * 3. Derives their hourly pay rate.
 * 4. Runs every salary rule sequentially (Basic -> Allowances -> Gross -> Deductions -> Net).
 * 5. Uses the safe mathematical expression evaluator (`expr-eval`) to compute dynamic formulas.
 * 6. Rounds all intermediate numbers cleanly to 2 decimal places (cents / paise).
 * 7. Returns the final itemized payslip breakdown (Basic, Gross, Total Deductions, Net Pay).
 */

import { Parser } from 'expr-eval';

/**
 * Main Function: computeEmployeePayslip
 * 
 * Calculates the complete payslip for an individual employee.
 * 
 * @param {Object} params
 * @param {Object} params.employee - Employee profile (id, name, department)
 * @param {Object} params.contract - Active contract (wage, start/end date)
 * @param {Object} [params.schedule] - Working schedule (weekly_hours, e.g. 40h)
 * @param {Object} [params.attendance] - Attendance summary (workedDays, unpaidDays, overtimeHours)
 * @param {Array} params.rules - Array of salary rules for this structure
 * @returns {Object} Complete payslip computation with line breakdown and aggregates
 */
export function computeEmployeePayslip({ employee, contract, schedule = {}, attendance = {}, rules = [] }) {
  // Parser from expr-eval safely executes algebraic formulas without risky javascript `eval()`
  const parser = new Parser();

  // --------------------------------------------------------------------------
  // STEP 1: GATHER CONTEXT VARIABLES
  // --------------------------------------------------------------------------
  // Standard monthly schedule days (defaults to 22 standard working days in a month)
  const scheduleDays = parseFloat(attendance.scheduledDays ?? attendance.scheduleDays ?? 22);
  // Actual days worked
  const workedDays = parseFloat(attendance.workedDays ?? 22);
  // Unpaid leave days taken (Loss of Pay)
  const unpaidDays = parseFloat(attendance.unpaidLeaveDays ?? attendance.unpaidDays ?? 0);
  // Overtime hours clocked
  const otHours = parseFloat(attendance.overtimeHours ?? 0);
  // Base monthly wage from contract
  const wage = parseFloat(contract.wage || 0);

  // Derive hourly rate:
  // E.g. 40 hours/week = 8 hours/day. 22 days * 8 hours = 176 standard working hours in the month.
  // Hourly rate = Wage / 176 hours.
  const weeklyHours = parseFloat(schedule.weekly_hours || 40.0);
  const dailyHours = weeklyHours > 0 ? weeklyHours / 5 : 8;
  const standardHours = scheduleDays * dailyHours;
  const hourlyRate = standardHours > 0 ? wage / standardHours : 0;

  // This `context` object holds all numbers. As each rule is calculated, its result
  // is added to this context so downstream rules can immediately use it!
  const context = {
    CONTRACT_WAGE: wage,
    SCHEDULE_DAYS: scheduleDays,
    WORKED_DAYS: workedDays,
    UNPAID_LEAVE_DAYS: unpaidDays,
    OVERTIME_HOURS: otHours,
    HOURLY_RATE: hourlyRate
  };

  const calculatedLines = [];
  const executionTrace = [];

  // Sort rules strictly by Sequence ascending (e.g. 10 -> 20 -> 30 -> 100 -> 110 -> 200)
  // This ensures prerequisites are always calculated before rules that depend on them.
  const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);

  // --------------------------------------------------------------------------
  // STEP 2: SEQUENTIALLY EXECUTE EACH SALARY RULE
  // --------------------------------------------------------------------------
  for (const rule of sortedRules) {
    let rawAmount = 0;
    let evalError = null;
    let expressionUsed = '';

    try {
      // Case A: Fixed currency amount (e.g. ₹3,000 conveyance allowance)
      if (rule.type === 'FIXED') {
        rawAmount = parseFloat(rule.fixed_amount || 0);
        expressionUsed = `${rawAmount}`;
      } 
      // Case B: Percentage applied to another rule (e.g. HRA = 40% of BASIC)
      else if (rule.type === 'PERCENTAGE') {
        const base = context[rule.base_code] !== undefined ? context[rule.base_code] : (context['BASIC'] || 0);
        const rate = parseFloat(rule.percentage_rate || 0);
        rawAmount = (base * rate) / 100;
        expressionUsed = `${base} * (${rate} / 100)`;
      } 
      // Case C: Formula expression evaluated dynamically
      // E.g. "(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)" or "GROSS > 15000 ? 200 : 0"
      else if (rule.type === 'FORMULA') {
        expressionUsed = rule.formula || '0';
        const expr = parser.parse(expressionUsed);
        rawAmount = expr.evaluate(context);
      }
    } catch (err) {
      // If a formula has a syntax error or division by zero, catch it safely instead of crashing
      evalError = err.message;
      rawAmount = 0;
    }

    // Always round money to 2 decimal places (paise/cents) to avoid floating point drift like 103090.90999999999
    const finalAmount = Math.round((Number(rawAmount) || 0) * 100) / 100;
    
    // Save this computed rule into the context so subsequent rules can use its value
    context[rule.code] = finalAmount;

    // Record the itemized line for the payslip
    calculatedLines.push({
      rule_code: rule.code,
      rule_name: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      type: rule.type,
      amount: finalAmount,
      error: evalError
    });

    // Record an execution trace step (used by the visual simulator in the UI)
    executionTrace.push({
      sequence: rule.sequence,
      code: rule.code,
      name: rule.name,
      category: rule.category,
      expression: expressionUsed,
      evaluatedAmount: finalAmount,
      error: evalError
    });
  }

  // --------------------------------------------------------------------------
  // STEP 3: EXTRACT KEY FINANCIAL TOTALS
  // --------------------------------------------------------------------------
  const basic = context['BASIC'] !== undefined ? context['BASIC'] : 0;
  const gross = context['GROSS'] !== undefined ? context['GROSS'] : 0;
  const deductions = context['TOTAL_DED'] !== undefined 
    ? context['TOTAL_DED'] 
    : calculatedLines
        .filter(l => l.category === 'DEDUCTION' && l.rule_code !== 'TOTAL_DED')
        .reduce((sum, l) => sum + l.amount, 0);

  // Net salary = Gross minus Deductions
  const net = context['NET'] !== undefined ? context['NET'] : (gross - deductions);

  return {
    employee_id: employee?.id || null,
    employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Simulation',
    contract_id: contract?.id || null,
    worked_days: workedDays,
    scheduled_days: scheduleDays,
    unpaid_leave_days: unpaidDays,
    overtime_hours: otHours,
    hourly_rate: Math.round(hourlyRate * 100) / 100,
    basic: Math.round(basic * 100) / 100,
    gross: Math.round(gross * 100) / 100,
    deductions: Math.round(deductions * 100) / 100,
    net_salary: Math.round(net * 100) / 100,
    lines: calculatedLines,
    trace: executionTrace,
    context
  };
}

/**
 * Helper Function: simulateCalculation
 * 
 * WHAT IT DOES:
 * Allows running a simulation of rules with test values without needing a real database record.
 * This is called directly by the "Dry Run Test Sandbox" in the UI.
 */
export function simulateCalculation({
  wage = 120000,
  scheduleDays = 22,
  workedDays = 22,
  unpaidDays = 0,
  overtimeHours = 0,
  weeklyHours = 40,
  rules = []
}) {
  return computeEmployeePayslip({
    employee: { id: 'sim-emp', first_name: 'Simulation', last_name: 'User' },
    contract: { id: 'sim-contract', wage },
    schedule: { weekly_hours: weeklyHours },
    attendance: {
      scheduledDays: scheduleDays,
      workedDays,
      unpaidLeaveDays: unpaidDays,
      overtimeHours
    },
    rules
  });
}
