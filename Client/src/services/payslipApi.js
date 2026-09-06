import api from './api';

/**
 * Fetches the authenticated employee's latest active remuneration statement.
 */
export const getMyLatestPayslip = async () => {
  const response = await api.get('/payslips/my-latest');
  return response.data;
};

/**
 * Fetches the authenticated employee's historical payslips archive.
 */
export const getMyPayslipHistory = async () => {
  const response = await api.get('/payslips/my-history');
  return response.data;
};

/**
 * Fetches a specific payslip record by ID.
 */
export const getPayslipById = async (id) => {
  const response = await api.get(`/payslips/${id}`);
  return response.data;
};

/**
 * Downloads the real PDF payslip document.
 */
export const downloadPayslipPdf = async (id = 'my-latest') => {
  const response = await api.get(`/payslips/${id}/pdf`, {
    responseType: 'blob'
  });

  // Check if response is actually an error payload received as JSON blob
  if (response.data && response.data.type === 'application/json') {
    const text = await response.data.text();
    const errorJson = JSON.parse(text);
    throw new Error(errorJson.message || 'Failed to download payslip PDF');
  }

  // Extract filename from Content-Disposition header if available
  let filename = `Payslip_${id}.pdf`;
  const disposition = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'];
  if (disposition && disposition.includes('filename=')) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '').trim();
    }
  } else {
    const today = new Date().toISOString().split('T')[0];
    filename = `PeoplePay360_Payslip_${today}.pdf`;
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  // Cleanup object URL
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);

  return { success: true, filename };
};

/**
 * Sends the payslip statement PDF to the employee's email.
 */
export const sendPayslipEmail = async (id = 'my-latest') => {
  const response = await api.post(`/payslips/${id}/email`);
  return response.data;
};
