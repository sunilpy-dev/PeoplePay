import api from './api';

export const getLeaveTypes = async () => {
  const res = await api.get('/leaves/types');
  return res.data.data;
};

export const getMyLeaveBalances = async () => {
  const res = await api.get('/leaves/balances/me');
  return res.data;
};

export const getLeaveBalances = async (employeeId = null) => {
  const params = employeeId ? { employee_id: employeeId } : {};
  const res = await api.get('/leaves/balances', { params });
  return res.data.data;
};

export const getTeamBalances = async () => {
  const res = await api.get('/leaves/team-balances');
  return res.data.data;
};

export const getLeaveAllocations = async (params = {}) => {
  const res = await api.get('/leaves/allocations', { params });
  return res.data;
};

export const createOrUpdateAllocation = async (payload) => {
  const res = await api.post('/leaves/allocations', payload);
  return res.data;
};

export const getLeaveRequests = async (params = {}) => {
  const res = await api.get('/leaves/requests', { params });
  return res.data;
};

export const getLeaveRequest = async (id) => {
  const res = await api.get(`/leaves/requests/${id}`);
  return res.data.data;
};

export const createLeaveRequest = async (payload) => {
  const res = await api.post('/leaves/requests', payload);
  return res.data;
};

export const approveLeaveRequest = async (id) => {
  const res = await api.put(`/leaves/requests/${id}/approve`);
  return res.data;
};

export const rejectLeaveRequest = async (id, rejectionReason) => {
  const res = await api.put(`/leaves/requests/${id}/reject`, { rejectionReason });
  return res.data;
};

export const cancelLeaveRequest = async (id) => {
  const res = await api.delete(`/leaves/requests/${id}`);
  return res.data;
};
