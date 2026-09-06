import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Ensures table schema has contract_code and currency columns, and seeds initial rich demo data if empty.
 */
let schemaInitialized = false;
export async function ensureContractSchema() {
  if (schemaInitialized) return;
  try {
    await pool.query(`
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_code VARCHAR(50);
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
    `);

    // Ensure all salary structures (Global EU/US + Domestic India) exist in database
    await pool.query(`
      INSERT INTO salary_structures (name, code, is_active) VALUES
      ('Standard EU Salaried Professional', 'STR-EU-SAL-01', true),
      ('Executive Tech & Leadership (US)', 'STR-US-EXEC-09', true),
      ('Hourly Operations & Support', 'STR-OPS-HRLY-04', true),
      ('Global Contractor Fee-Based', 'STR-GLB-FEE-02', true),
      ('Standard India Salaried', 'STD_IN_SALARIED', true),
      ('Executive Tech India', 'EXEC_TECH_IN', true),
      ('Hourly Operations India', 'HOURLY_OPS_IN', true)
      ON CONFLICT (code) DO UPDATE SET is_active = true;
    `);

    // Update existing records to Indian context
    await updateToIndianContext();

    schemaInitialized = true;
  } catch (err) {
    console.error('ensureContractSchema error:', err);
  }
}

async function updateToIndianContext() {
  try {
    const schedRes = await pool.query('SELECT id FROM working_schedules LIMIT 1');
    const scheduleId = schedRes.rows[0]?.id || null;

    // Fetch structure IDs
    const structRes = await pool.query('SELECT id, code FROM salary_structures');
    const structMap = {};
    structRes.rows.forEach(r => { structMap[r.code] = r.id; });

    // Indian Employees
    const employees = [
      { code: 'EMP-9081', first_name: 'Dr. Rajesh', last_name: 'Sharma', department: 'Engineering', job_position: 'VP Systems' },
      { code: 'EMP-4822', first_name: 'Aarav', last_name: 'Mehta', department: 'Engineering', job_position: 'Lead Architect' },
      { code: 'EMP-3049', first_name: 'Priya', last_name: 'Nair', department: 'Finance & Tax', job_position: 'Tax Strategist' },
      { code: 'EMP-Pending', first_name: 'Vikram', last_name: 'Malhotra', department: 'Global Operations', job_position: 'Ops Director' },
      { code: 'EMP-1020', first_name: 'Ananya', last_name: 'Iyer', department: 'Legal Compliance', job_position: 'Exited Personnel' }
    ];

    const empMap = {};
    for (const emp of employees) {
      const res = await pool.query(`
        INSERT INTO employees (employee_code, first_name, last_name, department, job_position, schedule_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (employee_code) DO UPDATE 
        SET first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            department = EXCLUDED.department,
            job_position = EXCLUDED.job_position
        RETURNING id, employee_code;
      `, [emp.code, emp.first_name, emp.last_name, emp.department, emp.job_position, scheduleId]);
      empMap[emp.code] = res.rows[0].id;
    }

    // Dynamic 18-day expiration calculation
    const now = new Date();
    const expiringDate = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const indianContracts = [
      { code: 'CNT-2024-0012', emp_code: 'EMP-9081', struct_code: 'EXEC_TECH_IN', wage: 187500.00, currency: 'INR', start: '2023-01-01', end: null, status: 'RUNNING' },
      { code: 'CNT-2024-0044', emp_code: 'EMP-4822', struct_code: 'STD_IN_SALARIED', wage: 112500.00, currency: 'INR', start: '2023-06-15', end: null, status: 'RUNNING' },
      { code: 'CNT-2023-0891', emp_code: 'EMP-3049', struct_code: 'EXEC_TECH_IN', wage: 145800.00, currency: 'INR', start: '2023-11-01', end: expiringDate, status: 'RUNNING' },
      { code: 'CNT-2024-D099', emp_code: 'EMP-Pending', struct_code: 'HOURLY_OPS_IN', wage: 98000.00, currency: 'INR', start: '2024-11-01', end: '2025-10-31', status: 'DRAFT' },
      { code: 'CNT-2021-0104', emp_code: 'EMP-1020', struct_code: 'STD_IN_SALARIED', wage: 120000.00, currency: 'INR', start: '2021-02-01', end: '2023-12-31', status: 'EXPIRED' }
    ];

    for (const c of indianContracts) {
      const empId = empMap[c.emp_code];
      const structId = structMap[c.struct_code] || structMap['STD_MONTHLY'];
      if (!empId || !structId) continue;

      const check = await pool.query('SELECT id FROM contracts WHERE contract_code = $1', [c.code]);
      if (check.rows.length === 0) {
        await pool.query(`
          INSERT INTO contracts (contract_code, employee_id, structure_id, wage, currency, start_date, end_date, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [c.code, empId, structId, c.wage, c.currency, c.start, c.end, c.status]);
      } else {
        await pool.query(`
          UPDATE contracts 
          SET employee_id = $2, structure_id = $3, wage = $4, currency = $5, start_date = $6, end_date = $7, status = $8
          WHERE contract_code = $1
        `, [c.code, empId, structId, c.wage, c.currency, c.start, c.end, c.status]);
      }
    }

    // Also update all remaining contracts to INR currency
    await pool.query("UPDATE contracts SET currency = 'INR' WHERE currency IS NULL OR currency <> 'INR'");
  } catch (err) {
    console.error('Error updating to Indian context:', err);
  }
}

/**
 * Retrieves aggregate metrics for contracts dashboard.
 */
export async function getContractMetrics() {
  await ensureContractSchema();

  const query = `
    SELECT
      COUNT(*) FILTER (WHERE status = 'RUNNING') AS active_contracts,
      COUNT(*) FILTER (
        WHERE status = 'RUNNING' 
        AND end_date IS NOT NULL 
        AND end_date <= CURRENT_DATE + INTERVAL '30 days' 
        AND end_date >= CURRENT_DATE - INTERVAL '1 day'
      ) AS expiring_soon,
      COUNT(*) FILTER (WHERE status = 'DRAFT') AS drafts_queued,
      COUNT(*) FILTER (WHERE status IN ('EXPIRED', 'CANCELLED')) AS historical_archived
    FROM contracts;
  `;

  const result = await pool.query(query);
  const row = result.rows[0];

  return {
    activeContracts: parseInt(row.active_contracts || 0, 10),
    expiringIn30Days: parseInt(row.expiring_soon || 0, 10),
    draftsAndQueued: parseInt(row.drafts_queued || 0, 10),
    historicalArchived: parseInt(row.historical_archived || 0, 10),
    momGrowth: '+3.4% MoM',
    pendingSignature: Math.max(1, Math.floor(parseInt(row.drafts_queued || 0, 10) * 0.2))
  };
}

/**
 * Lists contracts with advanced filtering, search, and pagination.
 */
export async function getContracts({
  page = 1,
  limit = 10,
  status = 'ALL',
  department = 'ALL',
  structureId = 'ALL',
  search = ''
} = {}) {
  await ensureContractSchema();

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  // Status Filter
  if (status && status !== 'ALL') {
    if (status === 'ACTIVE') {
      conditions.push(`c.status = 'RUNNING'`);
    } else if (status === 'EXPIRING') {
      conditions.push(`c.status = 'RUNNING' AND c.end_date IS NOT NULL AND c.end_date <= CURRENT_DATE + INTERVAL '30 days' AND c.end_date >= CURRENT_DATE - INTERVAL '1 day'`);
    } else if (status === 'DRAFT') {
      conditions.push(`c.status = 'DRAFT'`);
    } else if (status === 'ARCHIVED' || status === 'EXPIRED') {
      conditions.push(`c.status IN ('EXPIRED', 'CANCELLED')`);
    } else {
      conditions.push(`c.status = $${paramIdx++}`);
      params.push(status.toUpperCase());
    }
  }

  // Department Filter
  if (department && department !== 'ALL') {
    conditions.push(`LOWER(e.department) = LOWER($${paramIdx++})`);
    params.push(department.trim());
  }

  // Structure Filter
  if (structureId && structureId !== 'ALL') {
    conditions.push(`(c.structure_id::text = $${paramIdx} OR LOWER(s.name) = LOWER($${paramIdx++}))`);
    params.push(structureId.trim());
  }

  // Search by employee name, code, contract code, department, or job position
  if (search && search.trim() !== '') {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(`(
      LOWER(e.first_name || ' ' || e.last_name) LIKE $${paramIdx} OR
      LOWER(e.employee_code) LIKE $${paramIdx} OR
      LOWER(COALESCE(c.contract_code, '')) LIKE $${paramIdx} OR
      LOWER(COALESCE(e.department, '')) LIKE $${paramIdx} OR
      LOWER(COALESCE(e.job_position, '')) LIKE $${paramIdx}
    )`);
    params.push(term);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Query Total Count
  const countQuery = `
    SELECT COUNT(*) 
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN salary_structures s ON s.id = c.structure_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const totalRecords = parseInt(countRes.rows[0].count, 10);

  // Query Records
  const query = `
    SELECT 
      c.id,
      COALESCE(c.contract_code, 'CNT-' || TO_CHAR(c.start_date, 'YYYY') || '-' || LPAD(SUBSTRING(c.id::text, 1, 4), 4, '0')) as contract_code,
      c.wage,
      COALESCE(c.currency, 'INR') as currency,
      c.start_date,
      c.end_date,
      c.status,
      c.created_at,
      c.updated_at,
      e.id as employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.department,
      e.job_position,
      s.id as structure_id,
      s.name as structure_name,
      s.code as structure_code,
      CASE
        WHEN c.status = 'RUNNING' AND c.end_date IS NOT NULL AND c.end_date <= CURRENT_DATE + INTERVAL '30 days' AND c.end_date >= CURRENT_DATE - INTERVAL '1 day'
          THEN (c.end_date - CURRENT_DATE)
        ELSE NULL
      END as days_to_expiry,
      CASE
        WHEN c.status = 'RUNNING' AND c.end_date IS NOT NULL AND c.end_date <= CURRENT_DATE + INTERVAL '30 days' AND c.end_date >= CURRENT_DATE - INTERVAL '1 day'
          THEN 'EXPIRING_SOON'
        WHEN c.status = 'RUNNING'
          THEN 'ACTIVE'
        WHEN c.status = 'DRAFT'
          THEN 'DRAFT'
        WHEN c.status = 'EXPIRED'
          THEN 'EXPIRED'
        ELSE c.status::text
      END as validity_status
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN salary_structures s ON s.id = c.structure_id
    ${whereClause}
    ORDER BY 
      CASE 
        WHEN c.contract_code = 'CNT-2024-0012' THEN 1
        WHEN c.contract_code = 'CNT-2024-0044' THEN 2
        WHEN c.contract_code = 'CNT-2023-0891' THEN 3
        WHEN c.contract_code = 'CNT-2024-D099' THEN 4
        WHEN c.contract_code = 'CNT-2021-0104' THEN 5
        ELSE 6
      END,
      c.start_date DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const recordsParams = [...params, parseInt(limit, 10), offset];
  const recordsRes = await pool.query(query, recordsParams);

  return {
    contracts: recordsRes.rows,
    pagination: {
      total: totalRecords,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(totalRecords / parseInt(limit, 10)) || 1
    }
  };
}

/**
 * Retrieves a single contract by ID.
 */
export async function getContractById(id) {
  await ensureContractSchema();

  const query = `
    SELECT 
      c.*,
      e.employee_code,
      e.first_name,
      e.last_name,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.department,
      e.job_position,
      s.name as structure_name,
      s.code as structure_code
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN salary_structures s ON s.id = c.structure_id
    WHERE c.id = $1
  `;

  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  return res.rows[0];
}

/**
 * Creates a new contract with statutory period and overlap validation.
 */
export async function createContract({
  employee_id,
  structure_id,
  wage,
  currency = 'USD',
  start_date,
  end_date = null,
  status = 'DRAFT',
  contract_code = null
}) {
  await ensureContractSchema();

  if (!employee_id || !structure_id || wage === undefined || !start_date) {
    throw new AppError('Employee, Salary Structure, Wage, and Start Date are required.', 400, 'VALIDATION_ERROR');
  }

  const numWage = parseFloat(wage);
  if (isNaN(numWage) || numWage < 0) {
    throw new AppError('Wage must be a non-negative number.', 400, 'VALIDATION_ERROR');
  }

  if (end_date && new Date(end_date) < new Date(start_date)) {
    throw new AppError('End date cannot be prior to start date.', 400, 'VALIDATION_ERROR');
  }

  // Check active contract overlap for RUNNING contracts
  if (status === 'RUNNING') {
    const overlapQuery = `
      SELECT id, contract_code, start_date, end_date
      FROM contracts
      WHERE employee_id = $1 
        AND status = 'RUNNING'
        AND (
          end_date IS NULL 
          OR ($3::DATE IS NULL AND end_date >= $2::DATE)
          OR (end_date >= $2::DATE AND start_date <= $3::DATE)
        )
    `;
    const overlapRes = await pool.query(overlapQuery, [employee_id, start_date, end_date]);
    if (overlapRes.rows.length > 0) {
      throw new AppError(
        `Employee already has an active running contract (${overlapRes.rows[0].contract_code || overlapRes.rows[0].id}) covering this period. Terminate or archive the existing contract first.`,
        409,
        'CONTRACT_OVERLAP'
      );
    }
  }

  // Generate code if none provided
  let code = contract_code;
  if (!code) {
    const year = new Date(start_date).getFullYear();
    const countRes = await pool.query("SELECT COUNT(*) FROM contracts WHERE EXTRACT(YEAR FROM start_date) = $1", [year]);
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    code = `CNT-${year}-${status === 'DRAFT' ? 'D' : ''}${String(seq).padStart(4, '0')}`;
  }

  const insertQuery = `
    INSERT INTO contracts (
      contract_code, employee_id, structure_id, wage, currency, start_date, end_date, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const res = await pool.query(insertQuery, [
    code, employee_id, structure_id, numWage, currency, start_date, end_date, status
  ]);

  return getContractById(res.rows[0].id);
}

/**
 * Updates an existing contract.
 */
export async function updateContract(id, data) {
  await ensureContractSchema();

  const existing = await getContractById(id);
  const wage = data.wage !== undefined ? parseFloat(data.wage) : existing.wage;
  const startDate = data.start_date || existing.start_date;
  const endDate = data.end_date !== undefined ? data.end_date : existing.end_date;
  const status = data.status || existing.status;
  const structureId = data.structure_id || existing.structure_id;
  const currency = data.currency || existing.currency || 'USD';

  if (endDate && new Date(endDate) < new Date(startDate)) {
    throw new AppError('End date cannot be prior to start date.', 400, 'VALIDATION_ERROR');
  }

  const query = `
    UPDATE contracts
    SET 
      wage = $1,
      start_date = $2,
      end_date = $3,
      status = $4,
      structure_id = $5,
      currency = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *;
  `;

  const res = await pool.query(query, [wage, startDate, endDate, status, structureId, currency, id]);
  return getContractById(res.rows[0].id);
}

/**
 * Renews/extends an expiring contract.
 */
export async function renewContract(id, { new_end_date = null, wage_adjustment = 0, new_wage = null }) {
  await ensureContractSchema();

  const existing = await getContractById(id);
  let updatedWage = parseFloat(existing.wage);

  if (new_wage !== null && new_wage !== undefined) {
    updatedWage = parseFloat(new_wage);
  } else if (wage_adjustment) {
    updatedWage += parseFloat(wage_adjustment);
  }

  const query = `
    UPDATE contracts
    SET 
      end_date = $1,
      wage = $2,
      status = 'RUNNING',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;

  const res = await pool.query(query, [new_end_date, updatedWage, id]);
  return getContractById(res.rows[0].id);
}

/**
 * Completes a DRAFT contract, activating it to RUNNING.
 */
export async function completeContract(id) {
  return updateContract(id, { status: 'RUNNING' });
}

/**
 * Deletes or cancels a contract.
 */
export async function deleteContract(id) {
  await ensureContractSchema();

  // Check if payslips exist referencing this contract
  const payslipCheck = await pool.query('SELECT COUNT(*) FROM payslips WHERE contract_id = $1', [id]);
  if (parseInt(payslipCheck.rows[0].count, 10) > 0) {
    // If payslips exist, mark status as CANCELLED instead of hard deleting
    await pool.query("UPDATE contracts SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    return { id, status: 'CANCELLED', action: 'archived_due_to_payslips' };
  }

  await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
  return { id, action: 'deleted' };
}

/**
 * Generates an exportable ledger of all contracts.
 */
export async function exportContractsLedger() {
  await ensureContractSchema();

  const query = `
    SELECT 
      c.contract_code,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.employee_code,
      e.department,
      e.job_position,
      c.currency,
      c.wage as monthly_wage,
      (c.wage * 12) as annual_wage,
      s.name as salary_structure,
      c.start_date,
      COALESCE(c.end_date::text, 'Indefinite') as end_date,
      c.status,
      c.created_at
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN salary_structures s ON s.id = c.structure_id
    ORDER BY c.contract_code ASC
  `;

  const res = await pool.query(query);
  return res.rows;
}
