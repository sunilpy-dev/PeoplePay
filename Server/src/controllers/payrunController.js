import {
  createPayrunService,
  getPayrunsService,
  getPayrunByIdService,
  getEligibleEmployeesService,
  generateDraftPayslipsService,
  recomputePayrunBatchService,
  exportPayrunSummaryCsvService
} from '../services/payrunService.js';

/**
 * Controller: Create a new payrun cycle.
 */
export const createPayrun = async (req, res, next) => {
  try {
    const payrun = await createPayrunService(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Payrun created successfully.',
      data: payrun
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get list of all payruns.
 */
export const getPayruns = async (req, res, next) => {
  try {
    const payruns = await getPayrunsService();
    res.status(200).json({
      status: 'success',
      data: payruns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get specific payrun details and paginated payslip lines.
 */
export const getPayrunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payrunData = await getPayrunByIdService(id, req.query);
    res.status(200).json({
      status: 'success',
      data: payrunData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get eligible employees for selection in a payrun.
 */
export const getEligibleEmployees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employees = await getEligibleEmployeesService(id);
    res.status(200).json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Generate draft payslips for selected employees.
 */
export const generateDraftPayslips = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeIds } = req.body;
    const result = await generateDraftPayslipsService(id, employeeIds);
    res.status(200).json({
      status: 'success',
      message: `${result.generatedCount} draft payslip(s) generated successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Recompute all draft payslips in batch.
 */
export const recomputeBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await recomputePayrunBatchService(id);
    res.status(200).json({
      status: 'success',
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Export summary CSV for payroll review.
 */
export const exportSummaryCsv = async (req, res, next) => {
  try {
    const { id } = req.params;
    const csvData = await exportPayrunSummaryCsvService(id);
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payrun_summary_${today}.csv"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
