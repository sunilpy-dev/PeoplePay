import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Lists employees with search, department filtering, status filtering, and pagination.
 */
export const getEmployees = async ({ search = '', department = '', status = '', page = 1, limit = 50 } = {}) => {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(`(
      e.first_name ILIKE $${paramIndex} OR 
      e.last_name ILIKE $${paramIndex} OR 
      e.employee_code ILIKE $${paramIndex} OR 
      e.job_position ILIKE $${paramIndex} OR 
      e.department ILIKE $${paramIndex} OR
      u.email ILIKE $${paramIndex}
    )`);
    params.push(term);
    paramIndex++;
  }

  if (department && department.trim() && department !== 'All Departments') {
    conditions.push(`e.department = $${paramIndex}`);
    params.push(department.trim());
    paramIndex++;
  }

  if (status && status.trim() && status !== 'All Statuses') {
    if (status.toLowerCase() === 'active') {
      conditions.push(`e.is_active = TRUE`);
    } else if (status.toLowerCase() === 'inactive') {
      conditions.push(`e.is_active = FALSE`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM employees e 
    LEFT JOIN users u ON e.user_id = u.id 
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Employee list query (Excludes bank_account_no from list view for data security)
  const listQuery = `
    SELECT 
      e.id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position,
      e.manager_id,
      e.is_active,
      e.created_at,
      e.updated_at,
      u.email as user_email,
      CASE 
        WHEN m.id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
        ELSE NULL 
      END as manager_name,
      m.employee_code as manager_code
    FROM employees e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN employees m ON e.manager_id = m.id
    ${whereClause}
    ORDER BY e.created_at DESC, e.employee_code ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(parsedLimit, offset);
  const listRes = await pool.query(listQuery, params);

  return {
    employees: listRes.rows,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Retrieves full employee profile including manager details and bank information.
 */
export const getEmployeeById = async (id) => {
  if (!id) {
    throw new AppError('Employee ID is required.', 400, 'VALIDATION_ERROR');
  }

  const query = `
    SELECT 
      e.id,
      e.user_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position,
      e.manager_id,
      e.bank_account_no,
      e.bank_ifsc,
      e.is_active,
      e.created_at,
      e.updated_at,
      u.email as user_email,
      CASE 
        WHEN m.id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
        ELSE NULL 
      END as manager_name,
      m.employee_code as manager_code,
      m.job_position as manager_position
    FROM employees e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN employees m ON e.manager_id = m.id
    WHERE e.id = $1
  `;

  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  return res.rows[0];
};

/**
 * Creates a new employee master record.
 */
export const createEmployee = async (data) => {
  const {
    employee_code,
    first_name,
    last_name,
    department,
    job_position,
    manager_id,
    bank_account_no,
    bank_ifsc,
    is_active = true
  } = data;

  if (!employee_code || !first_name || !last_name || !department || !job_position) {
    throw new AppError('Please provide employee code, first name, last name, department, and job position.', 400, 'VALIDATION_ERROR');
  }

  // Check unique employee_code
  const existingCode = await pool.query('SELECT id FROM employees WHERE LOWER(employee_code) = LOWER($1)', [employee_code.trim()]);
  if (existingCode.rows.length > 0) {
    throw new AppError(`Employee code '${employee_code}' is already registered.`, 409, 'DUPLICATE_EMPLOYEE_CODE');
  }

  // Validate manager exists if provided
  if (manager_id) {
    const managerRes = await pool.query('SELECT id FROM employees WHERE id = $1', [manager_id]);
    if (managerRes.rows.length === 0) {
      throw new AppError('The assigned manager does not exist.', 400, 'INVALID_MANAGER');
    }
  }

  const insertQuery = `
    INSERT INTO employees (
      employee_code,
      first_name,
      last_name,
      department,
      job_position,
      manager_id,
      bank_account_no,
      bank_ifsc,
      is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    employee_code.trim(),
    first_name.trim(),
    last_name.trim(),
    department.trim(),
    job_position.trim(),
    manager_id || null,
    bank_account_no ? bank_account_no.trim() : null,
    bank_ifsc ? bank_ifsc.trim() : null,
    is_active !== false
  ];

  const result = await pool.query(insertQuery, values);
  return result.rows[0];
};

/**
 * Updates an existing employee profile.
 */
export const updateEmployee = async (id, data) => {
  if (!id) {
    throw new AppError('Employee ID is required.', 400, 'VALIDATION_ERROR');
  }

  // Check employee exists
  const existing = await pool.query('SELECT id, employee_code FROM employees WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  const {
    employee_code,
    first_name,
    last_name,
    department,
    job_position,
    manager_id,
    bank_account_no,
    bank_ifsc,
    is_active
  } = data;

  // Prevent self-manager assignment
  if (manager_id && manager_id === id) {
    throw new AppError('An employee cannot be assigned as their own manager.', 400, 'SELF_MANAGER_NOT_ALLOWED');
  }

  // Validate manager exists if provided
  if (manager_id) {
    const managerRes = await pool.query('SELECT id FROM employees WHERE id = $1', [manager_id]);
    if (managerRes.rows.length === 0) {
      throw new AppError('The assigned manager does not exist.', 400, 'INVALID_MANAGER');
    }
  }

  // Check unique employee code if changing
  if (employee_code && employee_code.trim().toLowerCase() !== existing.rows[0].employee_code.toLowerCase()) {
    const codeCheck = await pool.query('SELECT id FROM employees WHERE LOWER(employee_code) = LOWER($1) AND id != $2', [employee_code.trim(), id]);
    if (codeCheck.rows.length > 0) {
      throw new AppError(`Employee code '${employee_code}' is already in use by another employee.`, 409, 'DUPLICATE_EMPLOYEE_CODE');
    }
  }

  const updateQuery = `
    UPDATE employees SET
      employee_code = COALESCE($1, employee_code),
      first_name = COALESCE($2, first_name),
      last_name = COALESCE($3, last_name),
      department = COALESCE($4, department),
      job_position = COALESCE($5, job_position),
      manager_id = $6,
      bank_account_no = $7,
      bank_ifsc = $8,
      is_active = COALESCE($9, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *
  `;

  const values = [
    employee_code ? employee_code.trim() : null,
    first_name ? first_name.trim() : null,
    last_name ? last_name.trim() : null,
    department ? department.trim() : null,
    job_position ? job_position.trim() : null,
    manager_id !== undefined ? (manager_id || null) : existing.rows[0].manager_id,
    bank_account_no !== undefined ? (bank_account_no ? bank_account_no.trim() : null) : undefined,
    bank_ifsc !== undefined ? (bank_ifsc ? bank_ifsc.trim() : null) : undefined,
    is_active !== undefined ? is_active : null,
    id
  ];

  const result = await pool.query(updateQuery, values);
  return result.rows[0];
};

/**
 * Soft-deactivates an employee master record.
 */
export const deactivateEmployee = async (id) => {
  if (!id) {
    throw new AppError('Employee ID is required.', 400, 'VALIDATION_ERROR');
  }

  const check = await pool.query('SELECT id, is_active FROM employees WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  const updateRes = await pool.query(
    'UPDATE employees SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, employee_code, is_active',
    [id]
  );

  return updateRes.rows[0];
};

/**
 * Retrieves all distinct active departments with headcount stats.
 */
export const getDepartments = async () => {
  const query = `
    SELECT 
      department,
      COUNT(*) as total_employees,
      COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_employees
    FROM employees
    WHERE department IS NOT NULL AND department != ''
    GROUP BY department
    ORDER BY department ASC
  `;

  const res = await pool.query(query);

  const defaultDepts = ['Engineering', 'People', 'Product', 'Finance', 'Sales', 'Operations', 'Legal'];
  const existingNames = new Set(res.rows.map(r => r.department));

  const merged = [...res.rows];
  for (const dept of defaultDepts) {
    if (!existingNames.has(dept)) {
      merged.push({
        department: dept,
        total_employees: '0',
        active_employees: '0'
      });
    }
  }

  return merged.sort((a, b) => a.department.localeCompare(b.department));
};

/**
 * Retrieves active employees eligible for manager selection, excluding current employee ID.
 */
export const getEligibleManagers = async (excludeId = null) => {
  let query = `
    SELECT 
      id,
      employee_code,
      first_name,
      last_name,
      job_position,
      department
    FROM employees
    WHERE is_active = TRUE
  `;
  const params = [];

  if (excludeId) {
    query += ` AND id != $1`;
    params.push(excludeId);
  }

  query += ` ORDER BY first_name ASC, last_name ASC`;

  const res = await pool.query(query, params);
  return res.rows.map(m => ({
    id: m.id,
    employee_code: m.employee_code,
    name: `${m.first_name} ${m.last_name}`,
    job_position: m.job_position,
    department: m.department
  }));
};

/**
 * Retrieves aggregate employee statistics for KPI cards.
 */
export const getEmployeeStats = async () => {
  const query = `
    SELECT 
      COUNT(*)::int as total,
      COUNT(CASE WHEN is_active = TRUE THEN 1 END)::int as active,
      COUNT(CASE WHEN is_active = FALSE THEN 1 END)::int as inactive,
      COUNT(DISTINCT department)::int as departments
    FROM employees
  `;

  const res = await pool.query(query);
  const row = res.rows[0];

  return {
    total: parseInt(row.total || 0, 10),
    active: parseInt(row.active || 0, 10),
    inactive: parseInt(row.inactive || 0, 10),
    departments: parseInt(row.departments || 0, 10)
  };
};

