import pool from '../config/db.js';
import { validateSalaryRulesDAG } from '../engine/dagValidator.js';
import { computeEmployeePayslip } from '../engine/salaryEngine.js';

export const payrollConfigService = {
  /**
   * Fetch all salary structures with rule counts
   */
  async getAllStructures() {
    // Ensure default structures have rules initialized if empty
    await this.seedDefaultRulesIfEmpty();

    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.code, 
        s.is_active, 
        s.created_at, 
        s.updated_at,
        COUNT(r.id)::int AS rule_count,
        COUNT(DISTINCT c.id)::int AS active_contracts_count
      FROM salary_structures s
      LEFT JOIN salary_rules r ON s.id = r.structure_id
      LEFT JOIN contracts c ON s.id = c.structure_id AND c.status = 'RUNNING'
      GROUP BY s.id, s.name, s.code, s.is_active, s.created_at, s.updated_at
      ORDER BY s.created_at ASC
    `);
    return result.rows;
  },

  /**
   * Fetch single structure by ID with rules
   */
  async getStructureById(id) {
    const structRes = await pool.query('SELECT * FROM salary_structures WHERE id = $1', [id]);
    if (structRes.rows.length === 0) return null;

    const rulesRes = await pool.query(
      'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
      [id]
    );

    return {
      ...structRes.rows[0],
      rules: rulesRes.rows
    };
  },

  /**
   * Create new salary structure
   */
  async createStructure({ name, code, is_active = true }) {
    const existing = await pool.query('SELECT id FROM salary_structures WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      const err = new Error(`A salary structure with code '${code}' already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const res = await pool.query(
      `INSERT INTO salary_structures (name, code, is_active)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, code, is_active]
    );
    return res.rows[0];
  },

  /**
   * Update salary structure
   */
  async updateStructure(id, { name, code, is_active }) {
    const res = await pool.query(
      `UPDATE salary_structures
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           is_active = COALESCE($3, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, code, is_active, id]
    );
    return res.rows[0];
  },

  /**
   * Delete salary structure
   */
  async deleteStructure(id) {
    // Check if in use by contracts
    const contractsInUse = await pool.query('SELECT count(*) FROM contracts WHERE structure_id = $1', [id]);
    if (parseInt(contractsInUse.rows[0].count, 10) > 0) {
      const err = new Error('Cannot delete salary structure: it is referenced by existing employee contracts.');
      err.statusCode = 409;
      throw err;
    }

    const res = await pool.query('DELETE FROM salary_structures WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
  },

  /**
   * Get rules for a structure
   */
  async getRulesByStructure(structureId) {
    const res = await pool.query(
      `SELECT * FROM salary_rules 
       WHERE structure_id = $1 
       ORDER BY sequence ASC`,
      [structureId]
    );
    return res.rows;
  },

  /**
   * Create rule under structure with Kahn's DAG validation
   */
  async createRule(structureId, ruleData) {
    const { name, code, category, sequence, type, fixed_amount, percentage_rate, base_code, formula } = ruleData;

    // Fetch existing rules to test for cycles
    const existingRules = await this.getRulesByStructure(structureId);

    // Tentatively add the candidate rule to the set
    const candidateRules = [
      ...existingRules,
      { code, type, base_code, formula, sequence: Number(sequence) }
    ];

    // Kahn's Topological Sort Cycle Detector
    const dagResult = validateSalaryRulesDAG(candidateRules);
    if (!dagResult.isValid) {
      const err = new Error(dagResult.error || 'Circular dependency detected in salary rules.');
      err.statusCode = 422;
      err.details = dagResult;
      throw err;
    }

    const res = await pool.query(
      `INSERT INTO salary_rules 
       (structure_id, name, code, category, sequence, type, fixed_amount, percentage_rate, base_code, formula)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        structureId,
        name,
        code.toUpperCase(),
        category,
        sequence,
        type,
        fixed_amount || 0,
        percentage_rate || 0,
        base_code ? base_code.toUpperCase() : null,
        formula || null
      ]
    );
    return res.rows[0];
  },

  /**
   * Update rule with Kahn's DAG validation
   */
  async updateRule(ruleId, ruleData) {
    const currentRuleRes = await pool.query('SELECT * FROM salary_rules WHERE id = $1', [ruleId]);
    if (currentRuleRes.rows.length === 0) {
      const err = new Error('Salary rule not found');
      err.statusCode = 404;
      throw err;
    }
    const currentRule = currentRuleRes.rows[0];
    const structureId = currentRule.structure_id;

    const existingRules = await this.getRulesByStructure(structureId);
    // Replace current rule in validation candidate set
    const candidateRules = existingRules.map((r) => {
      if (r.id === ruleId) {
        return {
          code: (ruleData.code || r.code).toUpperCase(),
          type: ruleData.type || r.type,
          base_code: ruleData.base_code !== undefined ? ruleData.base_code : r.base_code,
          formula: ruleData.formula !== undefined ? ruleData.formula : r.formula,
          sequence: Number(ruleData.sequence || r.sequence)
        };
      }
      return r;
    });

    const dagResult = validateSalaryRulesDAG(candidateRules);
    if (!dagResult.isValid) {
      const err = new Error(dagResult.error || 'Circular dependency detected in salary rules.');
      err.statusCode = 422;
      err.details = dagResult;
      throw err;
    }

    const { name, code, category, sequence, type, fixed_amount, percentage_rate, base_code, formula } = ruleData;
    const res = await pool.query(
      `UPDATE salary_rules
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           category = COALESCE($3, category),
           sequence = COALESCE($4, sequence),
           type = COALESCE($5, type),
           fixed_amount = COALESCE($6, fixed_amount),
           percentage_rate = COALESCE($7, percentage_rate),
           base_code = COALESCE($8, base_code),
           formula = COALESCE($9, formula),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        name,
        code ? code.toUpperCase() : null,
        category,
        sequence,
        type,
        fixed_amount,
        percentage_rate,
        base_code ? base_code.toUpperCase() : null,
        formula,
        ruleId
      ]
    );
    return res.rows[0];
  },

  /**
   * Delete rule
   */
  async deleteRule(ruleId) {
    const res = await pool.query('DELETE FROM salary_rules WHERE id = $1 RETURNING *', [ruleId]);
    return res.rows[0];
  },

  /**
   * Live Rule Simulation
   */
  async simulateCalculation({ structureId, wage = 100000, workedDays = 22, scheduledDays = 22, unpaidLeaveDays = 0, overtimeHours = 0 }) {
    const rules = await this.getRulesByStructure(structureId);
    if (rules.length === 0) {
      return { lines: [], net_salary: 0, basic: 0, gross: 0, deductions: 0 };
    }

    const mockEmployee = { id: 'sim-employee', name: 'Simulation Candidate' };
    const mockContract = { id: 'sim-contract', wage };
    const mockSchedule = { weekly_hours: 40 };
    const mockAttendance = {
      workedDays,
      scheduledDays,
      unpaidLeaveDays,
      overtimeHours
    };

    return computeEmployeePayslip({
      employee: mockEmployee,
      contract: mockContract,
      schedule: mockSchedule,
      attendance: mockAttendance,
      rules
    });
  },

  /**
   * Ensure standard structures have full rule sequences in DB
   */
  async seedDefaultRulesIfEmpty() {
    const structuresRes = await pool.query('SELECT id, code FROM salary_structures');
    const defaultRulesTemplate = [
      { name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 10, type: 'FORMULA', formula: '(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)' },
      { name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', sequence: 20, type: 'PERCENTAGE', percentage_rate: 40.00, base_code: 'BASIC' },
      { name: 'Conveyance Allowance', code: 'CONV', category: 'ALLOWANCE', sequence: 30, type: 'FIXED', fixed_amount: 3000.00 },
      { name: 'Special Allowance', code: 'SPECIAL', category: 'ALLOWANCE', sequence: 40, type: 'FORMULA', formula: 'CONTRACT_WAGE * 0.10' },
      { name: 'Overtime Earnings', code: 'OVERTIME', category: 'ALLOWANCE', sequence: 50, type: 'FORMULA', formula: 'OVERTIME_HOURS * (HOURLY_RATE * 1.50)' },
      { name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 100, type: 'FORMULA', formula: 'BASIC + HRA + CONV + SPECIAL + OVERTIME' },
      { name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', sequence: 110, type: 'PERCENTAGE', percentage_rate: 12.00, base_code: 'BASIC' },
      { name: 'Professional Tax', code: 'PT', category: 'DEDUCTION', sequence: 120, type: 'FORMULA', formula: 'GROSS > 15000 ? 200 : 0' },
      { name: 'Loss of Pay', code: 'LOP', category: 'DEDUCTION', sequence: 130, type: 'FORMULA', formula: '(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS' },
      { name: 'Total Deductions', code: 'TOTAL_DED', category: 'DEDUCTION', sequence: 140, type: 'FORMULA', formula: 'PF + PT + LOP' },
      { name: 'Net Salary', code: 'NET', category: 'NET', sequence: 200, type: 'FORMULA', formula: 'GROSS - TOTAL_DED' }
    ];

    for (const struct of structuresRes.rows) {
      const countRes = await pool.query('SELECT count(*) FROM salary_rules WHERE structure_id = $1', [struct.id]);
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        for (const rule of defaultRulesTemplate) {
          await pool.query(`
            INSERT INTO salary_rules 
            (structure_id, name, code, category, sequence, type, fixed_amount, percentage_rate, base_code, formula)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (structure_id, code) DO NOTHING
          `, [
            struct.id,
            rule.name,
            rule.code,
            rule.category,
            rule.sequence,
            rule.type,
            rule.fixed_amount || 0,
            rule.percentage_rate || 0,
            rule.base_code || null,
            rule.formula || null
          ]);
        }
      }
    }
  }
};

export default payrollConfigService;
