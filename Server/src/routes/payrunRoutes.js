import express from 'express';
import { payrunController } from '../controllers/payrunController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles, ROLES } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrunController.getPayruns
);

router.get(
  '/:id',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrunController.getPayrun
);

router.post(
  '/',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrunController.createPayrun
);

router.post(
  '/:id/compute',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrunController.computePayrun
);

export default router;
