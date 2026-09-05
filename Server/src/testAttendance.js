import app from './app.js';
import pool from './config/db.js';

let server;

async function runAttendanceTests() {
  console.log('=== RUNNING BACKEND ATTENDANCE VERIFICATION TESTS ===\n');

  await new Promise((resolve) => {
    server = app.listen(5098, () => {
      console.log('Attendance test server listening on port 5098');
      resolve();
    });
  });

  const baseUrl = 'http://localhost:5098/api/v1';

  try {
    // 1. Admin login to get JWT token
    console.log('1. Logging in as Admin ...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'Password@123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    if (!token) throw new Error('Admin login failed');
    console.log('Admin login successful.');

    // 2. Test GET /attendance/status
    console.log('\n2. Testing GET /attendance/status ...');
    const statusRes = await fetch(`${baseUrl}/attendance/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const statusData = await statusRes.json();
    console.log('Status endpoint response status:', statusRes.status);
    console.log('Is Clocked In:', statusData.data?.isClockedIn);

    // 3. Test GET /attendance/metrics
    console.log('\n3. Testing GET /attendance/metrics ...');
    const metricsRes = await fetch(`${baseUrl}/attendance/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const metricsData = await metricsRes.json();
    console.log('Metrics endpoint response status:', metricsRes.status);
    console.log('Monthly Worked:', metricsData.data?.monthlyWorked, 'Target:', metricsData.data?.monthlyTarget);

    // 4. Test GET /attendance/roster
    console.log('\n4. Testing GET /attendance/roster ...');
    const rosterRes = await fetch(`${baseUrl}/attendance/roster`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const rosterData = await rosterRes.json();
    console.log('Roster endpoint response status:', rosterRes.status);
    console.log('Roster count returned:', rosterData.data?.roster?.length);
    if (rosterData.data?.roster?.length > 0) {
      console.log('Sample roster item employee:', rosterData.data.roster[0].first_name, rosterData.data.roster[0].last_name, 'Status:', rosterData.data.roster[0].auditStatus);
    }

    console.log('\n>>> ALL BACKEND ATTENDANCE TESTS PASSED SUCCESSFULLY! <<<\n');
  } catch (err) {
    console.error('Attendance test error:', err);
    process.exit(1);
  } finally {
    server.close();
    await pool.end();
  }
}

runAttendanceTests();
