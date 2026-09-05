import api from './api';

export const contractService = {
  // Get aggregated KPI metrics
  async getMetrics() {
    const res = await api.get('/contracts/metrics');
    return res.data.data;
  },

  // Get filtered contracts list with pagination
  async getContracts(params = {}) {
    const res = await api.get('/contracts', { params });
    return res.data;
  },

  // Get single contract details
  async getContract(id) {
    const res = await api.get(`/contracts/${id}`);
    return res.data.data;
  },

  // Create new contract
  async createContract(data) {
    const res = await api.post('/contracts', data);
    return res.data.data;
  },

  // Update existing contract
  async updateContract(id, data) {
    const res = await api.put(`/contracts/${id}`, data);
    return res.data.data;
  },

  // Renew contract
  async renewContract(id, data) {
    const res = await api.post(`/contracts/${id}/renew`, data);
    return res.data.data;
  },

  // Complete / Activate draft contract
  async completeContract(id) {
    const res = await api.patch(`/contracts/${id}/complete`);
    return res.data.data;
  },

  // Delete / cancel contract
  async deleteContract(id) {
    const res = await api.delete(`/contracts/${id}`);
    return res.data.data;
  },

  // Export ledger data
  async exportLedger() {
    const res = await api.get('/contracts/export');
    return res.data.data;
  },

  // Lookups for assignment dropdowns
  async getEmployeesLookup() {
    const res = await api.get('/lookups/employees');
    return res.data.data;
  },

  async getStructuresLookup() {
    const res = await api.get('/lookups/structures');
    return res.data.data;
  },

  async getDepartmentsLookup() {
    const res = await api.get('/lookups/departments');
    return res.data.data;
  },

  // Working Schedules API
  async getSchedules() {
    const res = await api.get('/schedules');
    return res.data.data;
  },

  async getSchedule(id) {
    const res = await api.get(`/schedules/${id}`);
    return res.data.data;
  },

  async createSchedule(data) {
    const res = await api.post('/schedules', data);
    return res.data.data;
  },

  async updateSchedule(id, data) {
    const res = await api.put(`/schedules/${id}`, data);
    return res.data.data;
  },

  async deleteSchedule(id) {
    const res = await api.delete(`/schedules/${id}`);
    return res.data.data;
  }
};

export default contractService;
