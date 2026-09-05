import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Search,
  Bell,
  Zap,
  ChevronDown,
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar,
  Clock, 
  DollarSign, 
  FileSpreadsheet,
  Sliders, 
  AlertCircle, 
  PieChart, 
  ShieldCheck,
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
  CheckCircle2
  ArrowLeftRight
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

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const quickActionRef = useRef(null);
  const roleRef = useRef(null);

  const searchQuery = searchParams.get('search') || '';

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
  const [globalSearch, setGlobalSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /**
   * Functional Search Handler for Top Navbar Search Input
   */
  const handleTopSearchChange = (e) => {
    const val = e.target.value;
    const currentParams = Object.fromEntries(searchParams.entries());
    if (val.trim()) {
      setSearchParams({ ...currentParams, search: val });
    } else {
      delete currentParams.search;
      setSearchParams(currentParams);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (location.pathname !== '/attendance' && searchQuery.trim()) {
        navigate(`/attendance?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
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

  // Canonical Nav Items configured per role according to reference UI screenshots & PRD
  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'HR CORE',
      title: 'MAIN',
      items: [
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Contracts', path: '/contracts', icon: FileText },
        { name: 'Working Schedules', path: '/schedules', icon: Calendar },
        { name: 'Attendance', path: '/attendance', icon: Clock },
        { name: 'Time Off', path: '/leaves', icon: Calendar },
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER', 'EMPLOYEE'] }
      ]
    },
    {
      title: 'PAYROLL PROCESSING',
      title: 'HR CORE',
      items: [
        { name: 'Payroll / Payruns', path: '/payroll/payruns', icon: DollarSign },
        { name: 'My Payslips', path: '/payroll/payslips', icon: FileText },
      ]
    },
    {
      title: 'PAYROLL CONFIGURATION & RISK',
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
        { name: 'Salary Structures', path: '/payroll/structures', icon: Sliders },
        { name: 'Salary Rules', path: '/payroll/rules', icon: Sliders },
        { name: 'Payroll Control Center', path: '/payroll/control-center', icon: ShieldCheck },
      ]
    }
  ];

  const formatRoleLabel = (r) => {
    switch (r) {
      case 'ADMIN': return 'ADMIN';
      case 'HR_PAYROLL_MANAGER': return 'HR Payroll Manager';
      case 'HR_PAYROLL_USER': return 'HR Payroll User';
      case 'HR_MANAGER': return 'HR Manager';
      default: return 'Employee';
    }
  };
        { name: 'Salary Structures', path: '/payroll/structures', icon: Sliders, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Salary Rules', path: '/payroll/rules', icon: SlidersHorizontal, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] },
        { name: 'Payroll Control Center', path: '/payroll/control', icon: ShieldCheck, roles: ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'] }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header Bar — Fixed at Top */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200/80 px-4 md:px-6 py-2.5 flex items-center justify-between shadow-2xs h-[53px]">
        
        {/* Left: Brand Logo & Functional Search Bar */}
        <div className="flex items-center gap-6 flex-1 max-w-xl">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              P
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
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight leading-none block">PeoplePay360</span>
              <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">Enterprise Suite</span>
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
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#f8faff] border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 w-64 lg:w-72 focus:outline-none focus:bg-white focus:border-[#0051d5] focus:ring-1 focus:ring-[#0051d5] transition"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
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
          {/* Dynamic Authenticated Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ROLE</span>
            <span className="font-semibold text-slate-800">{formatRoleName(role)}</span>
            <ChevronDown size={13} className="text-slate-400 ml-0.5" />
          </div>

          {/* Fully Functional Search Input */}
          <div className="hidden md:flex items-center relative flex-1 max-w-sm">
            <Search 
              size={15} 
              className="absolute left-3 text-slate-400 cursor-pointer" 
              onClick={() => {
                if (location.pathname !== '/attendance' && searchQuery.trim()) {
                  navigate(`/attendance?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
            <input
              type="text"
              placeholder="Search employees, payruns, codes..."
              value={searchQuery}
              onChange={handleTopSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100/70 border border-transparent text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Breadcrumb, Role Selector, Quick Action, Bell, User Profile */}
        <div className="flex items-center gap-3 md:gap-4 text-xs font-medium text-slate-600">
          
          <div className="hidden lg:flex items-center gap-1 text-slate-500 text-xs">
            <span className="cursor-pointer hover:text-slate-800" onClick={() => navigate('/dashboard')}>PeoplePay360</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 cursor-pointer hover:text-blue-600" onClick={() => navigate('/dashboard')}>Global Workspace</span>
          </div>

          {/* Role Pill Dropdown */}
          <div className="relative" ref={roleRef}>
            <button 
              onClick={() => setRoleOpen(!roleOpen)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-800 text-xs font-semibold transition"
            >
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">ROLE</span>
              <span>{formatRoleLabel(role)}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {roleOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs space-y-2">
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-bold text-slate-900">{formatRoleLabel(role)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active Authorization Level</p>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle2 size={13} />
                    <span>Session Authenticated</span>
                  </p>
                  <p className="text-slate-500">Terminal ID: 04-HQ</p>
                </div>
          {/* Quick Action Button */}
          <button 
            type="button"
            onClick={() => navigate('/employees')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Zap size={13} className="fill-current text-white" />
            <span>Quick Action</span>
          </button>

          {/* Notification Bell */}
          <button 
            type="button" 
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 relative transition"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {/* User Profile Snapshot & Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs border border-slate-300">
                {user?.firstName ? user.firstName[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="relative" ref={quickActionRef}>
            <button 
              onClick={() => setQuickActionOpen(!quickActionOpen)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span>Quick Action</span>
            </button>

            {quickActionOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
                <button
                  onClick={() => { navigate('/attendance'); setQuickActionOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Clock size={14} className="text-blue-600" />
                  <span>Time & Attendance</span>
                </button>
                <button
                  onClick={() => { navigate('/dashboard'); setQuickActionOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <LayoutDashboard size={14} className="text-emerald-600" />
                  <span>Dashboard Overview</span>
                </button>
                <button
                  onClick={() => { navigate('/leaves'); setQuickActionOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Calendar size={14} className="text-indigo-600" />
                  <span>Leave & Time Off</span>
                </button>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.displayName || 'System User'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-medium">
                  {user?.jobPosition || formatRoleName(role)}
                </p>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (unreadNotifications > 0) setUnreadNotifications(0);
              }}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative cursor-pointer"
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 border border-white"></span>
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
                    <p className="font-semibold text-slate-800 text-[11px]">Attendance Punch Tracked</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Biometric sync verified on Terminal 04-HQ</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800 text-[11px]">System Maintenance Complete</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Payroll engine FY24 audit baseline updated</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info with Dropdown */}
          <div className="relative" ref={profileRef}>
            <div 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-85 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                {user?.firstName ? user.firstName[0] : (user?.displayName ? user.displayName[0] : 'U')}
              </div>
              <div className="hidden md:block text-left">
                <p className="font-bold text-slate-900 text-xs leading-none">
                  {user?.displayName || 'User Profile'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                  {user?.jobPosition || user?.department || formatRoleLabel(role)}
                </p>
              </div>
              <ChevronDown size={13} className="text-slate-400 hidden md:block" />
            </div>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs space-y-2">
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-bold text-slate-900">{user?.displayName || 'Authenticated User'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{formatRoleLabel(role)}</p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition text-xs cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.displayName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  {user?.employeeCode && (
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{user.employeeCode}</p>
                  )}
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

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>
      </header>

      {/* Main Body with Fixed Left Sidebar + Independently Scrolling Content */}
      <div className="flex flex-1 relative pt-[53px]">
        
        {/* Left Sidebar Navigation — Fixed & Non-scrollable */}
        <aside className={`
          fixed top-[53px] bottom-0 left-0 z-30 w-60 bg-white border-r border-slate-200/90 transform transition-transform duration-200 ease-in-out flex flex-col justify-between overflow-hidden
          md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full justify-between overflow-hidden">
            
            {/* Workspace Selector Dropdown */}
            <div className="p-3 border-b border-slate-100">
              <button className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-between hover:bg-slate-100/70 transition">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Global Tech Corp</span>
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
            </div>

            {/* Nav Groups (Compact spacing, non-scrollable) */}
            <nav className="flex-1 px-3 py-2 space-y-3 overflow-hidden">
              {navGroups.map((group, idx) => (
                <div key={idx}>
                  <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                    {group.title}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative
                              ${isActive 
                                ? 'bg-blue-50/80 text-blue-700 font-bold' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1 bottom-1 w-1 bg-blue-600 rounded-r-full"></span>
                            )}
                            <Icon size={15} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
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
          <div className="flex flex-col h-full overflow-y-auto">
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
                  role === 'ADMIN' || item.roles.includes(role)
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

            {/* Sidebar Footer — Compliant & Version Info */}
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium px-3.5 bg-white mt-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                FY24 Compliant
              </span>
              <span className="font-mono text-[10px]">v4.18</span>
            </div>

          </div>
        </aside>
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

        {/* Main Content View Outlet — Indented by sidebar width on desktop */}
        <main className="flex-1 min-w-0 bg-slate-50/50 p-4 md:p-6 lg:p-8 md:ml-60">
          <Outlet />
        </main>
        {/* Main Content Area: Independently scrollable */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto bg-[#f8faff] p-6 lg:p-8">
          <Outlet context={{ globalSearch, setGlobalSearch }} />
        </main>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 md:hidden"
          />
        )}

      </div>
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
