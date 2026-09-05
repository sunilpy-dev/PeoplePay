import { payrollControlService } from '../services/payrollControlService.js';

export const payrollControlController = {
  async getTelemetry(req, res, next) {
    try {
      const telemetry = await payrollControlService.getControlCenterTelemetry();
      res.status(200).json({ status: 'success', data: telemetry });
    } catch (err) {
      next(err);
    }
  },

  async resolveEscalation(req, res, next) {
    try {
      const resolved = await payrollControlService.resolveEscalation(req.params.id, req.body?.notes);
      // Fetch fresh telemetry after resolving
      const updatedTelemetry = await payrollControlService.getControlCenterTelemetry();
      res.status(200).json({ 
        status: 'success', 
        message: 'Escalation resolved successfully', 
        data: { resolved, telemetry: updatedTelemetry } 
      });
    } catch (err) {
      next(err);
    }
  },

  async reevaluateRisk(req, res, next) {
    try {
      const freshTelemetry = await payrollControlService.reevaluateRiskEngine();
      res.status(200).json({ 
        status: 'success', 
        message: 'Risk engine re-evaluation complete. Telemetry synchronized.', 
        data: freshTelemetry 
      });
    } catch (err) {
      next(err);
    }
  },

  async releasePayrun(req, res, next) {
    try {
      const result = await payrollControlService.releasePendingPayrun();
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  async exportGeneralLedger(req, res, next) {
    try {
      const result = await payrollControlService.exportGeneralLedger();
      if (req.query.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.status(200).send(result.data);
      }
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default payrollControlController;
