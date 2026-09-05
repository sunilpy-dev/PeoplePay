import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, UserPlus, Save, AlertCircle, Building2, UserCheck, CreditCard, Hash } from 'lucide-react';
import { Modal } from '../../components/Modal';

export const EmployeeFormModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    department: 'Engineering',
    job_position: '',
    manager_id: '',
    bank_account_no: '',
    bank_ifsc: '',
    is_active: true
  });

  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load lookup data (departments & eligible managers)
  useEffect(() => {
    if (!isOpen) return;

    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [deptRes, mgrRes] = await Promise.all([
          api.get('/employees/departments'),
          api.get(`/employees/managers${initialData?.id ? `?excludeId=${initialData.id}` : ''}`)
        ]);

        if (deptRes.data.success) {
          setDepartments(deptRes.data.data.map(d => d.department));
        }
        if (mgrRes.data.success) {
          setManagers(mgrRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load employee lookups:', err);
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();

    if (initialData) {
      setFormData({
        employee_code: initialData.employee_code || '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        department: initialData.department || 'Engineering',
        job_position: initialData.job_position || '',
        manager_id: initialData.manager_id || '',
        bank_account_no: initialData.bank_account_no || '',
        bank_ifsc: initialData.bank_ifsc || '',
        is_active: initialData.is_active !== false
      });
    } else {
      setFormData({
        employee_code: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        first_name: '',
        last_name: '',
        department: 'Engineering',
        job_position: '',
        manager_id: '',
        bank_account_no: '',
        bank_ifsc: '',
        is_active: true
      });
    }
    setError('');
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    if (!formData.employee_code.trim()) {
      setError('Employee Code is required.');
      return false;
    }
    if (!formData.first_name.trim()) {
      setError('First name is required.');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required.');
      return false;
    }
    if (!formData.department.trim()) {
      setError('Department is required.');
      return false;
    }
    if (!formData.job_position.trim()) {
      setError('Job position is required.');
      return false;
    }
    if (isEdit && formData.manager_id && formData.manager_id === initialData?.id) {
      setError('An employee cannot be their own manager.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/employees/${initialData.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Save employee error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save employee profile';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      preventClose={submitting}
      customHeader={
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              {isEdit ? <Save size={16} /> : <UserPlus size={16} />}
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {isEdit ? `Edit Profile — ${initialData?.first_name} ${initialData?.last_name}` : 'Register New Employee'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isEdit ? 'Update employee master and bank details' : 'Enter enterprise workforce identity details'}
              </p>
            </div>
          </div>
          {!submitting && (
            <button 
              type="button" 
              onClick={onClose} 
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}
        </div>
      }
    >
      {/* Modal Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 font-medium">{error}</div>
            </div>
          )}

          {/* Section: Identity */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Hash size={13} className="text-slate-400" />
              <span>Identity & Code</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="employee_code"
                  required
                  value={formData.employee_code}
                  onChange={handleChange}
                  placeholder="EMP-1001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Elena"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Rostova"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Organization */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400" />
              <span>Department & Role Hierarchy</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Position / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="job_position"
                  required
                  value={formData.job_position}
                  onChange={handleChange}
                  placeholder="Senior Staff Engineer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reporting Manager
                </label>
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">No Manager (Top-level)</option>
                  {managers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.employee_code} - {mgr.job_position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Bank Information */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <CreditCard size={13} className="text-slate-400" />
              <span>Payroll Bank Account</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  name="bank_account_no"
                  value={formData.bank_account_no}
                  onChange={handleChange}
                  placeholder="998877665544"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank IFSC / Branch Code
                </label>
                <input
                  type="text"
                  name="bank_ifsc"
                  value={formData.bank_ifsc}
                  onChange={handleChange}
                  placeholder="HDFC0001234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono uppercase focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Status Checkbox */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <span>Active Employee Status</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition flex items-center gap-1.5"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isEdit ? 'Save Changes' : 'Create Employee'}</span>
                </>
              )}
            </button>
          </div>
        </form>
    </Modal>
  );
};
