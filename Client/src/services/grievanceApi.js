import api from './api';

/**
 * Fetches grievances list (role-aware: all for HR/Admin, own for Employee).
 */
export const getGrievances = async (params = {}) => {
  const response = await api.get('/grievances', { params });
  return response.data;
};

/**
 * Fetches single grievance details by ID.
 */
export const getGrievanceById = async (id) => {
  const response = await api.get(`/grievances/${id}`);
  return response.data;
};

/**
 * Submits a new grievance (Employees only).
 */
export const createGrievance = async (grievanceData) => {
  const response = await api.post('/grievances', grievanceData);
  return response.data;
};

/**
 * Resolves / Approves a grievance (HR Payroll Manager / Admin).
 */
export const resolveGrievance = async (id, resolutionData = {}) => {
  const response = await api.put(`/grievances/${id}/resolve`, resolutionData);
  return response.data;
};

/**
 * Rejects a grievance with reason (HR Payroll Manager / Admin).
 */
export const rejectGrievance = async (id, rejectData = {}) => {
  const response = await api.put(`/grievances/${id}/reject`, rejectData);
  return response.data;
};
