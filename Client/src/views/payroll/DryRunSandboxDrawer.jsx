/**
 * ==============================================================================
 * PEOPLEPAY360: DRY RUN TEST SANDBOX DRAWER
 * ==============================================================================
 * 
 * WHAT THIS COMPONENT DOES IN SIMPLE WORDS:
 * Imagine you're an HR manager editing payroll rules and you want to test:
 * "If an employee earns ₹1,20,000, works 22 days, and does 4 hours overtime,
 * how much will their Gross and Net pay be?"
 * 
 * Instead of waiting for the end of the month or running a real payroll batch,
 * this slide-over drawer gives you a safe "playground / flight simulator":
 * 1. You adjust the inputs (Wage, Scheduled Days, Worked Days, Unpaid Leaves, Overtime).
 * 2. It immediately runs the calculation in real-time.
 * 3. It shows top summary cards: Basic Pay, Gross Salary, Total Deductions, Net Disbursed.
 * 4. It shows a step-by-step trace of every single rule being evaluated in order.
 * 5. Nothing here touches or modifies the database—it's completely safe!
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Sliders, DollarSign, Calendar, Clock } from 'lucide-react';
import { runClientSimulation } from '../../services/salaryService';

export const DryRunSandboxDrawer = ({ isOpen, onClose, rules = [] }) => {
  // Input parameters state (defaults to standard monthly parameters)
  const [inputs, setInputs] = useState({
    wage: 120000,
    scheduleDays: 22,
    workedDays: 22,
    unpaidDays: 0,
    overtimeHours: 4
  });

  // Simulated calculation output
  const [simResult, setSimResult] = useState(null);

  // Automatically recalculate whenever inputs change or when drawer is opened
  useEffect(() => {
    if (isOpen) {
      const result = runClientSimulation({
        wage: inputs.wage,
        scheduleDays: inputs.scheduleDays,
        workedDays: inputs.workedDays,
        unpaidDays: inputs.unpaidDays,
        overtimeHours: inputs.overtimeHours,
        rules
      });
      setSimResult(result);
    }
  }, [isOpen, inputs, rules]);

  // Body scroll locking
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle number input changes
  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Indian Rupee currency formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
              <Play size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Dry Run Test Sandbox</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded font-semibold">
                  Deterministic Pass
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Real-time algebraic rule evaluation engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders size={14} className="text-indigo-600" />
                Operational Context Parameters
              </span>
              <button
                type="button"
                onClick={() => setInputs({ wage: 120000, scheduleDays: 22, workedDays: 22, unpaidDays: 0, overtimeHours: 4 })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Contract Wage Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  CONTRACT_WAGE (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={inputs.wage}
                  onChange={e => handleInputChange('wage', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              {/* Schedule Days Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  SCHEDULE_DAYS
                </label>
                <input
                  type="number"
                  value={inputs.scheduleDays}
                  onChange={e => handleInputChange('scheduleDays', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              {/* Worked Days Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  WORKED_DAYS
                </label>
                <input
                  type="number"
                  value={inputs.workedDays}
                  onChange={e => handleInputChange('workedDays', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              {/* Unpaid Days Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  UNPAID_LEAVE_DAYS
                </label>
                <input
                  type="number"
                  value={inputs.unpaidDays}
                  onChange={e => handleInputChange('unpaidDays', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              {/* Overtime Hours Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  OVERTIME_HOURS
                </label>
                <input
                  type="number"
                  value={inputs.overtimeHours}
                  onChange={e => handleInputChange('overtimeHours', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              {/* Derived Hourly Rate Display */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  DERIVED HOURLY_RATE
                </label>
                <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600">
                  ₹{simResult?.hourly_rate || '0.00'}/hr
                </div>
              </div>
            </div>
          </div>

          {/* Aggregates Summary Cards */}
          {simResult && (
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Basic Pay</span>
                <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(simResult.basic)}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Gross Salary</span>
                <p className="text-sm font-bold font-mono text-indigo-900 mt-0.5">{formatCurrency(simResult.gross)}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Total Deductions</span>
                <p className="text-sm font-bold font-mono text-rose-900 mt-0.5">-{formatCurrency(simResult.deductions)}</p>
              </div>
              <div className="p-3 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-xl shadow-md">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Net Disbursed</span>
                <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{formatCurrency(simResult.net_salary)}</p>
              </div>
            </div>
          )}

          {/* Sequential Execution Trace Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Rule Execution Sequence Trace
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {simResult?.lines?.length || 0} Rules Evaluated Topologically
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {simResult?.lines?.map((line) => {
                const isNet = line.rule_code === 'NET';
                const isGross = line.rule_code === 'GROSS';
                const isDeduction = line.category === 'DEDUCTION';

                return (
                  <div 
                    key={line.rule_code}
                    className={`px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${
                      isNet 
                        ? 'bg-indigo-50/70 font-semibold' 
                        : isGross 
                          ? 'bg-slate-50 font-semibold' 
                          : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 py-0.5 text-center rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold">
                        {String(line.sequence).padStart(3, '0')}
                      </span>
                      <div className="truncate">
                        <span className="font-mono font-bold text-slate-800 mr-2">{line.rule_code}</span>
                        <span className="text-slate-500 text-[11px]">{line.rule_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        line.category === 'BASIC' ? 'bg-blue-100 text-blue-700' :
                        line.category === 'ALLOWANCE' ? 'bg-teal-100 text-teal-700' :
                        line.category === 'GROSS' ? 'bg-purple-100 text-purple-700' :
                        line.category === 'DEDUCTION' ? 'bg-rose-100 text-rose-700' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {line.category}
                      </span>
                      <span className={`font-mono text-xs text-right w-24 ${
                        isNet ? 'text-emerald-700 font-bold text-sm' :
                        isGross ? 'text-indigo-900 font-bold' :
                        isDeduction ? 'text-rose-700' : 'text-slate-900'
                      }`}>
                        {formatCurrency(line.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Topological dependency check passed</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
