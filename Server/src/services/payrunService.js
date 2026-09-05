import pool from '../config/db.js';
import { computeEmployeePayslip } from '../engine/salaryEngine.js';

export const payrunService = {
  /**
   * Get all payruns with aggregated metrics
   */
  async getAllPayruns() {
    await this.seedInitialPayrunIfEmpty();

    const query = `
      SELECT 
        p.id,
        p.name,
        p.structure_id,
        s.name as structure_name,
        s.code as structure_code,
        p.period_start,
        p.period_end,
        p.status,
        p.created_at,
        p.updated_at,
        COUNT(ps.id)::int as payslip_count,
        COALESCE(SUM(ps.gross), 0)::numeric as total_gross,
        COALESCE(SUM(ps.deductions), 0)::numeric as total_deductions,
        COALESCE(SUM(ps.net_salary), 0)::numeric as total_net
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      LEFT JOIN payslips ps ON p.id = ps.payrun_id
      GROUP BY p.id, s.name, s.code
      ORDER BY p.created_at DESC
    `;
    const res = await pool.query(query);
    return res.rows;
  },

  /**
   * Get single payrun with all generated payslips and line items
   */
  async getPayrunById(id) {
    const payrunRes = await pool.query(`
      SELECT 
        p.*,
        s.name as structure_name,
        s.code as structure_code
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      WHERE p.id = $1
    `, [id]);

    if (payrunRes.rows.length === 0) return null;

    const payslipsRes = await pool.query(`
      SELECT 
        ps.*,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.department,
        e.job_position,
        e.bank_account_no,
        e.bank_ifsc
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      WHERE ps.payrun_id = $1
      ORDER BY e.first_name ASC
    `, [id]);

    // Fetch lines for these payslips
    const slipIds = payslipsRes.rows.map(s => s.id);
    let linesBySlipId = {};
    if (slipIds.length > 0) {
      const linesRes = await pool.query(`
        SELECT * FROM payslip_lines 
        WHERE payslip_id = ANY($1::uuid[])
        ORDER BY payslip_id, rule_code ASC
      `, [slipIds]);

      for (const line of linesRes.rows) {
        if (!linesBySlipId[line.payslip_id]) {
          linesBySlipId[line.payslip_id] = [];
        }
        linesBySlipId[line.payslip_id].push(line);
      }
    }

    const payslips = payslipsRes.rows.map(s => ({
      ...s,
      lines: linesBySlipId[s.id] || []
    }));

    return {
      ...payrunRes.rows[0],
      payslips
    };
  },

  /**
   * Create a new payrun in DRAFT state
   */
  async createPayrun({ name, structure_id, period_start, period_end }) {
    const res = await pool.query(`
      INSERT INTO payruns (name, structure_id, period_start, period_end, status)
      VALUES ($1, $2, $3, $4, 'DRAFT')
      RETURNING *
    `, [name, structure_id, period_start, period_end]);
    return res.rows[0];
  },

  /**
   * Execute Production Calculation Engine for all eligible employees in the Payrun
   */
  async computePayrun(payrunId) {
    const payrunRes = await pool.query('SELECT * FROM payruns WHERE id = $1', [payrunId]);
    if (payrunRes.rows.length === 0) {
      const err = new Error('Payrun not found');
      err.statusCode = 404;
      throw err;
    }
    const payrun = payrunRes.rows[0];

    // Fetch rules for this structure
    const rulesRes = await pool.query(
      'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
      [payrun.structure_id]
    );
    const rules = rulesRes.rows;

    // Fetch eligible active employees with contracts
    const contractsRes = await pool.query(`
      SELECT 
        c.id as contract_id,
        c.wage,
        c.currency,
        c.status as contract_status,
        e.id as employee_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.department,
        e.bank_account_no,
        e.bank_ifsc,
        s.weekly_hours
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN working_schedules s ON e.schedule_id = s.id
      WHERE (c.structure_id = $1 OR c.status = 'RUNNING')
        AND e.is_active = TRUE
    `, [payrun.structure_id]);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Remove previously generated payslips for this payrun to allow recomputation
      await client.query('DELETE FROM payslips WHERE payrun_id = $1', [payrunId]);

      const computedSlips = [];

      for (const row of contractsRes.rows) {
        // Attendance simulation (22 scheduled days, 22 worked days)
        const attendance = {
          scheduledDays: 22,
          workedDays: 22,
          unpaidLeaveDays: 0,
          overtimeHours: 4 // Standard baseline
        };

        const calc = computeEmployeePayslip({
          employee: { id: row.employee_id, first_name: row.first_name, last_name: row.last_name },
          contract: { id: row.contract_id, wage: row.wage },
          schedule: { weekly_hours: row.weekly_hours || 40 },
          attendance,
          rules
        });

        // Insert Payslip
        const slipRes = await client.query(`
          INSERT INTO payslips (
            payrun_id, employee_id, contract_id, 
            worked_days, unpaid_leave_days, overtime_hours,
            basic, gross, deductions, net_salary, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'COMPUTED')
          RETURNING id
        `, [
          payrunId,
          row.employee_id,
          row.contract_id,
          calc.worked_days,
          calc.unpaid_leave_days,
          calc.overtime_hours,
          calc.basic,
          calc.gross,
          calc.deductions,
          calc.net_salary
        ]);

        const slipId = slipRes.rows[0].id;

        // Insert Lines
        for (const line of calc.lines) {
          await client.query(`
            INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, amount)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            slipId,
            line.rule_code,
            line.rule_name,
            line.category,
            line.amount
          ]);
        }

        computedSlips.push({
          employeeName: `${row.first_name} ${row.last_name}`,
          netSalary: calc.net_salary
        });
      }

      // Update Payrun Status to COMPUTED
      await client.query(`
        UPDATE payruns 
        SET status = 'COMPUTED', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [payrunId]);

      await client.query('COMMIT');

      return {
        payrunId,
        status: 'COMPUTED',
        totalComputed: computedSlips.length,
        employees: computedSlips
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Auto seed an initial payrun if empty so the screen is immediately informative
   */
  async seedInitialPayrunIfEmpty() {
    const checkRes = await pool.query('SELECT count(*) FROM payruns');
    if (parseInt(checkRes.rows[0].count, 10) === 0) {
      // Pick first structure
      const structRes = await pool.query('SELECT id FROM salary_structures ORDER BY created_at ASC LIMIT 1');
      if (structRes.rows.length > 0) {
        const structureId = structRes.rows[0].id;
        const newPayrun = await pool.query(`
          INSERT INTO payruns (name, structure_id, period_start, period_end, status)
          VALUES ('PR-2024-11-M • November 2024 Regular Payrun', $1, '2024-11-01', '2024-11-30', 'DRAFT')
          RETURNING id
        `, [structureId]);

        // Auto compute it
        try {
          await this.computePayrun(newPayrun.rows[0].id);
        } catch (e) {
          console.error('Initial payrun auto-compute notice:', e.message);
        }
      }
    }
  }
};

export default payrunService;
