import app from './app.js';
import pool from './config/db.js';

let server;

async function runTests() {
  console.log('=== RUNNING BACKEND AUTH VERIFICATION TESTS ===\n');

  await new Promise((resolve) => {
    server = app.listen(5099, () => {
      console.log('Test server listening on port 5099');
      resolve();
    });
  });

  const baseUrl = 'http://localhost:5099/api/v1';

  try {
    // 1. Health check
    console.log('1. Testing GET /health ...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('Health check status:', healthRes.status, healthData.status);
    if (healthRes.status !== 200 || healthData.status !== 'healthy') {
      throw new Error('Health check failed');
    }

    // 2. Invalid login
    console.log('\n2. Testing POST /auth/login with invalid password ...');
    const invalidLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'WrongPassword' })
    });
    const invalidData = await invalidLoginRes.json();
    console.log('Invalid login status:', invalidLoginRes.status, invalidData.message);
    if (invalidLoginRes.status !== 401) {
      throw new Error(`Expected 401 for invalid login, got ${invalidLoginRes.status}`);
    }

    // 3. Admin login
    console.log('\n3. Testing POST /auth/login for ADMIN user ...');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'Password@123' })
    });
    const adminData = await adminLoginRes.json();
    console.log('Admin login status:', adminLoginRes.status);
    console.log('User role:', adminData.data?.user?.role);
    console.log('Token received:', adminData.data?.token ? 'YES' : 'NO');
    if (adminLoginRes.status !== 200 || !adminData.data?.token) {
      throw new Error('Admin login failed');
    }

    const adminToken = adminData.data.token;

    // 4. Test GET /auth/me with Admin token
    console.log('\n4. Testing GET /auth/me with valid Bearer token ...');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const meData = await meRes.json();
    console.log('Auth Me status:', meRes.status);
    console.log('User email:', meData.data?.user?.email);
    console.log('Permissions summary:', Object.keys(meData.data?.permissions || {}));
    if (meRes.status !== 200 || meData.data?.user?.email !== 'admin@peoplepay360.com') {
      throw new Error('/auth/me verification failed');
    }

    // 5. Test HR Payroll Manager Login
    console.log('\n5. Testing POST /auth/login for HR_PAYROLL_MANAGER ...');
    const payrollRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'payroll.manager@peoplepay360.com', password: 'Password@123' })
    });
    const payrollData = await payrollRes.json();
    console.log('Payroll Manager status:', payrollRes.status, 'Role:', payrollData.data?.user?.role);
    if (payrollRes.status !== 200 || payrollData.data?.user?.role !== 'HR_PAYROLL_MANAGER') {
      throw new Error('HR Payroll Manager login failed');
    }

    // 6. Test Employee Login (Sarah Connor)
    console.log('\n6. Testing POST /auth/login for EMPLOYEE (Sarah Connor) ...');
    const empRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.connor@peoplepay360.com', password: 'Password@123' })
    });
    const empData = await empRes.json();
    console.log('Employee status:', empRes.status, 'Employee Code:', empData.data?.user?.employeeCode, 'Role:', empData.data?.user?.role);
    if (empRes.status !== 200 || empData.data?.user?.employeeCode !== 'EMP-1001') {
      throw new Error('Employee profile linkage failed');
    }

    // 7. Test Logout endpoint
    console.log('\n7. Testing POST /auth/logout ...');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const logoutData = await logoutRes.json();
    console.log('Logout status:', logoutRes.status, logoutData.message);
    if (logoutRes.status !== 200) {
      throw new Error('Logout failed');
    }

    // 8. Test 401 unauthorized on protected route without token
    console.log('\n8. Testing GET /auth/me without token (expect 401) ...');
    const unauthRes = await fetch(`${baseUrl}/auth/me`);
    console.log('Unauthenticated status:', unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }

    // 9. Quick Role Verification Tests
    console.log('\n=== QUICK ROLE VERIFICATION TESTS ===\n');

    // 9.1 HR credentials + HR Payroll expected (Match -> 200)
    console.log('9.1 Testing HR credentials + HR_PAYROLL_MANAGER expected (expect 200) ...');
    const hrMatchRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'payroll.manager@peoplepay360.com',
        password: 'Password@123',
        expectedRole: 'HR_PAYROLL_MANAGER'
      })
    });
    const hrMatchData = await hrMatchRes.json();
    console.log('HR Match status:', hrMatchRes.status, 'Success:', hrMatchData.success);
    if (hrMatchRes.status !== 200 || !hrMatchData.data?.token) {
      throw new Error('HR Payroll verification failed for matching role');
    }

    // 9.2 Employee credentials + Employee expected (Match -> 200)
    console.log('9.2 Testing Employee credentials + EMPLOYEE expected (expect 200) ...');
    const empMatchRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.connor@peoplepay360.com',
        password: 'Password@123',
        expectedRole: 'EMPLOYEE'
      })
    });
    const empMatchData = await empMatchRes.json();
    console.log('Employee Match status:', empMatchRes.status, 'Success:', empMatchData.success);
    if (empMatchRes.status !== 200 || !empMatchData.data?.token) {
      throw new Error('Employee verification failed for matching role');
    }

    // 9.3 Employee credentials + HR Payroll expected (Mismatch -> 403 ROLE_MISMATCH)
    console.log('9.3 Testing Employee credentials + HR_PAYROLL_MANAGER expected (expect 403 ROLE_MISMATCH) ...');
    const empMismatchRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.connor@peoplepay360.com',
        password: 'Password@123',
        expectedRole: 'HR_PAYROLL_MANAGER'
      })
    });
    const empMismatchData = await empMismatchRes.json();
    console.log('Mismatch status:', empMismatchRes.status, 'Code:', empMismatchData.code, 'Message:', empMismatchData.message);
    if (empMismatchRes.status !== 403 || empMismatchData.code !== 'ROLE_MISMATCH' || empMismatchData.token) {
      throw new Error('Expected 403 ROLE_MISMATCH for employee accessing HR role');
    }

    // 9.4 HR credentials + Employee expected (Mismatch -> 403 ROLE_MISMATCH)
    console.log('9.4 Testing HR credentials + EMPLOYEE expected (expect 403 ROLE_MISMATCH) ...');
    const hrMismatchRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'payroll.manager@peoplepay360.com',
        password: 'Password@123',
        expectedRole: 'EMPLOYEE'
      })
    });
    const hrMismatchData = await hrMismatchRes.json();
    console.log('Mismatch status:', hrMismatchRes.status, 'Code:', hrMismatchData.code, 'Message:', hrMismatchData.message);
    if (hrMismatchRes.status !== 403 || hrMismatchData.code !== 'ROLE_MISMATCH') {
      throw new Error('Expected 403 ROLE_MISMATCH for HR accessing Employee role');
    }

    // 9.5 Wrong password with expectedRole (Password fail -> 401 INVALID_CREDENTIALS, no role leak)
    console.log('9.5 Testing Wrong Password with expectedRole (expect 401, no role leak) ...');
    const wrongPwRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.connor@peoplepay360.com',
        password: 'WrongPassword',
        expectedRole: 'HR_PAYROLL_MANAGER'
      })
    });
    const wrongPwData = await wrongPwRes.json();
    console.log('Wrong Password status:', wrongPwRes.status, 'Code:', wrongPwData.code, 'Message:', wrongPwData.message);
    if (wrongPwRes.status !== 401 || wrongPwData.code !== 'INVALID_CREDENTIALS') {
      throw new Error('Expected 401 INVALID_CREDENTIALS when password is wrong');
    }

    // 9.6 Admin credentials + Global Admin expected (Match -> 200)
    console.log('9.6 Testing Admin credentials + ADMIN expected (expect 200) ...');
    const adminMatchRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@peoplepay360.com',
        password: 'Password@123',
        expectedRole: 'ADMIN'
      })
    });
    const adminMatchData = await adminMatchRes.json();
    console.log('Admin Match status:', adminMatchRes.status, 'Role:', adminMatchData.data?.user?.role);
    if (adminMatchRes.status !== 200 || adminMatchData.data?.user?.role !== 'ADMIN') {
      throw new Error('Admin verification failed for matching role');
    }

    console.log('\n>>> ALL BACKEND AUTH & QUICK ROLE VERIFICATION TESTS PASSED SUCCESSFULLY! <<<\n');
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
