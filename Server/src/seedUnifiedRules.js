import pool from './config/db.js';

async function seedAllRules() {
  try {
    const structRes = await pool.query('SELECT id, code FROM salary_structures');
    const structs = {};
    structRes.rows.forEach(r => { structs[r.code] = r.id; });

    console.log('Found structures:', Object.keys(structs));

    const rulesData = {
      'STR-EU-SAL-01': [
        { seq: 10, code: 'BASIC', name: 'Basic Salary', cat: 'BASIC', type: 'FORMULA', form: 'contract.wage' },
        { seq: 20, code: 'HRA', name: 'Housing & Remote Allowance', cat: 'ALLOWANCE', type: 'FORMULA', form: 'BASIC * 0.15 + REMOTE_STIPEND' },
        { seq: 50, code: 'GROSS', name: 'Gross Pay Computation', cat: 'GROSS', type: 'FORMULA', form: 'BASIC + HRA' },
        { seq: 70, code: 'SOC_SEC', name: 'Statutory Social Security 6.2%', cat: 'DEDUCTION', type: 'FORMULA', form: 'GROSS * -0.062' },
        { seq: 80, code: 'PAYE_TAX', name: 'Withholding Income Tax', cat: 'DEDUCTION', type: 'FORMULA', form: 'lookup_tax_bracket(GROSS, contract.tax_id)' },
        { seq: 100, code: 'NET', name: 'Net Take-Home Pay', cat: 'NET', type: 'FORMULA', form: 'GROSS - Deductions' }
      ],
      'STR-US-EXEC-09': [
        { seq: 10, code: 'BASE', name: 'Executive Base Salary', cat: 'BASIC', type: 'FORMULA', form: 'contract.wage' },
        { seq: 20, code: 'RSU', name: 'Equity / RSU Monthly Tranche', cat: 'ALLOWANCE', type: 'FORMULA', form: 'contract.equity_tranche' },
        { seq: 30, code: 'BONUS', name: 'Performance Incentive Target', cat: 'ALLOWANCE', type: 'FORMULA', form: 'BASE * 0.25' },
        { seq: 50, code: 'GROSS', name: 'Executive Gross Compensation', cat: 'GROSS', type: 'FORMULA', form: 'BASE + RSU + BONUS' },
        { seq: 70, code: '401K', name: '401(k) Safe Harbor Match (4%)', cat: 'DEDUCTION', type: 'FORMULA', form: 'BASE * -0.04' },
        { seq: 80, code: 'FED_TAX', name: 'US Federal & State Withholding', cat: 'DEDUCTION', type: 'FORMULA', form: 'GROSS * -0.32' },
        { seq: 90, code: 'FICA', name: 'FICA Medicare / Social Security', cat: 'DEDUCTION', type: 'FORMULA', form: 'GROSS * -0.0765' },
        { seq: 100, code: 'NET', name: 'Net Disbursable Take-Home', cat: 'NET', type: 'FORMULA', form: 'GROSS - Deductions' }
      ],
      'STR-OPS-HRLY-04': [
        { seq: 10, code: 'HOURLY_BASE', name: 'Shift Hourly Wage', cat: 'BASIC', type: 'FORMULA', form: 'HOURLY_RATE * WORKED_HOURS' },
        { seq: 20, code: 'SHIFT_DIFF', name: 'Night Shift Differential (15%)', cat: 'ALLOWANCE', type: 'FORMULA', form: 'HOURLY_BASE * 0.15' },
        { seq: 30, code: 'OVERTIME', name: 'Overtime Tiering 1.5x / 2.0x', cat: 'ALLOWANCE', type: 'FORMULA', form: 'OVERTIME_HOURS * (HOURLY_RATE * 1.5)' },
        { seq: 50, code: 'GROSS', name: 'Hourly Gross Aggregate', cat: 'GROSS', type: 'FORMULA', form: 'HOURLY_BASE + SHIFT_DIFF + OVERTIME' },
        { seq: 70, code: 'STAT_DED', name: 'Statutory Payroll Withholding', cat: 'DEDUCTION', type: 'FORMULA', form: 'GROSS * -0.15' },
        { seq: 100, code: 'NET', name: 'Net Bi-weekly Disbursable', cat: 'NET', type: 'FORMULA', form: 'GROSS - STAT_DED' }
      ],
      'STR-GLB-FEE-02': [
        { seq: 10, code: 'FEE_BASE', name: 'Contractor Milestone Fee', cat: 'BASIC', type: 'FORMULA', form: 'contract.monthly_fee' },
        { seq: 50, code: 'GROSS', name: 'Total Invoiced Gross', cat: 'GROSS', type: 'FORMULA', form: 'FEE_BASE' },
        { seq: 100, code: 'NET', name: 'Net Wire Disbursement', cat: 'NET', type: 'FORMULA', form: 'GROSS' }
      ],
      'STD_IN_SALARIED': [
        { seq: 10, code: 'BASIC', name: 'Basic Salary', cat: 'BASIC', type: 'FORMULA', form: '(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)' },
        { seq: 20, code: 'HRA', name: 'House Rent Allowance', cat: 'ALLOWANCE', type: 'PERCENTAGE', rate: 40, base: 'BASIC' },
        { seq: 30, code: 'CONV', name: 'Conveyance Allowance', cat: 'ALLOWANCE', type: 'FIXED', fixed: 3000 },
        { seq: 40, code: 'SPECIAL', name: 'Special Allowance', cat: 'ALLOWANCE', type: 'FORMULA', form: 'CONTRACT_WAGE * 0.10' },
        { seq: 50, code: 'OVERTIME', name: 'Overtime Earnings', cat: 'ALLOWANCE', type: 'FORMULA', form: 'OVERTIME_HOURS * (HOURLY_RATE * 1.50)' },
        { seq: 100, code: 'GROSS', name: 'Gross Salary', cat: 'GROSS', type: 'FORMULA', form: 'BASIC + HRA + CONV + SPECIAL + OVERTIME' },
        { seq: 110, code: 'PF', name: 'Provident Fund', cat: 'DEDUCTION', type: 'PERCENTAGE', rate: 12, base: 'BASIC' },
        { seq: 120, code: 'PT', name: 'Professional Tax', cat: 'DEDUCTION', type: 'FORMULA', form: 'GROSS > 15000 ? 200 : 0' },
        { seq: 130, code: 'LOP', name: 'Loss of Pay', cat: 'DEDUCTION', type: 'FORMULA', form: '(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS' },
        { seq: 140, code: 'TOTAL_DED', name: 'Total Deductions', cat: 'DEDUCTION', type: 'FORMULA', form: 'PF + PT + LOP' },
        { seq: 200, code: 'NET', name: 'Net Salary', cat: 'NET', type: 'FORMULA', form: 'GROSS - TOTAL_DED' }
      ],
      'EXEC_TECH_IN': [
        { seq: 10, code: 'BASIC', name: 'Executive Base Salary', cat: 'BASIC', type: 'FORMULA', form: 'contract.wage * 0.50' },
        { seq: 20, code: 'HRA', name: 'House Rent Allowance', cat: 'ALLOWANCE', type: 'PERCENTAGE', rate: 50, base: 'BASIC' },
        { seq: 30, code: 'BONUS', name: 'Performance Incentive', cat: 'ALLOWANCE', type: 'FORMULA', form: 'BASIC * 0.25' },
        { seq: 50, code: 'GROSS', name: 'Executive Gross Compensation', cat: 'GROSS', type: 'FORMULA', form: 'BASIC + HRA + BONUS' },
        { seq: 70, code: 'PF', name: 'Provident Fund', cat: 'DEDUCTION', type: 'PERCENTAGE', rate: 12, base: 'BASIC' },
        { seq: 80, code: 'PT', name: 'Professional Tax', cat: 'DEDUCTION', type: 'FORMULA', form: '200' },
        { seq: 100, code: 'NET', name: 'Net Disbursable Take-Home', cat: 'NET', type: 'FORMULA', form: 'GROSS - PF - PT' }
      ],
      'HOURLY_OPS_IN': [
        { seq: 10, code: 'HOURLY_BASE', name: 'Shift Hourly Wage', cat: 'BASIC', type: 'FORMULA', form: 'HOURLY_RATE * WORKED_HOURS' },
        { seq: 20, code: 'SHIFT_DIFF', name: 'Night Shift Differential (15%)', cat: 'ALLOWANCE', type: 'FORMULA', form: 'HOURLY_BASE * 0.15' },
        { seq: 30, code: 'OVERTIME', name: 'Overtime Earnings', cat: 'ALLOWANCE', type: 'FORMULA', form: 'OVERTIME_HOURS * (HOURLY_RATE * 1.50)' },
        { seq: 50, code: 'GROSS', name: 'Hourly Gross Aggregate', cat: 'GROSS', type: 'FORMULA', form: 'HOURLY_BASE + SHIFT_DIFF + OVERTIME' },
        { seq: 70, code: 'PT', name: 'Professional Tax', cat: 'DEDUCTION', type: 'FORMULA', form: 'GROSS > 15000 ? 200 : 0' },
        { seq: 100, code: 'NET', name: 'Net Bi-weekly Disbursable', cat: 'NET', type: 'FORMULA', form: 'GROSS - PT' }
      ]
    };

    for (const [structCode, rules] of Object.entries(rulesData)) {
      const structId = structs[structCode];
      if (!structId) continue;

      for (const r of rules) {
        await pool.query(`
          INSERT INTO salary_rules (structure_id, sequence, code, name, category, type, fixed_amount, percentage_rate, base_code, formula)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (structure_id, code) DO UPDATE
          SET sequence = EXCLUDED.sequence,
              name = EXCLUDED.name,
              category = EXCLUDED.category,
              type = EXCLUDED.type,
              fixed_amount = EXCLUDED.fixed_amount,
              percentage_rate = EXCLUDED.percentage_rate,
              base_code = EXCLUDED.base_code,
              formula = EXCLUDED.formula
        `, [
          structId,
          r.seq,
          r.code,
          r.name,
          r.cat,
          r.type,
          r.fixed || 0.00,
          r.rate || 0.00,
          r.base || null,
          r.form || null
        ]);
      }
    }

    console.log('Seeded rules for all unified structures successfully!');
    process.exit(0);
  } catch (err) {
    console.error('seedAllRules error:', err);
    process.exit(1);
  }
}

seedAllRules();
