import app from './app.js';
import pool from './config/db.js';

let server;

async function runGrievanceTests() {
  console.log('=== RUNNING GRIEVANCE WORKFLOW & RBAC INTEGRATION TESTS ===\n');

  await new Promise((resolve) => {
    server = app.listen(5099, () => {
      console.log('Test server listening on port 5099');
      resolve();
    });
  });

  const baseUrl = 'http://localhost:5099/api/v1';

  try {
    // 1. Authenticate as Employee (Sarah Connor)
    console.log('1. Authenticating as EMPLOYEE (sarah.connor@peoplepay360.com)...');
    const empLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.connor@peoplepay360.com', password: 'Password@123' })
    });
    const empData = await empLogin.json();
    const empToken = empData.data?.token;
    if (!empToken) throw new Error('Employee login failed');
    const empHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${empToken}` };
    console.log('   Employee authenticated successfully.');

    // 2. Authenticate as HR Payroll Manager (payroll.manager@peoplepay360.com)
    console.log('\n2. Authenticating as HR_PAYROLL_MANAGER (payroll.manager@peoplepay360.com)...');
    const hrLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'payroll.manager@peoplepay360.com', password: 'Password@123' })
    });
    const hrData = await hrLogin.json();
    const hrToken = hrData.data?.token;
    if (!hrToken) throw new Error('HR Payroll Manager login failed');
    const hrHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hrToken}` };
    console.log('   HR Payroll Manager authenticated successfully.');

    // 3. Authenticate as Admin (admin@peoplepay360.com)
    console.log('\n3. Authenticating as ADMIN (admin@peoplepay360.com)...');
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'Password@123' })
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.data?.token;
    const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };
    console.log('   Admin authenticated successfully.');

    // 4. Test: Employee SUBMIT Grievance -> MUST SUCCEED (201)
    console.log('\n4. Testing POST /grievances as EMPLOYEE...');
    const createRes = await fetch(`${baseUrl}/grievances`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        category: 'Overtime / Shift Differential Discrepancy',
        description: 'Missing 4 hours weekend overtime from October cycle.',
        requestedAdjustment: 120.00
      })
    });
    const createData = await createRes.json();
    console.log('   Status:', createRes.status, 'Ticket Code:', createData.data?.ticketCode);
    if (createRes.status !== 201 || !createData.data?.id) {
      throw new Error(`Failed: Employee was not able to submit grievance: ${JSON.stringify(createData)}`);
    }
    const createdGrievanceId = createData.data.id;

    // 5. Test: HR Payroll Manager SUBMIT Grievance -> MUST BE FORBIDDEN (403)
    console.log('\n5. Testing POST /grievances as HR_PAYROLL_MANAGER (RBAC Check)...');
    const hrCreateRes = await fetch(`${baseUrl}/grievances`, {
      method: 'POST',
      headers: hrHeaders,
      body: JSON.stringify({
        category: 'TDS / Income Tax Slab Calculation',
        description: 'Attempting to create grievance as HR Payroll Manager.',
        requestedAdjustment: 50.00
      })
    });
    const hrCreateData = await hrCreateRes.json();
    console.log('   Status:', hrCreateRes.status, 'Message:', hrCreateData.message);
    if (hrCreateRes.status !== 403) {
      throw new Error(`FAILED: HR Payroll Manager was expected to be forbidden (403), got ${hrCreateRes.status}`);
    }
    console.log('   SUCCESS: HR Payroll Manager is strictly prohibited from submitting grievances.');

    // 6. Test: HR Payroll Manager LIST Grievances -> MUST SUCCEED (200)
    console.log('\n6. Testing GET /grievances as HR_PAYROLL_MANAGER...');
    const hrListRes = await fetch(`${baseUrl}/grievances`, { headers: hrHeaders });
    const hrListData = await hrListRes.json();
    console.log('   Status:', hrListRes.status, 'Total grievances visible to HR:', hrListData.count);
    if (hrListRes.status !== 200 || !Array.isArray(hrListData.data)) {
      throw new Error('Failed to list grievances as HR Payroll Manager');
    }

    // 7. Test: HR Payroll Manager RESOLVE/APPROVE Grievance -> MUST SUCCEED (200)
    console.log('\n7. Testing PUT /grievances/:id/resolve as HR_PAYROLL_MANAGER...');
    const resolveRes = await fetch(`${baseUrl}/grievances/${createdGrievanceId}/resolve`, {
      method: 'PUT',
      headers: hrHeaders,
      body: JSON.stringify({ notes: 'Discrepancy verified against biometric logs. 4h overtime approved.' })
    });
    const resolveData = await resolveRes.json();
    console.log('   Status:', resolveRes.status, 'Updated Status:', resolveData.data?.status);
    if (resolveRes.status !== 200 || resolveData.data?.status !== 'RESOLVED') {
      throw new Error(`Failed to resolve grievance: ${JSON.stringify(resolveData)}`);
    }

    // 8. Test: Employee creates another grievance for rejection test
    console.log('\n8. Submitting second grievance for rejection test...');
    const create2Res = await fetch(`${baseUrl}/grievances`, {
      method: 'POST',
      headers: empHeaders,
      body: JSON.stringify({
        category: 'Unpaid Leave / LOP Calculation',
        description: 'Disputing 1 day LOP deduction.',
        requestedAdjustment: 80.00
      })
    });
    const create2Data = await create2Res.json();
    const grievance2Id = create2Data.data.id;

    // 9. Test: HR Payroll Manager REJECT Grievance -> MUST SUCCEED (200)
    console.log('\n9. Testing PUT /grievances/:id/reject as HR_PAYROLL_MANAGER...');
    const rejectRes = await fetch(`${baseUrl}/grievances/${grievance2Id}/reject`, {
      method: 'PUT',
      headers: hrHeaders,
      body: JSON.stringify({ reason: 'Unpaid leave confirmed in absence management logs.' })
    });
    const rejectData = await rejectRes.json();
    console.log('   Status:', rejectRes.status, 'Updated Status:', rejectData.data?.status);
    if (rejectRes.status !== 200 || rejectData.data?.status !== 'REJECTED') {
      throw new Error(`Failed to reject grievance: ${JSON.stringify(rejectData)}`);
    }

    console.log('\n========================================================');
    console.log('>>> ALL GRIEVANCE RBAC & WORKFLOW TESTS PASSED 100%! <<<');
    console.log('========================================================\n');
  } catch (err) {
    console.error('Test Suite Error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
}

runGrievanceTests();
