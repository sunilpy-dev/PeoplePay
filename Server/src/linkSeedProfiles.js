import pool from './config/db.js';

async function main() {
  try {
    await pool.query(`
      UPDATE employees 
      SET user_id = (SELECT id FROM users WHERE email = 'hr.manager@peoplepay360.com')
      WHERE employee_code = 'EMP-09228' AND user_id IS NULL;

      UPDATE employees 
      SET user_id = (SELECT id FROM users WHERE email = 'admin@peoplepay360.com')
      WHERE employee_code = 'EMP-08492' AND user_id IS NULL;

      UPDATE employees 
      SET user_id = (SELECT id FROM users WHERE email = 'payroll.manager@peoplepay360.com')
      WHERE employee_code = 'EMP-06041' AND user_id IS NULL;
    `);

    const types = await pool.query('SELECT id, code FROM leave_types');
    const annualId = types.rows.find(t => t.code === 'ANNUAL')?.id;
    const sickId = types.rows.find(t => t.code === 'SICK')?.id;

    const emps = await pool.query("SELECT id, employee_code FROM employees WHERE employee_code IN ('EMP-08492', 'EMP-09228', 'EMP-06041')");
    for (const emp of emps.rows) {
      if (annualId) {
        await pool.query(`
          INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, taken_days, status)
          VALUES ($1, $2, 25.00, 0.00, 'APPROVED')
          ON CONFLICT (employee_id, leave_type_id) DO NOTHING
        `, [emp.id, annualId]);
      }
      if (sickId) {
        await pool.query(`
          INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, taken_days, status)
          VALUES ($1, $2, 12.00, 0.00, 'APPROVED')
          ON CONFLICT (employee_id, leave_type_id) DO NOTHING
        `, [emp.id, sickId]);
      }
    }

    console.log('Linked users to employees and populated seed allocations successfully');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
