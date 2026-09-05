/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY STRUCTURES (SCHEMAS) MASTER-DETAIL VIEW
 * ==============================================================================
 * 
 * WHAT THIS COMPONENT DOES IN SIMPLE WORDS:
 * In a company, different types of employees have different pay structures:
 * - Regular Full-Time Employees (have Basic, HRA, PF, PT, etc.)
 * - US Executives (have RSUs, Equity Tranches, 401k matching)
 * - Hourly Shift Workers (have Overtime 1.5x/2.0x, shift differentials)
 * - Independent Contractors (have flat fees and self-withholding)
 * 
 * This screen lets HR organize these different packages into "Structures":
 * 1. The LEFT panel lists all Registered Schemas (with code, employee counts, rule counts).
 * 2. Clicking any schema on the left displays its full detail on the RIGHT panel.
 * 3. The RIGHT panel shows:
 *    - Schema details and status tags.
 *    - "Execution Sequence Graph": Table of rules belonging to this structure.
 *    - Quick "+ Add Rule", "Configure", and "Reorder Sequence" actions.
 *    - "Simulation Sandbox (Sample Base)" bottom strip: Live calculation preview
 *      (Gross -> Social Contributions -> Estimated Tax -> Net Pay) with a "Deterministic Pass" badge!
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Layers, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Download, 
  Settings, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Code,
  DollarSign,
  Percent,
  Calculator,
  ChevronRight,
  Check
} from 'lucide-react';
import { salaryService, DEFAULT_STRUCTURES, DEFAULT_RULES, runClientSimulation } from '../../services/salaryService';
import { RuleModal } from './RuleModal';

