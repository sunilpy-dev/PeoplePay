/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY STRUCTURE SERVICE LAYER
 * ==============================================================================
 * 
 * WHAT THIS FILE DOES IN SIMPLE WORDS:
 * This service is the "bridge" between our Express controllers and PostgreSQL.
 * 
 * It manages:
 * 1. Fetching salary structures (schemas) and their ordered rules from the database.
 * 2. Creating, updating, and deleting structures.
 * 3. Adding, updating, or deleting individual rules while strictly enforcing the DAG:
 *    - Before saving a new or edited rule, it runs Kahn's algorithm (`validateRuleDAG`).
 *    - If someone enters a circular formula, it rejects the save with HTTP 422!
 *    - If someone tries to delete a rule that another rule depends on, it blocks the deletion!
 * 4. Providing safe default fallback data if PostgreSQL is temporarily offline during development.
 */

import pool from '../config/db.js';
import { validateRuleDAG } from '../engine/dagValidator.js';
import { simulateCalculation } from '../engine/salaryEngine.js';
import { AppError } from '../middleware/errorHandler.js';

// Default fallback rules matching db/seed.sql and Docs/UI mockups
const DEFAULT_RULES = [
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

// Default fallback schemas matching India-based compensation standards
const DEFAULT_STRUCTURES = [
  {
    id: '0d12c78f-d2c4-4d7e-8152-fffba4869bee',
    name: 'Standard India Salaried',
    code: 'STD_IN_SALARIED',
    is_active: true,
    rule_count: 11,
    employee_count: 142,
    rules: DEFAULT_RULES
  },
  {
    id: 'c555cccc-01e7-4e87-b27f-d2d2507a8b02',
    name: 'Executive Tech India',
    code: 'EXEC_TECH_IN',
    is_active: true,
    rule_count: 7,
    employee_count: 36,
    rules: DEFAULT_RULES.slice(0, 7)
  },
  {
    id: '76509a07-3e50-4ea2-a706-0f6720d879a7',
    name: 'Hourly Operations India',
    code: 'HOURLY_OPS_IN',
    is_active: true,
    rule_count: 6,
    employee_count: 58,
    rules: DEFAULT_RULES.slice(0, 6)
  },
  {
    id: 'b204f418-88b6-445a-9b47-622a5de6fc26',
    name: 'Standard Full-Time Structure',
    code: 'STD_MONTHLY',
    is_active: true,
    rule_count: 11,
    employee_count: 520,
    rules: DEFAULT_RULES
  }
];

/**
 * getAllStructures
 * 
 * Fetches all salary structures from PostgreSQL with counts of rules and active contracts.
 * If the database query fails, falls back gracefully to in-memory schemas so the UI never crashes.
 */
export const getAllStructures = async () => {
  try {
    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.code, 
        s.is_active,
        s.created_at,
        COUNT(DISTINCT r.id)::int as rule_count,
        COUNT(DISTINCT c.id)::int as employee_count
      FROM salary_structures s
      LEFT JOIN salary_rules r ON r.structure_id = s.id
      LEFT JOIN contracts c ON c.structure_id = s.id AND c.status = 'RUNNING'
      GROUP BY s.id
      ORDER BY s.created_at ASC
    `;
    const res = await pool.query(query);
    if (res.rows.length > 0) {
      return res.rows;
    }
  } catch (err) {
    console.warn('Database query for salary structures failed, using fallback schemas:', err.message);
  }
  return DEFAULT_STRUCTURES.map(({ rules, ...rest }) => rest);
};

/**
 * getStructureById
 * 
 * Fetches a single structure by ID along with its full list of rules sorted by sequence.
 * Runs Kahn's DAG algorithm to tag whether the rules are in a valid topological execution state.
 */
export const getStructureById = async (id) => {
  let structure = null;
  let rules = [];

  try {
    const sRes = await pool.query('SELECT * FROM salary_structures WHERE id = $1', [id]);
    if (sRes.rows.length > 0) {
      structure = sRes.rows[0];
      const rRes = await pool.query(
        'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
        [id]
      );
      rules = rRes.rows.map(r => ({
        ...r,
        fixed_amount: parseFloat(r.fixed_amount || 0),
        percentage_rate: parseFloat(r.percentage_rate || 0)
      }));
    }
  } catch (err) {
    console.warn(`Database query for structure ${id} failed, checking fallback:`, err.message);
  }

  // Fallback to default in-memory structure if not yet in database
  if (!structure) {
    const fallback = DEFAULT_STRUCTURES.find(s => s.id === id || s.code === id) || DEFAULT_STRUCTURES[0];
    structure = {
      id: fallback.id,
      name: fallback.name,
      code: fallback.code,
      is_active: fallback.is_active,
      created_at: new Date().toISOString()
    };
    rules = fallback.rules.map((r, idx) => ({ id: `rule-${idx + 1}`, structure_id: structure.id, ...r }));
  }

  // Validate the dependency graph
  const dagResult = validateRuleDAG(rules);

  return {
    ...structure,
    rules,
    dagStatus: dagResult.isValid ? 'VALID' : 'INVALID',
    dagValidation: dagResult
  };
};

/**
 * createStructure
 * 
 * Creates a new compensation structure schema.
 * If initial rules are provided, validates their DAG before writing to the database.
 */
export const createStructure = async ({ name, code, is_active = true, rules = [] }) => {
  if (!name || !code) {
    throw new AppError('Structure name and code are required.', 400, 'VALIDATION_ERROR');
  }

  // If initial rules provided, validate DAG before persisting
  if (rules.length > 0) {
    const dagCheck = validateRuleDAG(rules);
    if (!dagCheck.isValid) {
      throw new AppError(`Cannot create structure with invalid rule DAG: ${dagCheck.errors?.join(' ')}`, 422, 'DAG_CYCLE_DETECTED');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sRes = await client.query(
      `INSERT INTO salary_structures (name, code, is_active) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), code.trim().toUpperCase(), is_active]
    );
    const newStructure = sRes.rows[0];

    const insertedRules = [];
    for (const rule of rules) {
      const rRes = await client.query(
        `INSERT INTO salary_rules (structure_id, name, code, category, sequence, type, fixed_amount, percentage_rate, base_code, formula)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          newStructure.id,
          rule.name,
          rule.code.toUpperCase(),
          rule.category,
          rule.sequence,
          rule.type,
          rule.fixed_amount || 0,
          rule.percentage_rate || 0,
          rule.base_code || null,
          rule.formula || null
        ]
      );
      insertedRules.push(rRes.rows[0]);
    }

    await client.query('COMMIT');
    return {
      ...newStructure,
      rules: insertedRules,
      dagStatus: 'VALID'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      throw new AppError(`A salary structure with code '${code}' already exists.`, 409, 'DUPLICATE_CODE');
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * updateStructure
 * 
 * Updates a structure's name, code, or active toggle.
 */
export const updateStructure = async (id, { name, code, is_active }) => {
  const updates = [];
  const params = [id];
  let pIdx = 2;

  if (name !== undefined) {
    updates.push(`name = $${pIdx++}`);
    params.push(name.trim());
  }
  if (code !== undefined) {
    updates.push(`code = $${pIdx++}`);
    params.push(code.trim().toUpperCase());
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${pIdx++}`);
    params.push(is_active);
  }

  if (updates.length === 0) {
    return getStructureById(id);
  }

  const query = `UPDATE salary_structures SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
  const res = await pool.query(query, params);
  if (res.rows.length === 0) {
    throw new AppError('Salary structure not found.', 404, 'NOT_FOUND');
  }

  return getStructureById(id);
};

/**
 * deleteStructure
 * 
 * Deletes a structure, guarding against active employment contracts that reference it.
 */
export const deleteStructure = async (id) => {
  const contractCheck = await pool.query(
    'SELECT COUNT(*) FROM contracts WHERE structure_id = $1',
    [id]
  );
  if (parseInt(contractCheck.rows[0]?.count || 0, 10) > 0) {
    throw new AppError('Cannot delete salary structure: it is referenced by active employment contracts.', 400, 'STRUCTURE_IN_USE');
  }

  const res = await pool.query('DELETE FROM salary_structures WHERE id = $1 RETURNING id', [id]);
  if (res.rows.length === 0) {
    throw new AppError('Salary structure not found.', 404, 'NOT_FOUND');
  }
  return { id, deleted: true };
};

/**
 * addRuleToStructure
 * 
 * Adds a new salary rule into a structure.
 * CRITICAL SAFETY CHECK: Runs Kahn's DAG check on (current rules + new rule).
 * If the new rule introduces a circular reference or sequence violation, rejects with HTTP 422!
 */
export const addRuleToStructure = async (structureId, ruleData) => {
  const { name, code, category, sequence, type, fixed_amount, percentage_rate, base_code, formula } = ruleData;

  if (!name || !code || !category || !sequence || !type) {
    throw new AppError('Missing required rule fields (name, code, category, sequence, type).', 400, 'VALIDATION_ERROR');
  }

  const existingRes = await pool.query(
    'SELECT * FROM salary_rules WHERE structure_id = $1',
    [structureId]
  );
  const currentRules = existingRes.rows;

  // Check unique rule code within this structure
  if (currentRules.some(r => r.code.toUpperCase() === code.toUpperCase())) {
    throw new AppError(`A rule with code '${code}' already exists in this structure.`, 409, 'DUPLICATE_RULE_CODE');
  }

  const candidateRule = {
    code: code.trim().toUpperCase(),
    name: name.trim(),
    category,
    sequence: parseInt(sequence, 10),
    type,
    fixed_amount: parseFloat(fixed_amount || 0),
    percentage_rate: parseFloat(percentage_rate || 0),
    base_code: base_code ? base_code.trim().toUpperCase() : null,
    formula: formula ? formula.trim() : null
  };

  // Run Kahn's algorithm over (current rules + candidate rule)
  const allCandidateRules = [...currentRules, candidateRule];
  const dagResult = validateRuleDAG(allCandidateRules);
  if (!dagResult.isValid) {
    throw new AppError(
      `Cannot add rule: Circular dependency or sequence violation detected: ${dagResult.errors?.join(' ')}`,
      422,
      'DAG_CYCLE_DETECTED'
    );
  }

  const insertQuery = `
    INSERT INTO salary_rules (structure_id, name, code, category, sequence, type, fixed_amount, percentage_rate, base_code, formula)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const res = await pool.query(insertQuery, [
    structureId,
    candidateRule.name,
    candidateRule.code,
    candidateRule.category,
    candidateRule.sequence,
    candidateRule.type,
    candidateRule.fixed_amount,
    candidateRule.percentage_rate,
    candidateRule.base_code,
    candidateRule.formula
  ]);

  return res.rows[0];
};

