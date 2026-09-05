import api from './api';

/**
 * Fetches the current employee punch status (Clocked In / Clocked Out).
 */
export const getAttendanceStatus = async () => {
  const response = await api.get('/attendance/status');
  return response.data;
};

/**
 * Executes Punch In action for the logged-in employee.
 */
export const punchIn = async () => {
  const response = await api.post('/attendance/punch-in');
  return response.data;
};

/**
 * Executes Punch Out action for the logged-in employee.
 */
export const punchOut = async () => {
  const response = await api.post('/attendance/punch-out');
  return response.data;
};

/**
 * Fetches summary metrics.
 * For HR/Admin: org-wide metrics. For EMPLOYEE: their own metrics (scoped by backend).
 */
export const getAttendanceMetrics = async () => {
  const response = await api.get('/attendance/metrics');
  return response.data;
};

/**
 * Fetches the authenticated employee's own attendance history (paginated).
 * Identity is determined by the backend from the JWT — no employeeId param needed.
 */
export const getMyAttendanceHistory = async (params = {}) => {
  const response = await api.get('/attendance/my-history', { params });
  return response.data;
};

/**
 * Fetches operational attendance roster with filters & search.
 * Only available to HR/Admin roles — backend enforces 403 for employees.
 */
export const getAttendanceRoster = async (params = {}) => {
  const response = await api.get('/attendance/roster', { params });
  return response.data;
};

/**
 * Submits an attendance correction for a specific punch record.
 */
export const correctAttendanceRecord = async (id, correctionData) => {
  const response = await api.patch(`/attendance/correct/${id}`, correctionData);
  return response.data;
};

/**
 * Bulk validates selected attendance log records.
 * Only available to HR/Admin roles — backend enforces 403 for employees.
 * @param {string[]} attendanceIds - Array of attendance record UUIDs
 */
export const bulkValidateLogs = async (attendanceIds) => {
  const response = await api.post('/attendance/bulk-validate', { attendanceIds });
  return response.data;
};

/**
 * Exports the timesheet data for payroll as a CSV file download.
 * Only available to HR/Admin roles — backend enforces 403 for employees.
 * Triggers a browser file download directly.
 * @param {object} params - Filter params (search, department, exceptionsOnly, dateFrom, dateTo)
 */
export const exportTimesheet = async (params = {}) => {
  const response = await api.get('/attendance/export-timesheet', {
    params,
    responseType: 'blob'
  });

  // Trigger browser file download
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `timesheet_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
