/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY RULE EDITOR MODAL
 * ==============================================================================
 * 
 * WHAT THIS COMPONENT DOES IN SIMPLE WORDS:
 * This popup dialog lets users create a brand new salary rule or edit an existing one.
 * 
 * Features:
 * 1. Automatically suggests the next logical sequence number (e.g. 10, 20, 30...).
 * 2. Provides three Computation Methods:
 *    - FIXED: Flat amount (e.g. ₹3,000 allowance).
 *    - PERCENTAGE: Percentage of another rule (e.g. 40% of BASIC).
 *    - FORMULA: Dynamic algebraic formula with expr-eval.
 * 3. Interactive Context Chips:
 *    Users can click buttons like "+CONTRACT_WAGE" or "+WORKED_DAYS" to insert variables
 *    directly into the formula box without typing errors!
 * 4. Client-side Circular Reference Guard:
 *    Prevents an immediate cycle if the user tries to reference the rule inside its own formula.
 */

import React, { useState, useEffect } from 'react';
import { X, HelpCircle, AlertTriangle, CheckCircle, Code, DollarSign, Percent, Calculator } from 'lucide-react';
import { Modal } from '../../components/Modal';

// Context variables provided by the backend engine
const CONTEXT_VARS = [
  { name: 'CONTRACT_WAGE', desc: 'Agreed monthly compensation from active contract' },
  { name: 'SCHEDULE_DAYS', desc: 'Standard expected working days in period (e.g. 22)' },
  { name: 'WORKED_DAYS', desc: 'Actual days clocked in or approved paid leaves' },
  { name: 'UNPAID_LEAVE_DAYS', desc: 'Unpaid leaves / Loss of Pay duration' },
  { name: 'OVERTIME_HOURS', desc: 'Accumulated daily overtime beyond schedule' },
  { name: 'HOURLY_RATE', desc: 'Wage divided by standard scheduled hours' }
];

