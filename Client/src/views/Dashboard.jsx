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
  PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user, role, permissions } = useAuth();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        console.error('Health check failed:', err);
        setHealth({ status: 'degraded', database: 'disconnected' });
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  const formatRole = (r) => {
    if (!r) return '';
    return r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const featureCards = [
    {
      title: 'Employee Master',
      desc: 'Central employee profiles, manager hierarchies, and bank details.',
      icon: Users,
      path: '/employees',
      roleReq: permissions?.canManageEmployees,
      badge: 'Phase 2'
    },
    {
      title: 'Contracts & Schedules',
      desc: 'Period-isolated contracts, working schedules, and weekly hours derivation.',
      icon: FileText,
      path: '/contracts',
      roleReq: permissions?.canManageContracts,
      badge: 'Phase 3'
    },
    {
      title: 'Attendance & Overtime',
      desc: 'Daily clock-in/out, worked hours derivation, and overtime tracking.',
      icon: Clock,
      path: '/attendance',
      roleReq: true,
      badge: 'Phase 4'
    },
    {
      title: 'Time Off & Leaves',
      desc: 'Annual/Sick allocations, leave requests, and approval workflow.',
      icon: Calendar,
      path: '/leaves',
      roleReq: true,
      badge: 'Phase 5'
    },
    {
      title: 'Salary Structures & DAG',
      desc: 'Topologically sequenced salary calculation rules and dynamic formula parser.',
      icon: Sliders,
      path: '/payroll/structures',
      roleReq: permissions?.canManageSalaryRules,
      badge: 'Phase 6'
    },
    {
      title: 'Payruns & Payslips',
      desc: 'Two-step payrun creation wizard, draft computation, and pre-flight validation.',
      icon: DollarSign,
      path: '/payroll/payruns',
      roleReq: permissions?.canExecutePayruns,
      badge: 'Phase 7'
    },
    {
      title: 'Payroll Grievance Review',
      desc: 'Pre-payroll payslip verification, employee grievance submission & HR resolution.',
      icon: AlertTriangle,
      path: '/payroll/grievances',
      roleReq: true,
      badge: 'Phase 9'
    },
    {
      title: 'Budget Cost Intelligence',
      desc: 'Department budget vs actual payroll expense tracking and variance analysis.',
      icon: PieChart,
      path: '/payroll/budgets',
      roleReq: permissions?.canManageBudgets,
      badge: 'Phase 12'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wide">
                Phase 1 Baseline Active
              </span>
              <span className="text-xs text-slate-400">
                PostgreSQL Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user?.displayName || 'User'}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              You are signed in as <span className="font-semibold text-white">{formatRole(role)}</span>
              {user?.department ? ` in the ${user.department} department` : ''}.
              All operational actions are authenticated via JWT and secured by PostgreSQL RBAC.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center gap-3 text-left">
              <div className={`w-3 h-3 rounded-full ${health?.database === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">PostgreSQL DB</p>
                <p className="text-xs font-medium text-slate-200">
                  {loadingHealth ? 'Checking...' : health?.database === 'connected' ? 'Connected & Healthy' : 'Disconnected'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats / System Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Session</p>
            <p className="text-lg font-bold text-slate-900 mt-1 truncate">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{user?.employeeCode || 'System User'}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Access Role</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatRole(role)}</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">RBAC Guard Active</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Database Tables</p>
            <p className="text-lg font-bold text-slate-900 mt-1">14 Tables</p>
            <p className="text-xs text-slate-400 mt-0.5">PostgreSQL Relational DDL</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Backend API</p>
            <p className="text-lg font-bold text-slate-900 mt-1">Express v4</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">REST Endpoints Live</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Module Overview Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">PeoplePay360 Modules Roadmap</h2>
            <p className="text-xs text-slate-500 mt-0.5">Connected end-to-end operational modules per PRD specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            const hasAccess = role === 'ADMIN' || card.roleReq;

            return (
              <div 
                key={idx}
                className={`
                  p-5 rounded-xl border transition duration-150 flex flex-col justify-between
                  ${hasAccess 
                    ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md' 
                    : 'bg-slate-50/70 border-slate-200/60 opacity-60'}
                `}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${hasAccess ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {hasAccess ? 'Authorized Role' : 'Restricted Role'}
                  </span>
                  {hasAccess && (
                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-0.5">
                      Ready <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
