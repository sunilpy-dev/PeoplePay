import express from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'));

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

export default router;
