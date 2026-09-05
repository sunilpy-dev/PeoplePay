import { Parser } from 'expr-eval';

/**
 * Production Salary Execution Engine
 * Evaluates configured salary rules sequentially according to sequence order (10 -> 200).
 * Supports FIXED, PERCENTAGE, and FORMULA computation types with context bindings.
 *
 * @param {Object} params
 * @param {Object} params.employee - Employee record
 * @param {Object} params.contract - Contract record with wage
 * @param {Object} [params.schedule] - Working schedule (defaults to 40h/week)
 * @param {Object} [params.attendance] - Attendance metrics (workedDays, scheduledDays, unpaidLeaveDays, overtimeHours)
 * @param {Array} params.rules - Array of salary rules configured for the structure
 * @returns {Object} Calculated payslip breakdown with lines and aggregates
 */
export function computeEmployeePayslip({ employee, contract, schedule = {}, attendance = {}, rules = [] }) {
  const parser = new Parser();

  // 1. Establish Calculation Context Variables
  const scheduleDays = Number(attendance.scheduledDays ?? 22);
  const workedDays = Number(attendance.workedDays ?? 22);
  const unpaidDays = Number(attendance.unpaidLeaveDays ?? 0);
  const otHours = Number(attendance.overtimeHours ?? 0);
  const wage = parseFloat(contract?.wage || 0);

  const weeklyHours = parseFloat(schedule?.weekly_hours || 40);
  const dailyHours = weeklyHours > 0 ? weeklyHours / 5 : 8;
  const totalStandardHours = scheduleDays * dailyHours;
  const hourlyRate = totalStandardHours > 0 ? wage / totalStandardHours : 0;

  const context = {
    CONTRACT_WAGE: wage,
    SCHEDULE_DAYS: scheduleDays,
    WORKED_DAYS: workedDays,
    UNPAID_LEAVE_DAYS: unpaidDays,
    OVERTIME_HOURS: otHours,
    HOURLY_RATE: Math.round(hourlyRate * 100) / 100
  };

  const calculatedLines = [];

  // Sort rules strictly by Sequence ascending (e.g. 10 -> 20 -> 30 -> ... -> 200)
  const sortedRules = [...rules].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  // 2. Sequentially Execute Rules
  for (const rule of sortedRules) {
    let amount = 0;
    try {
      if (rule.type === 'FIXED') {
        amount = parseFloat(rule.fixed_amount || 0);
      } else if (rule.type === 'PERCENTAGE') {
        const base = parseFloat(context[rule.base_code] ?? 0);
        const rate = parseFloat(rule.percentage_rate || 0);
        amount = (base * rate) / 100;
      } else if (rule.type === 'FORMULA') {
        if (rule.formula && rule.formula.trim()) {
          const expr = parser.parse(rule.formula);
          amount = expr.evaluate(context);
        } else {
          amount = 0;
        }
      }
    } catch (err) {
      console.error(`[SalaryEngine] Execution error on rule ${rule.code} (${rule.name}):`, err.message);
      amount = 0;
    }

    // Safety guard against NaN or Infinity
    if (isNaN(amount) || !isFinite(amount)) {
      amount = 0;
    }

    // Round to 2 Decimal Places
    amount = Math.round(amount * 100) / 100;
    context[rule.code] = amount;

    calculatedLines.push({
      rule_code: rule.code,
      rule_name: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      type: rule.type,
      amount: amount
    });
  }

  // 3. Extract Core System Aggregates
  const basic = context['BASIC'] ?? 0;
  const gross = context['GROSS'] ?? (basic + (context['HRA'] || 0) + (context['SPECIAL'] || 0));
  const deductions = context['TOTAL_DED'] ?? ((context['PF'] || 0) + (context['PT'] || 0) + (context['LOP'] || 0));
  const net = context['NET'] !== undefined ? context['NET'] : (gross - deductions);

  return {
    employee_id: employee?.id,
    contract_id: contract?.id,
    worked_days: workedDays,
    scheduled_days: scheduleDays,
    unpaid_leave_days: unpaidDays,
    overtime_hours: otHours,
    hourly_rate: context.HOURLY_RATE,
    basic,
    gross,
    deductions,
    net_salary: net,
    lines: calculatedLines,
    context
  };
}

export default {
  computeEmployeePayslip
};
