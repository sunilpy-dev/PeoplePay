import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || ''));

/**
 * Resolves employee ID for authenticated user
 */
const resolveEmployeeId = async (user) => {
  if (typeof user === 'string') {
    if (isUuid(user)) return user;
    const codeRes = await pool.query('SELECT id FROM employees WHERE employee_code = $1 LIMIT 1', [user]);
    if (codeRes.rows.length > 0) return codeRes.rows[0].id;
    return null;
  }
  if (user?.employeeId && isUuid(user.employeeId)) return user.employeeId;
  if (user?.id && isUuid(user.id)) {
    const userEmpRes = await pool.query('SELECT id FROM employees WHERE user_id = $1 LIMIT 1', [user.id]);
    if (userEmpRes.rows.length > 0) return userEmpRes.rows[0].id;
  }
  if (user?.email) {
    const emailEmpRes = await pool.query(
      `SELECT e.id FROM employees e 
       JOIN users u ON u.id = e.user_id 
       WHERE u.email = $1 LIMIT 1`,
      [user.email]
    );
    if (emailEmpRes.rows.length > 0) return emailEmpRes.rows[0].id;
  }
  return null;
};

/**
 * Generates a unique grievance ticket code (e.g. GRV-8812)
 */
const generateTicketCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = `GRV-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await pool.query('SELECT id FROM grievances WHERE ticket_code = $1 LIMIT 1', [code]);
    if (existing.rows.length === 0) return code;
  }
  return `GRV-${Date.now().toString().slice(-6)}`;
};

/**
 * 1. Submit a Grievance Ticket
 * RESTRICTION: HR_PAYROLL_MANAGER is strictly forbidden from submitting grievances.
 */
export const createGrievanceService = async (data, user) => {
  // STRICT RBAC CHECK: HR Payroll Managers must NOT submit grievances
  if (user?.role === 'HR_PAYROLL_MANAGER') {
    throw new AppError(
      'Access denied. HR Payroll Managers are not authorized to submit grievances. Grievances can only be raised by employees.',
      403,
      'FORBIDDEN'
    );
  }

  const employeeId = await resolveEmployeeId(user);
  if (!employeeId) {
    throw new AppError('An active employee profile is required to raise a payslip grievance.', 400, 'EMPLOYEE_REQUIRED');
  }

  const {
    category,
    description,
    payslipId,
    payrunId,
    requestedAdjustment
  } = data;

  if (!category || !description || !description.trim()) {
    throw new AppError('Category and detailed description are required to submit a grievance.', 400, 'VALIDATION_ERROR');
  }

  // Validate UUIDs if provided
  const validPayslipId = payslipId && isUuid(payslipId) ? payslipId : null;
  const validPayrunId = payrunId && isUuid(payrunId) ? payrunId : null;
  const adjustmentVal = parseFloat(requestedAdjustment || 0) || 0.00;
  const ticketCode = await generateTicketCode();

  const insertQuery = `
    INSERT INTO grievances (
      ticket_code,
      employee_id,
      payslip_id,
      payrun_id,
      category,
      description,
      requested_adjustment,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
    RETURNING *
  `;

  const result = await pool.query(insertQuery, [
    ticketCode,
    employeeId,
    validPayslipId,
    validPayrunId,
    category.trim(),
    description.trim(),
    adjustmentVal
  ]);

  return await getGrievanceByIdService(result.rows[0].id, user);
};

/**
 * 2. Get list of grievances
 * Scoped by role: Employees see their own; HR/Admin see all across org
 */
export const getGrievancesService = async (user, filters = {}) => {
  const isEmployee = user?.role === 'EMPLOYEE';
  let employeeId = null;

  if (isEmployee) {
    employeeId = await resolveEmployeeId(user);
    if (!employeeId) {
      return [];
    }
  }

  let query = `
    SELECT 
      g.id,
      g.ticket_code,
      g.category,
      g.description,
      g.requested_adjustment,
      g.status,
      g.resolution_notes,
      g.resolved_at,
      g.created_at,
      g.updated_at,
      e.id as employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position,
      p.id as payrun_id,
      p.name as payrun_name,
      p.period_start,
      p.period_end,
      ps.id as payslip_id,
      ps.net_salary as payslip_net
    FROM grievances g
    INNER JOIN employees e ON e.id = g.employee_id
    LEFT JOIN payruns p ON p.id = g.payrun_id
    LEFT JOIN payslips ps ON ps.id = g.payslip_id
    WHERE 1=1
  `;

  const params = [];

  if (isEmployee && employeeId) {
    params.push(employeeId);
    query += ` AND g.employee_id = $${params.length}`;
  }

  if (filters.status) {
    params.push(filters.status);
    query += ` AND g.status = $${params.length}`;
  }

  if (filters.payrunId && isUuid(filters.payrunId)) {
    params.push(filters.payrunId);
    query += ` AND g.payrun_id = $${params.length}`;
  }

  query += ` ORDER BY g.created_at DESC`;

  const { rows } = await pool.query(query, params);

  return rows.map((r) => ({
    id: r.id,
    ticketCode: r.ticket_code,
    category: r.category,
    description: r.description,
    requestedAdjustment: parseFloat(r.requested_adjustment || 0),
    status: r.status,
    resolutionNotes: r.resolution_notes,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    employee: {
      id: r.employee_id,
      code: r.employee_code,
      name: `${r.first_name} ${r.last_name}`,
      department: r.department,
      jobPosition: r.job_position,
      initials: `${(r.first_name || '')[0] || ''}${(r.last_name || '')[0] || ''}`.toUpperCase()
    },
    payrun: r.payrun_id ? {
      id: r.payrun_id,
      name: r.payrun_name,
      periodStart: r.period_start,
      periodEnd: r.period_end
    } : null,
    payslip: r.payslip_id ? {
      id: r.payslip_id,
      netSalary: parseFloat(r.payslip_net || 0)
    } : null
  }));
};

/**
 * 3. Get single grievance details by ID
 */
export const getGrievanceByIdService = async (id, user) => {
  if (!id) {
    throw new AppError('Grievance ID is required.', 400, 'VALIDATION_ERROR');
  }

  const query = `
    SELECT 
      g.id,
      g.ticket_code,
      g.category,
      g.description,
      g.requested_adjustment,
      g.status,
      g.resolution_notes,
      g.resolved_at,
      g.created_at,
      g.updated_at,
      e.id as employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position,
      p.id as payrun_id,
      p.name as payrun_name,
      p.period_start,
      p.period_end,
      ps.id as payslip_id,
      ps.net_salary as payslip_net
    FROM grievances g
    INNER JOIN employees e ON e.id = g.employee_id
    LEFT JOIN payruns p ON p.id = g.payrun_id
    LEFT JOIN payslips ps ON ps.id = g.payslip_id
    WHERE (g.id::text = $1 OR g.ticket_code = $1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [id]);

  if (rows.length === 0) {
    throw new AppError('Grievance ticket not found.', 404, 'NOT_FOUND');
  }

  const r = rows[0];

  // RBAC ownership guard for EMPLOYEE role
  if (user?.role === 'EMPLOYEE') {
    const empId = await resolveEmployeeId(user);
    if (r.employee_id !== empId) {
      throw new AppError('You do not have authorization to view this grievance.', 403, 'FORBIDDEN');
    }
  }

  return {
    id: r.id,
    ticketCode: r.ticket_code,
    category: r.category,
    description: r.description,
    requestedAdjustment: parseFloat(r.requested_adjustment || 0),
    status: r.status,
    resolutionNotes: r.resolution_notes,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    employee: {
      id: r.employee_id,
      code: r.employee_code,
      name: `${r.first_name} ${r.last_name}`,
      department: r.department,
      jobPosition: r.job_position,
      initials: `${(r.first_name || '')[0] || ''}${(r.last_name || '')[0] || ''}`.toUpperCase()
    },
    payrun: r.payrun_id ? {
      id: r.payrun_id,
      name: r.payrun_name,
      periodStart: r.period_start,
      periodEnd: r.period_end
    } : null,
    payslip: r.payslip_id ? {
      id: r.payslip_id,
      netSalary: parseFloat(r.payslip_net || 0)
    } : null
  };
};

