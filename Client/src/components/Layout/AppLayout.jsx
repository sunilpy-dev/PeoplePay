import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileSpreadsheet, 
  Sliders, 
  SlidersHorizontal,
  ShieldCheck, 
  Building2, 
  ChevronsUpDown, 
  Search, 
  Zap, 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  Menu, 
  X, 
  UserCheck,
  Code,
  ArrowLeftRight,
  CheckCircle2
} from 'lucide-react';

export const AppLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navbar interactive dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [globalSearch, setGlobalSearch] = useState(searchParams.get('search') || '');

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const quickActionRef = useRef(null);
  const roleRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(event.target)) {
        setQuickActionOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target)) {
        setRoleOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatRoleName = (r) => {
    switch (r) {
      case 'ADMIN':
        return 'Global Admin';
      case 'HR_PAYROLL_MANAGER':
        return 'HR Payroll Manager';
      case 'HR_PAYROLL_USER':
        return 'HR Payroll User';
      case 'HR_MANAGER':
        return 'HR Manager';
      case 'EMPLOYEE':
        return 'Employee';
      default:
        return r ? r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') : 'User';
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setGlobalSearch(val);
    const currentParams = Object.fromEntries(searchParams.entries());
    if (val.trim()) {
      setSearchParams({ ...currentParams, search: val });
    } else {
      delete currentParams.search;
      setSearchParams(currentParams);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      if (location.pathname === '/dashboard') {
        navigate(`/employees?search=${encodeURIComponent(globalSearch.trim())}`);
      }
    }
  };

  // Canonical Nav Items configured per role according to reference UI screenshots & PRD
  const navGroups = [
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
        { name: 'Time Off', path: '/leaves', icon: Calendar, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] }
      ]
    },
    {
      title: 'PAYROLL PROCESSING',
      items: [
        { name: 'Payroll / Payruns', path: '/payroll/payruns', icon: DollarSign, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'My Payslips', path: '/payroll/payslips', icon: FileSpreadsheet, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] }
      ]
    },
    {
      title: 'PAYROLL CONFIGURATION & RISK',
      items: [
        { name: 'Salary Structures', path: '/payroll/structures', icon: Sliders, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Salary Rules', path: '/payroll/rules', icon: SlidersHorizontal, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Payroll Control Center', path: '/payroll/control', icon: ShieldCheck, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] }
      ]
    }
  ];

  return (
    <div className="h-screen w-full bg-[#f8faff] flex flex-col overflow-hidden font-sans">
      
      {/* =========================================================================
          TOP GLOBAL NAVBAR (Canonical PeoplePay360 Header)
         ========================================================================= */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        
        {/* Left: Brand Identity & Global Search */}
        <div className="flex items-center gap-5">
          {/* Mobile Menu Toggle Button */}
          <button 
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo & Brand Title */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#0051d5] text-white flex items-center justify-center font-bold shadow-xs">
              <ArrowLeftRight size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5 leading-none">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">PeoplePay</span>
                <span className="font-extrabold text-[#0051d5] text-sm tracking-tight">360</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Enterprise Suite</span>
            </div>
          </Link>

          {/* Global Search Input */}
          <div className="hidden md:flex items-center relative ml-2">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input 
              type="text" 
              placeholder="Search employees, payruns, codes..."
              value={globalSearch}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="pl-8 pr-7 py-1.5 bg-[#f8faff] border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 w-64 lg:w-72 focus:outline-none focus:bg-white focus:border-[#0051d5] focus:ring-1 focus:ring-[#0051d5] transition"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearch('');
                  const currentParams = Object.fromEntries(searchParams.entries());
                  delete currentParams.search;
                  setSearchParams(currentParams);
                }}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Center: Workspace Breadcrumb */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span>PeoplePay360</span>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-800 font-semibold">Global Workspace</span>
        </div>

        {/* Right: Role Area, Quick Action, Notification & User Snapshot */}
        <div className="flex items-center gap-3">
          
          {/* Role Pill Dropdown */}
          <div className="relative" ref={roleRef}>
            <button 
              type="button"
              onClick={() => setRoleOpen(!roleOpen)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ROLE</span>
              <span className="font-semibold text-slate-800">{formatRoleName(role)}</span>
              <ChevronDown size={13} className="text-slate-400 ml-0.5" />
            </button>

            {roleOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs space-y-2">
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-bold text-slate-900">{formatRoleName(role)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Database RBAC Authorization</p>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle2 size={13} />
                    <span>PostgreSQL Guard Active</span>
                  </p>
                  <p className="text-slate-400 font-mono text-[10px]">Session Token Verified</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Button & Dropdown */}
          <div className="relative" ref={quickActionRef}>
            <button 
              type="button"
              onClick={() => setQuickActionOpen(!quickActionOpen)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span>Quick Action</span>
            </button>

            {quickActionOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => { navigate('/employees'); setQuickActionOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Users size={14} className="text-blue-600" />
                  <span>Employee Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/attendance'); setQuickActionOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Clock size={14} className="text-emerald-600" />
                  <span>Time & Attendance</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/leaves'); setQuickActionOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Calendar size={14} className="text-indigo-600" />
                  <span>Leave Management</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/contracts'); setQuickActionOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <FileText size={14} className="text-purple-600" />
                  <span>Contract Life Cycle</span>
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell & Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button 
              type="button"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (unreadNotifications > 0) setUnreadNotifications(0);
              }}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 relative transition"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] text-slate-400 font-medium">All caught up</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800 text-[11px]">System Audit Synced</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">PostgreSQL health & RBAC verification passed</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800 text-[11px]">Payroll Engine Ready</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">FY24 compliance rules active in background</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Snapshot & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs border border-slate-300">
                {user?.firstName ? user.firstName[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.displayName || 'System User'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-medium">
                  {user?.jobPosition || formatRoleName(role)}
                </p>
              </div>
              <ChevronDown size={13} className="text-slate-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.displayName || 'Authenticated User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  {user?.employeeCode && (
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{user.employeeCode}</p>
                  )}
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{formatRoleName(role)}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* =========================================================================
          SHELL BODY: FIXED LEFT SIDEBAR + INDEPENDENT MAIN CANVAS
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Canonical Left Sidebar */}
        <aside className={`
          fixed inset-y-14 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:h-full
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Company / Organization Selector */}
            <div className="p-3 border-b border-slate-100">
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shadow-2xs cursor-pointer transition">
                <div className="flex items-center gap-2 truncate">
                  <Building2 size={15} className="text-blue-600 shrink-0" />
                  <span className="truncate">Global Tech Corp</span>
                </div>
                <ChevronsUpDown size={14} className="text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-3 py-3 space-y-5">
              {navGroups.map((group, idx) => {
                const visibleItems = group.items.filter(item => 
                  role === 'ADMIN' || !item.roles || item.roles.includes(role)
                );

                if (visibleItems.length === 0) return null;

                return (
                  <div key={idx}>
                    <p className="px-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                      {group.title}
                    </p>
                    <ul className="space-y-0.5">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                        
                        return (
                          <li key={item.path}>
                            <Link
                              to={item.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition duration-150
                                ${isActive 
                                  ? 'bg-[#eef2ff] text-[#0051d5] font-semibold shadow-2xs' 
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                              `}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon size={16} className={isActive ? 'text-[#0051d5]' : 'text-slate-400'} />
                                <span>{item.name}</span>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
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

        {/* Main Content Area: Independently scrollable */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto bg-[#f8faff] p-6 lg:p-8">
          <Outlet context={{ globalSearch, setGlobalSearch }} />
        </main>

      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}
    </div>
  );
};
