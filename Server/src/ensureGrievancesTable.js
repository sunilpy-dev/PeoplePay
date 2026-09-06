import pool from './config/db.js';

export async function ensureGrievancesTable() {
  try {
    // 1. Create enum if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grievance_status') THEN
          CREATE TYPE grievance_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
        END IF;
      END
      $$;
    `);

    // 2. Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grievances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_code VARCHAR(20) UNIQUE NOT NULL,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        payslip_id UUID REFERENCES payslips(id) ON DELETE SET NULL,
        payrun_id UUID REFERENCES payruns(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        requested_adjustment DECIMAL(12,2) DEFAULT 0.00,
        status grievance_status DEFAULT 'PENDING',
        resolution_notes TEXT,
        resolved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_grievances_employee_id ON grievances(employee_id);
      CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
      CREATE INDEX IF NOT EXISTS idx_grievances_ticket_code ON grievances(ticket_code);
    `);

    // 3. Seed demonstration grievance if table empty
    const checkRes = await pool.query('SELECT COUNT(*) as count FROM grievances');
    if (parseInt(checkRes.rows[0].count, 10) === 0) {
      const empRes = await pool.query("SELECT id FROM employees WHERE employee_code = 'EMP-1102' OR employee_code = 'EMP-1001' LIMIT 1");
      if (empRes.rows.length > 0) {
        const empId = empRes.rows[0].id;
        await pool.query(`
          INSERT INTO grievances (
            ticket_code,
            employee_id,
            category,
            description,
            requested_adjustment,
            status
          ) VALUES (
            'GRV-8812',
            $1,
            'Overtime / Shift Differential Discrepancy',
            'Disputed weekend shift differential. Claims 12 hours night surcharge missing from Oct 19 Sunday rotation.',
            240.00,
            'PENDING'
          )
        `, [empId]);
        console.log('Seeded initial demonstration grievance (GRV-8812).');
      }
    }

    console.log('PostgreSQL grievances schema ready.');
  } catch (err) {
    console.error('Error ensuring grievances table:', err.message);
  }
}

if (process.argv[1].endsWith('ensureGrievancesTable.js')) {
  ensureGrievancesTable().then(() => process.exit(0));
}
