import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  User,
  Users,
  Building2,
  CalendarCheck,
  CalendarRange,
  FileText,
  Hourglass,
  Sliders,
  Plane,
  HeartPulse,
  Award,
  Sun,
  XCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as leaveApi from '../services/leaveApi';
import api from '../services/api';
import { Modal } from '../components/Modal';

const HR_ADMIN_ROLES = ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'];

export const Leaves = () => {
  const { user, role } = useAuth();
  const isHRAdmin = role === 'ADMIN' || (role && HR_ADMIN_ROLES.includes(role));

  // State
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'allocations'
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [hasProfile, setHasProfile] = useState(true);
  const [profileMessage, setProfileMessage] = useState(null);
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form states
  const [requestForm, setRequestForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [allocationForm, setAllocationForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    allocatedDays: ''
  });

  // Action status
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load all initial data from PostgreSQL
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [typesData, myBalancesRes, requestsData] = await Promise.all([
        leaveApi.getLeaveTypes(),
        leaveApi.getMyLeaveBalances(),
        leaveApi.getLeaveRequests()
      ]);

      setLeaveTypes(typesData || []);
      setBalances(myBalancesRes?.data || []);
      setHasProfile(myBalancesRes?.hasProfile ?? true);
      setProfileMessage(myBalancesRes?.message || null);
      setRequests(requestsData?.data || []);

      // If HR/Admin, fetch allocations and employee list
      if (isHRAdmin) {
        const [allocData, empData] = await Promise.all([
          leaveApi.getLeaveAllocations(),
          api.get('/employees?limit=100')
        ]);
        setAllocations(allocData?.data || []);
        setEmployees(empData?.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
      setActionError(err.response?.data?.message || 'Failed to load leave records from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.employeeId, isHRAdmin]);

  // Clear messages automatically after 6 seconds
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  // Calculate live request duration
  const calculatedDuration = useMemo(() => {
    if (!requestForm.startDate || !requestForm.endDate) return 0;
    const start = new Date(requestForm.startDate);
    const end = new Date(requestForm.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [requestForm.startDate, requestForm.endDate]);

  // Selected leave type balance in form
  const selectedTypeBalance = useMemo(() => {
    if (!requestForm.leaveTypeId) return null;
    return balances.find(b => b.leave_type_id === requestForm.leaveTypeId);
  }, [requestForm.leaveTypeId, balances]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        req.first_name?.toLowerCase().includes(query) ||
        req.last_name?.toLowerCase().includes(query) ||
        req.employee_code?.toLowerCase().includes(query) ||
        req.leave_type_name?.toLowerCase().includes(query) ||
        req.reason?.toLowerCase().includes(query);

      // Status match
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'duration') return b.duration_days - a.duration_days;
      return 0;
    });
  }, [requests, searchQuery, statusFilter, sortBy]);

  // Filtered allocations
  const filteredAllocations = useMemo(() => {
    return allocations.filter(alloc => {
      const query = searchQuery.toLowerCase().trim();
      return !query || 
        alloc.first_name?.toLowerCase().includes(query) ||
        alloc.last_name?.toLowerCase().includes(query) ||
        alloc.employee_code?.toLowerCase().includes(query) ||
        alloc.department?.toLowerCase().includes(query) ||
        alloc.leave_type_name?.toLowerCase().includes(query);
    });
  }, [allocations, searchQuery]);

  // Pending count badge
  const pendingCount = useMemo(() => {
    return requests.filter(r => r.status === 'SUBMITTED').length;
  }, [requests]);

  // Handle Time Off Request Submission
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);

    try {
      const targetEmpId = isHRAdmin && requestForm.employeeId ? requestForm.employeeId : user?.employeeId;

      if (!targetEmpId) {
        throw new Error('An employee profile is required to request time off.');
      }

      if (!requestForm.leaveTypeId || !requestForm.startDate || !requestForm.endDate) {
        throw new Error('Please select a leave type, start date, and end date.');
      }

      await leaveApi.createLeaveRequest({
        employeeId: targetEmpId,
        leaveTypeId: requestForm.leaveTypeId,
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        reason: requestForm.reason
      });

      setActionSuccess('Leave request submitted successfully. Approver has been designated.');
      setRequestForm({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to submit leave request.');
    } finally {
      setIsRequestModalOpen(false);
      setSubmitting(false);
    }
  };

  // Handle Allocation Creation / Update
  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);

    try {
      if (!allocationForm.employeeId || !allocationForm.leaveTypeId || allocationForm.allocatedDays === '') {
        throw new Error('Please select an employee, leave type, and enter allocated days.');
      }

      await leaveApi.createOrUpdateAllocation({
        employeeId: allocationForm.employeeId,
        leaveTypeId: allocationForm.leaveTypeId,
        allocatedDays: parseFloat(allocationForm.allocatedDays)
      });

      setActionSuccess('Leave allocation updated successfully in database.');
      setAllocationForm({ employeeId: '', leaveTypeId: '', allocatedDays: '' });
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update leave allocation.');
    } finally {
      setIsAllocationModalOpen(false);
      setSubmitting(false);
    }
  };

  // Handle Approve Request
  const handleApprove = async (id) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await leaveApi.approveLeaveRequest(id);
      setActionSuccess('Leave request approved and balance deducted.');
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Approval failed.');
    }
  };

  // Handle Reject Request
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);

    try {
      await leaveApi.rejectLeaveRequest(rejectingRequest.id, rejectionReason);
      setActionSuccess('Leave request has been refused.');
      setRejectionReason('');
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setRejectingRequest(null);
      setSubmitting(false);
    }
  };

  // Handle Cancel Own Request
  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    setActionError(null);
    try {
      await leaveApi.cancelLeaveRequest(id);
      setActionSuccess('Leave request cancelled.');
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Pending HR Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Approved
          </span>
        );
      case 'REFUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} className="text-rose-600" />
            Refused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            WORKFORCE OPERATIONS • ENTITLEMENTS FY24
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Time Off & Absence Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage synchronized vacation accruals, medical leaves, statutory allocations, and manager approvals across international entities.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Policy indicator pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eef4ff] border border-blue-200/80 text-xs font-medium text-[#0051d5]">
            <span>Accrual Policy: <strong>Global Corp Standard</strong></span>
          </div>

          {/* HR/Admin: New Allocation Button */}
          {isHRAdmin && (
            <button
              type="button"
              onClick={() => {
                setAllocationForm({
                  employeeId: employees[0]?.id || user?.employeeId || '',
                  leaveTypeId: leaveTypes[0]?.id || '',
                  allocatedDays: ''
                });
                setIsAllocationModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#0051d5] bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition shadow-2xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Allocation</span>
            </button>
          )}

          {/* Request Time Off Button */}
          <button
            type="button"
            onClick={() => {
              setRequestForm({
                employeeId: user?.employeeId || employees[0]?.id || '',
                leaveTypeId: leaveTypes[0]?.id || '',
                startDate: '',
                endDate: '',
                reason: ''
              });
              setIsRequestModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0f172a] hover:bg-slate-800 rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Request Time Off</span>
          </button>
        </div>
      </div>

      {/* Admin Notice if account has no personal employee profile */}
      {!hasProfile && isHRAdmin && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900">
          <Info size={16} className="text-blue-600 shrink-0" />
          <span>
            {profileMessage || 'Logged in with an administrative management account. You can configure leave allocations and process team approval requests below.'}
          </span>
        </div>
      )}

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Top KPI Cards: Dynamic Leave Entitlements & Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Annual Vacation */}
        {(() => {
          const annual = balances.find(b => b.leave_type_code === 'ANNUAL') || { allocated_days: 0, taken_days: 0, available_days: 0 };
          const percent = annual.allocated_days > 0 ? Math.round((annual.available_days / annual.allocated_days) * 100) : 0;
          return (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  ANNUAL VACATION
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center">
                  <Plane size={17} />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {annual.available_days}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">days left</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
                  <span>{annual.taken_days} used</span>
                  <span>{annual.allocated_days} granted</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#0051d5] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, percent)}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Accrues period basis</span>
                  <span className="font-semibold text-blue-600">{percent}% remaining</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 2: Medical / Sick Leave */}
        {(() => {
          const sick = balances.find(b => b.leave_type_code === 'SICK') || { allocated_days: 0, taken_days: 0, available_days: 0 };
          const percent = sick.allocated_days > 0 ? Math.round((sick.available_days / sick.allocated_days) * 100) : 0;
          return (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  MEDICAL / SICK LEAVE
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <HeartPulse size={17} />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {sick.available_days}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">days left</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
                  <span>{sick.taken_days} used</span>
                  <span>{sick.allocated_days} granted</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, percent)}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Doctor note threshold: &gt;3d</span>
                  <span className="font-semibold text-teal-600">{percent}% remaining</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 3: Personal / Casual Leave */}
        {(() => {
          const casual = balances.find(b => b.leave_type_code === 'CASUAL' || b.leave_type_code === 'PERSONAL') || { allocated_days: 0, taken_days: 0, available_days: 0 };
          const percent = casual.allocated_days > 0 ? Math.round((casual.available_days / casual.allocated_days) * 100) : 0;
          return (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  PERSONAL / WELLNESS
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sun size={17} />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {casual.available_days}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">days left</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
                  <span>{casual.taken_days} used</span>
                  <span>{casual.allocated_days} granted</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, percent)}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>No rollover to FY25</span>
                  <span className="font-semibold text-indigo-600">{percent}% remaining</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 4: Unpaid / Statutory */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              PARENTAL / STATUTORY
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={17} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                Full Eligibility
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Up to 16 Weeks</span>
              <span>State & Corp Funded</span>
            </div>
            <div className="mt-2.5 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>Compliant with statutory labor laws</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Main Operational Workspace (Tabs & Filter Bar) */}
      <div className="space-y-4">
        
        {/* Tab Selection and Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-white text-[#0051d5] border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <CalendarRange size={15} />
              <span>Requests & Approvals Queue</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {pendingCount} Pending
                </span>
              )}
            </button>

            {isHRAdmin && (
              <button
                onClick={() => setActiveTab('allocations')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                  activeTab === 'allocations'
                    ? 'bg-white text-[#0051d5] border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Sliders size={15} />
                <span>Leave Allocations & Entitlements</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, ID or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 w-56 sm:w-64 focus:outline-none focus:border-blue-500 transition shadow-2xs"
              />
            </div>

            {activeTab === 'requests' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-blue-500 transition shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Pending HR Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REFUSED">Refused</option>
              </select>
            )}

            <button
              onClick={fetchData}
              title="Refresh records"
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition shadow-2xs"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>

        </div>

        {/* 4. Table Section: Requests Queue */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Queue: Actionable Employee Absence Requests
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reviewing pending department requests requiring managerial sign-off or HR compliance audit.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>SORT BY:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                >
                  <option value="newest">Submission Date (Newest)</option>
                  <option value="duration">Duration Days</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw size={20} className="animate-spin text-blue-600 mx-auto mb-2" />
                Loading leave requests from PostgreSQL...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <CalendarCheck size={28} className="text-slate-300 mx-auto mb-2" />
                No leave requests found matching your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-[#f8faff] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Leave Type</th>
                      <th className="px-4 py-3">Duration & Days</th>
                      <th className="px-4 py-3">Reason / Note</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Reviewer</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => {
                      const canApproveThis = isHRAdmin && req.status === 'SUBMITTED' && req.employee_id !== user?.employeeId;
                      const isOwnPending = req.employee_id === user?.employeeId && req.status === 'SUBMITTED';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition">
                          
                          {/* Employee */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {req.first_name?.[0] || 'U'}{req.last_name?.[0] || ''}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {req.first_name} {req.last_name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {req.employee_code} • {req.department}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Leave Type */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              {req.leave_type_name}
                            </span>
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">
                              {new Date(req.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(req.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {req.duration_days} {req.duration_days === 1 ? 'day' : 'consecutive days'}
                            </span>
                          </td>

                          {/* Reason */}
                          <td className="px-4 py-3.5 max-w-xs truncate text-slate-600">
                            {req.reason || <span className="text-slate-400 italic">No notes provided</span>}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {getStatusBadge(req.status)}
                          </td>

                          {/* Reviewer */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                            {req.approver_first_name ? (
                              <span>{req.approver_first_name} {req.approver_last_name}</span>
                            ) : req.status === 'SUBMITTED' ? (
                              <span className="text-slate-400 italic">Awaiting Review</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {canApproveThis ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(req.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition flex items-center gap-1"
                                >
                                  <Check size={13} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingRequest(req);
                                    setRejectionReason('');
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition flex items-center gap-1"
                                >
                                  <X size={13} />
                                  <span>Refuse</span>
                                </button>
                              </div>
                            ) : isOwnPending ? (
                              <button
                                type="button"
                                onClick={() => handleCancelRequest(req.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded transition"
                              >
                                Cancel Request
                              </button>
                            ) : req.status === 'APPROVED' ? (
                              <span className="text-[11px] font-medium text-emerald-600">
                                Logged & Synced
                              </span>
                            ) : req.status === 'REFUSED' ? (
                              <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px] inline-block" title={req.rejection_reason}>
                                {req.rejection_reason || 'Refused'}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. Table Section: Leave Allocations (HR/Admin) */}
        {activeTab === 'allocations' && isHRAdmin && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Global Leave Entitlements & Allocation Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configured days, used timecards, and remaining balance reserves for all verified personnel.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw size={20} className="animate-spin text-blue-600 mx-auto mb-2" />
                Loading allocations from database...
              </div>
            ) : filteredAllocations.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <Sliders size={28} className="text-slate-300 mx-auto mb-2" />
                No allocations found. Click "New Allocation" to grant entitlements.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-[#f8faff] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Leave Type</th>
                      <th className="px-4 py-3 font-mono text-right">Allocated</th>
                      <th className="px-4 py-3 font-mono text-right">Taken</th>
                      <th className="px-4 py-3 font-mono text-right">Available</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAllocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {alloc.first_name} {alloc.last_name}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {alloc.employee_code} • {alloc.job_position}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                          {alloc.department}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {alloc.leave_type_name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                          {alloc.allocated_days}d
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                          {alloc.taken_days}d
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0051d5]">
                          {alloc.available_days}d
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Reserve
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setAllocationForm({
                                employeeId: alloc.employee_id,
                                leaveTypeId: alloc.leave_type_id,
                                allocatedDays: alloc.allocated_days
                              });
                              setIsAllocationModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded transition"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 6. Team Schedule Radar Section (Upcoming Absences Roster) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-[#0051d5]" />
            <h3 className="font-bold text-sm text-slate-900">Team Schedule Radar</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Live visibility of concurrent absences across connected teams to mitigate project delivery bottlenecks.
        </p>

        {/* Live Upcoming Roster Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {requests.filter(r => r.status === 'APPROVED' || r.status === 'SUBMITTED').slice(0, 6).map((req) => (
            <div key={req.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {req.first_name?.[0]}{req.last_name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">{req.first_name} {req.last_name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {req.leave_type_name} • {req.duration_days} {req.duration_days === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono text-slate-700 font-semibold block">
                  {new Date(req.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className={`text-[9px] font-bold uppercase ${req.status === 'APPROVED' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {req.status === 'APPROVED' ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
          ))}

          {requests.filter(r => r.status === 'APPROVED' || r.status === 'SUBMITTED').length === 0 && (
            <div className="col-span-full py-6 text-center text-xs text-slate-400 italic">
              No active or upcoming scheduled team absences on record.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: Request Time Off
         ========================================================================= */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Time Off"
        icon={CalendarRange}
        maxWidth="max-w-lg"
        preventClose={submitting}
      >
        <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
          
          {/* Target Employee Select (If HR/Admin requesting on behalf) */}
          {isHRAdmin && employees.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={requestForm.employeeId || user?.employeeId || ''}
                onChange={(e) => setRequestForm({ ...requestForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Leave Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={requestForm.leaveTypeId}
              onChange={(e) => setRequestForm({ ...requestForm, leaveTypeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              required
            >
              <option value="" disabled>Select Leave Category</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.is_unpaid ? '(Unpaid / LOP)' : ''}
                </option>
              ))}
            </select>

            {/* Live Balance Hint */}
            {selectedTypeBalance && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Available Balance:</span>
                <strong className="text-[#0051d5] font-mono">
                  {selectedTypeBalance.is_unpaid ? 'Uncapped / Loss of Pay' : `${selectedTypeBalance.available_days} days`}
                </strong>
              </p>
            )}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                min={requestForm.startDate}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition font-mono"
                required
              />
            </div>
          </div>

          {/* Live Duration Calculation */}
          {calculatedDuration > 0 && (
            <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <span className="font-medium">Calculated Leave Duration:</span>
              <strong className="font-mono text-sm">{calculatedDuration} {calculatedDuration === 1 ? 'day' : 'days'}</strong>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Operational Notes
            </label>
            <textarea
              rows="3"
              placeholder="Optional brief description for the approving manager..."
              value={requestForm.reason}
              onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0f172a] hover:bg-slate-800 disabled:opacity-50 rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={13} className="animate-spin" />}
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* =========================================================================
          MODAL 2: New Leave Allocation (HR/Admin)
         ========================================================================= */}
      <Modal
        isOpen={isAllocationModalOpen && isHRAdmin}
        onClose={() => setIsAllocationModalOpen(false)}
        title="Configure Leave Allocation"
        icon={Sliders}
        maxWidth="max-w-lg"
        preventClose={submitting}
      >
        <form onSubmit={handleCreateAllocation} className="p-6 space-y-4">
          
          {/* Employee Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={allocationForm.employeeId}
              onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              required
            >
              <option value="" disabled>Select Target Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code}) — {emp.department}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={allocationForm.leaveTypeId}
              onChange={(e) => setAllocationForm({ ...allocationForm, leaveTypeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              required
            >
              <option value="" disabled>Select Leave Type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>

          {/* Allocated Days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Total Allocated Days <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="365"
              placeholder="e.g. 24.0"
              value={allocationForm.allocatedDays}
              onChange={(e) => setAllocationForm({ ...allocationForm, allocatedDays: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition font-mono"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Updates PostgreSQL <code>leave_allocations</code> reserve for the active fiscal period.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAllocationModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0051d5] hover:bg-blue-700 disabled:opacity-50 rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={13} className="animate-spin" />}
              <span>{submitting ? 'Saving...' : 'Save Allocation'}</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* =========================================================================
          MODAL 3: Refuse Leave Request Reason
         ========================================================================= */}
      <Modal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        title="Refuse Leave Request"
        icon={XCircle}
        maxWidth="max-w-md"
        preventClose={submitting}
      >
        {rejectingRequest && (
          <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-600">
              You are refusing the leave request for <strong className="text-slate-900">{rejectingRequest.first_name} {rejectingRequest.last_name}</strong> ({rejectingRequest.duration_days} days).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Critical project milestone overlap or team coverage shortfall..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500 transition"
                required
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                {submitting && <RefreshCw size={13} className="animate-spin" />}
                <span>{submitting ? 'Refusing...' : 'Refuse Request'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
