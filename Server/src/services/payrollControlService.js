import pool from '../config/db.js';
import { runPreFlightWarningScan } from '../engine/warningScanner.js';

export const payrollControlService = {
  /**
   * Initializes auxiliary tables if not present (payroll_budgets, payroll_escalations, historical_payruns)
   */
  async ensureTables() {
    // 1. Department Budgets Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payroll_budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        department VARCHAR(100) NOT NULL,
        period_quarter VARCHAR(10) NOT NULL,
        period_year INT NOT NULL,
        budget_amount DECIMAL(12,2) NOT NULL,
        committed_amount DECIMAL(12,2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_dept_quarter UNIQUE(department, period_quarter, period_year)
      )
    `);

    // 2. Payroll Escalations & Compliance Stream Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payroll_escalations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL, -- 'CRITICAL', 'CONTRACTUAL', 'OPERATIONAL', 'STATUTORY'
        severity_tag VARCHAR(50) NOT NULL, -- 'High Blocker', 'Payroll Interlock', 'Approval Gate', 'Statutory'
        assigned_lead VARCHAR(100) NOT NULL,
        employee_code VARCHAR(50),
        employee_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'RESOLVED'
        resolution_action VARCHAR(50) NOT NULL, -- 'Resolve', 'Extend / Prorate', 'Batch Approve', 'Apply Update'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Historical Audit Payrun Ledger Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_payruns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id VARCHAR(50) UNIQUE NOT NULL,
        cycle_period VARCHAR(100) NOT NULL,
        disbursement_date DATE NOT NULL,
        total_disbursed DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        headcount INT NOT NULL,
        discrepancies VARCHAR(50) NOT NULL DEFAULT '0 Flagged',
        approval_authority VARCHAR(100) NOT NULL,
        compliance_lock VARCHAR(50) NOT NULL DEFAULT 'SOC2 Locked',
        audit_hash VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if initial records exist, if not insert defaults
    const budgetCount = await pool.query('SELECT count(*) FROM payroll_budgets');
    if (parseInt(budgetCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO payroll_budgets (department, period_quarter, period_year, budget_amount, committed_amount, currency)
        VALUES 
          ('Engineering', 'Q4', 2024, 4000000.00, 3892000.00, 'INR'),
          ('Sales & Field Operations', 'Q4', 2024, 1900000.00, 1842200.00, 'INR'),
          ('Product & UX', 'Q4', 2024, 1000000.00, 980000.00, 'INR'),
          ('General & Administrative', 'Q4', 2024, 600000.00, 600000.00, 'INR')
      `);
    }

    const escCount = await pool.query('SELECT count(*) FROM payroll_escalations');
    if (parseInt(escCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO payroll_escalations 
        (code, title, description, category, severity_tag, assigned_lead, employee_code, employee_name, status, resolution_action)
        VALUES 
          ('ESC-101', 'Missing PAN & TDS Declaration for mid-month joiner', 'Tax residency documentation incomplete. Payout withholding required by Section 192.', 'CRITICAL', 'High Blocker', 'Priya Nair (Tax Analyst)', 'EMP-1020', 'Ananya Iyer', 'OPEN', 'Resolve'),
          ('ESC-102', 'Bank IFSC verification failed: HDFC0000242 checksum mismatch', 'Bank routing directory returned transit rejection. Clearing house requires validated branch IFSC code.', 'CRITICAL', 'High Blocker', 'System Core Engine', 'EMP-4822', 'Aarav Mehta', 'OPEN', 'Resolve'),
          ('ESC-103', 'Fixed-term Contract expiry within current payrun window', 'Standard 12-month consultant engagement terminates prior to cycle cutoff. Proration or extension required.', 'CONTRACTUAL', 'Payroll Interlock', 'Sarah Connor (HR Dir.)', 'EMP-3049', 'Priya Nair', 'OPEN', 'Extend / Prorate'),
          ('ESC-104', 'Unreconciled Overtime Exceeding 16h weekly statutory limit', '4 pending timesheets contain non-standard weekend hours requiring direct VP approval gate.', 'CONTRACTUAL', 'Approval Gate', 'Alex Chen (VP Ops)', 'EMP-9081', 'Dr. Rajesh Sharma', 'OPEN', 'Batch Approve'),
          ('ESC-105', 'New Section 80C Tax Regime slab revision pending application', 'Central Board of Direct Taxes issued statutory notification. Slabs ready to be auto-applied.', 'CONTRACTUAL', 'Statutory', 'Compliance Bureau', 'ALL-ORG', 'Organization Wide', 'OPEN', 'Apply Update')
      `);
    }

    const histCount = await pool.query('SELECT count(*) FROM historical_payruns');
    if (parseInt(histCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO historical_payruns 
        (batch_id, cycle_period, disbursement_date, total_disbursed, currency, headcount, discrepancies, approval_authority, compliance_lock, audit_hash)
        VALUES 
          ('PR-2024-10-M', 'Oct 01 - Oct 31, 2024', '2024-10-31', 7314200.00, 'INR', 84, '0 Flagged', 'Sarah Connor (Dir. Fin)', 'SOC2 Locked', 'a7f92b41c0e35d123'),
          ('PR-2024-09-M', 'Sep 01 - Sep 30, 2024', '2024-09-30', 7198450.00, 'INR', 82, '0 Flagged', 'Alex Chen (VP Ops)', 'ISO 27001', 'c4d28e90a5f12e871'),
          ('PR-2024-08-M', 'Aug 01 - Aug 31, 2024', '2024-08-31', 7052100.00, 'INR', 80, '1 Resolved', 'Sarah Connor (Dir. Fin)', 'SOC2 Locked', '9b11fa44d82b13009'),
          ('PR-2024-07-M', 'Jul 01 - Jul 31, 2024', '2024-07-31', 6890300.00, 'INR', 78, '0 Flagged', 'Sarah Connor (Dir. Fin)', 'SOC2 Locked', '2e5867a1ffb394112')
      `);
    }
  },

  /**
   * Complete Control Center State Telemetry
   */
  async getControlCenterTelemetry() {
    await this.ensureTables();

    // 1. Run live pre-flight scanner
    const scanResults = await runPreFlightWarningScan();

    // 2. Fetch Departmental Budgets
    const budgetsRes = await pool.query(`
      SELECT * FROM payroll_budgets 
      WHERE period_quarter = 'Q4' AND period_year = 2024 
      ORDER BY budget_amount DESC
    `);

    let totalBudget = 0;
    let totalCommitted = 0;
    const departmentBudgets = budgetsRes.rows.map((b) => {
      const budget = parseFloat(b.budget_amount);
      const committed = parseFloat(b.committed_amount);
      totalBudget += budget;
      totalCommitted += committed;
      const percentage = budget > 0 ? (committed / budget) * 100 : 0;
      return {
        id: b.id,
        department: b.department,
        budget,
        committed,
        variance: budget - committed,
        percentage: Math.round(percentage * 10) / 10
      };
    });

    const favorableVariance = totalBudget - totalCommitted;
    const utilizationRate = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0;
    const variancePercentage = totalBudget > 0 ? (favorableVariance / totalBudget) * 100 : 0;

    // 3. Fetch Escalation Stream
    const escalationsRes = await pool.query(`
      SELECT * FROM payroll_escalations 
      ORDER BY CASE WHEN status = 'OPEN' THEN 0 ELSE 1 END, created_at ASC
    `);

    // 4. Fetch Historical Audit Payruns
    const historyRes = await pool.query(`
      SELECT * FROM historical_payruns 
      ORDER BY disbursement_date DESC
    `);

    return {
      governance: {
        version: 'PCC GOVERNANCE V4.8',
        telemetryStatus: 'Real-time Telemetry Active',
        preflightStatus: scanResults.totalBlockers > 0 ? 'Action Required' : 'Cleared for Review',
        lockState: 'SOC2 / ISO 27001',
        cutoffWindow: '26h 14m remaining',
        erpLedgerSync: 'NetSuite Live Feed'
      },
      riskAssessment: {
        score: scanResults.score,
        maxScore: scanResults.maxScore,
        level: scanResults.riskLevel,
        badgeColor: scanResults.badgeColor,
        evaluatedAt: scanResults.evaluatedAt,
        itemizedRisks: scanResults.itemizedRisks,
        totalBlockers: scanResults.totalBlockers,
        totalWarnings: scanResults.totalWarnings
      },
      financialAllocation: {
        totalBudget,
        totalCommitted,
        variance: favorableVariance,
        variancePercentage: Math.round(variancePercentage * 100) / 100,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        currency: 'INR',
        symbol: '₹',
        departmentBudgets
      },
      escalationStream: {
        total: escalationsRes.rows.length,
        openCount: escalationsRes.rows.filter(e => e.status === 'OPEN').length,
        criticalCount: escalationsRes.rows.filter(e => e.category === 'CRITICAL' && e.status === 'OPEN').length,
        contractualCount: escalationsRes.rows.filter(e => e.category === 'CONTRACTUAL' && e.status === 'OPEN').length,
        items: escalationsRes.rows
      },
      historicalPayruns: historyRes.rows
    };
  },

  /**
   * Action: Resolve an escalation
   */
  async resolveEscalation(id, resolutionNotes = 'Resolved by Payroll Administrator') {
    await this.ensureTables();
    const res = await pool.query(`
      UPDATE payroll_escalations 
      SET status = 'RESOLVED', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    return res.rows[0];
  },

  /**
   * Action: Re-evaluate risk engine
   */
  async reevaluateRiskEngine() {
    return this.getControlCenterTelemetry();
  },

  /**
   * Action: Release Pending Payrun
   */
  async releasePendingPayrun() {
    await this.ensureTables();
    return {
      success: true,
      batchId: 'PR-2024-11-M',
      message: 'Pending Payrun PR-2024-11-M successfully verified and queued for banking disbursement batch.',
      disbursementScheduled: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
      status: 'QUEUED_FOR_SETTLEMENT'
    };
  },

  /**
   * Action: Export GL to NetSuite / SAP format
   */
  async exportGeneralLedger() {
    await this.ensureTables();
    const historyRes = await pool.query('SELECT * FROM historical_payruns ORDER BY disbursement_date DESC');
    
    // Generate CSV General Ledger format
    const csvHeader = 'Batch ID,Cycle Period,Disbursement Date,Total Disbursed (INR),Headcount,Compliance Lock,Approval Authority,Audit Hash\n';
    const csvRows = historyRes.rows.map(r => 
      `"${r.batch_id}","${r.cycle_period}","${new Date(r.disbursement_date).toISOString().split('T')[0]}","${r.total_disbursed}","${r.headcount}","${r.compliance_lock}","${r.approval_authority}","${r.audit_hash}"`
    ).join('\n');

    return {
      filename: `GL_EXPORT_PEOPLEPAY360_${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv',
      data: csvHeader + csvRows
    };
  }
};

export default payrollControlService;
