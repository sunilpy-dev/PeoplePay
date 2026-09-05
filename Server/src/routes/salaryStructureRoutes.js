import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles, PAYROLL_ADMIN_ROLES, PAYROLL_MANAGER_ONLY } from '../middleware/rbac.js';
import * as controller from '../controllers/salaryStructureController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// 1. Structure Read & Simulation Endpoints (Accessible to HR Payroll Users, Managers, Admins)
router.get('/', requireRoles(...PAYROLL_ADMIN_ROLES), controller.getStructures);
router.get('/:id', requireRoles(...PAYROLL_ADMIN_ROLES), controller.getStructure);
router.post('/:id/simulate', requireRoles(...PAYROLL_ADMIN_ROLES), controller.simulateStructure);
router.post('/validate-dag', requireRoles(...PAYROLL_ADMIN_ROLES), controller.validateDAG);

// 2. Structure Configuration / Write Endpoints (Restricted to HR Payroll Manager & Admin)
router.post('/', requireRoles(...PAYROLL_MANAGER_ONLY), controller.createStructure);
router.put('/:id', requireRoles(...PAYROLL_MANAGER_ONLY), controller.updateStructure);
router.delete('/:id', requireRoles(...PAYROLL_MANAGER_ONLY), controller.deleteStructure);

// 3. Rule Management Endpoints (Restricted to HR Payroll Manager & Admin)
router.post('/:id/rules', requireRoles(...PAYROLL_MANAGER_ONLY), controller.addRule);
router.put('/:id/rules/:ruleId', requireRoles(...PAYROLL_MANAGER_ONLY), controller.updateRule);
router.delete('/:id/rules/:ruleId', requireRoles(...PAYROLL_MANAGER_ONLY), controller.deleteRule);

export default router;
