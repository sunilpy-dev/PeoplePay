import api from './api';

/**
 * Fetches all payruns.
 */
export const getPayruns = async () => {
  const response = await api.get('/payruns');
  return response.data;
};

/**
 * Fetches specific payrun details and paginated payslip records.
 */
export const getPayrunById = async (id = 'latest', params = {}) => {
  const response = await api.get(`/payruns/${id}`, { params });
  return response.data;
};

/**
 * Creates a new payrun cycle.
 */
export const createPayrun = async (payrunData) => {
  const response = await api.post('/payruns', payrunData);
  return response.data;
};

/**
 * Fetches eligible employees for payrun draft payslip generation.
 */
export const getEligibleEmployees = async (payrunId) => {
  const response = await api.get(`/payruns/${payrunId}/eligible-employees`);
  return response.data;
};

/**
 * Generates draft payslips for selected employees in the payrun.
 */
export const generateDraftPayslips = async (payrunId, employeeIds) => {
  const response = await api.post(`/payruns/${payrunId}/generate-drafts`, { employeeIds });
  return response.data;
};

/**
 * Recomputes all draft payslips in the payrun batch.
 */
export const recomputeBatch = async (payrunId) => {
  const response = await api.post(`/payruns/${payrunId}/recompute`);
  return response.data;
};

/**
 * Exports payrun summary CSV.
 */
export const exportPayrunSummaryCsv = async (payrunId) => {
  const response = await api.get(`/payruns/${payrunId}/export`, {
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `payrun_summary_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};