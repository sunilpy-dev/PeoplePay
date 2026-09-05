import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { EmployeeFormModal } from './EmployeeFormModal';
import { Modal } from '../../components/Modal';
import { 
  Users, 
  UserPlus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  UserX, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  List, 
  LayoutGrid,
  X,
  AlertTriangle
} from 'lucide-react';

export const EmployeeDirectory = () => {
  const navigate = useNavigate();
  const deptSelectRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, departments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Deactivate Confirmation Modal State
  const [deactivatingEmployee, setDeactivatingEmployee] = useState(null);
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/employees/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load employee statistics:', err);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedDept && selectedDept !== 'All Departments') params.append('department', selectedDept);
      if (selectedStatus && selectedStatus !== 'All Statuses') params.append('status', selectedStatus);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/employees?${params.toString()}`);
      if (res.data.success) {
        setEmployees(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load employee roster:', err);
      setError('Failed to fetch employee directory records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/employees/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [debouncedSearch, selectedDept, selectedStatus, page]);

  const handleCreateOpen = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (emp, e) => {
    if (e) e.stopPropagation();
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingEmployee) return;
    setDeactivatingLoading(true);
    setError('');
    try {
      await api.delete(`/employees/${deactivatingEmployee.id}`);
      await fetchEmployees();
      await fetchStats();
    } catch (err) {
      console.error('Failed to deactivate employee:', err);
      setError(err.response?.data?.message || 'Failed to deactivate employee.');
    } finally {
      setDeactivatingEmployee(null);
      setDeactivatingLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedDept('All Departments');
    setSelectedStatus('All Statuses');
    setPage(1);
  };

  const handleKpiFilter = (type) => {
    setPage(1);
    if (type === 'all') {
      handleClearFilters();
    } else if (type === 'active') {
      setSelectedStatus(selectedStatus === 'Active' ? 'All Statuses' : 'Active');
    } else if (type === 'inactive') {
      setSelectedStatus(selectedStatus === 'Inactive' ? 'All Statuses' : 'Inactive');
    } else if (type === 'departments') {
      if (deptSelectRef.current) {
        deptSelectRef.current.focus();
      }
    }
  };

  const getDeptColor = (dept) => {
    switch (dept) {
      case 'Engineering':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'People':
      case 'HR':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Product':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Finance':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sales':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const hasActiveFilters = searchInput.trim() !== '' || selectedDept !== 'All Departments' || selectedStatus !== 'All Statuses';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Employees
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>{totalCount} Records</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Centralized employee master registry with department assignments, reporting structures, and verified payroll bank information.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* List / Kanban View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {/* Add Employee Button */}
          <button
            type="button"
            onClick={handleCreateOpen}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <UserPlus size={15} />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* Interactive KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div 
          onClick={() => handleKpiFilter('all')}
          className={`
            p-4 rounded-xl border bg-white cursor-pointer transition flex items-center justify-between shadow-2xs
            ${selectedStatus === 'All Statuses' && selectedDept === 'All Departments' && !searchInput
              ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'}
          `}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</p>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.total}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">All employee records</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Active Workforce */}
        <div 
          onClick={() => handleKpiFilter('active')}
          className={`
            p-4 rounded-xl border bg-white cursor-pointer transition flex items-center justify-between shadow-2xs
            ${selectedStatus === 'Active'
              ? 'border-emerald-600 ring-2 ring-emerald-500/20' 
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'}
          `}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Workforce</p>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.active}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {selectedStatus === 'Active' ? 'Active filter applied' : 'Active employee records'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Inactive Records */}
        <div 
          onClick={() => handleKpiFilter('inactive')}
          className={`
            p-4 rounded-xl border bg-white cursor-pointer transition flex items-center justify-between shadow-2xs
            ${selectedStatus === 'Inactive'
              ? 'border-rose-600 ring-2 ring-rose-500/20' 
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'}
          `}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inactive Records</p>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.inactive}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {selectedStatus === 'Inactive' ? 'Inactive filter applied' : 'Deactivated employee records'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <UserX size={20} />
          </div>
        </div>

        {/* Departments */}
        <div 
          onClick={() => handleKpiFilter('departments')}
          className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-purple-300 cursor-pointer transition flex items-center justify-between shadow-2xs hover:shadow-xs"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Departments</p>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{stats.departments}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Distinct departments</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, employee code, role, email..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">DEPT:</span>
            <select
              ref={deptSelectRef}
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
            >
              <option value="All Departments">All Departments</option>
              {departments.map((d) => (
                <option key={d.department} value={d.department}>{d.department}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">STATUS:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedDept('All Departments');
                setSelectedStatus('All Statuses');
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Area: Table View or Kanban View */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-slate-500 mt-3">Loading workforce directory...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-rose-200 p-8 text-center text-rose-600 text-xs">
          {error}
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users size={32} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No Employees Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or department filter.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List Table View matching Employee Directory design */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee Name & ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Reporting Manager</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    {/* Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-semibold text-xs shrink-0">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight hover:text-indigo-600 transition">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-mono font-medium text-slate-700">{emp.employee_code}</span>
                            {emp.user_email && <span>• {emp.user_email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getDeptColor(emp.department)}`}>
                        {emp.department}
                      </span>
                    </td>

                    {/* Position */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {emp.job_position}
                    </td>

                    {/* Reporting Manager */}
                    <td className="py-3.5 px-4">
                      {emp.manager_name ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <UserCheck size={13} className="text-slate-400 shrink-0" />
                          <span>{emp.manager_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Direct / Executive</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${emp.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span>{emp.is_active ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleEditOpen(emp, e)}
                          title="Edit Profile"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                        >
                          <Edit3 size={14} />
                        </button>
                        <Link
                          to={`/employees/${emp.id}`}
                          title="View Details"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
                        >
                          <Eye size={14} />
                        </Link>
                        {emp.is_active && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeactivatingEmployee(emp);
                            }}
                            title="Deactivate Profile"
                            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{employees.length}</span> of <span className="font-semibold text-slate-900">{totalCount}</span> employees
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-medium text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban View by Department */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((deptItem) => {
            const deptEmps = employees.filter(e => e.department === deptItem.department);
            return (
              <div key={deptItem.department} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{deptItem.department}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {deptEmps.length}
                  </span>
                </div>
                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-96">
                  {deptEmps.length === 0 ? (
                    <p className="text-center text-[11px] text-slate-400 py-4 italic">No employees</p>
                  ) : (
                    deptEmps.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xs bg-slate-50/50 cursor-pointer transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-semibold text-slate-500">{emp.employee_code}</span>
                          <span className={`w-2 h-2 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-900 mt-1">{emp.first_name} {emp.last_name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{emp.job_position}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Employee Create / Edit Modal */}
      <EmployeeFormModal
        isOpen={isModalOpen}
        initialData={editingEmployee}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={() => {
          fetchEmployees();
          fetchDepartments();
          fetchStats();
        }}
      />

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={Boolean(deactivatingEmployee)}
        onClose={() => setDeactivatingEmployee(null)}
        title="Deactivate Employee Profile"
        icon={AlertTriangle}
        maxWidth="max-w-md"
        preventClose={deactivatingLoading}
      >
        {deactivatingEmployee && (
          <div className="p-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to deactivate <span className="font-semibold text-slate-800">{deactivatingEmployee.first_name} {deactivatingEmployee.last_name}</span> ({deactivatingEmployee.employee_code})?
              This will mark the record inactive in PostgreSQL.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeactivatingEmployee(null)}
                disabled={deactivatingLoading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateConfirm}
                disabled={deactivatingLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {deactivatingLoading ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

