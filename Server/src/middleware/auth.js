import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import pool from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. No token provided.', 401, 'UNAUTHORIZED'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');

    // Fetch fresh user record and associated employee details if any
    const userQuery = `
      SELECT 
        u.id, 
        u.email, 
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
      WHERE u.id = $1
    `;
    const result = await pool.query(userQuery, [decoded.id]);

    if (result.rows.length === 0) {
      return next(new AppError('The user associated with this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return next(new AppError('This user account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    req.user = {
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
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
    }
    next(error);
  }
};