export const RuleModal = ({ isOpen, onClose, onSave, ruleToEdit, existingRules = [] }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ALLOWANCE',
    sequence: 35,
    type: 'FORMULA',
    fixed_amount: 0,
    percentage_rate: 10,
    base_code: 'BASIC',
    formula: ''
  });

  const [validationError, setValidationError] = useState('');

  // Pre-fill form when editing, or reset when opening a new rule
  useEffect(() => {
    if (ruleToEdit) {
      setFormData({
        ...ruleToEdit,
        sequence: ruleToEdit.sequence || 35,
        fixed_amount: ruleToEdit.fixed_amount || 0,
        percentage_rate: ruleToEdit.percentage_rate || 0,
        base_code: ruleToEdit.base_code || 'BASIC',
        formula: ruleToEdit.formula || ''
      });
    } else {
      // Suggest next sequence number
      const maxSeq = existingRules.length > 0 ? Math.max(...existingRules.map(r => r.sequence)) : 0;
      setFormData({
        code: '',
        name: '',
        category: 'ALLOWANCE',
        sequence: maxSeq + 10,
        type: 'FORMULA',
        fixed_amount: 0,
        percentage_rate: 10,
        base_code: existingRules[0]?.code || 'BASIC',
        formula: ''
      });
    }
    setValidationError('');
  }, [ruleToEdit, existingRules, isOpen]);

  if (!isOpen) return null;

  // Filter rules that execute strictly before this rule
  const precedingRules = existingRules.filter(
    r => r.sequence < formData.sequence && (!ruleToEdit || r.code !== ruleToEdit.code)
  );

  // Helper: insert variable or token into formula textarea
  const handleInsertToken = (token) => {
    setFormData(prev => ({
      ...prev,
      formula: prev.formula ? `${prev.formula} ${token}` : token
    }));
  };

  // Submit and validate form inputs
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.code.trim() || !formData.name.trim()) {
      setValidationError('Rule Code and Rule Name are required.');
      return;
    }

    if (formData.type === 'PERCENTAGE' && !formData.base_code) {
      setValidationError('Please select a base rule code for percentage calculation.');
      return;
    }

    if (formData.type === 'FORMULA' && !formData.formula.trim()) {
      setValidationError('Please enter a formula expression.');
      return;
    }

    // Check circular references: formula cannot reference self
    if (formData.type === 'FORMULA' && formData.formula.includes(formData.code.trim().toUpperCase())) {
      setValidationError(`Circular reference: Formula cannot reference its own rule code '${formData.code}'.`);
      return;
    }

    onSave({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      sequence: parseInt(formData.sequence, 10),
      fixed_amount: parseFloat(formData.fixed_amount || 0),
      percentage_rate: parseFloat(formData.percentage_rate || 0)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      customHeader={
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-400 font-semibold">
              PAYROLL ENGINE // DAG COMPILER
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              {ruleToEdit ? `Edit Rule: ${ruleToEdit.code}` : 'Add Salary Computation Rule'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
      }
    >
      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs font-medium">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Row 1: Code, Name, Sequence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Sequence Order *
              </label>
              <input
                type="number"
                value={formData.sequence}
                onChange={e => setFormData({ ...formData, sequence: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                placeholder="10, 20, 35..."
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Order in execution pipeline</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Rule Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-semibold uppercase text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                placeholder="BONUS_KPI"
                disabled={!!ruleToEdit}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Unique variable identifier</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none font-medium"
              >
                <option value="BASIC">Basic Pay</option>
                <option value="ALLOWANCE">Allowance</option>
                <option value="GROSS">Gross Base</option>
                <option value="DEDUCTION">Deduction</option>
                <option value="NET">Net Pay</option>
              </select>
            </div>
          </div>

          {/* Row 2: Human Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Rule Display Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              placeholder="e.g. Quarterly Performance Incentive"
              required
            />
          </div>

          {/* Row 3: Computation Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Computation Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'FIXED', label: 'Fixed Amount', icon: DollarSign, desc: 'Constant currency value' },
                { type: 'PERCENTAGE', label: 'Percentage (%)', icon: Percent, desc: 'Ratio applied to base code' },
                { type: 'FORMULA', label: 'Python / Math Formula', icon: Calculator, desc: 'Dynamic algebraic expression' }
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = formData.type === opt.type;
                return (
                  <button
                    type="button"
                    key={opt.type}
                    onClick={() => setFormData({ ...formData, type: opt.type })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 text-indigo-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Field: FIXED AMOUNT */}
          {formData.type === 'FIXED' && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Fixed Currency Amount (₹ / $)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fixed_amount}
                  onChange={e => setFormData({ ...formData, fixed_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="3000.00"
                />
              </div>
            </div>
          )}

          {/* Conditional Field: PERCENTAGE */}
          {formData.type === 'PERCENTAGE' && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Percentage Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.percentage_rate}
                    onChange={e => setFormData({ ...formData, percentage_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                    placeholder="40.00"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 font-mono text-sm">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Base Rule Code
                </label>
                <select
                  value={formData.base_code}
                  onChange={e => setFormData({ ...formData, base_code: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                >
                  <option value="BASIC">BASIC (Basic Salary)</option>
                  <option value="GROSS">GROSS (Gross Salary)</option>
                  {precedingRules
                    .filter(r => r.code !== 'BASIC' && r.code !== 'GROSS')
                    .map(r => (
                      <option key={r.code} value={r.code}>
                        {r.code} ({r.name})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Conditional Field: FORMULA */}
          {formData.type === 'FORMULA' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Formula Expression
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Standard math operators (+, -, *, /, ?, :)</span>
              </div>

              <textarea
                rows={3}
                value={formData.formula}
                onChange={e => setFormData({ ...formData, formula: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none leading-relaxed"
                placeholder="e.g. (CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)"
              />

              {/* Clickable Context Tokens */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Insert Context Variables:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CONTEXT_VARS.map(v => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => handleInsertToken(v.name)}
                      title={v.desc}
                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-mono transition-colors"
                    >
                      +{v.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preceding Rules Tokens */}
              {precedingRules.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Insert Upstream Rule Values (Seq &lt; {formData.sequence}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {precedingRules.map(r => (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => handleInsertToken(r.code)}
                        title={`Seq ${r.sequence}: ${r.name}`}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-mono transition-colors"
                      >
                        +{r.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle size={14} />
              <span>{ruleToEdit ? 'Update Rule' : 'Save Rule to Pipeline'}</span>
            </button>
          </div>
        </form>
    </Modal>
  );
};
