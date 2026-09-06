import express from 'express';
import * as grievanceController from '../controllers/grievanceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();

// All grievance endpoints require active authentication
router.use(authenticate);

// 1. Submit Grievance (Employees only - HR Payroll Manager is explicitly forbidden)
router.post('/', grievanceController.createGrievance);

// 2. List Grievances (Role-scoped: Employees see own, HR/Admin see all)
router.get('/', grievanceController.getGrievances);

// 3. Get Grievance by ID (with ownership check for Employees)
router.get('/:id', grievanceController.getGrievanceById);

// 4. Resolve / Approve Grievance (Admin, HR Payroll Manager, HR Manager)
router.put(
  '/:id/resolve',
  requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER'),
  grievanceController.resolveGrievance
);

// 5. Reject Grievance (Admin, HR Payroll Manager, HR Manager)
router.put(
  '/:id/reject',
  requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER'),
  grievanceController.rejectGrievance
);

export default router;
