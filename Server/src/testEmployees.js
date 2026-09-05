import app from './app.js';
import pool from './config/db.js';

let server;

async function runEmployeeTests() {
  console.log('=== RUNNING PHASE 2 EMPLOYEE MASTER TESTS ===\n');

  await new Promise((resolve) => {
    server = app.listen(5098, () => {
      console.log('Test server listening on port 5098');
      resolve();
    });
  });

  const baseUrl = 'http://localhost:5098/api/v1';

  try {
    // 1. Authenticate as Admin
    console.log('1. Authenticating as ADMIN...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'Password@123' })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    console.log('Admin authenticated successfully.\n');

    // 2. List Employees
    console.log('2. Testing GET /employees ...');
    const listRes = await fetch(`${baseUrl}/employees`, { headers: authHeaders });
    const listData = await listRes.json();
    console.log('Status:', listRes.status, 'Total employees:', listData.pagination?.total);
    if (listRes.status !== 200 || !Array.isArray(listData.data)) {
      throw new Error('Failed to list employees');
    }

    // 3. Get Departments
    console.log('\n3. Testing GET /employees/departments ...');
    const deptsRes = await fetch(`${baseUrl}/employees/departments`, { headers: authHeaders });
    const deptsData = await deptsRes.json();
    console.log('Status:', deptsRes.status, 'Departments:', deptsData.data.map(d => d.department));
    if (deptsRes.status !== 200 || !Array.isArray(deptsData.data)) {
      throw new Error('Failed to get departments');
    }

    // 4. Get Managers
    console.log('\n4. Testing GET /employees/managers ...');
    const mgrsRes = await fetch(`${baseUrl}/employees/managers`, { headers: authHeaders });
    const mgrsData = await mgrsRes.json();
    console.log('Status:', mgrsRes.status, 'Available managers count:', mgrsData.data.length);
    if (mgrsRes.status !== 200 || !Array.isArray(mgrsData.data)) {
      throw new Error('Failed to get managers');
    }
    const sampleManagerId = mgrsData.data[0]?.id || null;

    // 4.1 Get Employee Statistics
    console.log('\n4.1 Testing GET /employees/stats ...');
    const statsRes = await fetch(`${baseUrl}/employees/stats`, { headers: authHeaders });
    const statsData = await statsRes.json();
    console.log('Status:', statsRes.status, 'Stats:', statsData.data);
    if (statsRes.status !== 200 || typeof statsData.data?.total !== 'number') {
      throw new Error('Failed to get employee statistics');
    }

    // 5. Create Employee
    console.log('\n5. Testing POST /employees (Create new employee) ...');
    const testCode = 'EMP-TEST-' + Math.floor(Math.random() * 10000);
    const createRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employee_code: testCode,
        first_name: 'Marcus',
        last_name: 'Brody',
        department: 'Engineering',
        job_position: 'Staff Systems Architect',
        manager_id: sampleManagerId,
        bank_account_no: '987654321098',
        bank_ifsc: 'HDFC0004321'
      })
    });
    const createData = await createRes.json();
    console.log('Create Status:', createRes.status, 'Created ID:', createData.data?.id);
    if (createRes.status !== 201 || !createData.data?.id) {
      throw new Error(`Failed to create employee: ${JSON.stringify(createData)}`);
    }
    const createdId = createData.data.id;

    // 6. Duplicate Employee Code Conflict
    console.log('\n6. Testing POST /employees with duplicate employee_code (Expect 409) ...');
    const dupRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employee_code: testCode,
        first_name: 'Duplicate',
        last_name: 'User',
        department: 'Engineering',
        job_position: 'Engineer'
      })
    });
    const dupData = await dupRes.json();
    console.log('Duplicate Status:', dupRes.status, 'Error Code:', dupData.code);
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409, got ${dupRes.status}`);
    }

    // 7. Prevent Self-Manager Assignment
    console.log('\n7. Testing PUT /employees/:id with self as manager (Expect 400) ...');
    const selfMgrRes = await fetch(`${baseUrl}/employees/${createdId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        manager_id: createdId
      })
    });
    const selfMgrData = await selfMgrRes.json();
    console.log('Self-Manager Status:', selfMgrRes.status, 'Error Code:', selfMgrData.code);
    if (selfMgrRes.status !== 400 || selfMgrData.code !== 'SELF_MANAGER_NOT_ALLOWED') {
      throw new Error(`Expected 400 SELF_MANAGER_NOT_ALLOWED, got ${selfMgrRes.status}`);
    }

    // 8. Update Employee & Bank Info
    console.log('\n8. Testing PUT /employees/:id (Update Profile & Bank Information) ...');
    const updateRes = await fetch(`${baseUrl}/employees/${createdId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        first_name: 'Marcus',
        last_name: 'Brody-Updated',
        department: 'Product',
        job_position: 'Principal Architect',
        bank_account_no: '11223344556677',
        bank_ifsc: 'SBIN0001234'
      })
    });
    const updateData = await updateRes.json();
    console.log('Update Status:', updateRes.status, 'Updated Department:', updateData.data?.department);
    if (updateRes.status !== 200 || updateData.data?.department !== 'Product') {
      throw new Error(`Failed to update employee: ${JSON.stringify(updateData)}`);
    }

    // 9. Get Employee Details
    console.log('\n9. Testing GET /employees/:id (Verify Profile & Bank info) ...');
    const detailRes = await fetch(`${baseUrl}/employees/${createdId}`, { headers: authHeaders });
    const detailData = await detailRes.json();
    console.log('Detail Status:', detailRes.status);
    console.log('Name:', `${detailData.data?.first_name} ${detailData.data?.last_name}`);
    console.log('Bank Account:', detailData.data?.bank_account_no);
    console.log('Bank IFSC:', detailData.data?.bank_ifsc);
    if (detailRes.status !== 200 || detailData.data?.bank_account_no !== '11223344556677') {
      throw new Error('Failed to retrieve updated employee details');
    }

    // 10. Search Employee
    console.log('\n10. Testing GET /employees?search=Brody ...');
    const searchRes = await fetch(`${baseUrl}/employees?search=Brody`, { headers: authHeaders });
    const searchData = await searchRes.json();
    console.log('Search Status:', searchRes.status, 'Results:', searchData.data?.length);
    if (searchRes.status !== 200 || searchData.data?.length === 0) {
      throw new Error('Employee search failed');
    }

    // 11. Soft Deactivate Employee
    console.log('\n11. Testing DELETE /employees/:id (Soft Deactivation) ...');
    const deleteRes = await fetch(`${baseUrl}/employees/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteData = await deleteRes.json();
    console.log('Delete Status:', deleteRes.status, 'is_active:', deleteData.data?.is_active);
    if (deleteRes.status !== 200 || deleteData.data?.is_active !== false) {
      throw new Error('Failed to deactivate employee');
    }

    // 12. Clean up test record from database safely
    await pool.query('DELETE FROM employees WHERE id = $1', [createdId]);
    console.log('Cleaned up test record.');

    console.log('\n>>> ALL PHASE 2 EMPLOYEE BACKEND TESTS PASSED! <<<\n');
  } finally {
    server.close();
    await pool.end();
  }
}

runEmployeeTests().catch(err => {
  console.error('Employee test error:', err);
  process.exit(1);
});
