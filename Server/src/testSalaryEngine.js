import { validateRuleDAG } from './engine/dagValidator.js';
import { simulateCalculation } from './engine/salaryEngine.js';

console.log('=== RUNNING SALARY ENGINE & DAG VALIDATOR TESTS ===\n');

// 1. Standard 11 Rules from db/seed.sql and ARCHITECTURE.md
const standardRules = [
  { sequence: 10,  code: 'BASIC',     name: 'Basic Salary',             category: 'BASIC',     type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: '(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)' },
  { sequence: 20,  code: 'HRA',       name: 'House Rent Allowance',     category: 'ALLOWANCE', type: 'PERCENTAGE', fixed_amount: 0, percentage_rate: 40, base_code: 'BASIC', formula: null },
  { sequence: 30,  code: 'CONV',      name: 'Conveyance Allowance',     category: 'ALLOWANCE', type: 'FIXED',      fixed_amount: 3000, percentage_rate: 0, base_code: null, formula: null },
  { sequence: 40,  code: 'SPECIAL',   name: 'Special Allowance',        category: 'ALLOWANCE', type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: 'CONTRACT_WAGE * 0.10' },
  { sequence: 50,  code: 'OVERTIME',  name: 'Overtime Earnings',        category: 'ALLOWANCE', type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: 'OVERTIME_HOURS * (HOURLY_RATE * 1.50)' },
  { sequence: 100, code: 'GROSS',     name: 'Gross Salary',             category: 'GROSS',     type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: 'BASIC + HRA + CONV + SPECIAL + OVERTIME' },
  { sequence: 110, code: 'PF',        name: 'Provident Fund',           category: 'DEDUCTION', type: 'PERCENTAGE', fixed_amount: 0, percentage_rate: 12, base_code: 'BASIC', formula: null },
  { sequence: 120, code: 'PT',        name: 'Professional Tax',         category: 'DEDUCTION', type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: 'GROSS > 15000 ? 200 : 0' },
  { sequence: 130, code: 'LOP',       name: 'Loss of Pay',              category: 'DEDUCTION', type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: '(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS' },
  { sequence: 140, code: 'TOTAL_DED', name: 'Total Deductions',         category: 'DEDUCTION', type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: 'PF + PT + LOP' },
  { sequence: 200, code: 'NET',       name: 'Net Salary',               category: 'NET',       type: 'FORMULA',    fixed_amount: 0, percentage_rate: 0,  base_code: null,    formula: 'GROSS - TOTAL_DED' }
];

// Test 1: Standard Rules DAG Validation
console.log('1. Testing Standard Rules DAG Validation ...');
const dagResult = validateRuleDAG(standardRules);
console.log('DAG Valid:', dagResult.isValid);
console.log('Topological order:', dagResult.topologicalOrder);
if (!dagResult.isValid || dagResult.topologicalOrder.length !== 11) {
  throw new Error('Standard rules failed DAG validation');
}

// Test 2: Circular Dependency Detection (Kahn's Algorithm)
console.log('\n2. Testing Circular Dependency Detection ...');
const cyclicRules = [
  ...standardRules.filter(r => r.code !== 'NET'),
  { sequence: 45, code: 'BONUS', name: 'Bonus Incentive', category: 'ALLOWANCE', type: 'FORMULA', formula: 'NET * 0.1' },
  { sequence: 200, code: 'NET', name: 'Net Salary', category: 'NET', type: 'FORMULA', formula: 'GROSS + BONUS' }
];
const cyclicResult = validateRuleDAG(cyclicRules);
console.log('Cycle check valid (expected false):', cyclicResult.isValid);
console.log('Detected cycle error:', cyclicResult.errors);
if (cyclicResult.isValid) {
  throw new Error('Failed to detect circular dependency');
}

// Test 3: Sequence Violation Detection
console.log('\n3. Testing Sequence Violation Detection (prerequisite has higher sequence) ...');
const sequenceViolatingRules = [
  { sequence: 10, code: 'HRA', name: 'HRA', category: 'ALLOWANCE', type: 'PERCENTAGE', percentage_rate: 40, base_code: 'BASIC' },
  { sequence: 20, code: 'BASIC', name: 'Basic', category: 'BASIC', type: 'FIXED', fixed_amount: 50000 }
];
const seqResult = validateRuleDAG(sequenceViolatingRules);
console.log('Sequence violation valid (expected false):', seqResult.isValid);
console.log('Sequence violation error:', seqResult.errors);
if (seqResult.isValid) {
  throw new Error('Failed to detect sequence violation');
}

// Test 4: Computation with standard values
console.log('\n4. Testing Standard Salary Computation (Wage = 120,000, 22/22 days, 4 OT hours) ...');
const calc = simulateCalculation({
  wage: 120000,
  scheduleDays: 22,
  workedDays: 22,
  unpaidDays: 0,
  overtimeHours: 4,
  rules: standardRules
});

console.log('Basic Salary:', calc.basic);
console.log('Gross Salary:', calc.gross);
console.log('Total Deductions:', calc.deductions);
console.log('Net Salary:', calc.net_salary);
console.log('Lines calculated count:', calc.lines.length);

// Verify expected values:
// wage: 120000, scheduleDays: 22, dailyHours: 8, standardHours: 176, hourlyRate: 120000/176 = 681.818...
// BASIC = 120000 * 0.5 = 60000
// HRA = 60000 * 0.4 = 24000
// CONV = 3000
// SPECIAL = 120000 * 0.1 = 12000
// OVERTIME = 4 * (681.818... * 1.5) = 4090.91
// GROSS = 60000 + 24000 + 3000 + 12000 + 4090.91 = 103090.91
// PF = 60000 * 0.12 = 7200
// PT = 200 (since GROSS > 15000)
// LOP = 0
// TOTAL_DED = 7200 + 200 = 7400
// NET = 103090.91 - 7400 = 95690.91

if (calc.basic !== 60000) throw new Error(`Expected BASIC 60000, got ${calc.basic}`);
if (calc.gross !== 103090.91) throw new Error(`Expected GROSS 103090.91, got ${calc.gross}`);
if (calc.deductions !== 7400) throw new Error(`Expected DEDUCTIONS 7400, got ${calc.deductions}`);
if (calc.net_salary !== 95690.91) throw new Error(`Expected NET 95690.91, got ${calc.net_salary}`);

console.log('\n>>> ALL SALARY ENGINE & DAG TESTS PASSED PERFECTLY! <<<\n');
