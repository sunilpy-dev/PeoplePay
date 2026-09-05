import { AppError } from './errorHandler.js';

/**
 * Role-Based Access Control (RBAC) Middleware Guard
 * @param  {...string} allowedRoles Roles allowed to access the route
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before checking permissions.', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role;

    // ADMIN always has full access
    if (userRole === 'ADMIN' || allowedRoles.includes(userRole)) {
      return next();
    }

    return next(new AppError(`Access denied. Role '${userRole}' is not authorized to access this resource.`, 403, 'FORBIDDEN'));
  };
};

/**
 * Convenience role sets
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE'
};

export const HR_ADMIN_ROLES = [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER];
export const PAYROLL_ADMIN_ROLES = [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER];
export const PAYROLL_MANAGER_ONLY = [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER];
