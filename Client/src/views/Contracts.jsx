import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  ShieldCheck, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  Clock, 
  ListFilter, 
  Archive, 
  Search, 
  Download, 
  Plus, 
  Pencil, 
  GitBranch, 
  FileText, 
  Trash2, 
  Eye, 
  MoreVertical, 
  AlertCircle, 
  X, 
  Check, 
  ArrowRight,
  Filter,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import contractService from '../services/contractService';
import { Modal } from '../components/Modal';

export const Contracts = () => {
  const outletContext = useOutletContext();
  const globalSearch = outletContext?.globalSearch;

  // State
  const [contracts, setContracts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(globalSearch || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [structureFilter, setStructureFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Lookup Options
  const [employeesLookup, setEmployeesLookup] = useState([]);
  const [structuresLookup, setStructuresLookup] = useState([]);
  const [departmentsLookup, setDepartmentsLookup] = useState([]);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    employee_id: '',
    structure_id: '',
    wage: '',
    currency: 'INR',
    start_date: '',
    end_date: '',
    status: 'RUNNING'
  });

  const [renewData, setRenewData] = useState({
    new_end_date: '',
    wage_adjustment: '',
    new_wage: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Initial Data Load
  useEffect(() => {
    loadLookups();
    loadMetrics();
  }, []);

  // Fetch contracts on filter change
  useEffect(() => {
    loadContracts();
  }, [currentPage, statusFilter, deptFilter, structureFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadContracts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync when top universal search bar value changes
  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== searchTerm) {
      setSearchTerm(globalSearch);
      setCurrentPage(1);
    }
  }, [globalSearch]);

  const loadLookups = async () => {
    try {
      const [emps, structs, depts] = await Promise.all([
        contractService.getEmployeesLookup(),
        contractService.getStructuresLookup(),
        contractService.getDepartmentsLookup()
      ]);
      setEmployeesLookup(emps || []);
      setStructuresLookup(structs || []);
      setDepartmentsLookup(depts || []);
    } catch (err) {
      console.error('Failed to load lookup data:', err);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await contractService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractService.getContracts({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        department: deptFilter,
        structureId: structureFilter,
        search: searchTerm
      });
      setContracts(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load contracts:', err);
      setError(err.response?.data?.message || 'Failed to fetch contracts.');
    } finally {
      setLoading(false);
    }
  };

  // Default benchmark monthly wages for Indian compensation structures
  const STRUCTURE_BENCHMARK_WAGES = {
    'EXEC_TECH_IN': 187500,
    'STD_IN_SALARIED': 75000,
    'HOURLY_OPS_IN': 28000,
    'STD_MONTHLY': 50000
  };

  const handleStructureChange = (structureId) => {
    const selected = structuresLookup.find(
      s => String(s.id) === String(structureId) || s.code === structureId
    );

    let autoWage = '';
    if (selected) {
      if (selected.base_wage != null && Number(selected.base_wage) > 0) {
        autoWage = String(Number(selected.base_wage));
      } else if (STRUCTURE_BENCHMARK_WAGES[selected.code]) {
        autoWage = String(STRUCTURE_BENCHMARK_WAGES[selected.code]);
      } else {
        autoWage = '75000';
      }
    }

    setFormData(prev => ({
      ...prev,
      structure_id: structureId,
      wage: autoWage !== '' ? autoWage : prev.wage
    }));
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (selectedContract) {
        await contractService.updateContract(selectedContract.id, {
          ...formData,
          end_date: formData.end_date || null
        });
      } else {
        await contractService.createContract({
          ...formData,
          end_date: formData.end_date || null
        });
      }
      setFormData({
        employee_id: '',
        structure_id: '',
        wage: '',
        currency: 'INR',
        start_date: '',
        end_date: '',
        status: 'RUNNING'
      });
      await Promise.all([loadContracts(), loadMetrics()]);
    } catch (err) {
      setError(err.response?.data?.message || (selectedContract ? 'Failed to update contract.' : 'Failed to create contract.'));
    } finally {
      setIsNewModalOpen(false);
      setSelectedContract(null);
      setSubmitting(false);
    }
  };

  const handleRenewContract = async (e) => {
    e.preventDefault();
    if (!selectedContract) return;
    setSubmitting(true);
    setError(null);
    try {
      await contractService.renewContract(selectedContract.id, {
        new_end_date: renewData.new_end_date || null,
        wage_adjustment: renewData.wage_adjustment ? parseFloat(renewData.wage_adjustment) : 0,
        new_wage: renewData.new_wage ? parseFloat(renewData.new_wage) : null
      });
      await Promise.all([loadContracts(), loadMetrics()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to renew contract.');
    } finally {
      setIsRenewModalOpen(false);
      setSelectedContract(null);
      setSubmitting(false);
    }
  };

  const handleCompleteDraft = async (contractId) => {
    try {
      await contractService.completeContract(contractId);
      await Promise.all([loadContracts(), loadMetrics()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete contract.');
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete/archive this contract?')) return;
    try {
      await contractService.deleteContract(contractId);
      await Promise.all([loadContracts(), loadMetrics()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contract.');
    }
  };

  const handleExportLedger = async () => {
    try {
      const rows = await contractService.exportLedger();
      if (!rows || rows.length === 0) {
        alert('No ledger records to export.');
        return;
      }
      const headers = Object.keys(rows[0]).join(',');
      const csv = [headers, ...rows.map(r => Object.values(r).map(val => `"${val ?? ''}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `peoplepay_contracts_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export ledger: ' + err.message);
    }
  };

  const formatCurrency = (amount) => {
    const val = parseFloat(amount || 0);
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDepartmentColor = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('eng')) return 'bg-blue-600';
    if (d.includes('fin') || d.includes('tax')) return 'bg-teal-500';
    if (d.includes('oper')) return 'bg-slate-700';
    if (d.includes('legal') || d.includes('comp')) return 'bg-slate-400';
    return 'bg-indigo-500';
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. STATUTORY PAYROLL LOCK BANNER */}
      <div className="bg-[#0F172A] text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-teal-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-white">
                STATUTORY PAYROLL LOCK
              </span>
              <span className="text-teal-400 font-bold">•</span>
              <span className="text-[11px] font-mono text-slate-400 uppercase">ISO/IEC 27001</span>
            </div>
            <p className="text-xs text-slate-300 font-normal mt-1 leading-relaxed">
              <span className="font-semibold text-white">Important:</span> Payroll runs strictly apply the active contract effective during the selected payroll period. Retroactive amendments require dual authorization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <span className="text-xs font-mono text-slate-400 hidden lg:inline">
            Active Ledger: <span className="text-slate-200 font-semibold">FY24-Q3</span>
          </span>
          <button 
            onClick={() => setIsComplianceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm"
          >
            <BookOpen size={14} />
            <span>Compliance Rules</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. FOUR KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Contracts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                ACTIVE CONTRACTS
              </span>
              <CheckSquare size={17} className="text-blue-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {metrics ? metrics.activeContracts.toLocaleString() : '1,248'}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                +3.4% MoM
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: Expiring in <= 30 Days */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                EXPIRING IN ≤ 30 DAYS
              </span>
              <Clock size={17} className="text-rose-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {metrics ? metrics.expiringIn30Days : '19'}
              </span>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                Requires Action
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: '18%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Drafts & Queued */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                DRAFTS & QUEUED
              </span>
              <ListFilter size={17} className="text-blue-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {metrics ? metrics.draftsAndQueued : '42'}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                8 Pending Signature
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '32%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 4: Historical Archived */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                HISTORICAL ARCHIVED
              </span>
              <Archive size={17} className="text-slate-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {metrics ? metrics.historicalArchived.toLocaleString() : '3,891'}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Full Retention
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-700 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER AND ACTION TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Left Side: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search size={15} className="absolute inset-y-0 left-3 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID (CNT-2024-XXXX)..."
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (outletContext?.setGlobalSearch && outletContext.globalSearch !== val) {
                  outletContext.setGlobalSearch(val);
                }
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  if (outletContext?.setGlobalSearch) outletContext.setGlobalSearch('');
                }}
                className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 flex items-center"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <ListFilter size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Contracts</option>
              <option value="EXPIRING">Expiring Soon</option>
              <option value="DRAFT">Drafts & Queued</option>
              <option value="ARCHIVED">Historical / Expired</option>
            </select>
          </div>

          {/* Structure Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">STRUCTURE:</span>
            <select
              value={structureFilter}
              onChange={(e) => setStructureFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Structures</option>
              {structuresLookup.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Department Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">DEPT:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departmentsLookup.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2.5 self-end xl:self-auto shrink-0">
          <button
            onClick={handleExportLedger}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Ledger</span>
          </button>

          <button
            onClick={() => {
              setSelectedContract(null);
              setFormData({
                employee_id: '',
                structure_id: '',
                wage: '',
                currency: 'INR',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                status: 'RUNNING'
              });
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus size={15} />
            <span>New Contract</span>
          </button>
        </div>
      </div>

      {/* 4. CONTRACTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold tracking-wider uppercase text-slate-400">
                <th className="py-3.5 px-4 font-bold">CONTRACT ID</th>
                <th className="py-3.5 px-4 font-bold">EMPLOYEE</th>
                <th className="py-3.5 px-4 font-bold">DEPARTMENT</th>
                <th className="py-3.5 px-4 font-bold">WAGE / BASE SALARY</th>
                <th className="py-3.5 px-4 font-bold">SALARY STRUCTURE</th>
                <th className="py-3.5 px-4 font-bold">EFFECTIVE RANGE</th>
                <th className="py-3.5 px-4 font-bold">VALIDITY</th>
                <th className="py-3.5 px-4 font-bold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading contracts ledger...</span>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No contracts matching the selected filters.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const isExpiring = c.validity_status === 'EXPIRING_SOON';
                  const isDraft = c.validity_status === 'DRAFT';
                  const isExpired = c.validity_status === 'EXPIRED';
                  const isActive = c.validity_status === 'ACTIVE';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* CONTRACT ID */}
                      <td className="py-4 px-4 font-mono font-bold whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs border ${
                          isExpiring 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-slate-100/80 text-slate-700 border-slate-200'
                        }`}>
                          {c.contract_code}
                        </span>
                      </td>

                      {/* EMPLOYEE */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-300/60">
                            {c.first_name ? `${c.first_name[0]}${c.last_name ? c.last_name[0] : ''}` : 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {c.employee_name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {c.employee_code} • {c.job_position}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* DEPARTMENT */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${getDepartmentColor(c.department)}`}></span>
                          <span>{c.department}</span>
                        </div>
                      </td>

                      {/* WAGE / BASE SALARY */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {formatCurrency(c.wage, c.currency)} <span className="font-normal text-slate-400 text-xs">/mo</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {isDraft 
                              ? 'Pending Approval' 
                              : isExpired 
                              ? 'Final Settlement Paid' 
                              : `${formatCurrency(parseFloat(c.wage) * 12, c.currency)}/yr`}
                          </span>
                        </div>
                      </td>

                      {/* SALARY STRUCTURE */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                          {c.structure_name || 'Standard Full-Time'}
                        </span>
                      </td>

                      {/* EFFECTIVE RANGE */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                        <div className="flex flex-col">
                          <span>{c.start_date ? c.start_date.split('T')[0] : '—'}</span>
                          <span className={`text-[11px] ${isExpiring ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            → {c.end_date ? `${c.end_date.split('T')[0]} ${c.days_to_expiry ? `(${c.days_to_expiry}d)` : ''}` : 'Indefinite'}
                          </span>
                        </div>
                      </td>

                      {/* VALIDITY BADGE */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isExpiring ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle size={13} className="text-rose-600" />
                            <span>Expiring Soon</span>
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            <span>Active</span>
                          </span>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            <span>Draft</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <Archive size={13} />
                            <span>Expired / Historical</span>
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isExpiring ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedContract(c);
                                  setRenewData({ new_end_date: '', wage_adjustment: '500', new_wage: '' });
                                  setIsRenewModalOpen(true);
                                }}
                                className="px-3 py-1 bg-rose-800 hover:bg-rose-900 text-white rounded text-xs font-semibold shadow-sm transition"
                              >
                                Renew Now
                              </button>
                              <button className="p-1 text-slate-400 hover:text-slate-600">
                                <MoreVertical size={16} />
                              </button>
                            </>
                          ) : isDraft ? (
                            <>
                              <button
                                onClick={() => handleCompleteDraft(c.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleDeleteContract(c.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Draft"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : isExpired ? (
                            <>
                              <button 
                                onClick={() => {
                                  setSelectedContract(c);
                                  setIsRenewModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 transition" 
                                title="Renew/Reactivate"
                              >
                                <Clock size={16} />
                              </button>
                              <button className="p-1 text-slate-400 hover:text-slate-600 transition" title="View Details">
                                <Eye size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setSelectedContract(c);
                                  setFormData({
                                    employee_id: c.employee_id,
                                    structure_id: c.structure_id,
                                    wage: c.wage,
                                    currency: c.currency,
                                    start_date: c.start_date.split('T')[0],
                                    end_date: c.end_date ? c.end_date.split('T')[0] : '',
                                    status: c.status
                                  });
                                  setIsNewModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 transition" 
                                title="Edit Contract"
                              >
                                <Pencil size={15} />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedContract(c);
                                  setIsRenewModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 transition" 
                                title="Amend / Extend"
                              >
                                <GitBranch size={15} />
                              </button>
                              <button 
                                onClick={() => alert(`Contract Ledger for ${c.contract_code}: Effective ${c.start_date.split('T')[0]}`)}
                                className="p-1 text-slate-400 hover:text-slate-700 transition" 
                                title="View Details"
                              >
                                <FileText size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. TABLE FOOTER & PAGINATION */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="font-semibold text-slate-800">{contracts.length > 0 ? (currentPage - 1) * 10 + 1 : 0}-{Math.min(currentPage * 10, pagination.total)}</strong> of <strong className="font-semibold text-slate-800">{pagination.total.toLocaleString()}</strong> total records
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Sync: Live with Payroll Engine
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            <button
              className="w-7 h-7 rounded bg-slate-950 text-white font-bold text-xs flex items-center justify-center"
            >
              {currentPage}
            </button>
            {pagination.totalPages > 1 && (
              <button
                onClick={() => setCurrentPage(2)}
                className="w-7 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center"
              >
                2
              </button>
            )}
            {pagination.totalPages > 2 && (
              <button
                onClick={() => setCurrentPage(3)}
                className="w-7 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center"
              >
                3
              </button>
            )}
            {pagination.totalPages > 3 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  className="px-2 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center"
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODAL: CREATE / EDIT CONTRACT */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => { setIsNewModalOpen(false); setSelectedContract(null); }}
        title={selectedContract ? 'Edit Employment Contract' : 'Create Employment Contract'}
        subtitle="Configure period-isolated wages and salary structures."
        maxWidth="max-w-lg"
        preventClose={submitting}
      >
        <form onSubmit={handleCreateContract} className="p-5 space-y-4">
          {/* Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Employee *
            </label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">Select Employee...</option>
              {employeesLookup.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code} - {emp.job_position})
                </option>
              ))}
            </select>
          </div>

          {/* Salary Structure */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Salary Structure *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Auto-fills base wage</span>
            </div>
            <select
              required
              value={formData.structure_id}
              onChange={(e) => handleStructureChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">Select Structure...</option>
              {structuresLookup.map(s => {
                const wageVal = s.base_wage ? Number(s.base_wage) : (STRUCTURE_BENCHMARK_WAGES[s.code] || 75000);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — ₹{wageVal.toLocaleString('en-IN')}/mo
                  </option>
                );
              })}
            </select>
          </div>

          {/* Monthly Wage & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Monthly Wage *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 15000.00"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              {formData.structure_id && formData.wage && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <span>✓</span>
                  <span>Auto-filled standard wage for structure (editable)</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          {/* Effective Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                End Date (Leave blank for Indefinite)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Contract Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              <option value="RUNNING">Active (Running)</option>
              <option value="DRAFT">Draft (Pending Signature/Approval)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsNewModalOpen(false); setSelectedContract(null); }}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Contract'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. MODAL: RENEW CONTRACT */}
      <Modal
        isOpen={isRenewModalOpen && Boolean(selectedContract)}
        onClose={() => { setIsRenewModalOpen(false); setSelectedContract(null); }}
        title={selectedContract ? `Renew Contract: ${selectedContract.contract_code}` : 'Renew Contract'}
        subtitle="Extend validity period and update compensation."
        maxWidth="max-w-md"
        preventClose={submitting}
      >
        {selectedContract && (
          <form onSubmit={handleRenewContract} className="p-5 space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div><span className="text-slate-500">Employee:</span> <strong className="text-slate-800">{selectedContract.employee_name}</strong></div>
              <div><span className="text-slate-500">Current Monthly Wage:</span> <strong className="text-slate-800">{formatCurrency(selectedContract.wage, selectedContract.currency)}</strong></div>
              <div><span className="text-slate-500">Current Expiry:</span> <strong className="text-slate-800">{selectedContract.end_date ? selectedContract.end_date.split('T')[0] : 'Indefinite'}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                New Expiration Date
              </label>
              <input
                type="date"
                required
                value={renewData.new_end_date}
                onChange={(e) => setRenewData({ ...renewData, new_end_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 6);
                    setRenewData({ ...renewData, new_end_date: d.toISOString().split('T')[0] });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                >
                  +6 Months
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() + 1);
                    setRenewData({ ...renewData, new_end_date: d.toISOString().split('T')[0] });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setRenewData({ ...renewData, new_end_date: '' })}
                  className="px-2.5 py-1 rounded bg-slate-100 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                >
                  Indefinite
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Wage Adjustment (+/- Amount)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={renewData.wage_adjustment}
                onChange={(e) => setRenewData({ ...renewData, wage_adjustment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setIsRenewModalOpen(false); setSelectedContract(null); }}
                disabled={submitting}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Authorize Renewal'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 8. MODAL: COMPLIANCE RULES */}
      <Modal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        title="Statutory Payroll Lock & Compliance"
        icon={ShieldCheck}
        maxWidth="max-w-lg"
      >
        <div className="p-5 space-y-3.5 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 font-medium">
            ISO/IEC 27001 Certified Contract Integrity Framework (Section 4.A & 5.A)
          </div>
          <p>
            <strong>1. Period-Isolation Rule:</strong> Every payrun strictly derives compensation, working schedules, and applicable rules from contracts active during that exact calendar window.
          </p>
          <p>
            <strong>2. Dual Authorization:</strong> Retroactive amendments to finalized payruns or previously active contracts cannot be executed by single operators. Dual approval with audit trail recording is enforced.
          </p>
          <p>
            <strong>3. Anti-Overlap Guard:</strong> An employee may not possess simultaneous active running contracts with conflicting effective periods, safeguarding against duplicate wage disbursement.
          </p>
          <p>
            <strong>4. Expiration Alert Matrix:</strong> Contracts expiring within 30 days are automatically escalated to the HR Operations queue for extension authorization before the next payrun computation cycle.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setIsComplianceModalOpen(false)}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            Understood
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Contracts;
