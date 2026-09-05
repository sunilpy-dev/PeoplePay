import express from 'express';
import * as leaveController from '../controllers/leaveController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles, HR_ADMIN_ROLES } from '../middleware/rbac.js';

const router = express.Router();

// All leave routes require authentication
router.use(authenticate);

// 1. Leave Types
router.get('/types', leaveController.getLeaveTypes);

// 2. Leave Balances
router.get('/balances/me', leaveController.getMyLeaveBalances);
router.get('/balances', leaveController.getLeaveBalances);
router.get('/team-balances', requireRoles(...HR_ADMIN_ROLES), leaveController.getTeamBalances);

// 3. Leave Allocations (HR/Admin management)
router.get('/allocations', requireRoles(...HR_ADMIN_ROLES), leaveController.getLeaveAllocations);
router.post('/allocations', requireRoles(...HR_ADMIN_ROLES), leaveController.createOrUpdateAllocation);

// 4. Leave Requests (Employee & HR)
router.get('/requests', leaveController.getLeaveRequests);
router.get('/requests/:id', leaveController.getLeaveRequest);
router.post('/requests', leaveController.createLeaveRequest);
router.delete('/requests/:id', leaveController.cancelLeaveRequest);

// 5. Approval Workflow (HR/Admin only)
router.put('/requests/:id/approve', requireRoles(...HR_ADMIN_ROLES), leaveController.approveLeaveRequest);
router.put('/requests/:id/reject', requireRoles(...HR_ADMIN_ROLES), leaveController.rejectLeaveRequest);

export default router;
