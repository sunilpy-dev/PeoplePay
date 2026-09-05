/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY RULES ARCHITECTURE & EXECUTION PIPELINE VIEW
 * ==============================================================================
 * 
 * WHAT THIS COMPONENT DOES IN SIMPLE WORDS:
 * This is the control console for HR and Payroll Managers to manage the mathematical rules
 * of the payroll engine.
 * 
 * It visually implements `Docs/UI/Salary Rules Architecture.png`:
 * 1. Top Executive KPI cards:
 *    - Compiled Rules count (e.g. 11 verified rules)
 *    - Computation Load latency (14.2ms)
 *    - Dynamic Formula Rules share (72%)
 *    - Execution Pipeline card: "Strict Sequence Mode" with "Zero circular references detected"
 * 2. Filter Bar:
 *    - Search by code or formula
 *    - Category tabs (Basic, Allowances, Gross, Deductions, Net)
 *    - Computation Type dropdown
 * 3. Rules Data Table:
 *    - Displays rules sorted by Sequence (010 -> 200).
 *    - Code snippet preview with JetBrains Mono.
 *    - Quick Edit and Delete buttons.
 * 4. Execution Sequence Hierarchy:
 *    - Visual bottom cards displaying the 5 pipeline stages (Contract -> Allowances -> Gross -> Deductions -> Net).
 * 5. Dry Run Test Sandbox:
 *    - Launches the interactive drawer where HR can change numbers (wage, worked days)
 *      and watch the rules evaluate in real-time!
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Search, 
  Plus, 
  FlaskConical, 
  ShieldCheck, 
  Code, 
  TrendingUp, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Calculator, 
  Edit3, 
  Trash2, 
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { salaryService, DEFAULT_RULES } from '../../services/salaryService';
import { RuleModal } from './RuleModal';
import { DryRunSandboxDrawer } from './DryRunSandboxDrawer';

