import http from 'http';
import app from './app.js';
import pool from './config/db.js';

const PORT = 5096;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/v1${path}`,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(PORT, async () => {
    console.log(`\n=== RUNNING PHASE 5 TIME OFF & LEAVES TESTS on port ${PORT} ===\n`);

    try {
      // 1. Authenticate Admin
      console.log('1. Authenticating as Admin...');
      const adminLogin = await request('POST', '/auth/login', {
        email: 'admin@peoplepay360.com',
        password: 'Password@123'
      });
      const adminToken = adminLogin.body.data?.token;
      console.log('Admin Authenticated:', adminLogin.status === 200 ? 'YES' : 'NO');

      // 2. Authenticate Employee (Sarah Connor - EMP-1001)
      console.log('\n2. Authenticating as Employee Sarah Connor...');
      const emp1Login = await request('POST', '/auth/login', {
        email: 'sarah.connor@peoplepay360.com',
        password: 'Password@123'
      });
      const emp1Token = emp1Login.body.data?.token;
      const emp1Id = emp1Login.body.data?.user?.employeeId;
      console.log('Sarah Connor Authenticated:', emp1Login.status === 200 ? 'YES' : 'NO', 'Emp ID:', emp1Id);

      // 3. Authenticate Employee (Alex Chen - EMP-1002)
      console.log('\n3. Authenticating as Employee Alex Chen...');
      const emp2Login = await request('POST', '/auth/login', {
        email: 'alex.chen@peoplepay360.com',
        password: 'Password@123'
      });
      const emp2Token = emp2Login.body.data?.token;
      const emp2Id = emp2Login.body.data?.user?.employeeId;
      console.log('Alex Chen Authenticated:', emp2Login.status === 200 ? 'YES' : 'NO', 'Emp ID:', emp2Id);

      // 4. Test GET /leaves/types
      console.log('\n4. Testing GET /leaves/types...');
      const typesRes = await request('GET', '/leaves/types', null, emp1Token);
      console.log('Leave types count:', typesRes.body.data?.length);
      const annualType = typesRes.body.data.find(t => t.code === 'ANNUAL');
      const sickType = typesRes.body.data.find(t => t.code === 'SICK');
      console.log('Annual Leave Type ID:', annualType?.id);

      // 5. Test Employee viewing own balances
      console.log('\n5. Testing GET /leaves/balances for Sarah Connor...');
      const balanceRes = await request('GET', '/leaves/balances', null, emp1Token);
      console.log('Balances Status:', balanceRes.status);
      console.log('Balances Data:', balanceRes.body.data);
      const initialAnnual = balanceRes.body.data.find(b => b.leave_type_code === 'ANNUAL');
      const initialAvailable = initialAnnual.available_days;
      console.log('Initial Annual Leave Available Days:', initialAvailable);

      // 6. Test Invalid Date Range (start > end)
      console.log('\n6. Testing POST /leaves/requests with invalid date range (expect 400)...');
      const invalidDateRes = await request('POST', '/leaves/requests', {
        leaveTypeId: annualType.id,
        startDate: '2026-10-15',
        endDate: '2026-10-10',
        reason: 'Backwards dates'
      }, emp1Token);
      console.log('Invalid Date Status (Expect 400):', invalidDateRes.status, 'Error Code:', invalidDateRes.body.code);

      // 7. Test Insufficient Leave Balance
      console.log('\n7. Testing POST /leaves/requests exceeding available balance (expect 422)...');
      const excessRes = await request('POST', '/leaves/requests', {
        leaveTypeId: annualType.id,
        startDate: '2026-11-01',
        endDate: '2026-12-15', // 45 days, exceeds 22
        reason: 'Extended vacation'
      }, emp1Token);
      console.log('Excess Balance Status (Expect 422):', excessRes.status, 'Error Code:', excessRes.body.code);

      // 8. Test Valid Leave Request Submission
      console.log('\n8. Testing POST /leaves/requests valid submission (2 days)...');
      const validReqRes = await request('POST', '/leaves/requests', {
        leaveTypeId: annualType.id,
        startDate: '2026-10-05',
        endDate: '2026-10-06', // 2 days
        reason: 'Family event'
      }, emp1Token);
      console.log('Submit Status (Expect 201):', validReqRes.status, 'Request ID:', validReqRes.body.data?.id);
      const createdRequestId = validReqRes.body.data?.id;

      // 9. Test Duplicate / Overlapping Leave Request
      console.log('\n9. Testing POST /leaves/requests overlapping request (expect 409)...');
      const overlapRes = await request('POST', '/leaves/requests', {
        leaveTypeId: annualType.id,
        startDate: '2026-10-06',
        endDate: '2026-10-08',
        reason: 'Overlapping request'
      }, emp1Token);
      console.log('Overlap Status (Expect 409):', overlapRes.status, 'Error Code:', overlapRes.body.code);

      // 10. Test Employee Cannot Approve Request (RBAC guard check)
      console.log('\n10. Testing PUT /leaves/requests/:id/approve as EMPLOYEE (expect 403)...');
      const empApproveRes = await request('PUT', `/leaves/requests/${createdRequestId}/approve`, {}, emp2Token);
      console.log('Employee Approve Status (Expect 403):', empApproveRes.status);

      // 11. Test Self-Approval Prevention as Admin if Admin was the requester
      console.log('\n11. Testing Self-Approval Prevention...');
      // Submit request as Alex Chen
      const alexReqRes = await request('POST', '/leaves/requests', {
        leaveTypeId: annualType.id,
        startDate: '2026-10-12',
        endDate: '2026-10-13',
        reason: 'Alex vacation'
      }, emp2Token);
      const alexReqId = alexReqRes.body.data?.id;

      // 12. Test HR/Admin Allocation Management
      console.log('\n12. Testing POST /leaves/allocations (Grant additional leave)...');
      // Employee attempts allocation (expect 403)
      const empAllocRes = await request('POST', '/leaves/allocations', {
        employeeId: emp1Id,
        leaveTypeId: annualType.id,
        allocatedDays: 30.00
      }, emp1Token);
      console.log('Employee Allocate Status (Expect 403):', empAllocRes.status);

      // Admin updates allocation
      const adminAllocRes = await request('POST', '/leaves/allocations', {
        employeeId: emp1Id,
        leaveTypeId: annualType.id,
        allocatedDays: 26.00
      }, adminToken);
      console.log('Admin Allocate Status (Expect 200):', adminAllocRes.status, 'New Allocated:', adminAllocRes.body.data?.allocated_days);

      // 13. Test Admin Approving Leave Request
      console.log('\n13. Testing PUT /leaves/requests/:id/approve as Admin...');
      const approveRes = await request('PUT', `/leaves/requests/${createdRequestId}/approve`, {}, adminToken);
      console.log('Approve Status (Expect 200):', approveRes.status, 'New Status:', approveRes.body.data?.status);

      // 14. Verify Balance is correctly reduced after approval
      console.log('\n14. Verifying Sarah Connor balance after 2-day approval...');
      const updatedBalanceRes = await request('GET', '/leaves/balances', null, emp1Token);
      const updatedAnnual = updatedBalanceRes.body.data.find(b => b.leave_type_code === 'ANNUAL');
      console.log('Updated Taken Days (Expect 4.00):', updatedAnnual.taken_days);
      console.log('Updated Available Days (Expect 22.00):', updatedAnnual.available_days);

      // 15. Test Admin Rejecting Leave Request
      console.log('\n15. Testing PUT /leaves/requests/:id/reject as Admin...');
      const rejectRes = await request('PUT', `/leaves/requests/${alexReqId}/reject`, {
        rejectionReason: 'Coverage requirement on those dates.'
      }, adminToken);
      console.log('Reject Status (Expect 200):', rejectRes.status, 'New Status:', rejectRes.body.data?.status, 'Rejection Note:', rejectRes.body.data?.rejection_reason);

      // 16. Verify Alex Chen balance was NOT reduced after rejection
      console.log('\n16. Verifying Alex Chen balance after rejection...');
      const alexBalanceRes = await request('GET', '/leaves/balances', null, emp2Token);
      const alexAnnual = alexBalanceRes.body.data.find(b => b.leave_type_code === 'ANNUAL');
      console.log('Alex Taken Days (Should remain unchanged):', alexAnnual.taken_days);

      // 17. Clean up test records
      await pool.query(`DELETE FROM leave_requests WHERE id IN ($1, $2)`, [createdRequestId, alexReqId]);
      await pool.query(`UPDATE leave_allocations SET allocated_days = 24.00, taken_days = 2.00 WHERE employee_id = $1 AND leave_type_id = $2`, [emp1Id, annualType.id]);
      console.log('\nTest records cleaned up.');

      console.log('\n>>> ALL PHASE 5 TIME OFF BACKEND TESTS PASSED SUCCESSFULLY! <<<\n');
      process.exit(0);
    } catch (err) {
      console.error('Test execution failed:', err);
      process.exit(1);
    } finally {
      server.close();
    }
  });
}

runTests();
