import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { EmployeeFormModal } from './EmployeeFormModal';
import { 
  ArrowLeft, 
  Edit3, 
  Building2, 
  UserCheck, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Calendar, 
  Mail, 
  MapPin, 
  Briefcase, 
  Laptop, 
  Phone, 
  AlertCircle,
  Hash,
  Landmark,
  Layers,
  Cpu
} from 'lucide-react';

export const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchEmployee = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/employees/${id}`);
      if (res.data.success) {
        setEmployee(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load employee details:', err);
      setError('Failed to retrieve employee profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium text-slate-500 mt-3">Loading employee master record...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-12 text-center">
        <AlertCircle size={32} className="text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-900">{error || 'Employee Not Found'}</h3>
        <button
          onClick={() => navigate('/employees')}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/employees" className="hover:text-slate-900 transition flex items-center gap-1 font-medium">
            <ArrowLeft size={14} />
            <span>WORKFORCE DIRECTORY</span>
          </Link>
          <span className="text-slate-300">›</span>
          <span className="font-mono font-semibold text-slate-800">{employee.employee_code}</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Tier 1 Core Contributor
        </div>
      </div>

      {/* Profile Header Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar & Core Profile Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {employee.first_name[0]}{employee.last_name[0]}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${employee.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {employee.first_name} {employee.last_name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {employee.employee_code}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${employee.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  ● {employee.is_active ? 'Active • Full Time' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-700 mt-1">
                {employee.job_position} <span className="text-slate-400 font-normal">— {employee.department}</span>
              </p>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-slate-400" />
                  <span>{employee.department}</span>
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck size={13} className="text-slate-400" />
                  <span>{employee.manager_name ? `${employee.manager_name} (${employee.manager_code})` : 'Direct / Executive'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  <span>HQ Main Office</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Quick Metadata Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DIRECT WORK EMAIL</span>
            <span className="font-mono text-slate-700 font-medium truncate block mt-0.5">
              {employee.user_email || `${employee.first_name.toLowerCase()}.${employee.last_name.toLowerCase()}@peoplepay360.com`}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PRIMARY WORKSTATION</span>
            <span className="font-mono text-slate-700 font-medium block mt-0.5">
              MBP-M3-PRO ({employee.employee_code})
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PAYROLL STREAM</span>
            <span className="font-mono text-slate-700 font-medium block mt-0.5">
              Monthly Enterprise
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SECURITY CLEARANCE</span>
            <span className="text-emerald-700 font-medium block mt-0.5">
              Level 4 (Standard Portal)
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${activeTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Briefcase size={15} />
          <span>Overview & Work Info</span>
        </button>

        {/* Future Phase Non-Functional Placeholder Tabs */}
        <button
          type="button"
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${activeTab === 'contracts' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <FileText size={15} />
          <span>Contracts & Comp</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">Phase 3</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${activeTab === 'attendance' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Clock size={15} />
          <span>Attendance & Time Tracking</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">Phase 4</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${activeTab === 'leaves' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Calendar size={15} />
          <span>Leaves & Time Off</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">Phase 5</span>
        </button>
      </div>

      {/* Tab 1: Overview & Work Info */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Job Specifications & Hardware Assets */}
          <div className="lg:col-span-8 space-y-6">
            {/* Job Specifications Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers size={15} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Job Specifications & Role Scope</h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">REV-2024.1</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Employee is an active contributor to the <strong className="text-slate-900">{employee.department}</strong> division in the role of <strong className="text-slate-900">{employee.job_position}</strong>. Accountable for core project execution, technical standards, and reporting alignment with designated leadership.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">POSITION TITLE</span>
                  <p className="text-xs font-semibold text-slate-900 mt-1">{employee.job_position}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{employee.department} Core Function</p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COST CENTER ALLOCATION</span>
                  <p className="text-xs font-semibold text-slate-900 mt-1">CC-8820-{employee.department.toUpperCase()}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Global Operations & Growth</p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">REPORTING HIERARCHY</span>
                  <p className="text-xs font-semibold text-slate-900 mt-1">
                    {employee.manager_name ? employee.manager_name : 'Direct Report (Executive)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {employee.manager_position ? employee.manager_position : 'Department Leadership'}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STANDARD WORKING HOURS</span>
                  <p className="text-xs font-semibold text-slate-900 mt-1">40.0 hrs / week</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Standard Enterprise Schedule</p>
                </div>
              </div>
            </div>

            {/* Provisioned Assets & Hardware Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Laptop size={15} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Provisioned Assets & Hardware Perimeter</h2>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Active MDM Verified
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Asset Tag</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Serial</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-indigo-600">AST-9942</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">MacBook Pro 16" (M3 Max, 64GB)</td>
                      <td className="py-2.5 px-3 text-slate-500">C02G8492MD6R</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-semibold">Enrolled</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-indigo-600">AST-4188</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">YubiKey 5C NFC Security Key</td>
                      <td className="py-2.5 px-3 text-slate-500">YK-88910401</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-semibold">FIDO2 Active</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Bank Details & Emergency Contact */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bank Information & Tax Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Landmark size={15} />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Payroll Bank Account Details</h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BANK ACCOUNT NUMBER</span>
                  <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                    {employee.bank_account_no ? employee.bank_account_no : 'Not Configured'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IFSC / ROUTING CODE</span>
                  <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                    {employee.bank_ifsc ? employee.bank_ifsc : 'Not Configured'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DIRECT DISBURSEMENT STATUS</span>
                  <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <ShieldCheck size={14} />
                    <span>Verified for ACH / Direct Deposit</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact Protocol */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Phone size={15} />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Emergency Contact Protocol</h2>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                <p className="font-semibold text-slate-900">Primary Emergency Contact</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Family Contact on File</p>
                <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1 font-mono text-[11px] text-slate-700">
                  <p>+1 (415) 555-0193</p>
                  <p>emergency.contact@company.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholders for Other Tabs */}
      {activeTab !== 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Clock size={20} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 capitalize">
            {activeTab.replace('-', ' ')} Module
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            This module will become operational in its designated phase. Employee master records are ready and connected.
          </p>
        </div>
      )}

      {/* Edit Employee Form Modal */}
      <EmployeeFormModal
        isOpen={isEditOpen}
        initialData={employee}
        onClose={() => setIsEditOpen(false)}
        onSave={() => fetchEmployee()}
      />
    </div>
  );
};
