import express from 'express';
import { payrollControlController } from '../controllers/payrollControlController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles, ROLES } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

// Telemetry & Risk Radar (viewable by payroll roles)
router.get(
  '/telemetry',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrollControlController.getTelemetry
);

// Actions (executable by payroll roles)
router.post(
  '/reevaluate',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrollControlController.reevaluateRisk
);

router.post(
  '/release',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollControlController.releasePayrun
);

router.post(
  '/escalations/:id/resolve',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollControlController.resolveEscalation
);

router.get(
  '/export-gl',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrollControlController.exportGeneralLedger
);

export default router;
