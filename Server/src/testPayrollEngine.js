import { computeEmployeePayslip } from './engine/salaryEngine.js';
import { validateSalaryRulesDAG } from './engine/dagValidator.js';
import { runPreFlightWarningScan } from './engine/warningScanner.js';
import { payrollConfigService } from './services/payrollConfigService.js';
import { payrollControlService } from './services/payrollControlService.js';
import pool from './config/db.js';

async function runTests() {
  console.log('=== STARTING PEOPLEPAY360 PHASE 6 PAYROLL ENGINE TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Salary Engine Sequential Calculation
    // -------------------------------------------------------------
    console.log('[1] Testing Production Salary Execution Engine...');
    const testRules = [
      { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 10, type: 'FORMULA', formula: '(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)' },
      { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, type: 'PERCENTAGE', percentage_rate: 40.00, base_code: 'BASIC' },
      { code: 'CONV', name: 'Conveyance Allowance', category: 'ALLOWANCE', sequence: 30, type: 'FIXED', fixed_amount: 3000.00 },
      { code: 'SPECIAL', name: 'Special Allowance', category: 'ALLOWANCE', sequence: 40, type: 'FORMULA', formula: 'CONTRACT_WAGE * 0.10' },
      { code: 'OVERTIME', name: 'Overtime Earnings', category: 'ALLOWANCE', sequence: 50, type: 'FORMULA', formula: 'OVERTIME_HOURS * (HOURLY_RATE * 1.50)' },
      { code: 'GROSS', name: 'Gross Salary', category: 'GROSS', sequence: 100, type: 'FORMULA', formula: 'BASIC + HRA + CONV + SPECIAL + OVERTIME' },
      { code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', sequence: 110, type: 'PERCENTAGE', percentage_rate: 12.00, base_code: 'BASIC' },
      { code: 'PT', name: 'Professional Tax', category: 'DEDUCTION', sequence: 120, type: 'FORMULA', formula: 'GROSS > 15000 ? 200 : 0' },
      { code: 'LOP', name: 'Loss of Pay', category: 'DEDUCTION', sequence: 130, type: 'FORMULA', formula: '(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS' },
      { code: 'TOTAL_DED', name: 'Total Deductions', category: 'DEDUCTION', sequence: 140, type: 'FORMULA', formula: 'PF + PT + LOP' },
      { code: 'NET', name: 'Net Salary', category: 'NET', sequence: 200, type: 'FORMULA', formula: 'GROSS - TOTAL_DED' }
    ];

    const payslipResult = computeEmployeePayslip({
      employee: { id: 'emp-test-1', first_name: 'Rajesh', last_name: 'Sharma' },
      contract: { id: 'contract-test-1', wage: 100000 },
      schedule: { weekly_hours: 40 },
      attendance: { scheduledDays: 22, workedDays: 22, unpaidLeaveDays: 0, overtimeHours: 10 },
      rules: testRules
    });

    // Wage: 100,000
    // Basic = (100000 * 0.5) * (22/22) = 50,000
    // HRA = 50000 * 0.40 = 20,000
    // CONV = 3,000
    // SPECIAL = 100000 * 0.10 = 10,000
    // Daily hours = 8, hourlyRate = 100000 / (22 * 8) = 100000 / 176 = 568.18
    // OVERTIME = 10 * (568.18 * 1.5) = 8522.70
    // GROSS = 50000 + 20000 + 3000 + 10000 + 8522.7 = 91522.70
    // PF = 50000 * 0.12 = 6,000
    // PT = 200
    // LOP = 0
    // TOTAL_DED = 6000 + 200 + 0 = 6,200
    // NET = 91522.70 - 6200 = 85322.70

    assert(payslipResult.basic === 50000, `Basic is calculated correctly: ${payslipResult.basic}`);
    assert(payslipResult.gross === 91522.7, `Gross is calculated correctly: ${payslipResult.gross}`);
    assert(payslipResult.deductions === 6200, `Total deductions calculated correctly: ${payslipResult.deductions}`);
    assert(payslipResult.net_salary === 85322.7, `Net salary calculated correctly: ${payslipResult.net_salary}`);
    assert(payslipResult.lines.length === 11, `All 11 configured rule lines evaluated`);

    // -------------------------------------------------------------
    // Test 2: Kahn's DAG Circular Dependency Detector
    // -------------------------------------------------------------
    console.log('\n[2] Testing Kahn DAG Validator...');
    const validDag = validateSalaryRulesDAG(testRules);
    assert(validDag.isValid === true && validDag.hasCycle === false, 'Kahn DAG permits valid acyclic salary rules');

    const cyclicRules = [
      ...testRules,
      { code: 'BONUS', category: 'ALLOWANCE', sequence: 60, type: 'FORMULA', formula: 'NET * 0.10' },
      { code: 'INCENTIVE', category: 'ALLOWANCE', sequence: 70, type: 'FORMULA', formula: 'BONUS * 0.5' }
    ];
    // Create an explicit cycle: NET depends on INCENTIVE, INCENTIVE depends on BONUS, BONUS depends on NET
    const ruleNetIndex = cyclicRules.findIndex(r => r.code === 'NET');
    cyclicRules[ruleNetIndex] = {
      ...cyclicRules[ruleNetIndex],
      formula: 'GROSS - TOTAL_DED + INCENTIVE'
    };

    const invalidDag = validateSalaryRulesDAG(cyclicRules);
    assert(invalidDag.isValid === false && invalidDag.hasCycle === true, 'Kahn DAG rejects cyclic dependency (BONUS -> INCENTIVE -> NET -> BONUS)');
    assert(invalidDag.cycleNodes.includes('BONUS') || invalidDag.cycleNodes.includes('NET'), `Identifies cycle nodes: ${invalidDag.cycleNodes.join(', ')}`);

    // -------------------------------------------------------------
    // Test 3: Pre-Flight Warning Scanner
    // -------------------------------------------------------------
    console.log('\n[3] Testing Pre-Flight Warning Scanner & Risk Radar...');
    const scanResult = await runPreFlightWarningScan();
    assert(typeof scanResult.score === 'number', `Computed Risk Score: ${scanResult.score} / 100`);
    assert(Array.isArray(scanResult.itemizedRisks), `Generated ${scanResult.itemizedRisks.length} itemized risk audit metrics`);
    assert(scanResult.totalWarnings > 0, `Identified real database warnings: ${scanResult.totalWarnings} items`);

    // -------------------------------------------------------------
    // Test 4: Payroll Control Center Service & Telemetry
    // -------------------------------------------------------------
    console.log('\n[4] Testing Control Center Service Telemetry...');
    const telemetry = await payrollControlService.getControlCenterTelemetry();
    assert(telemetry.governance.version === 'PCC GOVERNANCE V4.8', 'Governance telemetry version matches');
    assert(telemetry.financialAllocation.currency === 'INR', 'Financial allocation is strictly Indian Rupee (INR)');
    assert(telemetry.financialAllocation.departmentBudgets.length > 0, `Loaded ${telemetry.financialAllocation.departmentBudgets.length} departmental budgets`);
    assert(telemetry.escalationStream.items.length >= 5, `Active compliance escalation stream loaded with ${telemetry.escalationStream.items.length} items`);
    assert(telemetry.historicalPayruns.length >= 4, `Unified immutable audit ledger loaded with ${telemetry.historicalPayruns.length} historical payruns`);

    // -------------------------------------------------------------
    // Test 5: Structure and Rules CRUD Service
    // -------------------------------------------------------------
    console.log('\n[5] Testing Salary Structures Service...');
    const structures = await payrollConfigService.getAllStructures();
    assert(structures.length >= 3, `Retrieved ${structures.length} salary structures`);
    const indianStructure = structures.find(s => s.code === 'STD_MONTHLY' || s.code === 'STD_IN_SALARIED');
    assert(Boolean(indianStructure), `Found standard Indian salary structure: ${indianStructure?.name}`);

    // Simulation service test
    const simResult = await payrollConfigService.simulateCalculation({
      structureId: indianStructure.id,
      wage: 150000,
      workedDays: 22,
      scheduledDays: 22,
      unpaidLeaveDays: 1,
      overtimeHours: 5
    });
    assert(simResult.net_salary > 0, `Simulation calculated positive net salary: ₹${simResult.net_salary}`);

    console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  } catch (err) {
    console.error('Unhandled test exception:', err);
    failed++;
  } finally {
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
