import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Shield, 
  KeyRound,
  Users
} from 'lucide-react';
import logo from '../assets/logo.png';

export const Login = () => {
  // Inputs strictly initialize empty - manual user entry required
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [error, setError] = useState('');
  const [isRoleMismatch, setIsRoleMismatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const roleOptions = [
    {
      id: 'HR_PAYROLL',
      label: 'HR Payroll',
      roleValue: 'HR_PAYROLL_MANAGER'
    },
    {
      id: 'EMPLOYEE',
      label: 'Employee',
      roleValue: 'EMPLOYEE'
    },
    {
      id: 'GLOBAL_ADMIN',
      label: 'Global Admin',
      roleValue: 'ADMIN'
    }
  ];

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your enterprise email address.');
      setIsRoleMismatch(false);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      setIsRoleMismatch(false);
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      setIsRoleMismatch(false);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsRoleMismatch(false);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const selectedOpt = roleOptions.find((r) => r.id === selectedRoleId);
      const expectedRole = selectedOpt ? selectedOpt.roleValue : null;

      await login(email.trim(), password, expectedRole);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 403 && err.response?.data?.code === 'ROLE_MISMATCH') {
        setIsRoleMismatch(true);
        setError(err.response.data.message || 'Access denied — Role mismatch.');
      } else {
        setIsRoleMismatch(false);
        const msg = err.response?.data?.message || err.message || 'Invalid enterprise credentials or server error.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Outer Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        
        {/* =========================================================================
            LEFT COLUMN: Architectural Overview & System Security (5 cols on Desktop)
           ========================================================================= */}
        <div className="lg:col-span-5 bg-[#0b1528] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Technical Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: '28px 28px'
            }}
          />

          <div className="relative z-10">
            {/* Enterprise Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-semibold text-blue-300 tracking-wide">
              <ShieldCheck size={13} className="text-blue-400" />
              <span>ENTERPRISE HCM & PAYROLL</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-6 leading-snug">
              Workforce precision & payroll governance.
            </h1>
            <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
              Unified human capital management, rule-based payroll computation, and role-governed workforce operations.
            </p>

            {/* Architecture Highlights */}
            <div className="space-y-3 mt-8">
              <div className="bg-[#132038]/90 border border-[#1e2f4d] rounded-lg p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Database-Driven Authentication</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Bcrypt password verification with cryptographically signed JWT sessions.
                  </div>
                </div>
              </div>

              <div className="bg-[#132038]/90 border border-[#1e2f4d] rounded-lg p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Role-Based Access Control (RBAC)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Granular permissions for Admins, HR Managers, Payroll Specialists, and Employees.
                  </div>
                </div>
              </div>

              <div className="bg-[#132038]/90 border border-[#1e2f4d] rounded-lg p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">End-to-End Operational Pipeline</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Integrated Employee Master, Working Contracts, Attendance, Leaves, and Salary Engine.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Platform Architecture Label */}
          <div className="relative z-10 mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>PostgreSQL Engine</span>
            <span>•</span>
            <span>Express v4 API</span>
            <span>•</span>
            <span>JWT Security</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Enterprise Login Form (7 cols on Desktop)
           ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-8 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Top Brand & Status Bar */}
            <div className="flex items-center justify-between">
              {/* Brand Logo & Text */}
              <div className="flex items-center gap-2.5">
                <img 
                  src={logo} 
                  alt="PeoplePay360" 
                  className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-sm" 
                />
                <div>
                  <div className="leading-none text-base">
                    <span className="text-slate-900 font-extrabold tracking-tight">PeoplePay</span>
                    <span className="text-[#0051d5] font-extrabold tracking-tight">360</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block mt-0.5">
                    ENTERPRISE WORKFORCE SUITE
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>System Operational</span>
              </div>
            </div>

            {/* Main Form Heading */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                Welcome back to PeoplePay360
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your enterprise credentials to access your portal workspace.
              </p>
            </div>

            {/* Quick Role Verification Section */}
            <div className="mt-5 p-3.5 rounded-lg bg-[#f8faff] border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Quick Role Verification
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedRoleId ? 'Active Filter' : 'Optional Guard'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                Select an expected role to verify your credentials against database RBAC authorization.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => {
                  const isSelected = selectedRoleId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setError('');
                        setIsRoleMismatch(false);
                        setSelectedRoleId(isSelected ? null : opt.id);
                      }}
                      className={`
                        py-2 px-2.5 rounded-md text-center transition flex flex-col items-center justify-center border text-xs
                        ${isSelected 
                          ? 'bg-[#0b1528] text-white border-[#0b1528] shadow-sm ring-1 ring-[#0b1528]' 
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}
                      `}
                    >
                      <span className="font-semibold leading-tight block">{opt.label}</span>
                      <span className={`text-[9px] font-mono leading-tight block mt-0.5 ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                        {opt.roleValue}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-700 leading-relaxed">
                  {isRoleMismatch ? (
                    <>
                      <div className="font-bold text-rose-800 mb-0.5">
                        Access denied — Role mismatch
                      </div>
                      <div className="font-medium text-rose-700">
                        {error}
                      </div>
                    </>
                  ) : (
                    <div className="font-medium text-rose-700">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Enterprise Email
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your enterprise email"
                    autoComplete="email"
                    className="block w-full pl-9 pr-3 py-2 bg-[#f8faff] border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0051d5] focus:ring-1 focus:ring-[#0051d5] transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800">
                    Master Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setError('Password reset instructions must be requested from your HR Administrator.')}
                    className="text-[11px] text-[#0051d5] font-medium hover:underline focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="block w-full pl-9 pr-10 py-2 bg-[#f8faff] border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0051d5] focus:ring-1 focus:ring-[#0051d5] transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Sign In to Workspace Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold text-white bg-black hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition duration-150 shadow-sm mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1">
                <Lock size={12} className="text-slate-400" />
                <span>Encrypted Session</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-slate-400" />
                <span>PostgreSQL RBAC Enforced</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


