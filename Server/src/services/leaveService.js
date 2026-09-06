import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Fetch all available Leave Types
 */
export const getLeaveTypes = async () => {
  const result = await pool.query(
    `SELECT id, name, code, is_unpaid, created_at 
     FROM leave_types 
     ORDER BY is_unpaid ASC, name ASC`
  );
  return result.rows;
};

/**
 * Resolve own leave balances for the authenticated user
 */
export const getMyLeaveBalances = async (employeeId) => {
  if (!employeeId) {
    return {
      hasProfile: false,
      employeeId: null,
      balances: [],
      message: 'No employee profile is currently linked to this user account.'
    };
  }

  const query = `
    SELECT 
      lt.id as leave_type_id,
      lt.name as leave_type_name,
      lt.code as leave_type_code,
      lt.is_unpaid,
      COALESCE(la.id, NULL) as allocation_id,
      COALESCE(la.allocated_days, 0.00)::numeric as allocated_days,
      COALESCE(la.taken_days, 0.00)::numeric as taken_days,
      CASE 
        WHEN lt.is_unpaid THEN 999.00
        ELSE (COALESCE(la.allocated_days, 0.00) - COALESCE(la.taken_days, 0.00))::numeric 
      END as available_days,
      COALESCE(la.status, 'APPROVED') as allocation_status
    FROM leave_types lt
    LEFT JOIN leave_allocations la ON la.leave_type_id = lt.id AND la.employee_id = $1
    ORDER BY lt.is_unpaid ASC, lt.name ASC
  `;

  const result = await pool.query(query, [employeeId]);
  const balances = result.rows.map(row => ({
    ...row,
    allocated_days: parseFloat(row.allocated_days),
    taken_days: parseFloat(row.taken_days),
    available_days: parseFloat(row.available_days)
  }));

  return {
    hasProfile: true,
    employeeId,
    balances
  };
};

/**
 * Fetch leave balances for a specific employee with strict RBAC enforcement
 */
export const getLeaveBalances = async (targetEmployeeId, callerEmployeeId, callerRole) => {
  // If role is EMPLOYEE, prevent querying other employees' balances
  if (callerRole === 'EMPLOYEE') {
    if (targetEmployeeId && targetEmployeeId !== callerEmployeeId) {
      throw new AppError('Access denied. Employees can only view their own leave balances.', 403, 'FORBIDDEN');
    }
  }

  const resolvedId = targetEmployeeId || callerEmployeeId;

  if (!resolvedId) {
    return [];
  }

  const query = `
    SELECT 
      lt.id as leave_type_id,
      lt.name as leave_type_name,
      lt.code as leave_type_code,
      lt.is_unpaid,
      COALESCE(la.id, NULL) as allocation_id,
      COALESCE(la.allocated_days, 0.00)::numeric as allocated_days,
      COALESCE(la.taken_days, 0.00)::numeric as taken_days,
      CASE 
        WHEN lt.is_unpaid THEN 999.00
        ELSE (COALESCE(la.allocated_days, 0.00) - COALESCE(la.taken_days, 0.00))::numeric 
      END as available_days,
      COALESCE(la.status, 'APPROVED') as allocation_status
    FROM leave_types lt
    LEFT JOIN leave_allocations la ON la.leave_type_id = lt.id AND la.employee_id = $1
    ORDER BY lt.is_unpaid ASC, lt.name ASC
  `;

  const result = await pool.query(query, [resolvedId]);
  return result.rows.map(row => ({
    ...row,
    allocated_days: parseFloat(row.allocated_days),
    taken_days: parseFloat(row.taken_days),
    available_days: parseFloat(row.available_days)
  }));
};

/**
 * Fetch team balances across all employees (HR/Admin only)
 */
export const getTeamBalances = async () => {
  const query = `
    SELECT 
      e.id as employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      lt.id as leave_type_id,
      lt.name as leave_type_name,
      lt.code as leave_type_code,
      COALESCE(la.allocated_days, 0.00)::numeric as allocated_days,
      COALESCE(la.taken_days, 0.00)::numeric as taken_days,
      (COALESCE(la.allocated_days, 0.00) - COALESCE(la.taken_days, 0.00))::numeric as available_days
    FROM employees e
    CROSS JOIN leave_types lt
    LEFT JOIN leave_allocations la ON la.employee_id = e.id AND la.leave_type_id = lt.id
    WHERE e.is_active = true AND lt.is_unpaid = false
    ORDER BY e.first_name ASC, lt.name ASC
  `;

  const result = await pool.query(query);
  return result.rows.map(row => ({
    ...row,
    allocated_days: parseFloat(row.allocated_days),
    taken_days: parseFloat(row.taken_days),
    available_days: parseFloat(row.available_days)
  }));
};

