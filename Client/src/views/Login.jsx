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
  Building, 
  Play, 
  Shield, 
  ArrowLeftRight
} from 'lucide-react';

export const Login = () => {
  // Fields strictly initialized empty per product requirements
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [selectedDemoRole, setSelectedDemoRole] = useState('HR Payroll');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const demoRoles = [
    {
      id: 'HR Payroll',
      title: 'HR Payroll',
      sub: 'Approver'
    },
    {
      id: 'Employee',
      title: 'Employee',
      sub: 'Self-Service'
    },
    {
      id: 'Global Admin',
      title: 'Global Admin',
      sub: 'Audit & Ops'
    }
  ];

  const handleDemoSelect = (roleId) => {
    setSelectedDemoRole(roleId);
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your enterprise email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid enterprise credentials or server error.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Outer Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        
        {/* =========================================================================
            LEFT COLUMN: Dark Navy / Technical Grid Showcase (5 cols on Desktop)
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
              <span>ENTERPRISE GRADE HCM & PAYROLL</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-6 leading-snug">
              Workforce precision at global scale.
            </h1>
            <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
              Orchestrating compliant multi-jurisdiction compensation, tax auditing, and automated disbursement across 48 territories.
            </p>

            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="bg-[#132038]/90 border border-[#1e2f4d] rounded-lg p-3.5">
                <div className="text-xl font-bold font-mono tracking-tight text-white">99.98%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">First-pass Payroll Accuracy</div>
              </div>
              <div className="bg-[#132038]/90 border border-[#1e2f4d] rounded-lg p-3.5">
                <div className="text-xl font-bold font-mono tracking-tight text-white">42,000+</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Monthly Disbursed Slips</div>
              </div>
            </div>

            {/* Automated Treasury Clearance Item */}
            <div className="bg-[#132038]/90 border border-[#1e2f4d] rounded-lg p-3 flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-[#0051d5] text-white flex items-center justify-center shrink-0">
                  <Building size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-tight">Automated Treasury Clearance</div>
                  <div className="text-[10px] text-slate-400 font-mono">T-0 Direct ACH / SEPA Instant</div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                SOC2 TYPE II
              </span>
            </div>

            {/* Testimonial Quote */}
            <div className="bg-[#132038]/70 border border-[#1e2f4d] rounded-lg p-4 mt-6">
              <p className="text-xs text-slate-300 italic leading-relaxed">
                “PeoplePay360 unified our cross-border statutory compliance across 14 European entities and eliminated 40 hours of reconciliation every single cycle.”
              </p>
              <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-500 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  ER
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-none">Elena Rostova</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">VP of Global People Ops, Veloce Health</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badges */}
          <div className="relative z-10 mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400 tracking-wider">
            <span>GDPR Compliant</span>
            <span>•</span>
            <span>ISO 27001 Certified</span>
            <span>•</span>
            <span>FinCEN Regulated</span>
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
                <div className="w-8 h-8 rounded-lg bg-[#0b1528] text-white flex items-center justify-center font-bold shadow-sm">
                  <ArrowLeftRight size={16} className="text-blue-400" />
                </div>
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

            {/* Error Message Alert */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-700 font-medium leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800">
                    Enterprise Email
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Single Sign-On enabled
                  </span>
                </div>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.jenkins@meridian.io"
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
                    onClick={() => setError('Password reset instructions have been sent to your administrator.')}
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
                    placeholder="••••••••••••"
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

              {/* Password Strength Indicator Bars */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                  <div className="h-1 flex-1 bg-[#0051d5] rounded-full"></div>
                  <div className="h-1 flex-1 bg-[#0051d5] rounded-full"></div>
                  <div className="h-1 flex-1 bg-[#0051d5] rounded-full"></div>
                  <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Strong Enterprise key
                </span>
              </div>

              {/* Remember Session & FIDO2 Ready */}
              <div className="flex items-center justify-between pt-1">
                <label 
                  onClick={() => setRememberSession(!rememberSession)}
                  className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-3.5 h-3.5 text-black rounded border-slate-300 focus:ring-black accent-black"
                  />
                  <span>Remember session for 30 days</span>
                </label>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  FIDO2 Ready
                </span>
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

            {/* Corporate Identity Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold tracking-wider">
                <span className="bg-white px-2 text-slate-400">CORPORATE IDENTITY</span>
              </div>
            </div>

            {/* SSO Action Button */}
            <button
              type="button"
              onClick={() => setError('SSO SAML authentication requires enterprise IdP redirect.')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e2ecfe] border border-[#d3e2fe] transition duration-150"
            >
              <Play size={11} className="fill-current text-[#0051d5]" />
              <span>Continue with Okta / Google Workspace SSO</span>
            </button>

            {/* Fast Sandbox Simulation (Display Only) */}
            <div className="mt-5 p-3 rounded-lg bg-[#f8faff] border border-slate-200/90">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                  FAST SANDBOX SIMULATION
                </span>
                <span className="text-[9px] font-bold text-[#0051d5] tracking-wider uppercase">
                  DEMO MODES
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demoRoles.map((roleItem) => {
                  const isActive = selectedDemoRole === roleItem.id;
                  return (
                    <button
                      key={roleItem.id}
                      type="button"
                      onClick={() => handleDemoSelect(roleItem.id)}
                      className={`
                        py-1.5 px-2 rounded text-center transition flex flex-col items-center justify-center
                        ${isActive 
                          ? 'bg-black text-white shadow-sm' 
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}
                      `}
                    >
                      <span className="text-[11px] font-bold leading-tight block">{roleItem.title}</span>
                      <span className={`text-[9px] leading-tight block mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {roleItem.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1">
                <Lock size={12} className="text-slate-400" />
                <span>256-Bit TLS Encryption</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-slate-400" />
                <span>SOC2 Type II Audited</span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
              <Shield size={12} className="text-slate-400" />
              <span>Zero-Trust Privacy</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
