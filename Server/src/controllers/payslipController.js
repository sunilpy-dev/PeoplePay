import {
  getMyLatestPayslipService,
  getMyPayslipsHistoryService,
  getPayslipByIdService,
  generatePayslipPdfService,
  sendPayslipEmailService
} from '../services/payslipService.js';

/**
 * Controller: Get latest active payslip for authenticated employee.
 */
export const getMyLatestPayslip = async (req, res, next) => {
  try {
    const payslip = await getMyLatestPayslipService(req.user);
    res.status(200).json({
      status: 'success',
      data: payslip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get historical payslips archive for authenticated employee.
 */
export const getMyPayslipHistory = async (req, res, next) => {
  try {
    const history = await getMyPayslipsHistoryService(req.user);
    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get specific payslip by ID with RBAC check.
 */
export const getPayslipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await getPayslipByIdService(id, req.user);
    res.status(200).json({
      status: 'success',
      data: payslip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Download payslip PDF binary document.
 */
export const downloadPayslipPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pdfBuffer, filename } = await generatePayslipPdfService(id, req.user);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Email payslip statement PDF to employee.
 */
export const sendPayslipEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await sendPayslipEmailService(id, req.user);
    res.status(200).json({
      status: 'success',
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