/**
 * updateRuleInStructure
 * 
 * Updates an existing rule and verifies DAG integrity before saving.
 */
export const updateRuleInStructure = async (structureId, ruleId, ruleData) => {
  const existingRes = await pool.query(
    'SELECT * FROM salary_rules WHERE structure_id = $1',
    [structureId]
  );
  const currentRules = existingRes.rows;
  const existingRule = currentRules.find(r => r.id === ruleId);
  if (!existingRule) {
    throw new AppError('Salary rule not found.', 404, 'NOT_FOUND');
  }

  const updatedCandidate = {
    ...existingRule,
    ...ruleData,
    code: (ruleData.code || existingRule.code).toUpperCase(),
    sequence: parseInt(ruleData.sequence !== undefined ? ruleData.sequence : existingRule.sequence, 10)
  };

  const candidateRules = currentRules.map(r => r.id === ruleId ? updatedCandidate : r);
  const dagResult = validateRuleDAG(candidateRules);
  if (!dagResult.isValid) {
    throw new AppError(
      `Cannot update rule: Circular dependency or sequence violation: ${dagResult.errors?.join(' ')}`,
      422,
      'DAG_CYCLE_DETECTED'
    );
  }

  const query = `
    UPDATE salary_rules 
    SET 
      name = $1, 
      code = $2, 
      category = $3, 
      sequence = $4, 
      type = $5, 
      fixed_amount = $6, 
      percentage_rate = $7, 
      base_code = $8, 
      formula = $9
    WHERE id = $10 AND structure_id = $11
    RETURNING *
  `;
  const res = await pool.query(query, [
    updatedCandidate.name,
    updatedCandidate.code,
    updatedCandidate.category,
    updatedCandidate.sequence,
    updatedCandidate.type,
    updatedCandidate.fixed_amount,
    updatedCandidate.percentage_rate,
    updatedCandidate.base_code,
    updatedCandidate.formula,
    ruleId,
    structureId
  ]);

  return res.rows[0];
};

