import pool from './config/db.js';

async function check() {
  try {
    const res = await pool.query(`
      SELECT u.email, u.role, e.id as employee_id, e.employee_code, e.first_name, e.last_name
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      ORDER BY u.role, u.email
    `);
    console.table(res.rows);

    const slips = await pool.query(`
      SELECT ps.id, ps.employee_id, e.employee_code, e.first_name, p.name as payrun_name
      FROM payslips ps
      JOIN employees e ON e.id = ps.employee_id
      JOIN payruns p ON p.id = ps.payrun_id
    `);
    console.log('Total payslips in DB:', slips.rows.length);
    console.table(slips.rows);

    const attendances = await pool.query(`
      SELECT a.id, a.employee_id, e.employee_code, e.first_name, a.check_in, a.check_out
      FROM attendances a
      JOIN employees e ON e.id = a.employee_id
    `);
    console.log('Total attendance records in DB:', attendances.rows.length);
    console.table(attendances.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
