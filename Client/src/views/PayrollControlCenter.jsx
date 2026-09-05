import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Lock, 
  Download, 
  Search, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Building2,
  Users,
  Check,
  ChevronDown
} from 'lucide-react';
import { payrollService } from '../services/payrollService';

export function PayrollControlCenter() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchBatch, setSearchBatch] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Load telemetry data on mount
  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getControlTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error('Failed to load control center telemetry:', err);
      showToast('Failed to load telemetry data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReevaluate = async () => {
    try {
      setRefreshing(true);
      const data = await payrollService.reevaluateRisk();
      setTelemetry(data);
      showToast('Risk Engine re-evaluated. Live telemetry and compliance rules updated.', 'success');
    } catch (err) {
      console.error('Error re-evaluating risk engine:', err);
      showToast('Failed to re-evaluate risk engine.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleReleasePayrun = async () => {
    try {
      setReleasing(true);
      const res = await payrollService.releasePayrun();
      showToast(res.message || 'Pending payrun released for banking batch disbursement!', 'success');
    } catch (err) {
      console.error('Error releasing payrun:', err);
      showToast('Failed to release payrun.', 'error');
    } finally {
      setReleasing(false);
    }
  };

  const handleResolveEscalation = async (item) => {
    try {
      const res = await payrollService.resolveEscalation(item.id, `Action '${item.resolution_action}' applied by Administrator`);
      setTelemetry(res.telemetry);
      showToast(`Escalation ${item.code} (${item.resolution_action}) successfully applied and recorded!`, 'success');
    } catch (err) {
      console.error('Failed to resolve escalation:', err);
      showToast('Failed to resolve escalation item.', 'error');
    }
  };

  const handleExportGL = async () => {
    try {
      showToast('Generating and downloading General Ledger for NetSuite / SAP...', 'info');
      const gl = await payrollService.exportGL();
      const blob = new Blob([gl.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', gl.filename || 'GL_PAYROLL_EXPORT.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('General Ledger export downloaded successfully.', 'success');
    } catch (err) {
      console.error('Failed to export GL:', err);
      showToast('Failed to export General Ledger.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter escalations
  const filteredEscalations = useMemo(() => {
    if (!telemetry?.escalationStream?.items) return [];
    const items = telemetry.escalationStream.items;
    if (activeFilter === 'CRITICAL') {
      return items.filter(e => e.category === 'CRITICAL');
    }
    if (activeFilter === 'CONTRACTUAL') {
      return items.filter(e => e.category === 'CONTRACTUAL');
    }
    return items;
  }, [telemetry, activeFilter]);

  // Filter historical payruns
  const filteredPayruns = useMemo(() => {
    if (!telemetry?.historicalPayruns) return [];
    if (!searchBatch.trim()) return telemetry.historicalPayruns;
    const q = searchBatch.toLowerCase();
    return telemetry.historicalPayruns.filter(p => 
      p.batch_id.toLowerCase().includes(q) ||
      p.cycle_period.toLowerCase().includes(q) ||
      p.approval_authority.toLowerCase().includes(q)
    );
  }, [telemetry, searchBatch]);

  // Helper currency formatter for Indian Rupees
  const formatINR = (val) => {
    const num = parseFloat(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  if (loading && !telemetry) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8faff] min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Initializing PCC Governance Telemetry & Risk Radar...</p>
        </div>
      </div>
    );
  }

  const score = telemetry?.riskAssessment?.score ?? 94;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8faff] p-6 lg:p-8 space-y-6">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className={`fixed top-16 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : toastMessage.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* =========================================================================
          1. HEADER & GOVERNANCE BAR
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              {telemetry?.governance?.version || 'PCC GOVERNANCE V4.8'} • {telemetry?.governance?.telemetryStatus || 'Real-time Telemetry Active'}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Payroll Control Center & Risk Cockpit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Autonomous pre-flight audit, financial variance ledger, and multi-tier compliance verification engine.
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReevaluate}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-xs disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Re-evaluate Risk Engine</span>
          </button>

          <button
            type="button"
            onClick={handleReleasePayrun}
            disabled={releasing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-60"
          >
            <Send className={`w-4 h-4 text-white ${releasing ? 'animate-pulse' : ''}`} />
            <span>Release Pending Payrun</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Status Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pre-flight Check */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pre-flight Check</div>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {telemetry?.governance?.preflightStatus || 'Cleared for Review'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Lock State */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Compliance Lock</div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              {telemetry?.governance?.lockState || 'SOC2 / ISO 27001'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Cutoff Window */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cutoff Window</div>
            <div className="text-sm font-bold text-amber-700 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {telemetry?.governance?.cutoffWindow || '26h 14m remaining'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* ERP Sync Ledger */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ERP Sync Ledger</div>
            <div className="text-sm font-bold text-indigo-700 flex items-center gap-1.5 mt-0.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              {telemetry?.governance?.erpLedgerSync || 'NetSuite Live Feed'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. TWO-COLUMN GRID: EXECUTIVE RISK RADAR & FINANCIAL ALLOCATION
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Executive Risk Assessment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Executive Risk Assessment</h2>
                <p className="text-xs text-slate-400 mt-0.5">Overall Integrity Index • Real-time Telemetry</p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {telemetry?.riskAssessment?.level || 'Low Financial Risk'}
              </span>
            </div>

            {/* Radial Gauge Meter */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{score}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">OUT OF 100</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-3">
                Evaluated at {new Date(telemetry?.riskAssessment?.evaluatedAt || Date.now()).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Itemized Risk Breakdown List */}
            <div className="space-y-2.5 mt-2 pt-3 border-t border-slate-100">
              {telemetry?.riskAssessment?.itemizedRisks?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs">
                  <div className="flex items-center gap-2.5">
                    {item.severity === 'alert' ? (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : item.severity === 'info' ? (
                      <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : item.severity === 'pending' ? (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span className="font-medium text-slate-700">{item.title}</span>
                  </div>
                  
                  <div>
                    {item.severity === 'alert' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {item.count} items require review
                      </span>
                    ) : item.severity === 'info' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.count} items require review
                      </span>
                    ) : item.severity === 'pending' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {item.statusText}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.statusText}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Budget vs. Actual Variance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Budget vs. Actual Variance</h2>
                <p className="text-xs text-slate-400 mt-0.5">Financial Allocation • Q4 FY24-25</p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {telemetry?.financialAllocation?.utilizationRate || 97.5}% Utilized
              </span>
            </div>

            {/* Financial Numbers Highlight */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
              <div>
                <div className="text-xs font-semibold text-slate-400">Total Q4 Payroll Allocation</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {formatINR(telemetry?.financialAllocation?.totalBudget || 7500000)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Committed & Forecasted</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {formatINR(telemetry?.financialAllocation?.totalCommitted || 7314200)}
                </div>
              </div>
            </div>

            {/* Variance Pill */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold mb-5">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-600 rotate-180" />
                Favorable Variance Capacity
              </span>
              <span>
                +{formatINR(telemetry?.financialAllocation?.variance || 185800.00)} (+{telemetry?.financialAllocation?.variancePercentage || 2.47}% under allocated capacity)
              </span>
            </div>

            {/* Departmental Spend Progress Bars */}
            <div className="space-y-3.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Departmental Allocation</div>
              {telemetry?.financialAllocation?.departmentBudgets?.map((dept) => (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{dept.department}</span>
                    <span className="text-slate-500 font-mono">
                      {formatINR(dept.committed)} <span className="text-slate-400">/ {formatINR(dept.budget)}</span> ({dept.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.percentage >= 100
                          ? 'bg-amber-500'
                          : dept.percentage > 95
                          ? 'bg-blue-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, dept.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. ACTIVE COMPLIANCE & WARNING ESCALATION STREAM
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Compliance & Warning Escalation Stream</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-flight blockers must be resolved or formally overridden prior to executing bank payment dispatch.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({telemetry?.escalationStream?.total || 5})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Critical ({telemetry?.escalationStream?.criticalCount || 2})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CONTRACTUAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === 'CONTRACTUAL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Contractual ({telemetry?.escalationStream?.contractualCount || 3})
            </button>
          </div>
        </div>

        {/* Escalation Cards List */}
        <div className="space-y-3">
          {filteredEscalations.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                item.status === 'RESOLVED'
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : item.category === 'CRITICAL'
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                    item.severity_tag === 'High Blocker'
                      ? 'bg-rose-100 text-rose-800'
                      : item.severity_tag === 'Payroll Interlock'
                      ? 'bg-blue-100 text-blue-800'
                      : item.severity_tag === 'Approval Gate'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {item.severity_tag}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{item.code}</span>
                  <span className="text-xs font-medium text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.employee_code ? `${item.employee_code} • ${item.employee_name}` : item.assigned_lead}
                  </span>
                  {item.status === 'RESOLVED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <Check className="w-3 h-3" /> Resolved
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                <div className="text-[11px] text-slate-400">Assigned Lead: {item.assigned_lead}</div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center">
                {item.status === 'RESOLVED' ? (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    Audit Logged
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleResolveEscalation(item)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-xs ${
                      item.category === 'CRITICAL'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {item.resolution_action || 'Resolve'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          4. UNIFIED MULTI-YEAR HISTORICAL PAYRUNS (IMMUTABLE AUDIT LEDGER)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Unified Multi-Year Historical Payruns</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable audit ledger of completed payroll disbursements, encrypted hashes, and signed executive approvals.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search batch ID, period..."
              value={searchBatch}
              onChange={(e) => setSearchBatch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Payrun Batch ID</th>
                <th className="py-3 px-4">Cycle Period</th>
                <th className="py-3 px-4">Disbursement Date</th>
                <th className="py-3 px-4">Total Disbursed</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Discrepancies</th>
                <th className="py-3 px-4">Approval Authority</th>
                <th className="py-3 px-4">Compliance Lock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayruns.map((payrun) => (
                <tr key={payrun.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{payrun.batch_id}</td>
                  <td className="py-3.5 px-4 text-slate-700">{payrun.cycle_period}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {new Date(payrun.disbursement_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatINR(payrun.total_disbursed)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{payrun.headcount} Employees</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {payrun.discrepancies}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{payrun.approval_authority}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Lock className="w-3 h-3 text-slate-500" />
                      {payrun.compliance_lock}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200" title={payrun.audit_hash}>
                        {payrun.audit_hash.slice(0, 8)}...
                      </span>
                      <button
                        type="button"
                        onClick={handleExportGL}
                        title="Download Signed Settlement Report"
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with General Ledger Export & Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportGL}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs w-fit"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Full General Ledger (GL) to NetSuite / SAP</span>
          </button>

          <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-slate-500">
            <span>Showing {filteredPayruns.length} of 24 historical ledger batches</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="px-2.5 py-1 rounded border border-slate-200 text-slate-400 disabled:opacity-50 text-xs"
              >
                Previous
              </button>
              <span className="px-2 py-1 font-semibold text-slate-800">Page 1 of 6</span>
              <button
                type="button"
                className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default PayrollControlCenter;