/**
 * deleteRuleFromStructure
 * 
 * Deletes a rule only if no other rule in the structure depends on it.
 */
export const deleteRuleFromStructure = async (structureId, ruleId) => {
  const existingRes = await pool.query(
    'SELECT * FROM salary_rules WHERE structure_id = $1',
    [structureId]
  );
  const currentRules = existingRes.rows;
  const ruleToDelete = currentRules.find(r => r.id === ruleId);
  if (!ruleToDelete) {
    throw new AppError('Salary rule not found.', 404, 'NOT_FOUND');
  }

  // Check if other rules depend on ruleToDelete.code
  const remainingRules = currentRules.filter(r => r.id !== ruleId);
  for (const r of remainingRules) {
    if (r.type === 'PERCENTAGE' && r.base_code === ruleToDelete.code) {
      throw new AppError(
        `Cannot delete rule '${ruleToDelete.code}': Rule '${r.code}' depends on it as base code.`,
        400,
        'RULE_DEPENDENCY_BLOCKER'
      );
    }
    if (r.type === 'FORMULA' && r.formula && r.formula.includes(ruleToDelete.code)) {
      throw new AppError(
        `Cannot delete rule '${ruleToDelete.code}': Rule '${r.code}' formula depends on it.`,
        400,
        'RULE_DEPENDENCY_BLOCKER'
      );
    }
  }

  await pool.query('DELETE FROM salary_rules WHERE id = $1 AND structure_id = $2', [ruleId, structureId]);
  return { id: ruleId, deleted: true };
};

/**
 * simulateStructureCalculation
 * 
 * Runs a dynamic calculation of the structure against hypothetical numbers
 * (e.g. Wage = ₹120,000, 22 days worked, 4 OT hours) and returns step-by-step trace.
 */
export const simulateStructureCalculation = async (structureId, simulationInputs) => {
  const structureData = await getStructureById(structureId);
  const rules = structureData.rules || [];

  return simulateCalculation({
    wage: simulationInputs.wage || 120000,
    scheduleDays: simulationInputs.scheduleDays || 22,
    workedDays: simulationInputs.workedDays || 22,
    unpaidDays: simulationInputs.unpaidDays || 0,
    overtimeHours: simulationInputs.overtimeHours || 0,
    weeklyHours: simulationInputs.weeklyHours || 40,
    rules
  });
};