/**
 * 4. Resolve / Approve a Grievance Ticket
 * ALLOWED for: ADMIN, HR_PAYROLL_MANAGER, HR_MANAGER
 */
export const resolveGrievanceService = async (id, resolutionData, user) => {
  const allowedRoles = ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER'];
  if (!user || !allowedRoles.includes(user.role)) {
    throw new AppError('Access denied. You do not have permission to resolve grievances.', 403, 'FORBIDDEN');
  }

  const existing = await getGrievanceByIdService(id, user);
  if (existing.status === 'RESOLVED') {
    throw new AppError('Grievance ticket is already marked as resolved.', 400, 'ALREADY_RESOLVED');
  }

  const resolverEmployeeId = await resolveEmployeeId(user);
  const notes = resolutionData?.notes || 'Adjustment verified and approved during pre-payroll validation review.';

  const updateQuery = `
    UPDATE grievances
    SET 
      status = 'RESOLVED',
      resolution_notes = $1,
      resolved_by = $2,
      resolved_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;

  await pool.query(updateQuery, [notes, resolverEmployeeId, existing.id]);
  return await getGrievanceByIdService(existing.id, user);
};

/**
 * 5. Reject a Grievance Ticket
 * ALLOWED for: ADMIN, HR_PAYROLL_MANAGER, HR_MANAGER
 */
export const rejectGrievanceService = async (id, rejectData, user) => {
  const allowedRoles = ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER'];
  if (!user || !allowedRoles.includes(user.role)) {
    throw new AppError('Access denied. You do not have permission to reject grievances.', 403, 'FORBIDDEN');
  }

  const existing = await getGrievanceByIdService(id, user);
  const resolverEmployeeId = await resolveEmployeeId(user);
  const reason = rejectData?.reason || 'Discrepancy reviewed and found to be compliant with standard payroll schedule.';

  const updateQuery = `
    UPDATE grievances
    SET 
      status = 'REJECTED',
      resolution_notes = $1,
      resolved_by = $2,
      resolved_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;

  await pool.query(updateQuery, [reason, resolverEmployeeId, existing.id]);
  return await getGrievanceByIdService(existing.id, user);
};
