import express from 'express';
import * as contractController from '../controllers/contractController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();

// All contract endpoints require authentication and management role
router.use(authenticate);
router.use(requireRoles('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'));

// KPI Metrics
router.get('/metrics', contractController.getContractMetrics);

// Export Ledger
router.get('/export', contractController.exportContractsLedger);

// Contract CRUD
router.get('/', contractController.getContracts);
router.get('/:id', contractController.getContractById);
router.post('/', contractController.createContract);
router.put('/:id', contractController.updateContract);
router.post('/:id/renew', contractController.renewContract);
router.patch('/:id/complete', contractController.completeContract);
router.delete('/:id', contractController.deleteContract);

export default router;
