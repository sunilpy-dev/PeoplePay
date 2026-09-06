import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Download,
  Mail,
  HelpCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Building,
  ShieldCheck,
  CreditCard,
  FileMinus,
  Check,
  X,
  Send,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import {
  getMyLatestPayslip,
  getMyPayslipHistory,
  getPayslipById,
  downloadPayslipPdf,
  sendPayslipEmail
} from '../services/payslipApi';
import { createGrievance } from '../services/grievanceApi';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const MyPayslips = () => {
  const { user, role } = useAuth();

  // State
  const [payslip, setPayslip] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState('my-latest');
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Interactive UI toggles
  const [earningsExpanded, setEarningsExpanded] = useState(true);
  const [deductionsExpanded, setDeductionsExpanded] = useState(true);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef(null);

  // Search & Filter for History
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');

  // Action states
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Grievance modal
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [grievanceCategory, setGrievanceCategory] = useState('Overtime / Shift Differential Discrepancy');
  const [grievanceText, setGrievanceText] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  /**
   * Currency formatter for Indian Rupees (₹) with Indian Numbering System
   */
  const formatCurrency = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(isNaN(num) ? 0 : num);
  };

  const formatDeduction = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    const absVal = Math.abs(isNaN(num) ? 0 : num);
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absVal);
    return `-${formatted}`;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [latestRes, historyRes] = await Promise.all([
        getMyLatestPayslip().catch(() => null),
        getMyPayslipHistory().catch(() => null)
      ]);

      if (latestRes?.data) {
        setPayslip(latestRes.data);
        if (latestRes.data.id) {
          setSelectedId(latestRes.data.id);
        }
      } else {
        setPayslip(null);
      }

      if (historyRes?.data && Array.isArray(historyRes.data)) {
        setHistory(historyRes.data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to load payslip data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Interactive Payslip Selection & Dynamic Preview
   */
  const handleSelectPayslip = async (id) => {
    try {
      setSelectedId(id);
      setPeriodDropdownOpen(false);
      setLoadingPreview(true);

      if (id === 'my-latest') {
        const res = await getMyLatestPayslip();
        if (res?.data) {
          setPayslip(res.data);
          showToast(`Switched preview to ${res.data.periodLabel || 'Latest Statement'}`);
        }
      } else {
        const res = await getPayslipById(id);
        if (res?.data) {
          setPayslip(res.data);
          showToast(`Loaded statement for ${res.data.periodName || res.data.periodLabel}`);
        }
      }
    } catch (err) {
      console.error('Error switching payslip preview:', err);
      showToast('Failed to load payslip details.', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  /**
   * Real PDF Download Action
   */
  const handleDownloadPdf = async (id = selectedId) => {
    const targetId = id || selectedId || 'my-latest';
    try {
      setDownloadingPdf(true);
      setDownloadingId(targetId);
      const res = await downloadPayslipPdf(targetId);
      showToast(`Payslip PDF statement (${res?.filename || 'PDF'}) downloaded successfully.`);
    } catch (err) {
      console.error('PDF download error:', err);
      showToast(err.message || 'Failed to download PDF payslip statement.', 'error');
    } finally {
      setDownloadingPdf(false);
      setDownloadingId(null);
    }
  };

  /**
   * Real Email Statement Action
   */
  const handleSendEmail = async () => {
    const targetId = selectedId || 'my-latest';
    try {
      setSendingEmail(true);
      const res = await sendPayslipEmail(targetId);
      showToast(res.message || `Payslip PDF statement dispatched to ${user?.email || 'your email'}.`);
    } catch (err) {
      console.error('Email error:', err);
      showToast(err.message || 'Failed to dispatch email statement.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const [submittingGrievance, setSubmittingGrievance] = useState(false);

  const handleGrievanceSubmit = async (e) => {
    e.preventDefault();
    if (!grievanceText.trim()) return;

    setSubmittingGrievance(true);
    try {
      const res = await createGrievance({
        category: grievanceCategory,
        description: grievanceText.trim(),
        payslipId: payslip?.id,
        payrunId: payslip?.payrunId
      });
      const ticketCode = res.data?.ticketCode || 'GRV';
      showToast(`Grievance ticket [${ticketCode}] registered for ${payslip?.periodLabel || 'statement'}. HR & Payroll Operations will respond within 24-48h.`, 'success');
      setShowGrievanceModal(false);
      setGrievanceText('');
    } catch (err) {
      console.error('Grievance submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to submit grievance.';
      showToast(msg, 'error');
    } finally {
      setSubmittingGrievance(false);
    }
  };

  // Filtered History
  const filteredHistory = history.filter((item) => {
    const matchesSearch = 
      !historySearch || 
      item.periodName?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.periodRange?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.disbursementDate?.toLowerCase().includes(historySearch.toLowerCase());
    
    const matchesStatus = 
      historyStatusFilter === 'ALL' || 
      (item.status && item.status.toUpperCase() === historyStatusFilter);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
          toastMessage.type === 'success' 
            ? 'bg-slate-900 text-white border-slate-700' 
            : 'bg-rose-900 text-white border-rose-700'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={16} className="text-rose-400 shrink-0" />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TOP BANNER: Breadcrumb, Title, Emp ID, Header Controls
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Breadcrumbs & Title */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>EMPLOYEE WORKSPACE</span>
            <span>/</span>
            <span className="text-[#0051d5]">REMUNERATION & STATEMENTS (INR)</span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Payslips
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Emp ID: #{payslip?.employeeCode || user?.employeeCode || 'EMP-84092'}
            </span>
          </div>
        </div>

        {/* Right: Interactive Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Interactive Pay Period Selector Dropdown */}
          <div className="relative" ref={periodDropdownRef}>
            <button
              type="button"
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Calendar size={14} className="text-[#0051d5]" />
              <span>{payslip?.cycleLabel || payslip?.periodLabel || 'Select Period'}</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${periodDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {periodDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900">Select Pay Period</span>
                  <span className="text-[10px] text-slate-400 font-mono">FY 2024-25</span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                  <button
                    type="button"
                    onClick={() => handleSelectPayslip('my-latest')}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                      selectedId === 'my-latest' ? 'bg-blue-50/70 text-[#0051d5] font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold">October 2024 (Active)</p>
                      <p className="text-[10px] text-slate-400">Oct 01 - Oct 31, 2024</p>
                    </div>
                    {selectedId === 'my-latest' && <Check size={14} className="text-[#0051d5]" />}
                  </button>

                  {history.map((hist) => (
                    <button
                      key={hist.payslipId}
                      type="button"
                      onClick={() => handleSelectPayslip(hist.payslipId)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        selectedId === hist.payslipId ? 'bg-blue-50/70 text-[#0051d5] font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{hist.periodName}</p>
                        <p className="text-[10px] text-slate-400">{hist.periodRange}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[11px] font-semibold text-slate-800">{formatCurrency(hist.netPaid)}</span>
                        {selectedId === hist.payslipId && <Check size={13} className="text-[#0051d5] ml-auto mt-0.5" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Grievance Button (Hidden for HR Payroll Manager) */}
          {role !== 'HR_PAYROLL_MANAGER' && (
            <button
              type="button"
              onClick={() => setShowGrievanceModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <HelpCircle size={14} className="text-slate-500" />
              <span>Submit Grievance</span>
            </button>
          )}

          {/* Email Statement Button */}
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-60"
          >
            <Mail size={14} className={sendingEmail ? 'animate-spin text-[#0051d5]' : 'text-slate-500'} />
            <span>{sendingEmail ? 'Dispatching...' : 'Email Statement'}</span>
          </button>

          {/* Download PDF / Print Button */}
          <button
            type="button"
            onClick={() => handleDownloadPdf(selectedId)}
            disabled={downloadingPdf}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <Download size={14} className={downloadingPdf && downloadingId === selectedId ? 'animate-bounce' : ''} />
            <span>{downloadingPdf && downloadingId === selectedId ? 'Generating PDF...' : 'Download PDF / Print'}</span>
          </button>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          HERO STATEMENT CARD: Net Take-Home Pay (₹) & Retention Bar
      ───────────────────────────────────────────────────────────── */}
      {!loading && !payslip ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-[#0051d5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Payslip Statement Available</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            {user?.employeeId
              ? 'No payroll statement has been processed or published for your profile yet.'
              : 'No employee profile is linked to this user account. Self-service features require an active employee record.'}
          </p>
        </div>
      ) : (
        <>
          <div className={`bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 relative transition-all duration-200 ${
            loadingPreview ? 'opacity-60 pointer-events-none' : ''
          }`}>
            
            {loadingPreview && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs rounded-2xl z-20 flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0051d5]">
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Updating Statement Preview...</span>
                </div>
              </div>
            )}

            {/* Top Badges Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200">
                  <Check size={13} className="text-blue-600" />
                  <span>Period: {payslip?.periodLabel || 'Oct 01 - Oct 31, 2024'}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded font-mono text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200">
                  REF: {payslip?.referenceCode || 'PAY-2024-10-84092'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200">
                  {payslip?.workedDays ? `${payslip.workedDays} Worked Days (${payslip.workedHours || payslip.workedDays * 8}h)` : 'Full Schedule'}
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{payslip?.disbursalStatusLabel || 'Paid & Disbursed via Direct Bank Transfer'}</span>
              </span>
            </div>

            {/* Amount & Retention Bar Split */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-2">
              
              {/* Left: Net Take Home Pay in Indian Rupees (₹) */}
              <div className="space-y-1.5 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NET TAKE-HOME PAY REMITTANCE</p>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl md:text-4xl font-extrabold text-slate-900 font-mono tracking-tight text-emerald-700">
                    {formatCurrency(payslip?.netTakeHomePay || 0)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">INR (₹) • Disbursed to Bank Account</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                  <Building size={14} className="text-slate-400" />
                  <span>{payslip?.disbursalBankText || 'Direct Deposit transferred to HDFC Bank (A/C ****4921) on 28th'}</span>
                </div>
              </div>

              {/* Right: Gross to Net Retention Bar */}
              <div className="w-full lg:max-w-md bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GROSS TO NET RETENTION</span>
                  <span className="font-extrabold text-[#0051d5] font-mono">{payslip?.retentionPercentage || 80.59}%</span>
                </div>

                {/* Bi-Color Progress Bar */}
                <div className="w-full h-2.5 bg-rose-500 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-[#0051d5] h-full rounded-l-full transition-all duration-300" 
                    style={{ width: `${payslip?.retentionPercentage || 80.59}%` }}
                  ></div>
                </div>

                {/* Legend with INR formatting */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0051d5]"></span>
                    <span>Net {formatCurrency(payslip?.netTakeHomePay || 0)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Taxes & Deductions {formatCurrency(payslip?.totalDeductions || 0)}</span>
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              ITEMIZED BREAKDOWN: Gross Earnings vs Pre-Tax Deductions (₹)
              Expandable & Collapsible Sections
          ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Gross Earnings (Expandable) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              
              <div className="space-y-4">
                {/* Header with Interactive Collapse Toggle */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#0051d5] flex items-center justify-center">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">Gross Earnings</h3>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200">
                          {payslip?.earningsBreakdown?.length || 3} Items
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">Monthly Pay Component Breakdown (INR)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-slate-900 font-mono">
                      {formatCurrency(payslip?.grossEarnings || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEarningsExpanded(!earningsExpanded)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title={earningsExpanded ? 'Collapse breakdown' : 'Expand breakdown'}
                    >
                      {earningsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Earnings Itemized Lines (Collapsible Body) */}
                {earningsExpanded && (
                  <div className="space-y-3 divide-y divide-slate-50 animate-in fade-in duration-150">
                    {payslip?.earningsBreakdown?.map((item, idx) => (
                      <div key={idx} className="pt-2.5 first:pt-0 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900">{item.name}</p>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.subtext || 'Regular recurring earnings component'}</p>
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-900 shrink-0">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtotal Footer */}
              <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">TOTAL GROSS EARNINGS</span>
                <span className="font-extrabold text-slate-900 font-mono">{formatCurrency(payslip?.grossEarnings || 0)}</span>
              </div>

            </div>

            {/* Right Column: Deductions & Taxes (Expandable) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              
              <div className="space-y-4">
                {/* Header with Interactive Collapse Toggle */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                      <FileMinus size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">Deductions & Taxes</h3>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200">
                          {payslip?.deductionsBreakdown?.length || 4} Deductions
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">Statutory Withholdings & Benefits (INR)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-rose-600 font-mono">
                      {formatDeduction(payslip?.totalDeductions || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeductionsExpanded(!deductionsExpanded)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title={deductionsExpanded ? 'Collapse deductions' : 'Expand deductions'}
                    >
                      {deductionsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Deductions Itemized Lines (Collapsible Body) */}
                {deductionsExpanded && (
                  <div className="space-y-3 divide-y divide-slate-50 animate-in fade-in duration-150">
                    {payslip?.deductionsBreakdown?.map((item, idx) => (
                      <div key={idx} className="pt-2.5 first:pt-0 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.subtext || 'Statutory regulatory withholding'}</p>
                        </div>
                        <span className="text-xs font-bold font-mono text-rose-600 shrink-0">
                          {formatDeduction(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Net Disbursable Footer */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">NET DISBURSABLE TAKE-HOME</span>
                <span className="font-extrabold text-[#0051d5] font-mono text-sm">{formatCurrency(payslip?.netTakeHomePay || 0)}</span>
              </div>

            </div>

          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HISTORICAL PAYSLIPS ARCHIVE TABLE (Interactive with Search & Filter)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Section Header with Search & Filter Controls */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-slate-900">Historical Payslips Archive</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200">
                {filteredHistory.length} Cycles
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any cycle to preview detailed salary breakdown in Indian Rupees (₹)
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Quick Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search size={13} />
              </div>
              <input
                type="text"
                placeholder="Search cycle, date..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 w-44 lg:w-48 focus:outline-none focus:bg-white focus:border-[#0051d5] transition"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  historyStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('DISBURSED')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  historyStatusFilter === 'DISBURSED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Disbursed
              </button>
            </div>

          </div>
        </div>

        {/* Historical Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">PAY CYCLE PERIOD</th>
                <th className="py-3 px-4">DISBURSEMENT DATE</th>
                <th className="py-3 px-4 text-center">WORKED DAYS</th>
                <th className="py-3 px-4 text-right">GROSS PAY (₹)</th>
                <th className="py-3 px-4 text-right">DEDUCTIONS (₹)</th>
                <th className="py-3 px-4 text-right">NET PAID (₹)</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <FileText size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No payslips found</p>
                    <p className="text-[11px] mt-0.5">Try clearing your search query</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, idx) => {
                  const isCurrentlyPreviewed = selectedId === item.payslipId;

                  return (
                    <tr 
                      key={item.payslipId || idx} 
                      onClick={() => handleSelectPayslip(item.payslipId)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                        isCurrentlyPreviewed ? 'bg-blue-50/60 font-medium' : ''
                      }`}
                    >
                      
                      {/* Period Name & Date Range */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrentlyPreviewed ? 'bg-[#0051d5] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <FileText size={15} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{item.periodName}</p>
                              {isCurrentlyPreviewed && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#0051d5] text-white">
                                  PREVIEWING
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">{item.periodRange}</p>
                          </div>
                        </div>
                      </td>

                      {/* Disbursement Date */}
                      <td className="py-4 px-4 text-slate-600 font-medium font-mono text-[11px]">
                        {item.disbursementDate}
                      </td>

                      {/* Worked Days Box */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                          {item.workedDays}
                        </span>
                      </td>

                      {/* Gross Pay in Indian Rupees (₹) */}
                      <td className="py-4 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(item.grossEarnings)}
                      </td>

                      {/* Total Deductions in Indian Rupees (₹) */}
                      <td className="py-4 px-4 text-right font-mono font-semibold text-rose-600">
                        {formatDeduction(item.totalDeductions)}
                      </td>

                      {/* Net Paid in Indian Rupees (₹) */}
                      <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {formatCurrency(item.netPaid)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{item.status || 'Disbursed'}</span>
                        </span>
                      </td>

                      {/* Actions: View & PDF Download Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSelectPayslip(item.payslipId)}
                            title="Preview Payslip Breakdown"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
                          >
                            <Eye size={13} className="text-[#0051d5]" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(item.payslipId)}
                            disabled={downloadingPdf && downloadingId === item.payslipId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-60"
                          >
                            <Download size={13} className={downloadingPdf && downloadingId === item.payslipId ? 'animate-bounce text-[#0051d5]' : 'text-slate-500'} />
                            <span>{downloadingPdf && downloadingId === item.payslipId ? 'PDF...' : 'PDF'}</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          GRIEVANCE MODAL (In Indian Rupees Context)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showGrievanceModal}
        onClose={() => setShowGrievanceModal(false)}
        title="Submit Payslip Grievance"
        subtitle={`Inquiry ticket for ${payslip?.periodLabel || 'Current Statement'} (${formatCurrency(payslip?.netTakeHomePay)})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGrievanceSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispute Reason / Category</label>
            <select 
              value={grievanceCategory}
              onChange={(e) => setGrievanceCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium bg-white focus:outline-none focus:border-[#0051d5] transition"
            >
              <option>Overtime / Shift Differential Discrepancy</option>
              <option>Provident Fund (PF) Withholding Inquiry</option>
              <option>TDS / Income Tax Slab Calculation</option>
              <option>HRA or Allowance Missing</option>
              <option>Unpaid Leave / LOP Calculation</option>
              <option>Other Remuneration Question</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description & Details</label>
            <textarea
              rows="4"
              placeholder="Describe the discrepancy with exact dates, hours, and expected ₹ amounts..."
              value={grievanceText}
              onChange={(e) => setGrievanceText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#0051d5] transition"
              required
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowGrievanceModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingGrievance}
              className="px-5 py-2 rounded-xl bg-[#0051d5] hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer disabled:opacity-60"
            >
              {submittingGrievance ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
