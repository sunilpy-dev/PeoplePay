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
  Search,
  Zap,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  Globe,
  SlidersHorizontal,
  Scale
} from 'lucide-react';

export const AppLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatRoleLabel = (r) => {
    if (!r) return 'HR Payroll Manager';
    if (r === 'ADMIN') return 'System Administrator';
    if (r === 'HR_PAYROLL_MANAGER') return 'HR Payroll Manager';
    if (r === 'HR_PAYROLL_USER') return 'Payroll Specialist';
    if (r === 'HR_MANAGER') return 'HR Operations Lead';
    return 'Employee Portal';
  };

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] }
      ]
    },
    {
      title: 'HR CORE',
      items: [
        { name: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'] },
        { name: 'Contracts', path: '/contracts', icon: FileText, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'] },
        { name: 'Working Schedules', path: '/schedules', icon: Calendar, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'] },
        { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
        { name: 'Time Off', path: '/leaves', icon: Calendar, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'PAYROLL PROCESSING',
      items: [
        { name: 'Payroll / Payruns', path: '/payroll/payruns', icon: DollarSign, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'My Payslips', path: '/payroll/payslips', icon: FileText, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'PAYROLL CONFIGURATION & RISK',
      items: [
        { name: 'Salary Structures', path: '/payroll/structures', icon: Sliders, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Salary Rules', path: '/payroll/rules', icon: SlidersHorizontal, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Payroll Control Center', path: '/payroll/control', icon: ShieldCheck, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
      ]
    }
  ];

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased overflow-hidden">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 shrink-0 h-16 px-4 md:px-6 flex items-center justify-between z-30">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 w-64 shrink-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-900 text-sm tracking-tight">PeoplePay</span>
                <span className="font-bold text-blue-600 text-sm">360</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none">Enterprise Suite</span>
            </div>
          </Link>
        </div>

        {/* Middle: Universal Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search size={15} className="absolute inset-y-0 left-3 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Search employees, payruns, codes..."
              value={globalSearch}
              onChange={(e) => {
                const val = e.target.value;
                setGlobalSearch(val);
                if (!location.pathname.startsWith('/contracts')) {
                  navigate('/contracts');
                }
              }}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            {globalSearch && (
              <button 
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 flex items-center"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Workspace, Role, Quick Action & User Profile */}
        <div className="flex items-center gap-3">
          {/* Breadcrumb Workspace */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>PeoplePay360</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-semibold">India Operations</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden xl:block" />

          {/* Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">ROLE</span>
            <span className="font-semibold text-slate-700">{formatRoleLabel(role)}</span>
            <ChevronDown size={13} className="text-slate-400 ml-0.5" />
          </div>

          {/* Quick Action Button */}
          <button 
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <Zap size={13} className="text-amber-400 fill-amber-400" />
            <span>Quick Action</span>
          </button>

          {/* Notification Bell */}
          <button className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* User Profile Snapshot */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-semibold text-xs shadow-sm ring-1 ring-slate-200">
              {user?.firstName ? user.firstName[0] : (user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.displayName || 'E. Vance'}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {user?.jobPosition || 'Compliance Lead'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="p-1 text-slate-400 hover:text-rose-600 transition ml-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Company Selector Dropdown */}
            <div className="p-3">
              <div className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100/60 cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-blue-600" />
                  <span className="font-semibold text-slate-800">Global Tech India</span>
                </div>
                <ChevronsUpDown size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-3 py-1 space-y-5">
              {navSections.map((sec, idx) => (
                <div key={idx}>
                  <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                    {sec.title}
                  </p>
                  <ul className="space-y-0.5">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150
                              ${isActive
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                          >
                            <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Compliance Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>FY24 Compliant</span>
              </div>
              <span className="font-mono text-slate-400">v4.18</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/30 z-30 md:hidden"
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto h-full p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          <Outlet context={{ globalSearch, setGlobalSearch }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
