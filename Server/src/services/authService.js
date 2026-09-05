import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Authenticates a user by email and password, issuing a JWT.
 */
export const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Please provide both email and password.', 400, 'VALIDATION_ERROR');
  }

  const query = `
    SELECT 
      u.id, 
      u.email, 
      u.password_hash, 
      u.role, 
      u.is_active,
      e.id as employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.department,
      e.job_position
    FROM users u
    LEFT JOIN employees e ON e.user_id = u.id
    WHERE LOWER(u.email) = LOWER($1)
  `;

  const result = await pool.query(query, [email.trim()]);

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'ACCOUNT_DEACTIVATED');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'jwt_secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee_id,
      employeeCode: user.employee_code,
      firstName: user.first_name,
      lastName: user.last_name,
      department: user.department,
      jobPosition: user.job_position,
      displayName: user.first_name ? `${user.first_name} ${user.last_name}` : user.email.split('@')[0]
    }
  };
};

/**
 * Returns role-specific permissions summary for the active session.
 */
export const getRolePermissions = (role) => {
  const permissions = {
    canManageEmployees: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'].includes(role),
    canManageContracts: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'].includes(role),
    canManageSchedules: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'].includes(role),
    canApproveLeaves: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'].includes(role),
    canExecutePayruns: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'].includes(role),
    canFinalizePayruns: ['ADMIN', 'HR_PAYROLL_MANAGER'].includes(role),
    canManageSalaryRules: ['ADMIN', 'HR_PAYROLL_MANAGER'].includes(role),
    canManageBudgets: ['ADMIN', 'HR_PAYROLL_MANAGER'].includes(role),
    canResolveGrievances: ['ADMIN', 'HR_PAYROLL_MANAGER'].includes(role),
    canViewOwnSelfService: true,
    isSystemAdmin: role === 'ADMIN'
  };

  return permissions;
};
