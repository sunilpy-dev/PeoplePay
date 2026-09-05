import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Database, 
  Shield, 
  ArrowUpRight,
  FileText,
  Sliders,
  PieChart,
  UserCheck,
  Building2,
  Lock,
  MoreVertical,
  Check,
  X,
  Hourglass,
  RefreshCw,
  FileDown,
  ChevronRight,
  Fingerprint,
  Info
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, role, permissions } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, departments: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeCockpit, setActiveCockpit] = useState('ALL');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [healthRes, statsRes] = await Promise.allSettled([
          api.get('/health'),
          api.get('/employees/stats')
        ]);

        if (healthRes.status === 'fulfilled') {
          setHealth(healthRes.value.data);
        } else {
          setHealth({ status: 'degraded', database: 'disconnected' });
        }

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoadingHealth(false);
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatRole = (r) => {
    if (!r) return '';
    return r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const cockpitTabs = [
    { id: 'ALL', label: 'All Cockpits' },
    { id: 'EMPLOYEE', label: 'Employee' },
    { id: 'HR_MANAGER', label: 'HR Manager' },
    { id: 'HR_PAYROLL_USER', label: 'HR Payroll User' },
    { id: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager' },
    { id: 'ADMIN', label: 'Admin' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Active Simulation / Cockpit Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            ACTIVE CONTEXT
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Role-Adaptive Workspace
          </h1>
        </div>

        {/* Cockpit Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 overflow-x-auto shadow-sm">
          {cockpitTabs.map((tab) => {
            const isActive = activeCockpit === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCockpit(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Headcount */}
        <div 
          onClick={() => navigate('/employees')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              TOTAL HEADCOUNT
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {loadingStats ? '...' : (stats.total || 0).toLocaleString()}
              </span>
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ↑ {stats.active || 0} active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Database records</span>
              <span className="font-medium text-slate-700">
                {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(1)}% Active` : '100%'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Payrun Cycle */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              ACTIVE PAYRUN CYCLE
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                October 2024
              </span>
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Cycle #10
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-2 pt-2 border-t border-slate-100">
              <Clock size={13} className="shrink-0" />
              <span>Cutoff in 3 days (Oct 28)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Attendance Rate / Active Departments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              ATTENDANCE RATE
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                98.4%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                On-time today
              </span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#0051d5] h-full rounded-full w-[98.4%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Governance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              PENDING GOVERNANCE
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-600 tracking-tight">
                7
              </span>
              <span className="text-xs text-slate-500">
                requires resolution
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-indigo-50/60 rounded px-1.5 py-0.5 text-[11px] text-indigo-700 font-semibold">
                3 Leaves
              </div>
              <div className="bg-blue-50/60 rounded px-1.5 py-0.5 text-[11px] text-blue-700 font-semibold">
                2 Contracts
              </div>
              <div className="bg-rose-50/60 rounded px-1.5 py-0.5 text-[11px] text-rose-700 font-semibold">
                2 Alerts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Enterprise Compliance & Multi-Tenant Control Strip */}
      <div className="bg-[#151e2e] text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                Enterprise Compliance & Multi-Tenant Control
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AUDIT MODE: ON
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              6 active entities synched across EMEA, US-East, and APAC payroll rails. Auto-reconciliation active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            type="button" 
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
          >
            Audit Vault
          </button>
          <button 
            type="button" 
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0051d5] hover:bg-blue-700 rounded-md transition shadow-xs"
          >
            Security Policy Hub
          </button>
        </div>
      </div>

      {/* 4. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card A: Payroll Execution Radar */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            
            {/* Radar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900">
                    Payroll Execution Radar
                  </h2>
                  <p className="text-xs text-slate-500">
                    Current batch progress across validation, calculation & ledger reconciliation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-slate-100 text-slate-700 border border-slate-200">
                  ID: PAY-2024-10-M
                </span>
                <button className="text-slate-400 hover:text-slate-600 p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Stepper / Timeline Bar */}
            <div className="bg-[#f8faff] border border-slate-200/80 rounded-xl p-5">
              <div className="relative flex items-center justify-between">
                
                {/* Horizontal Background Line */}
                <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>
                {/* Active Progress Bar Portion */}
                <div className="absolute left-6 w-[45%] top-4 -translate-y-1/2 h-0.5 bg-[#0051d5] z-0"></div>

                {/* Step 1: Draft */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-[#0051d5] text-white flex items-center justify-center shadow-xs">
                    <Check size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-2">Draft</span>
                  <span className="text-[11px] text-slate-400">Oct 14</span>
                </div>

                {/* Step 2: Computed */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-[#0051d5] text-white flex items-center justify-center shadow-xs">
                    <Check size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-2">Computed</span>
                  <span className="text-[11px] text-slate-400">Oct 18</span>
                </div>

                {/* Step 3: In Validation (Current Active) */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-[#0051d5] text-white flex items-center justify-center ring-4 ring-blue-100 shadow-xs">
                    <RefreshCw size={15} className="animate-spin" />
                  </div>
                  <span className="text-xs font-bold text-[#0051d5] mt-2 underline decoration-2 underline-offset-4">
                    In Validation
                  </span>
                  <span className="text-[11px] font-medium text-blue-600">Running checks</span>
                </div>

                {/* Step 4: Paid */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center text-xs font-semibold">
                    4
                  </div>
                  <span className="text-xs font-medium text-slate-400 mt-2">Paid</span>
                  <span className="text-[11px] text-slate-400">Oct 28</span>
                </div>

                {/* Step 5: Dispatched */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center text-xs font-semibold">
                    5
                  </div>
                  <span className="text-xs font-medium text-slate-400 mt-2">Dispatched</span>
                  <span className="text-[11px] text-slate-400">Oct 30</span>
                </div>

              </div>
            </div>

            {/* Financial Commitment Sub-Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#f8faff] p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  GROSS PAYROLL COMMITMENT
                </span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  $2,418,250.00
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  <span>Employer Tax: <strong className="text-slate-700 font-mono">$342,100</strong></span>
                  <span>Benefits: <strong className="text-slate-700 font-mono">$184,500</strong></span>
                </div>
              </div>

              <div className="bg-[#f8faff] p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  NET DISBURSABLE FUNDS
                </span>
                <p className="text-2xl font-bold font-mono text-[#0051d5] mt-1">
                  $1,840,120.00
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  <span>Direct Deposit: <strong className="text-slate-700 font-mono">1,210</strong></span>
                  <span>Cross-Border Wire: <strong className="text-slate-700 font-mono">38</strong></span>
                </div>
              </div>
            </div>

            {/* Compliance Warnings Requiring Sign-off */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <AlertTriangle size={15} className="text-rose-500" />
                  <span>Compliance Warnings Requiring Sign-off (2)</span>
                </div>
                <span className="text-[11px] font-semibold text-rose-600">
                  Payroll Blockers
                </span>
              </div>

              {/* Warning Item 1 */}
              <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        Missing Tax ID (W-4 Incomplete)
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white text-slate-600 border border-slate-200">
                        EMP-0941
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Liam Henderson (Contractor - North America Tech Division) missing mandatory state tax declaration.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition">
                    Request Info
                  </button>
                  <button className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition">
                    Resolve
                  </button>
                </div>
              </div>

              {/* Warning Item 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        Anomalous Overtime Surge (+42.5 hrs)
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white text-slate-600 border border-slate-200">
                        EMP-0312
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      DevOps Infrastructure Team batch logged non-preapproved weekend bridge hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition">
                    Audit Logs
                  </button>
                  <button className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0051d5] hover:bg-blue-700 rounded transition">
                    Approve Exception
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Sub-Grid: Pending Time-Off & Expiring Contracts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sub-Card 1: Pending Time-Off */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Pending Time-Off</h3>
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#0051d5] text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">3 awaiting signature</span>
                </div>

                <div className="space-y-3 mt-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center">
                        SL
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Sarah Lin</div>
                        <div className="text-[11px] text-slate-500">UX Lead</div>
                        <div className="text-[11px] text-indigo-600 font-medium">Nov 04 - Nov 08 (5d)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition">
                        <X size={14} />
                      </button>
                      <button className="w-7 h-7 rounded bg-[#0f172a] hover:bg-slate-800 text-white flex items-center justify-center transition">
                        <Check size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs flex items-center justify-center">
                        MV
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Marcus Vance</div>
                        <div className="text-[11px] text-slate-500">Sr Backend</div>
                        <div className="text-[11px] text-blue-600 font-medium">Oct 25 (1d retrospective)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition">
                        <X size={14} />
                      </button>
                      <button className="w-7 h-7 rounded bg-[#0f172a] hover:bg-slate-800 text-white flex items-center justify-center transition">
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button 
                  onClick={() => navigate('/leaves')}
                  className="text-xs font-semibold text-[#0051d5] hover:text-blue-800 inline-flex items-center gap-1"
                >
                  View All 3 Leave Requests →
                </button>
              </div>
            </div>

            {/* Sub-Card 2: Expiring Contracts */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Expiring Contracts</h3>
                  </div>
                  <Hourglass size={15} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">3 contracts ending within 30 days</p>

                <div className="space-y-2.5 mt-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
                      <div className="text-[11px] text-slate-500">Data Scientist • Fixed Term</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-200">
                        11 days left
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Nov 05, 2024</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900">David Kalu</div>
                      <div className="text-[11px] text-slate-500">SecOps Consultant • External</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                        19 days left
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Nov 13, 2024</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Priya Patel</div>
                      <div className="text-[11px] text-slate-500">Product Designer • Contractor</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                        28 days left
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Nov 22, 2024</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => navigate('/contracts')}
                  className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} /> Launch Renewal Workflow
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card B1: My Employee Corner */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-50 text-[#0051d5] flex items-center justify-center">
                  <Fingerprint size={15} />
                </div>
                <h3 className="font-bold text-sm text-slate-900">My Employee Corner</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-50 text-teal-700 border border-teal-200">
                Self-Service
              </span>
            </div>

            {/* Today's Check-in status */}
            <div className="bg-[#eff6ff] rounded-xl p-3.5 flex items-center justify-between border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0051d5] text-white flex items-center justify-center">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-600">TODAY'S CHECK-IN</div>
                  <div className="text-base font-bold font-mono text-slate-900">08:58 AM</div>
                </div>
              </div>
              <span className="px-2 py-1 text-[11px] font-semibold rounded-md bg-white text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                On Schedule
              </span>
            </div>

            {/* Leave Balances */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Leave Balances</span>
                <Link to="/leaves" className="text-xs font-semibold text-[#0051d5] hover:underline">
                  Request Leave
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8faff] p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500">Annual Leave</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-900">14</span>
                    <span className="text-xs text-slate-400">days left</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#0051d5] h-full rounded-full w-[70%]"></div>
                  </div>
                </div>

                <div className="bg-[#f8faff] p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500">Sick Leave</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-900">8</span>
                    <span className="text-xs text-slate-400">days left</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full w-[80%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Latest Released Payslip */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                  LATEST RELEASED PAYSLIP
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">
                  Sept 2024
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400">Net Disbursed</span>
                  <div className="text-lg font-bold font-mono text-slate-900">$6,850.00</div>
                </div>
                <button className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0f172a] hover:bg-slate-800 rounded-md transition flex items-center gap-1.5">
                  <FileDown size={14} /> PDF
                </button>
              </div>
            </div>

          </div>

          {/* Card B2: Audit & System Stream */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Audit & System Stream</h3>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Synced
                </span>
              </div>

              {/* Activity Timeline List */}
              <div className="space-y-3.5 mt-3">
                
                {/* Event 1 */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    CZ
                  </div>
                  <div>
                    <p className="text-xs text-slate-800 leading-snug">
                      <strong className="font-semibold">C. Zhao</strong> approved overtime adjustment for #EMP-0219
                    </p>
                    <span className="text-[10px] text-slate-400">3 mins ago • Payroll Audit Log</span>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    <Activity size={14} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-800 leading-snug">
                      Automated computation cycle executed on <strong>{stats.total || 4} active records</strong>
                    </p>
                    <span className="text-[10px] text-slate-400">18 mins ago • Background Job #884</span>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    KM
                  </div>
                  <div>
                    <p className="text-xs text-slate-800 leading-snug">
                      <strong className="font-semibold">K. Morales</strong> updated compensation structure Executive Tier 2
                    </p>
                    <span className="text-[10px] text-slate-400">1 hr ago • Configuration</span>
                  </div>
                </div>

                {/* Event 4 */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={13} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-800 leading-snug">
                      Missing banking routing flag registered for new joiner H. Becker
                    </p>
                    <span className="text-[10px] text-slate-400">2 hrs ago • Compliance Guardian</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition text-center">
                Open Consolidated Audit Journal
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
