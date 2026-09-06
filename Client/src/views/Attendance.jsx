import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  ShieldCheck, 
  Utensils, 
  LogOut, 
  LogIn,
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Zap,
  Smile,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  Flag,
  UserCheck
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getAttendanceStatus, 
  punchIn, 
  punchOut, 
  getAttendanceMetrics, 
  getAttendanceRoster,
  getMyAttendanceHistory,
  correctAttendanceRecord,
  bulkValidateLogs,
  exportTimesheet
} from '../services/attendanceApi';
import { Modal } from '../components/Modal';

// Roles that can access the operational roster and HR/Admin controls
const HR_ADMIN_ROLES = ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'];

const PAGE_SIZE = 5;

/**
 * Attendance Management Console (Phase 4)
 * Single Source of Truth UI implementation based on Docs/UI/Time & Attendance Console.png
 */
export const Attendance = () => {
  const { user } = useAuth();
  const isHRAdmin = user && HR_ADMIN_ROLES.includes(user.role);

  const [searchParams, setSearchParams] = useSearchParams();

  // State management for status, metrics, roster, filters, and modal
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState({
    monthlyWorked: 0,
    monthlyTarget: 168.0,
    workedPercentage: 0,
    overtimeLogged: 0,
    tardinessIncidents: 0
  });
  const [roster, setRoster] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkValidating, setBulkValidating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Synchronized search parameter from URL query string
  const search = searchParams.get('search') || '';
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [dateRange, setDateRange] = useState('Oct 24, 2024 (Today)');

  /**
   * Helper to handle live search input change in roster toolbar.
   * Resets to page 1 whenever search changes.
   */
  const handleRosterSearchChange = (e) => {
    const val = e.target.value;
    const currentParams = Object.fromEntries(searchParams.entries());
    if (val.trim()) {
      setSearchParams({ ...currentParams, search: val });
    } else {
      delete currentParams.search;
      setSearchParams(currentParams);
    }
    setCurrentPage(1);
  };

  // Selection & Modal state
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeCorrection, setActiveCorrection] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({ checkIn: '', checkOut: '', reason: '' });
  const [toastMessage, setToastMessage] = useState(null);

  /**
   * Real-time clock update (EST Timezone display matching reference console header)
   */
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      });
      setCurrentTimeStr(`${timeString} EST`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Initial data load — reload when filters or current page changes.
   * For HR/Admin: load roster + org metrics.
   * For EMPLOYEE: load own history + own metrics.
   */
  useEffect(() => {
    loadAttendanceData();
  }, [search, selectedDept, selectedStatus, exceptionsOnly, currentPage]);

  /**
   * When filters change (not page), reset to page 1.
   * currentPage change is handled by the effect above.
   */
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [search, selectedDept, selectedStatus, exceptionsOnly]);

  /**
   * Helper function to fetch all attendance data from backend
   */
  const loadAttendanceData = async () => {
    try {
      setLoading(true);

      if (isHRAdmin) {
        // HR/Admin: load org-wide roster + org metrics
        const [statusRes, metricsRes, rosterRes] = await Promise.all([
          getAttendanceStatus().catch(() => null),
          getAttendanceMetrics().catch(() => null),
          getAttendanceRoster({
            search,
            department: selectedDept,
            status: selectedStatus,
            exceptionsOnly,
            page: currentPage,
            limit: PAGE_SIZE
          }).catch(() => null)
        ]);

        if (statusRes?.data) setStatus(statusRes.data);
        if (metricsRes?.data) setMetrics(metricsRes.data);
        if (rosterRes?.data) {
          setRoster(rosterRes.data.roster || []);
          setTotalRecords(rosterRes.data.totalRecords || 0);
          setTotalPages(rosterRes.data.totalPages || 1);
          // If current page exceeds available pages, reset to last valid page
          if (rosterRes.data.totalPages && currentPage > rosterRes.data.totalPages) {
            setCurrentPage(Math.max(1, rosterRes.data.totalPages));
          }
        }
      } else {
        // EMPLOYEE: load own status + own metrics + own history
        const [statusRes, metricsRes, historyRes] = await Promise.all([
          getAttendanceStatus().catch(() => null),
          getAttendanceMetrics().catch(() => null),
          getMyAttendanceHistory({
            page: currentPage,
            limit: PAGE_SIZE
          }).catch(() => null)
        ]);

        if (statusRes?.data) setStatus(statusRes.data);
        if (metricsRes?.data) setMetrics(metricsRes.data);
        if (historyRes?.data) {
          setRoster(historyRes.data.history || []);
          setTotalRecords(historyRes.data.totalRecords || 0);
          setTotalPages(historyRes.data.totalPages || 1);
          if (historyRes.data.totalPages && currentPage > historyRes.data.totalPages) {
            setCurrentPage(Math.max(1, historyRes.data.totalPages));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load attendance console data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles Employee Punch In action
   */
  const handlePunchIn = async () => {
    try {
      setActionLoading(true);
      await punchIn();
      showToast('Successfully punched in for active shift.', 'success');
      await loadAttendanceData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to punch in.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handles Employee Punch Out action
   */
  const handlePunchOut = async () => {
    try {
      setActionLoading(true);
      await punchOut();
      showToast('Successfully punched out. Shift completed.', 'success');
      await loadAttendanceData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to punch out.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handles row checkbox selection
   */
  const handleRowSelect = (attendanceId) => {
    setSelectedRows((prev) =>
      prev.includes(attendanceId)
        ? prev.filter((id) => id !== attendanceId)
        : [...prev, attendanceId]
    );
  };

  /**
   * Handles header checkbox (select all / deselect all on current page)
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = roster
        .filter((r) => r.attendance_id)
        .map((r) => r.attendance_id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  /**
   * Handles Bulk Validate Logs action.
   * Only available to HR/Admin — button is not rendered for employees.
   */
  const handleBulkValidate = async () => {
    if (selectedRows.length === 0) return;
    if (bulkValidating) return;

    try {
      setBulkValidating(true);
      const result = await bulkValidateLogs(selectedRows);
      showToast(result.message || `${selectedRows.length} record(s) validated successfully.`, 'success');
      setSelectedRows([]);
      await loadAttendanceData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Bulk validation failed. Please try again.', 'error');
    } finally {
      setBulkValidating(false);
    }
  };

  /**
   * Handles Export Timesheet for Payroll action.
   * Only available to HR/Admin — button is not rendered for employees.
   */
  const handleExportTimesheet = async () => {
    if (exporting) return;

    try {
      setExporting(true);
      await exportTimesheet({
        search,
        department: selectedDept,
        status: selectedStatus,
        exceptionsOnly
      });
      showToast('Timesheet exported successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Triggers the Punch Correction Modal for a selected record
   */
  const openCorrectionModal = (record) => {
    setActiveCorrection(record);
    setCorrectionForm({
      checkIn: record.check_in ? new Date(record.check_in).toISOString().slice(0, 16) : '',
      checkOut: record.check_out ? new Date(record.check_out).toISOString().slice(0, 16) : '',
      reason: ''
    });
  };

  /**
   * Submits punch correction to backend
   */
  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!activeCorrection) return;

    try {
      setActionLoading(true);
      await correctAttendanceRecord(activeCorrection.attendance_id, correctionForm);
      showToast('Attendance punch corrected and audit log updated.', 'success');
      await loadAttendanceData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Correction failed.', 'error');
    } finally {
      setActiveCorrection(null);
      setActionLoading(false);
    }
  };

  /**
   * Displays temporary feedback notification banner
   */
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Pagination: navigate to a specific page
   */
  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    if (p !== currentPage) {
      setCurrentPage(p);
      setSelectedRows([]);
    }
  };

  /**
   * Build visible page number buttons (show up to 3 around current page)
   */
  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  /**
   * Helper function to render audit status pill badges matching reference PNG
   */
  const renderAuditBadge = (statusCategory, auditStatus) => {
    switch (statusCategory) {
      case 'ON_TIME':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            On Time
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {auditStatus}
          </span>
        );
      case 'MISSING_PUNCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <Flag size={12} className="text-amber-600" />
            Missing Punch
          </span>
        );
      case 'OVERTIME':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <Zap size={12} className="text-blue-600" />
            {auditStatus}
          </span>
        );
      case 'EARLY_DEP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {auditStatus}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {auditStatus}
          </span>
        );
    }
  };

  // Determine header row checkbox state
  const selectableRows = roster.filter((r) => r.attendance_id);
  const allOnPageSelected = selectableRows.length > 0 && selectableRows.every((r) => selectedRows.includes(r.attendance_id));

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-12">
      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 ${
          toastMessage.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-rose-900 text-white border-rose-700'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Header & Real-time Digital Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Session Tracked
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Time & Attendance Console
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Authenticated Biometric & Geofenced Gateway · Terminal 04-HQ
          </p>
        </div>

        {/* Digital Clock Display */}
        <div className="bg-blue-50/90 border border-blue-100 text-blue-950 px-4 py-2 rounded-xl flex items-center gap-3 shadow-xs">
          <Clock className="text-blue-600" size={22} />
          <span className="font-mono text-xl md:text-2xl font-bold tracking-wider">
            {currentTimeStr || '03:24:42 EST'}
          </span>
        </div>
      </div>

      {/* Grid Layout: Main Punch Tracker + Metrics + Compliance Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2): Live Session Card + 3 Metric Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Live Punch Status Box */}
          <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Clock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CURRENT STATUS:</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <span className={`w-2 h-2 rounded-full ${status?.isClockedIn ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {status?.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {status?.isClockedIn ? (
                    <>
                      Since <span className="font-semibold text-slate-900">
                        {status?.checkInTime ? new Date(status.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '08:58 AM'}
                      </span> · Active shift duration: <span className="font-semibold text-blue-700">
                        {status?.todayTotalHours ? `${status.todayTotalHours}h today` : 'In Progress'}
                      </span>
                    </>
                  ) : (
                    status?.checkOutTime ? (
                      <>
                        Last checked out at <span className="font-semibold text-slate-900">
                          {new Date(status.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span> · Shift duration: <span className="font-semibold text-blue-700">{status.todayTotalHours}h logged today</span>
                      </>
                    ) : (
                      <span>Not clocked in today · Ready for scheduled shift</span>
                    )
                  )}
                </p>
              </div>
            </div>

            {/* Punch Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs md:text-sm flex items-center gap-2 transition shadow-xs"
              >
                <Utensils size={15} className="text-slate-500" />
                <span>Start Meal Break</span>
              </button>

              {status?.isClockedIn ? (
                <button
                  onClick={handlePunchOut}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs md:text-sm flex items-center gap-2 transition shadow-md shadow-red-600/20"
                >
                  <LogOut size={16} />
                  <span>Punch Out</span>
                </button>
              ) : (
                <button
                  onClick={handlePunchIn}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm flex items-center gap-2 transition shadow-md shadow-blue-600/20"
                >
                  <LogIn size={16} />
                  <span>Punch In</span>
                </button>
              )}
            </div>
          </div>

          {/* Metrics Row (Monthly Worked, Overtime Logged, Tardiness Incidents) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Monthly Worked */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Monthly Worked</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{metrics.monthlyWorked}</span>
                    <span className="text-xs text-slate-500">/ {metrics.monthlyTarget}</span>
                    <span className="text-[11px] font-bold text-blue-600 ml-1">{metrics.workedPercentage}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">hrs</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Briefcase size={18} />
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, metrics.workedPercentage)}%` }}></div>
              </div>
            </div>

            {/* Card 2: Overtime Logged */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Overtime Logged</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">+{metrics.overtimeLogged}</span>
                    <span className="text-[11px] text-slate-500">hrs</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Pre-Approved
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Zap size={18} />
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Card 3: Tardiness Incidents */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Tardiness Incidents</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{metrics.tardinessIncidents}</span>
                    <span className="text-[11px] text-slate-500">events</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      100% On-time
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                  <Smile size={18} />
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (Span 1): Compliance Check Widget */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">COMPLIANCE CHECK</span>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                Cycle: Oct 1 - Oct 31
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-2">Weekly Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated punch regularisation against schedule sync
            </p>

            {/* Bar Chart Representation (M T W T F S S) */}
            <div className="mt-5 flex items-end justify-between gap-2 h-20 px-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                const isSelected = idx === 3; // Thursday
                const heights = ['60%', '75%', '85%', '95%', '50%', '15%', '10%'];
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-slate-200/80 rounded-t-md flex items-end h-16">
                      <div 
                        className={`w-full rounded-t-md transition-all ${isSelected ? 'bg-blue-600' : 'bg-blue-100/80'}`}
                        style={{ height: heights[idx] }}
                      ></div>
                    </div>
                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Card: Staffing Rate */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-semibold text-slate-700">Department Staffing Rate</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                <span>Active On-Premise: <strong className="text-slate-800">382</strong></span>
                <span>Remote: <strong className="text-slate-800">124</strong></span>
              </div>
            </div>
            <span className="text-lg font-extrabold text-slate-900">94.2%</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          CONDITIONAL SECTION: HR/Admin gets the full operational roster.
          Employees get their own personal attendance history table.
      ───────────────────────────────────────────────────────────── */}

      {isHRAdmin ? (
        /* ── HR/ADMIN: Full Operational Roster ── */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Section Header & Primary Actions */}
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Attendance Administration & Operational Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily biometric punch verification, scheduled shift deltas, and payroll pre-validation logs
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkValidate}
                disabled={selectedRows.length === 0 || bulkValidating}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs md:text-sm flex items-center gap-2 transition ${
                  selectedRows.length === 0 || bulkValidating
                    ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <ShieldCheck size={16} />
                <span>{bulkValidating ? 'Validating...' : `Bulk Validate Logs${selectedRows.length > 0 ? ` (${selectedRows.length})` : ''}`}</span>
              </button>
              <button
                onClick={handleExportTimesheet}
                disabled={exporting}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm flex items-center gap-2 transition shadow-xs ${
                  exporting
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <Download size={15} />
                <span>{exporting ? 'Exporting...' : 'Export Timesheet for Payroll'}</span>
              </button>
            </div>
          </div>

          {/* Toolbar & Filters Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              {/* Date Range Selector */}
              <div className="relative">
                <button className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50">
                  <Calendar size={15} className="text-slate-500" />
                  <span>{dateRange}</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee name or ID..."
                  value={search}
                  onChange={handleRosterSearchChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Department Dropdown */}
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); }}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Operations</option>
                <option>Finance & Risk</option>
                <option>Human Resources</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); }}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option>All Statuses</option>
                <option>On Time</option>
                <option>Late</option>
                <option>Missing Punch</option>
                <option>Overtime</option>
              </select>
            </div>

            {/* Exceptions Only Checkbox */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exceptionsOnly}
                onChange={(e) => { setExceptionsOnly(e.target.checked); }}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>Exceptions Only</span>
            </label>
          </div>

          {/* Operational Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={handleSelectAll}
                      className="rounded text-blue-600 border-slate-300"
                    />
                  </th>
                  <th className="py-3 px-4">EMPLOYEE</th>
                  <th className="py-3 px-4">DEPARTMENT</th>
                  <th className="py-3 px-4">SCHEDULED SHIFT</th>
                  <th className="py-3 px-4">ACTUAL CHECK IN</th>
                  <th className="py-3 px-4">ACTUAL CHECK OUT</th>
                  <th className="py-3 px-4">WORKED HOURS</th>
                  <th className="py-3 px-4">AUDIT STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                      Loading attendance operational roster...
                    </td>
                  </tr>
                ) : roster.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                      No attendance records found matching filters.
                    </td>
                  </tr>
                ) : (
                  roster.map((row) => {
                    const isMissing = !row.check_out;
                    const isSelected = selectedRows.includes(row.attendance_id);
                    return (
                      <tr key={row.attendance_id || row.employee_id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!row.attendance_id}
                            onChange={() => row.attendance_id && handleRowSelect(row.attendance_id)}
                            className="rounded text-blue-600 border-slate-300"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                              {row.first_name[0]}{row.last_name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{row.first_name} {row.last_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{row.employee_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{row.department}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">{row.scheduled_shift || '09:00 – 17:00'}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-900 font-medium">
                          {row.check_in ? new Date(row.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {row.check_out ? (
                            <span className="text-slate-900 font-medium">
                              {new Date(row.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold">--:-- (Missing)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {row.worked_hours ? `${Math.floor(row.worked_hours)}h ${Math.round((row.worked_hours % 1) * 60)}m` : 'Incomplete'}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderAuditBadge(row.statusCategory, row.auditStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isMissing ? (
                            <button
                              onClick={() => openCorrectionModal(row)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                            >
                              Resolve Punch
                            </button>
                          ) : (
                            <button
                              onClick={() => openCorrectionModal(row)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                            >
                              Correct
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{roster.length}</strong> of <strong className="text-slate-800">{totalRecords}</strong> recorded employees
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                  currentPage <= 1
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                  currentPage >= totalPages
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* ── EMPLOYEE: Personal Attendance History ── */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Section Header */}
          <div className="p-5 md:p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              My Attendance History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your personal punch records and worked hours for this period
            </p>
          </div>

          {/* Personal History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">CHECK IN</th>
                  <th className="py-3 px-4">CHECK OUT</th>
                  <th className="py-3 px-4">WORKED HOURS</th>
                  <th className="py-3 px-4">OVERTIME</th>
                  <th className="py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                      Loading your attendance history...
                    </td>
                  </tr>
                ) : roster.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  roster.map((row) => {
                    const isMissing = row.check_in && !row.check_out;
                    const isAbsent = !row.check_in;
                    let statusCategory = 'ON_TIME';
                    let auditStatus = 'On Time';
                    if (isAbsent) { statusCategory = 'ABSENT'; auditStatus = 'Absent'; }
                    else if (isMissing) { statusCategory = 'MISSING_PUNCH'; auditStatus = 'Missing Punch'; }
                    else if (row.overtime_hours > 0) { statusCategory = 'OVERTIME'; auditStatus = `Overtime +${parseFloat(row.overtime_hours).toFixed(2)}h`; }
                    return (
                      <tr key={row.attendance_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {row.check_in ? new Date(row.check_in).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-900 font-medium">
                          {row.check_in ? new Date(row.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {row.check_out ? (
                            <span className="text-slate-900 font-medium">
                              {new Date(row.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold">--:-- (Missing)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {row.worked_hours ? `${Math.floor(row.worked_hours)}h ${Math.round((row.worked_hours % 1) * 60)}m` : 'Incomplete'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {row.overtime_hours > 0 ? `+${parseFloat(row.overtime_hours).toFixed(2)}h` : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderAuditBadge(statusCategory, auditStatus)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination (Employee history) */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{roster.length}</strong> of <strong className="text-slate-800">{totalRecords}</strong> records
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                  currentPage <= 1
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                  currentPage >= totalPages
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Attendance Punch Correction Modal (HR/Admin only) */}
      <Modal
        isOpen={Boolean(activeCorrection && isHRAdmin)}
        onClose={() => setActiveCorrection(null)}
        title="Attendance Punch Correction"
        subtitle={activeCorrection ? `${activeCorrection.first_name} ${activeCorrection.last_name} (${activeCorrection.employee_code})` : ''}
        icon={Clock}
        maxWidth="max-w-md"
        preventClose={actionLoading}
      >
        {activeCorrection && (
          <form onSubmit={handleSaveCorrection} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-In Timestamp</label>
              <input
                type="datetime-local"
                value={correctionForm.checkIn}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-Out Timestamp</label>
              <input
                type="datetime-local"
                value={correctionForm.checkOut}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Adjustment</label>
              <textarea
                rows="3"
                placeholder="Provide brief explanation for manual regularization..."
                value={correctionForm.reason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveCorrection(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Save & Update Log'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
