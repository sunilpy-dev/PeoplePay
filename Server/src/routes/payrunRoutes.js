import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import {
  createPayrun,
  getPayruns,
  getPayrunById,
  getEligibleEmployees,
  generateDraftPayslips,
  recomputeBatch,
  exportSummaryCsv
} from '../controllers/payrunController.js';

const router = Router();

// All payrun routes require authentication and payroll manager/user roles
router.use(authenticate);
router.use(requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'));

// Create and list payruns
router.post('/', createPayrun);
router.get('/', getPayruns);

// Specific payrun endpoints
router.get('/:id', getPayrunById);
router.get('/:id/eligible-employees', getEligibleEmployees);
router.post('/:id/generate-drafts', generateDraftPayslips);
router.post('/:id/recompute', recomputeBatch);
router.get('/:id/export', exportSummaryCsv);

export default router;
