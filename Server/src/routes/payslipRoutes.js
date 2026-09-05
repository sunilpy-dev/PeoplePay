import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMyLatestPayslip,
  getMyPayslipHistory,
  getPayslipById,
  downloadPayslipPdf,
  sendPayslipEmail
} from '../controllers/payslipController.js';

const router = Router();

// All payslip endpoints require authentication
router.use(authenticate);

// Employee-scoped endpoints (identity derived from JWT)
router.get('/my-latest', getMyLatestPayslip);
router.get('/my-history', getMyPayslipHistory);
router.get('/my-latest/pdf', downloadPayslipPdf);
router.post('/my-latest/email', sendPayslipEmail);

// Specific payslip ID endpoints
router.get('/:id', getPayslipById);
router.get('/:id/pdf', downloadPayslipPdf);
router.post('/:id/email', sendPayslipEmail);

export default router;
