import express from 'express';
import { payrollConfigController } from '../controllers/payrollConfigController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles, ROLES } from '../middleware/rbac.js';

const router = express.Router();

// All payroll configuration endpoints require authentication
router.use(authenticate);

// Structures CRUD
router.get(
  '/structures',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrollConfigController.getStructures
);

router.get(
  '/structures/:id',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrollConfigController.getStructure
);

router.post(
  '/structures',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollConfigController.createStructure
);

router.put(
  '/structures/:id',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollConfigController.updateStructure
);

router.delete(
  '/structures/:id',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollConfigController.deleteStructure
);

// Rules CRUD per structure
router.get(
  '/structures/:structureId/rules',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrollConfigController.getRules
);

router.post(
  '/structures/:structureId/rules',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollConfigController.createRule
);

router.put(
  '/rules/:id',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollConfigController.updateRule
);

router.delete(
  '/rules/:id',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER),
  payrollConfigController.deleteRule
);

// Simulation endpoint
router.post(
  '/simulate',
  requireRoles(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  payrollConfigController.simulateCalculation
);

export default router;