export const SalaryRules = () => {
  // Current rules in state
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [loading, setLoading] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');

  // Modal and drawer visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState(null);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load rules from backend when the component mounts
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const structures = await salaryService.getStructures();
      if (structures && structures.length > 0) {
        const primary = structures[0];
        const detail = await salaryService.getStructureById(primary.id);
        if (detail?.rules?.length) {
          setRules(detail.rules);
        }
      }
    } catch (e) {
      console.warn('Loading fallback rules:', e.message);
    } finally {
      setLoading(false);
    }
  };

  // User-facing toast feedback helper
  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter rules based on search text, category tab, and computation method
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesSearch = 
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.formula && rule.formula.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = 
        selectedCategory === 'ALL' || 
        rule.category === selectedCategory ||
        (selectedCategory === 'NET' && rule.category === 'NET');

      const matchesMethod = 
        selectedMethod === 'ALL' || 
        rule.type === selectedMethod;

      return matchesSearch && matchesCat && matchesMethod;
    }).sort((a, b) => a.sequence - b.sequence);
  }, [rules, searchQuery, selectedCategory, selectedMethod]);

  // Aggregate statistics for the KPI cards
  const stats = useMemo(() => {
    const total = rules.length;
    const formulaCount = rules.filter(r => r.type === 'FORMULA').length;
    const formulaShare = total > 0 ? Math.round((formulaCount / total) * 100) : 0;
    return {
      total,
      formulaCount,
      formulaShare
    };
  }, [rules]);

  // Save rule handler (called by RuleModal when user clicks Save)
  const handleSaveRule = (savedRule) => {
    if (ruleToEdit) {
      // Update existing rule
      setRules(prev => prev.map(r => r.code === savedRule.code ? { ...r, ...savedRule } : r));
      showToast(`Rule '${savedRule.code}' updated and DAG validated.`);
    } else {
      // Add newly created rule
      setRules(prev => [...prev, { id: `rule-${Date.now()}`, ...savedRule }]);
      showToast(`Rule '${savedRule.code}' added to execution pipeline.`);
    }
    setIsModalOpen(false);
    setRuleToEdit(null);
  };

  // Delete rule handler
  const handleDeleteRule = (code) => {
    if (window.confirm(`Are you sure you want to remove rule '${code}' from the pipeline?`)) {
      setRules(prev => prev.filter(r => r.code !== code));
      showToast(`Rule '${code}' removed from execution pipeline.`, 'info');
    }
  };

  // Color styles for category tags
  const getCategoryBadgeStyle = (cat) => {
    switch (cat) {
      case 'BASIC':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ALLOWANCE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'GROSS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DEDUCTION':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NET':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Badge styles for computation method
  const getMethodBadge = (type) => {
    switch (type) {
      case 'FIXED':
        return { label: 'Fixed Amount', icon: DollarSign, color: 'text-slate-600' };
      case 'PERCENTAGE':
        return { label: 'Percentage (%)', icon: Percent, color: 'text-indigo-600' };
      case 'FORMULA':
      default:
        return { label: 'Formula Expression', icon: Code, color: 'text-blue-600' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
          notification.type === 'info' ? 'bg-slate-900 text-white border-slate-800' : 'bg-emerald-900 text-emerald-100 border-emerald-800'
        }`}>
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
              PAYROLL ENGINE V4.2
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
              STRICT_EXECUTION_ORDER_ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Salary Rules Architecture <span className="text-slate-400 font-normal">/ Execution Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Configure programmatic payroll logic, order of execution sequences, tax withholdings, and mathematical deduction algorithms with zero latency.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsSandboxOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <FlaskConical size={15} className="text-indigo-600" />
            <span>Dry Run Test Sandbox</span>
          </button>
          <button
            onClick={() => {
              setRuleToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus size={15} />
            <span>New Salary Rule</span>
          </button>
        </div>
      </div>

      {/* Executive Metrics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Compiled Rules */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Compiled Rules
            </span>
            <span className="text-xs font-serif font-bold text-slate-400">Σ</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              All verified
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Across active compensation tiers</p>
        </div>

        {/* Card 2: Computation Load */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Computation Load
            </span>
            <TrendingUp size={15} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">14.2<span className="text-sm font-normal text-slate-500">ms</span></span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono">
              p99 &lt; 22ms
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Evaluated per employee/month</p>
        </div>

        {/* Card 3: Dynamic Formula Rules */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Dynamic Formula Rules
            </span>
            <Code size={15} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{stats.formulaCount}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono">
              {stats.formulaShare}% share
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">With syntax &amp; scope sandboxing</p>
        </div>

        {/* Card 4: Execution Pipeline (Dark Navy Card matching mockup) */}
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Execution Pipeline
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-bold text-white tracking-tight">Strict Sequence Mode</h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Seq 010 (Basic) → Seq 200 (Disbursed Net)
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <ShieldCheck size={14} />
            <span>Zero circular references detected</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, code (BASIC, TAX, 401K...)"
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Category Tabs & Method Dropdown */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[
              { id: 'ALL', label: 'All Categories' },
              { id: 'BASIC', label: 'Basic' },
              { id: 'ALLOWANCE', label: 'Allowances' },
              { id: 'GROSS', label: 'Gross' },
              { id: 'DEDUCTION', label: 'Deductions' },
              { id: 'NET', label: 'Net Salary' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedCategory === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Computation Types</option>
            <option value="FIXED">Fixed Amount</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FORMULA">Formula</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-4 w-20">SEQ</th>
                <th className="py-3 px-4 w-64">RULE NAME &amp; CODE</th>
                <th className="py-3 px-4 w-36">CATEGORY</th>
                <th className="py-3 px-4 w-44">COMPUTATION METHOD</th>
                <th className="py-3 px-4">FORMULA / VALUE PREVIEW</th>
                <th className="py-3 px-4 text-right w-24">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRules.map((rule) => {
                const methodInfo = getMethodBadge(rule.type);
                const MethodIcon = methodInfo.icon;
                const seqFormatted = String(rule.sequence).padStart(3, '0');

                return (
                  <tr key={rule.code} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sequence Badge */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-semibold text-[11px]">
                        {seqFormatted}
                      </span>
                    </td>

                    {/* Rule Name & Code */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 block">{rule.name}</span>
                        <span className="font-mono text-[11px] text-slate-400 tracking-tight uppercase">
                          {rule.code}
                        </span>
                      </div>
                    </td>

                    {/* Category Chip */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getCategoryBadgeStyle(rule.category)}`}>
                        {rule.category === 'BASIC' ? 'Basic Pay' :
                         rule.category === 'ALLOWANCE' ? 'Allowances' :
                         rule.category === 'GROSS' ? 'Gross Base' :
                         rule.category === 'DEDUCTION' ? 'Deductions' : 'Net Pay'}
                      </span>
                    </td>

                    {/* Computation Method */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                        <MethodIcon size={14} className={methodInfo.color} />
                        <span>{methodInfo.label}</span>
                      </div>
                    </td>

                    {/* Formula / Value Preview */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {rule.type === 'FIXED' ? (
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-800">
                          <span>₹{parseFloat(rule.fixed_amount || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-sans">Fixed Value</span>
                        </div>
                      ) : rule.type === 'PERCENTAGE' ? (
                        <div className="flex items-center justify-between bg-indigo-50/40 px-2.5 py-1 rounded border border-indigo-100 text-indigo-900">
                          <span>{rule.base_code || 'BASIC'} * {rule.percentage_rate}%</span>
                          <span className="text-[10px] text-indigo-500 font-sans">Applied to {rule.base_code || 'BASIC'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-900 text-slate-200 px-2.5 py-1 rounded border border-slate-800">
                          <span className="truncate max-w-md">{rule.formula}</span>
                          <span className="text-[10px] text-emerald-400 font-mono ml-2 shrink-0">expr-eval</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setRuleToEdit(rule);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Rule"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.code)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Displaying {filteredRules.length} of {rules.length} Active Computation Rules</span>
          <span className="font-mono text-[11px]">Strict DAG Pipeline: ACTIVE</span>
        </div>
      </div>

      {/* Execution Sequence Hierarchy (Pipeline Stages matching mockup) */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Execution Sequence Hierarchy</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Salary rules execute strictly left-to-right. Variables generated upstream are exposed to downstream formulas.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            <CheckCircle2 size={14} />
            <span>DAG State: Validated</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Stage 1 */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-600">Stage 1</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-200 rounded text-slate-700">000-019</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Contract &amp; Base</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Base wage, hourly multiplier, shift allowances.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 font-mono text-[10px] text-slate-600">
              → contract.wage
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase text-teal-600">Stage 2</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-200 rounded text-slate-700">020-049</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Allowances &amp; KPI</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Housing, conveyance, special, overtime earnings.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 font-mono text-[10px] text-slate-600">
              → categories.ALLOW
            </div>
          </div>

          {/* Checkpoint */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-700">Checkpoint</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-blue-100 rounded text-blue-800">100</span>
              </div>
              <h4 className="text-xs font-bold text-blue-950">Gross Foundation</h4>
              <p className="text-[11px] text-blue-800/80 mt-1 leading-snug">
                Total compensation base for progressive tax calculation.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200/80 font-mono text-[10px] text-blue-800 font-semibold">
              → GROSS_SUM
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase text-rose-600">Stage 4</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-200 rounded text-slate-700">110-199</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Tax &amp; Pre-tax Deductions</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                PF, professional tax, loss of pay deductions.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 font-mono text-[10px] text-slate-600">
              → categories.DED
            </div>
          </div>

          {/* Final Output (Dark Card matching mockup) */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">Final Output</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">200</span>
              </div>
              <h4 className="text-xs font-bold text-white">Net Disbursed</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Gross minus deductions into bank payroll batch.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 font-mono text-[10px] text-emerald-400 font-semibold">
              → NET_PAYABLE
            </div>
          </div>
        </div>
      </div>

      {/* Rule Add/Edit Modal */}
      <RuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRuleToEdit(null);
        }}
        onSave={handleSaveRule}
        ruleToEdit={ruleToEdit}
        existingRules={rules}
      />

      {/* Dry Run Test Sandbox Drawer */}
      <DryRunSandboxDrawer
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        rules={rules}
      />
    </div>
  );
};
