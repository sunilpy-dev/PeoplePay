import { Router } from 'express';
import * as employeeController from '../controllers/employeeController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles, HR_ADMIN_ROLES } from '../middleware/rbac.js';

const router = Router();

// All employee routes require active authentication
router.use(authenticate);

// Department, Manager, and Stats queries
router.get('/departments', employeeController.getDepartments);
router.get('/managers', employeeController.getManagers);
router.get('/stats', employeeController.getStats);

// CRUD operations
router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', requireRoles(...HR_ADMIN_ROLES), employeeController.createEmployee);
router.put('/:id', requireRoles(...HR_ADMIN_ROLES), employeeController.updateEmployee);
router.delete('/:id', requireRoles(...HR_ADMIN_ROLES), employeeController.deleteEmployee);

export default router;
