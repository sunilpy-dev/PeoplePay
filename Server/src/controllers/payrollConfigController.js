import { payrollConfigService } from '../services/payrollConfigService.js';
import { AppError } from '../middleware/errorHandler.js';

export const payrollConfigController = {
  async getStructures(req, res, next) {
    try {
      const structures = await payrollConfigService.getAllStructures();
      res.status(200).json({ status: 'success', data: structures });
    } catch (err) {
      next(err);
    }
  },

  async getStructure(req, res, next) {
    try {
      const structure = await payrollConfigService.getStructureById(req.params.id);
      if (!structure) {
        return next(new AppError('Salary structure not found', 404, 'NOT_FOUND'));
      }
      res.status(200).json({ status: 'success', data: structure });
    } catch (err) {
      next(err);
    }
  },

  async createStructure(req, res, next) {
    try {
      const { name, code, is_active } = req.body;
      if (!name || !code) {
        return next(new AppError('Name and Code are required for salary structure', 400, 'VALIDATION_ERROR'));
      }
      const newStructure = await payrollConfigService.createStructure({ name, code, is_active });
      res.status(201).json({ status: 'success', data: newStructure });
    } catch (err) {
      if (err.statusCode) {
        return next(new AppError(err.message, err.statusCode, 'CONFLICT'));
      }
      next(err);
    }
  },

  async updateStructure(req, res, next) {
    try {
      const updated = await payrollConfigService.updateStructure(req.params.id, req.body);
      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteStructure(req, res, next) {
    try {
      const deleted = await payrollConfigService.deleteStructure(req.params.id);
      res.status(200).json({ status: 'success', message: 'Salary structure deleted successfully', data: deleted });
    } catch (err) {
      if (err.statusCode) {
        return next(new AppError(err.message, err.statusCode, 'CONFLICT'));
      }
      next(err);
    }
  },

  async getRules(req, res, next) {
    try {
      const rules = await payrollConfigService.getRulesByStructure(req.params.structureId);
      res.status(200).json({ status: 'success', data: rules });
    } catch (err) {
      next(err);
    }
  },

  async createRule(req, res, next) {
    try {
      const { name, code, category, sequence, type } = req.body;
      if (!name || !code || !category || sequence === undefined || !type) {
        return next(new AppError('Name, code, category, sequence, and type are required', 400, 'VALIDATION_ERROR'));
      }
      const newRule = await payrollConfigService.createRule(req.params.structureId, req.body);
      res.status(201).json({ status: 'success', data: newRule });
    } catch (err) {
      if (err.statusCode === 422) {
        return res.status(422).json({
          status: 'fail',
          code: 'CIRCULAR_DEPENDENCY',
          message: err.message,
          details: err.details
        });
      }
      next(err);
    }
  },

  async updateRule(req, res, next) {
    try {
      const updated = await payrollConfigService.updateRule(req.params.id, req.body);
      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      if (err.statusCode === 422) {
        return res.status(422).json({
          status: 'fail',
          code: 'CIRCULAR_DEPENDENCY',
          message: err.message,
          details: err.details
        });
      }
      next(err);
    }
  },

  async deleteRule(req, res, next) {
    try {
      const deleted = await payrollConfigService.deleteRule(req.params.id);
      res.status(200).json({ status: 'success', message: 'Rule deleted successfully', data: deleted });
    } catch (err) {
      next(err);
    }
  },

  async simulateCalculation(req, res, next) {
    try {
      const result = await payrollConfigService.simulateCalculation(req.body);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default payrollConfigController;
