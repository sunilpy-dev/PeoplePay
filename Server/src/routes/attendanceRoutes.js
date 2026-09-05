import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { 
  getStatus, 
  punchIn, 
  punchOut, 
  getRoster, 
  correctAttendance, 
  getMetrics,
  getMyHistory,
  bulkValidateLogs,
  exportTimesheet
} from '../controllers/attendanceController.js';

const router = Router();

// All attendance routes require valid JWT authentication
router.use(authenticate);

// Employee check-in / check-out status and actions (all authenticated roles)
router.get('/status', getStatus);
router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);

// Attendance metrics — scoped by role inside the controller
// (HR/Admin get org-wide; EMPLOYEE gets their own)
router.get('/metrics', getMetrics);

// Employee's own attendance history — identity taken from JWT, not request params
router.get('/my-history', getMyHistory);

// Operational Roster — restricted to HR/Admin roles only
router.get('/roster', requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'), getRoster);

// Attendance correction endpoint — restricted to HR Managers and Admins
router.patch('/correct/:id', requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER'), correctAttendance);

// Bulk validate attendance logs — restricted to HR/Admin roles only
router.post('/bulk-validate', requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'), bulkValidateLogs);

// Export timesheet for payroll — restricted to HR/Admin roles only
router.get('/export-timesheet', requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'), exportTimesheet);

export default router;