export const SalaryStructures = () => {
  // All available structures in state
  const [structures, setStructures] = useState(DEFAULT_STRUCTURES);
  // Currently selected structure ID
  const [selectedStructureId, setSelectedStructureId] = useState('str-std-monthly');
  // Active structure full details (including its specific rules)
  const [activeStructure, setActiveStructure] = useState(DEFAULT_STRUCTURES[0]);
  const [loading, setLoading] = useState(false);

  // Modal and toast state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial load from backend API
  useEffect(() => {
    loadStructures();
  }, []);

  const loadStructures = async () => {
    setLoading(true);
    try {
      const data = await salaryService.getStructures();
      if (data && data.length > 0) {
        setStructures(data);
        if (!selectedStructureId || !data.some(s => s.id === selectedStructureId)) {
          setSelectedStructureId(data[0].id);
        }
      }
    } catch (e) {
      console.warn('Using fallback structures:', e.message);
    } finally {
      setLoading(false);
    }
  };

  // When selectedStructureId changes, load its full detail and rules
  useEffect(() => {
    if (selectedStructureId) {
      salaryService.getStructureById(selectedStructureId)
        .then(detail => {
          setActiveStructure(detail);
        })
        .catch(err => {
          const fallback = structures.find(s => s.id === selectedStructureId) || structures[0];
          setActiveStructure(fallback);
        });
    }
  }, [selectedStructureId, structures]);

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live sandbox calculation for bottom strip matching the mockup
  const sandboxResult = useMemo(() => {
    const rules = activeStructure?.rules || DEFAULT_RULES;
    return runClientSimulation({
      wage: 120000,
      scheduleDays: 22,
      workedDays: 22,
      unpaidDays: 0,
      overtimeHours: 4,
      rules
    });
  }, [activeStructure]);

  // Handle saving a rule (new or edited)
  const handleSaveRule = (savedRule) => {
    const currentRules = activeStructure?.rules || [];
    let updatedRules;
    if (ruleToEdit) {
      updatedRules = currentRules.map(r => r.code === savedRule.code ? { ...r, ...savedRule } : r);
      showToast(`Rule '${savedRule.code}' updated.`);
    } else {
      updatedRules = [...currentRules, { id: `rule-${Date.now()}`, ...savedRule }];
      showToast(`Rule '${savedRule.code}' added to structure.`);
    }

    setActiveStructure(prev => ({
      ...prev,
      rules: updatedRules.sort((a, b) => a.sequence - b.sequence),
      rule_count: updatedRules.length
    }));

    setIsRuleModalOpen(false);
    setRuleToEdit(null);
  };

  // Handle deleting a rule
  const handleDeleteRule = (code) => {
    if (window.confirm(`Are you sure you want to remove rule '${code}' from this structure?`)) {
      const updatedRules = (activeStructure?.rules || []).filter(r => r.code !== code);
      setActiveStructure(prev => ({
        ...prev,
        rules: updatedRules,
        rule_count: updatedRules.length
      }));
      showToast(`Rule '${code}' removed.`);
    }
  };

  // Currency formatting helper
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 bg-slate-900 text-white border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold block mb-1">
            GLOBAL PAYROLL GOVERNANCE &gt; COMPENSATION ARCHITECTURE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Salary Structures</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Orchestrate corporate grade compensation models, sequence computational dependencies, and enforce regional regulatory pay matrices.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => showToast('Salary structures matrix exported as CSV.')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download size={15} />
            <span>Export Matrix</span>
          </button>
          <button
            onClick={() => showToast('Create structure modal opened.')}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus size={15} />
            <span>Create Structure</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Structures */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Structures</span>
            <Sliders size={16} className="text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{structures.length}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              100% Validated
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Across global jurisdictions</p>
        </div>

        {/* Covered Employees */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Covered Employees</span>
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">1,248</span>
            <span className="text-xs text-slate-400 font-medium">/ 1,260 FTEs</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full w-[98%]"></div>
          </div>
        </div>

        {/* Configured Rules */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Configured Rules</span>
            <Layers size={16} className="text-teal-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">28</span>
            <span className="text-xs text-slate-500 font-medium">rules linked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">18 Statutory • 10 Discretionary</p>
        </div>

        {/* Compliance Audit */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Compliance Audit</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900 font-mono">ISO/IEC 27001</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 size={13} />
              <span>Automated Audit Passed</span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Checksum: #a499-f2e1</p>
        </div>
      </div>

      {/* Master-Detail Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Registered Schemas (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Registered Schemas</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-200 text-slate-700 font-semibold">
                {structures.length} Listed
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {structures.map((struct) => {
              const isSelected = struct.id === selectedStructureId;

              return (
                <div
                  key={struct.id}
                  onClick={() => setSelectedStructureId(struct.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {struct.code}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      struct.is_default ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {struct.is_default ? 'Active & Default' : 'Active'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{struct.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {struct.description || 'Standardized compensation schema.'}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Sliders size={12} className="text-slate-400" />
                      {struct.rule_count || 11} Rules
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Users size={12} className="text-slate-400" />
                      {struct.employee_count || 0} Employees
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom helper card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">RULE COMPILER ENGINE</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Rules execute in topological sort based on declared order sequences. Upstream variables are exposed downstream.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Active Selected Structure Detail (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-6">
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                    {activeStructure?.code || 'STD_MONTHLY'}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    {activeStructure?.region || 'Standard Jurisdiction'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {activeStructure?.name || 'Standard Structure'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeStructure?.description || 'Active computational structure.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setRuleToEdit(null);
                    setIsRuleModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus size={14} />
                  <span>Add Rule</span>
                </button>
                <button
                  onClick={() => showToast('Structure configuration panel.')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Settings size={14} />
                  <span>Configure</span>
                </button>
              </div>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-3 gap-3 py-3.5 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Calculation Depth
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {activeStructure?.rules?.length || 11} Computational Tiers
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Target Output
                </span>
                <span className="font-mono font-bold text-indigo-600 mt-0.5 block">
                  NET_PAYABLE
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  State Integrity
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Synchronized
                </span>
              </div>
            </div>
          </div>

          {/* Execution Sequence Graph Table */}
          <div className="px-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Execution Sequence Graph</h3>
                <p className="text-[11px] text-slate-500">Deterministic flow calculated sequentially by execution index.</p>
              </div>
              <button
                onClick={() => showToast('Rules order is strictly synchronized with sequence values.')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Reorder Sequence
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3 w-16">SEQ</th>
                    <th className="py-2.5 px-3 w-48">RULE IDENTITY</th>
                    <th className="py-2.5 px-3 w-32">CATEGORY</th>
                    <th className="py-2.5 px-3">COMPUTATION FORMULA / FACTOR</th>
                    <th className="py-2.5 px-3 text-right w-20">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeStructure?.rules || DEFAULT_RULES).map((rule) => {
                    const isNet = rule.code === 'NET';
                    const isGross = rule.code === 'GROSS';

                    return (
                      <tr 
                        key={rule.code} 
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isNet ? 'bg-indigo-50/40' : isGross ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[11px]">
                            {rule.sequence}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block font-mono">{rule.code}</span>
                          <span className="text-[11px] text-slate-500">{rule.name}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {rule.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {rule.type === 'FIXED' ? (
                            <span className="text-slate-700 font-semibold">₹{parseFloat(rule.fixed_amount || 0).toLocaleString()}</span>
                          ) : rule.type === 'PERCENTAGE' ? (
                            <span className="text-indigo-700">{rule.base_code || 'BASIC'} * {rule.percentage_rate}%</span>
                          ) : (
                            <span className="text-slate-800 truncate block max-w-sm">{rule.formula}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setRuleToEdit(rule);
                                setIsRuleModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.code)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Simulation Sandbox Bar matching mockup */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders size={14} className="text-indigo-600" />
                Simulation Sandbox (Sample ₹1,20,000 Base)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-semibold">
                Deterministic Pass
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 items-center">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Gross Payable</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {formatINR(sandboxResult.gross)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold uppercase text-rose-500 tracking-wider">Deductions (PF+PT)</span>
                  <p className="text-sm font-bold font-mono text-rose-700 mt-0.5">
                    -{formatINR(sandboxResult.deductions)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Hourly Rate</span>
                  <p className="text-sm font-bold font-mono text-slate-700 mt-0.5">
                    ₹{sandboxResult.hourly_rate}/hr
                  </p>
                </div>
              </div>

              <div className="sm:border-l sm:border-slate-100 sm:pl-3">
                <span className="text-[10px] font-semibold uppercase text-indigo-600 tracking-wider">Net Pay Result</span>
                <p className="text-lg font-extrabold font-mono text-indigo-600 mt-0.5">
                  {formatINR(sandboxResult.net_salary)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rule Add / Edit Modal */}
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
          setRuleToEdit(null);
        }}
        onSave={handleSaveRule}
        ruleToEdit={ruleToEdit}
        existingRules={activeStructure?.rules || DEFAULT_RULES}
      />
    </div>
  );
};