/**
 * Fetch all leave allocations with employee metadata (Admin/HR view)
 */
export const getLeaveAllocations = async ({ employeeId, department, search, page = 1, limit = 50 }) => {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const conditions = [];
  const values = [];

  if (employeeId) {
    values.push(employeeId);
    conditions.push(`la.employee_id = $${values.length}`);
  }

  if (department) {
    values.push(department);
    conditions.push(`e.department = $${values.length}`);
  }

  if (search) {
    values.push(`%${search.trim()}%`);
    conditions.push(`(
      e.first_name ILIKE $${values.length} OR 
      e.last_name ILIKE $${values.length} OR 
      e.employee_code ILIKE $${values.length} OR
      lt.name ILIKE $${values.length}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM leave_allocations la
    JOIN employees e ON e.id = la.employee_id
    JOIN leave_types lt ON lt.id = la.leave_type_id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      la.id,
      la.employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position,
      la.leave_type_id,
      lt.name as leave_type_name,
      lt.code as leave_type_code,
      lt.is_unpaid,
      la.allocated_days::numeric,
      la.taken_days::numeric,
      (la.allocated_days - la.taken_days)::numeric as available_days,
      la.status,
      la.created_at,
      la.updated_at
    FROM leave_allocations la
    JOIN employees e ON e.id = la.employee_id
    JOIN leave_types lt ON lt.id = la.leave_type_id
    ${whereClause}
    ORDER BY e.first_name ASC, lt.name ASC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  values.push(parseInt(limit, 10), offset);
  const dataResult = await pool.query(dataQuery, values);

  return {
    allocations: dataResult.rows.map(row => ({
      ...row,
      allocated_days: parseFloat(row.allocated_days),
      taken_days: parseFloat(row.taken_days),
      available_days: parseFloat(row.available_days)
    })),
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    }
  };
};

/**
 * Grant or Update a leave allocation for an employee (Admin/HR only)
 */
export const createOrUpdateAllocation = async ({ employeeId, leaveTypeId, allocatedDays }) => {
  if (!employeeId || !leaveTypeId || allocatedDays === undefined || allocatedDays === null) {
    throw new AppError('Employee ID, Leave Type ID, and Allocated Days are required.', 400, 'VALIDATION_ERROR');
  }

  const days = parseFloat(allocatedDays);
  if (isNaN(days) || days < 0) {
    throw new AppError('Allocated days must be a non-negative number.', 400, 'VALIDATION_ERROR');
  }

  // Validate employee
  const empCheck = await pool.query('SELECT id, is_active FROM employees WHERE id = $1', [employeeId]);
  if (empCheck.rows.length === 0) {
    throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  // Validate leave type
  const typeCheck = await pool.query('SELECT id, is_unpaid FROM leave_types WHERE id = $1', [leaveTypeId]);
  if (typeCheck.rows.length === 0) {
    throw new AppError('Leave type not found.', 404, 'LEAVE_TYPE_NOT_FOUND');
  }

  const upsertQuery = `
    INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, taken_days, status)
    VALUES ($1, $2, $3, 0.00, 'APPROVED')
    ON CONFLICT (employee_id, leave_type_id)
    DO UPDATE SET 
      allocated_days = EXCLUDED.allocated_days,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const result = await pool.query(upsertQuery, [employeeId, leaveTypeId, days]);
  return result.rows[0];
};

/**
 * Resolves the designated approver for a leave request based on reporting hierarchy and RBAC
 */
export const resolveApprover = async (employeeId) => {
  // 1. Check if employee has a configured reporting manager
  const empRes = await pool.query(
    `SELECT id, manager_id, first_name, last_name 
     FROM employees 
     WHERE id = $1`,
    [employeeId]
  );

  if (empRes.rows.length === 0) {
    throw new AppError('Employee profile not found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  const employee = empRes.rows[0];

  // If manager is configured and not self
  if (employee.manager_id && employee.manager_id !== employeeId) {
    const mgrRes = await pool.query('SELECT id, is_active FROM employees WHERE id = $1', [employee.manager_id]);
    if (mgrRes.rows.length > 0 && mgrRes.rows[0].is_active) {
      return employee.manager_id;
    }
  }

  // 2. If no direct manager, resolve an active employee with an HR/Admin role who is not the requester
  const hrRes = await pool.query(
    `SELECT e.id, e.first_name, e.last_name, u.role
     FROM employees e
     JOIN users u ON u.id = e.user_id
     WHERE u.role IN ('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN', 'HR_PAYROLL_USER')
       AND e.id != $1
       AND e.is_active = true
     ORDER BY 
       CASE u.role 
         WHEN 'HR_MANAGER' THEN 1 
         WHEN 'HR_PAYROLL_MANAGER' THEN 2 
         WHEN 'ADMIN' THEN 3 
         ELSE 4 
       END ASC, e.created_at ASC
     LIMIT 1`,
    [employeeId]
  );

  if (hrRes.rows.length > 0) {
    return hrRes.rows[0].id;
  }

  // 3. Fallback to any other active employee who is not the requester
  const fallbackRes = await pool.query(
    `SELECT e.id FROM employees e WHERE e.id != $1 AND e.is_active = true LIMIT 1`,
    [employeeId]
  );

  if (fallbackRes.rows.length > 0) {
    return fallbackRes.rows[0].id;
  }

  // If no independent reviewer exists in the entire system, refuse auto-approval
  throw new AppError(
    'No eligible independent approver could be resolved. An independent reviewer is required to process leave requests.',
    422,
    'NO_APPROVER_AVAILABLE'
  );
};

/**
 * Query leave requests with role-based filtering
 */
export const getLeaveRequests = async ({ employeeId, status, department, search, currentEmployeeId, userRole, page = 1, limit = 50 }) => {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const conditions = [];
  const values = [];

  // Employee role can ONLY view their own leave requests
  if (userRole === 'EMPLOYEE') {
    if (!currentEmployeeId) {
      return { requests: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
    }
    values.push(currentEmployeeId);
    conditions.push(`lr.employee_id = $${values.length}`);
  } else if (employeeId) {
    values.push(employeeId);
    conditions.push(`lr.employee_id = $${values.length}`);
  }

  if (status) {
    values.push(status.toUpperCase());
    conditions.push(`lr.status = $${values.length}`);
  }

  if (department) {
    values.push(department);
    conditions.push(`e.department = $${values.length}`);
  }

  if (search) {
    values.push(`%${search.trim()}%`);
    conditions.push(`(
      e.first_name ILIKE $${values.length} OR 
      e.last_name ILIKE $${values.length} OR 
      e.employee_code ILIKE $${values.length} OR
      lt.name ILIKE $${values.length} OR
      lr.reason ILIKE $${values.length}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM leave_requests lr
    JOIN employees e ON e.id = lr.employee_id
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      lr.id,
      lr.employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position,
      lr.leave_type_id,
      lt.name as leave_type_name,
      lt.code as leave_type_code,
      lt.is_unpaid,
      lr.start_date,
      lr.end_date,
      lr.duration_days::numeric,
      lr.reason,
      lr.status,
      lr.approver_id,
      app.first_name as approver_first_name,
      app.last_name as approver_last_name,
      app.employee_code as approver_employee_code,
      lr.rejection_reason,
      lr.created_at,
      lr.updated_at
    FROM leave_requests lr
    JOIN employees e ON e.id = lr.employee_id
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    LEFT JOIN employees app ON app.id = lr.approver_id
    ${whereClause}
    ORDER BY lr.created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  values.push(parseInt(limit, 10), offset);
  const dataResult = await pool.query(dataQuery, values);

  return {
    requests: dataResult.rows.map(row => ({
      ...row,
      duration_days: parseFloat(row.duration_days)
    })),
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    }
  };
};

/**
 * Fetch a single leave request by ID
 */
export const getLeaveRequestById = async (id) => {
  const query = `
    SELECT 
      lr.id,
      lr.employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position,
      lr.leave_type_id,
      lt.name as leave_type_name,
      lt.code as leave_type_code,
      lt.is_unpaid,
      lr.start_date,
      lr.end_date,
      lr.duration_days::numeric,
      lr.reason,
      lr.status,
      lr.approver_id,
      app.first_name as approver_first_name,
      app.last_name as approver_last_name,
      app.employee_code as approver_employee_code,
      lr.rejection_reason,
      lr.created_at,
      lr.updated_at
    FROM leave_requests lr
    JOIN employees e ON e.id = lr.employee_id
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    LEFT JOIN employees app ON app.id = lr.approver_id
    WHERE lr.id = $1
  `;

  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) {
    throw new AppError('Leave request not found.', 404, 'NOT_FOUND');
  }

  return {
    ...result.rows[0],
    duration_days: parseFloat(result.rows[0].duration_days)
  };
};

/**
 * Submit a new Leave Request
 */
export const createLeaveRequest = async ({ employeeId, leaveTypeId, startDate, endDate, reason, currentEmployeeId, userRole }) => {
  // If role is EMPLOYEE, must request for themselves
  const targetEmployeeId = userRole === 'EMPLOYEE' ? currentEmployeeId : (employeeId || currentEmployeeId);

  if (!targetEmployeeId) {
    throw new AppError('An employee profile is required to request time off.', 404, 'EMPLOYEE_PROFILE_NOT_FOUND');
  }

  if (!leaveTypeId || !startDate || !endDate) {
    throw new AppError('Leave Type, Start Date, and End Date are mandatory.', 400, 'VALIDATION_ERROR');
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format provided.', 400, 'INVALID_DATE_FORMAT');
  }

  if (start > end) {
    throw new AppError('Start date cannot be after end date.', 400, 'INVALID_DATE_RANGE');
  }

  // Calculate inclusive calendar leave days on the backend
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (calculatedDays <= 0) {
    throw new AppError('Leave duration must be at least 1 day.', 400, 'INVALID_DURATION');
  }

  // Validate employee exists and is active
  const empRes = await pool.query('SELECT id, is_active, first_name, last_name FROM employees WHERE id = $1', [targetEmployeeId]);
  if (empRes.rows.length === 0) {
    throw new AppError('Employee profile not found.', 404, 'EMPLOYEE_PROFILE_NOT_FOUND');
  }
  if (!empRes.rows[0].is_active) {
    throw new AppError('Deactivated employees cannot request time off.', 403, 'EMPLOYEE_INACTIVE');
  }

  // Validate leave type
  const typeRes = await pool.query('SELECT id, name, code, is_unpaid FROM leave_types WHERE id = $1', [leaveTypeId]);
  if (typeRes.rows.length === 0) {
    throw new AppError('Invalid or nonexistent leave type.', 404, 'LEAVE_TYPE_NOT_FOUND');
  }
  const leaveType = typeRes.rows[0];

  // Balance Check for Paid Leaves
  if (!leaveType.is_unpaid) {
    const allocRes = await pool.query(
      `SELECT allocated_days, taken_days, (allocated_days - taken_days) as available_days
       FROM leave_allocations
       WHERE employee_id = $1 AND leave_type_id = $2`,
      [targetEmployeeId, leaveTypeId]
    );

    const availableDays = allocRes.rows.length > 0 ? parseFloat(allocRes.rows[0].available_days) : 0;

    if (availableDays < calculatedDays) {
      throw new AppError(
        `Insufficient leave balance. Available: ${availableDays} days, Requested: ${calculatedDays} days.`,
        422,
        'INSUFFICIENT_LEAVE_BALANCE'
      );
    }
  }

  // Overlapping request check
  const overlapQuery = `
    SELECT id, start_date, end_date, status
    FROM leave_requests
    WHERE employee_id = $1
      AND status IN ('SUBMITTED', 'APPROVED')
      AND NOT (end_date < $2 OR start_date > $3)
  `;
  const overlapRes = await pool.query(overlapQuery, [targetEmployeeId, startDate, endDate]);

  if (overlapRes.rows.length > 0) {
    throw new AppError(
      'An active or pending leave request already overlaps with these selected dates.',
      409,
      'OVERLAPPING_LEAVE_REQUEST'
    );
  }

  // Resolve designated approver using reporting hierarchy & RBAC
  const resolvedApproverId = await resolveApprover(targetEmployeeId);

  // Insert into PostgreSQL with SUBMITTED (pending) status
  const insertQuery = `
    INSERT INTO leave_requests (
      employee_id,
      leave_type_id,
      start_date,
      end_date,
      duration_days,
      reason,
      approver_id,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED')
    RETURNING *
  `;

  const insertResult = await pool.query(insertQuery, [
    targetEmployeeId,
    leaveTypeId,
    startDate,
    endDate,
    calculatedDays,
    reason?.trim() || null,
    resolvedApproverId
  ]);

  return insertResult.rows[0];
};

/**
 * Approve a pending leave request (HR/Admin only)
 */
export const approveLeaveRequest = async (requestId, callerEmployeeId, callerRole) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch request details with lock
    const reqRes = await client.query(
      `SELECT lr.*, lt.is_unpaid 
       FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.id = $1 
       FOR UPDATE`,
      [requestId]
    );

    if (reqRes.rows.length === 0) {
      throw new AppError('Leave request not found.', 404, 'NOT_FOUND');
    }

    const leaveReq = reqRes.rows[0];

    if (leaveReq.status !== 'SUBMITTED') {
      throw new AppError(
        `Only pending requests can be approved. Current status: ${leaveReq.status}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Strict Self-Approval Prevention
    if (callerEmployeeId && leaveReq.employee_id === callerEmployeeId) {
      throw new AppError(
        'Employees cannot approve their own leave requests. An independent approver is required.',
        400,
        'SELF_APPROVAL_NOT_ALLOWED'
      );
    }

    // Re-verify balance integrity before finalizing approval
    if (!leaveReq.is_unpaid) {
      const balanceRes = await client.query(
        `SELECT allocated_days, taken_days, (allocated_days - taken_days) as available_days
         FROM leave_allocations
         WHERE employee_id = $1 AND leave_type_id = $2
         FOR UPDATE`,
        [leaveReq.employee_id, leaveReq.leave_type_id]
      );

      const available = balanceRes.rows.length > 0 ? parseFloat(balanceRes.rows[0].available_days) : 0;
      if (available < parseFloat(leaveReq.duration_days)) {
        throw new AppError(
          `Cannot approve request: Insufficient remaining balance (Available: ${available}d, Requested: ${leaveReq.duration_days}d).`,
          422,
          'INSUFFICIENT_LEAVE_BALANCE'
        );
      }

      // Increment taken_days in leave_allocations
      await client.query(
        `UPDATE leave_allocations
         SET taken_days = taken_days + $1, updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $2 AND leave_type_id = $3`,
        [leaveReq.duration_days, leaveReq.employee_id, leaveReq.leave_type_id]
      );
    }

    // Update request status to APPROVED
    await client.query(
      `UPDATE leave_requests
       SET status = 'APPROVED', approver_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [callerEmployeeId || leaveReq.approver_id, requestId]
    );

    await client.query('COMMIT');

    return getLeaveRequestById(requestId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reject a pending leave request (HR/Admin only)
 */
export const rejectLeaveRequest = async (requestId, callerEmployeeId, rejectionReason, callerRole) => {
  const reqRes = await pool.query(
    `SELECT id, employee_id, status FROM leave_requests WHERE id = $1`,
    [requestId]
  );

  if (reqRes.rows.length === 0) {
    throw new AppError('Leave request not found.', 404, 'NOT_FOUND');
  }

  const leaveReq = reqRes.rows[0];

  if (leaveReq.status !== 'SUBMITTED') {
    throw new AppError(
      `Only pending requests can be rejected. Current status: ${leaveReq.status}`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Prevent self-rejection
  if (callerEmployeeId && leaveReq.employee_id === callerEmployeeId) {
    throw new AppError(
      'Employees cannot review or reject their own leave requests. An independent reviewer is required.',
      400,
      'SELF_APPROVAL_NOT_ALLOWED'
    );
  }

  const updateQuery = `
    UPDATE leave_requests
    SET status = 'REFUSED', approver_id = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;

  await pool.query(updateQuery, [
    callerEmployeeId || null,
    rejectionReason?.trim() || 'Request rejected by authorized reviewer.',
    requestId
  ]);

  return getLeaveRequestById(requestId);
};

/**
 * Cancel a pending leave request (Requester can cancel own request)
 */
export const cancelLeaveRequest = async (requestId, callerEmployeeId, userRole) => {
  const reqRes = await pool.query(
    `SELECT id, employee_id, status FROM leave_requests WHERE id = $1`,
    [requestId]
  );

  if (reqRes.rows.length === 0) {
    throw new AppError('Leave request not found.', 404, 'NOT_FOUND');
  }

  const leaveReq = reqRes.rows[0];

  // Employee can only cancel own requests
  if (userRole === 'EMPLOYEE' && leaveReq.employee_id !== callerEmployeeId) {
    throw new AppError('You are not authorized to cancel this leave request.', 403, 'FORBIDDEN');
  }

  if (leaveReq.status !== 'SUBMITTED') {
    throw new AppError('Only pending leave requests can be cancelled.', 400, 'CANNOT_CANCEL');
  }

  await pool.query(
    `UPDATE leave_requests 
     SET status = 'REFUSED', rejection_reason = 'Cancelled by requester', updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [requestId]
  );

  return { id: requestId, cancelled: true };
};
