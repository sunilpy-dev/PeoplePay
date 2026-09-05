import app from './app.js';
import pool from './config/db.js';

let server;

async function runContractTests() {
  console.log('=== RUNNING PHASE 3 CONTRACT & SCHEDULE INTEGRATION TESTS ===\n');

  await new Promise((resolve) => {
    server = app.listen(5098, () => {
      console.log('Test server listening on port 5098');
      resolve();
    });
  });

  const baseUrl = 'http://localhost:5098/api/v1';

  try {
    // 1. Authenticate
    console.log('1. Authenticating as Admin...');
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
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('   Authenticated successfully.');

    // 2. Test GET /contracts/metrics
    console.log('\n2. Testing GET /contracts/metrics ...');
    const metricsRes = await fetch(`${baseUrl}/contracts/metrics`, { headers: authHeaders });
    const metricsData = await metricsRes.json();
    console.log('   Metrics response:', metricsData.data);
    if (metricsRes.status !== 200 || !metricsData.data?.activeContracts) {
      throw new Error('Metrics endpoint failed');
    }

    // 3. Test GET /contracts list
    console.log('\n3. Testing GET /contracts ...');
    const listRes = await fetch(`${baseUrl}/contracts?page=1&limit=10`, { headers: authHeaders });
    const listData = await listRes.json();
    console.log(`   Found ${listData.data?.length} contracts. Total: ${listData.pagination?.total}`);
    if (listRes.status !== 200 || !Array.isArray(listData.data)) {
      throw new Error('Contracts list endpoint failed');
    }

    // 4. Test Lookups
    console.log('\n4. Testing GET /lookups/employees ...');
    const empLookupRes = await fetch(`${baseUrl}/lookups/employees`, { headers: authHeaders });
    const empLookupData = await empLookupRes.json();
    console.log(`   Found ${empLookupData.data?.length} employees for dropdown.`);

    const structLookupRes = await fetch(`${baseUrl}/lookups/structures`, { headers: authHeaders });
    const structLookupData = await structLookupRes.json();
    console.log(`   Found ${structLookupData.data?.length} structures for dropdown.`);

    if (empLookupData.data.length === 0 || structLookupData.data.length === 0) {
      throw new Error('Lookups returned empty');
    }

    const testEmp = empLookupData.data[0];
    const testStruct = structLookupData.data[0];

    // 5. Create Draft Contract
    console.log('\n5. Testing POST /contracts (Create Draft Contract) ...');
    const createRes = await fetch(`${baseUrl}/contracts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employee_id: testEmp.id,
        structure_id: testStruct.id,
        wage: 8500.00,
        currency: 'USD',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        status: 'DRAFT'
      })
    });
    const createData = await createRes.json();
    console.log('   Create status:', createRes.status, 'Contract ID:', createData.data?.contract_code);
    if (createRes.status !== 201 || !createData.data?.id) {
      throw new Error(`Failed to create draft contract: ${JSON.stringify(createData)}`);
    }
    const createdId = createData.data.id;

    // 6. Complete / Activate Contract
    console.log('\n6. Testing PATCH /contracts/:id/complete ...');
    const completeRes = await fetch(`${baseUrl}/contracts/${createdId}/complete`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const completeData = await completeRes.json();
    console.log('   Complete status:', completeRes.status, 'Status:', completeData.data?.status);
    if (completeRes.status !== 200 || completeData.data?.status !== 'RUNNING') {
      throw new Error('Failed to complete contract');
    }

    // 7. Renew Contract
    console.log('\n7. Testing POST /contracts/:id/renew ...');
    const renewRes = await fetch(`${baseUrl}/contracts/${createdId}/renew`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        new_end_date: '2026-12-31',
        wage_adjustment: 500
      })
    });
    const renewData = await renewRes.json();
    console.log('   Renew status:', renewRes.status, 'New Wage:', renewData.data?.wage);
    if (renewRes.status !== 200 || parseFloat(renewData.data?.wage) !== 9000.00) {
      throw new Error('Failed to renew contract');
    }

    // 8. Delete Contract
    console.log('\n8. Testing DELETE /contracts/:id ...');
    const deleteRes = await fetch(`${baseUrl}/contracts/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteData = await deleteRes.json();
    console.log('   Delete status:', deleteRes.status, deleteData.message);
    if (deleteRes.status !== 200) {
      throw new Error('Failed to delete contract');
    }

    // 9. Working Schedules
    console.log('\n9. Testing GET /schedules ...');
    const schedRes = await fetch(`${baseUrl}/schedules`, { headers: authHeaders });
    const schedData = await schedRes.json();
    console.log(`   Found ${schedData.data?.length} working schedules.`);
    if (schedRes.status !== 200 || !Array.isArray(schedData.data)) {
      throw new Error('Failed to get working schedules');
    }

    // 10. Export Ledger
    console.log('\n10. Testing GET /contracts/export ...');
    const exportRes = await fetch(`${baseUrl}/contracts/export`, { headers: authHeaders });
    const exportData = await exportRes.json();
    console.log(`   Export returned ${exportData.data?.length} ledger records.`);
    if (exportRes.status !== 200 || !Array.isArray(exportData.data)) {
      throw new Error('Export ledger failed');
    }

    console.log('\n>>> ALL PHASE 3 BACKEND INTEGRATION TESTS PASSED! <<<\n');
  } finally {
    server.close();
    await pool.end();
  }
}

runContractTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
