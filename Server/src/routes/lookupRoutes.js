import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// List active employees for assignment dropdowns
router.get('/employees', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        employee_code, 
        first_name, 
        last_name, 
        (first_name || ' ' || last_name) as name, 
        department, 
        job_position
      FROM employees 
      WHERE is_active = true 
      ORDER BY first_name ASC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// List salary structures for contract assignment
router.get('/structures', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, name, code, is_active, base_wage
      FROM salary_structures
      WHERE is_active = true
      ORDER BY name ASC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// List unique departments
router.get('/departments', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT department
      FROM employees
      WHERE department IS NOT NULL AND department <> ''
      ORDER BY department ASC
    `);

    res.status(200).json({
      success: true,
      data: result.rows.map(r => r.department)
    });
  } catch (err) {
    next(err);
  }
});

export default router;
