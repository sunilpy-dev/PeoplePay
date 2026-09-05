import { payrunService } from '../services/payrunService.js';
import { AppError } from '../middleware/errorHandler.js';

export const payrunController = {
  async getPayruns(req, res, next) {
    try {
      const payruns = await payrunService.getAllPayruns();
      res.status(200).json({ status: 'success', data: payruns });
    } catch (err) {
      next(err);
    }
  },

  async getPayrun(req, res, next) {
    try {
      const payrun = await payrunService.getPayrunById(req.params.id);
      if (!payrun) {
        return next(new AppError('Payrun not found', 404, 'NOT_FOUND'));
      }
      res.status(200).json({ status: 'success', data: payrun });
    } catch (err) {
      next(err);
    }
  },

  async createPayrun(req, res, next) {
    try {
      const { name, structure_id, period_start, period_end } = req.body;
      if (!name || !structure_id || !period_start || !period_end) {
        return next(new AppError('Name, structure, period_start, and period_end are required', 400, 'VALIDATION_ERROR'));
      }
      const newPayrun = await payrunService.createPayrun({ name, structure_id, period_start, period_end });
      res.status(201).json({ status: 'success', data: newPayrun });
    } catch (err) {
      next(err);
    }
  },

  async computePayrun(req, res, next) {
    try {
      const result = await payrunService.computePayrun(req.params.id);
      res.status(200).json({ 
        status: 'success', 
        message: `Calculation engine evaluated ${result.totalComputed} payslips successfully.`,
        data: result 
      });
    } catch (err) {
      next(err);
    }
  }
};

export default payrunController;
