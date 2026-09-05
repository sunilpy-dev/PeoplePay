import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  DollarSign, 
  Sliders, 
  AlertCircle, 
  PieChart, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  UserCheck,
  Building2,
  ChevronRight,
  Code
} from 'lucide-react';

export const AppLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'HR_PAYROLL_MANAGER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'HR_PAYROLL_USER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HR_MANAGER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'EMPLOYEE':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatRoleName = (r) => {
    if (!r) return '';
    return r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  // Nav Items configured per role according to PRD & ARCHITECTURE
  const navItems = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'HR Operations',
      items: [
        { name: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'] },
        { name: 'Contracts', path: '/contracts', icon: FileText, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'] },
        { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
        { name: 'Time Off & Leaves', path: '/leaves', icon: Calendar, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'Payroll Management',
      items: [
        { name: 'Payruns', path: '/payroll/payruns', icon: DollarSign, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Payslips', path: '/payroll/payslips', icon: FileText, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
        { name: 'Salary Structures', path: '/payroll/structures', icon: Sliders, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Salary Rules', path: '/payroll/rules', icon: Code, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Payroll Grievances', path: '/payroll/grievances', icon: AlertCircle, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
        { name: 'Budget & Analytics', path: '/payroll/budgets', icon: PieChart, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
            P
          </div>
          <span className="font-semibold text-lg tracking-tight">PeoplePay360</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out flex flex-col justify-between
        md:translate-x-0 md:static md:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/30">
              P
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">PeoplePay360</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">HR & Payroll Operations</p>
            </div>
          </div>

          {/* User Session Snapshot */}
          <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 flex items-center justify-center font-semibold text-sm">
                {user?.firstName ? user.firstName[0] : user?.email[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(role)}`}>
                {formatRoleName(role)}
              </span>
              {user?.employeeCode && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {user.employeeCode}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-6">
            {navItems.map((group, idx) => {
              const visibleItems = group.items.filter(item => 
                role === 'ADMIN' || item.roles.includes(role)
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={idx}>
                  <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                    {group.title}
                  </p>
                  <ul className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                              ${isActive 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                              <span>{item.name}</span>
                            </div>
                            {isActive && <ChevronRight size={14} className="text-indigo-200" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* Logout Action Footer */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-rose-900/40 border border-transparent hover:border-rose-700/50 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </div>
  );
};
