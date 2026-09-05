import api from './api';

export const payrollService = {
  // -------------------------------------------------------------
  // Salary Structures API
  // -------------------------------------------------------------
  async getStructures() {
    const res = await api.get('/payroll/structures');
    return res.data.data;
  },

  async getStructure(id) {
    const res = await api.get(`/payroll/structures/${id}`);
    return res.data.data;
  },

  async createStructure(data) {
    const res = await api.post('/payroll/structures', data);
    return res.data.data;
  },

  async updateStructure(id, data) {
    const res = await api.put(`/payroll/structures/${id}`, data);
    return res.data.data;
  },

  async deleteStructure(id) {
    const res = await api.delete(`/payroll/structures/${id}`);
    return res.data.data;
  },

  // -------------------------------------------------------------
  // Salary Rules API
  // -------------------------------------------------------------
  async getRules(structureId) {
    const res = await api.get(`/payroll/structures/${structureId}/rules`);
    return res.data.data;
  },

  async createRule(structureId, data) {
    const res = await api.post(`/payroll/structures/${structureId}/rules`, data);
    return res.data.data;
  },

  async updateRule(id, data) {
    const res = await api.put(`/payroll/rules/${id}`, data);
    return res.data.data;
  },

  async deleteRule(id) {
    const res = await api.delete(`/payroll/rules/${id}`);
    return res.data.data;
  },

  async simulateCalculation(data) {
    const res = await api.post('/payroll/simulate', data);
    return res.data.data;
  },

  // -------------------------------------------------------------
  // Payroll Control Center & Risk Radar Telemetry
  // -------------------------------------------------------------
  async getControlTelemetry() {
    const res = await api.get('/payroll/control/telemetry');
    return res.data.data;
  },

  async reevaluateRisk() {
    const res = await api.post('/payroll/control/reevaluate');
    return res.data.data;
  },

  async releasePayrun() {
    const res = await api.post('/payroll/control/release');
    return res.data.data;
  },

  async resolveEscalation(id, notes = '') {
    const res = await api.post(`/payroll/control/escalations/${id}/resolve`, { notes });
    return res.data.data;
  },

  async exportGL() {
    const res = await api.get('/payroll/control/export-gl');
    return res.data.data;
  },

  // -------------------------------------------------------------
  // Payrun Management API
  // -------------------------------------------------------------
  async getPayruns() {
    const res = await api.get('/payruns');
    return res.data.data;
  },

  async getPayrun(id) {
    const res = await api.get(`/payruns/${id}`);
    return res.data.data;
  },

  async createPayrun(data) {
    const res = await api.post('/payruns', data);
    return res.data.data;
  },

  async computePayrun(id) {
    const res = await api.post(`/payruns/${id}/compute`);
    return res.data;
  }
};

export default payrollService;
