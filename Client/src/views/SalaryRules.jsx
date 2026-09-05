import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  Calculator, 
  Layers, 
  Edit3, 
  Trash2, 
  X,
  Code2,
  HelpCircle
} from 'lucide-react';
import { payrollService } from '../services/payrollService';

export function SalaryRules() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStructureId = searchParams.get('structureId');

  const [structures, setStructures] = useState([]);
  const [selectedStructureId, setSelectedStructureId] = useState(initialStructureId || '');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Simulation inputs
  const [simInputs, setSimInputs] = useState({
    wage: 100000,
    scheduledDays: 22,
    workedDays: 22,
    unpaidLeaveDays: 0,
    overtimeHours: 10
  });
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    code: '',
    category: 'ALLOWANCE',
    sequence: 60,
    type: 'FORMULA',
    fixed_amount: '0.00',
    percentage_rate: '0.00',
    base_code: 'BASIC',
    formula: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Initial structures load
  useEffect(() => {
    loadStructures();
  }, []);

  // When selected structure changes, load its rules
  useEffect(() => {
    if (selectedStructureId) {
      loadRules(selectedStructureId);
    }
  }, [selectedStructureId]);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getStructures();
      setStructures(data || []);
      if (data && data.length > 0) {
        if (!selectedStructureId || !data.find(s => s.id === selectedStructureId)) {
          setSelectedStructureId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load structures:', err);
      setFeedback({ type: 'error', message: 'Could not load salary structures.' });
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async (structId) => {
    try {
      setRulesLoading(true);
      const data = await payrollService.getRules(structId);
      setRules(data || []);
      // Auto trigger initial simulation
      runSimulation(structId, simInputs);
    } catch (err) {
      console.error('Failed to load rules:', err);
      setFeedback({ type: 'error', message: 'Could not load rules for selected structure.' });
    } finally {
      setRulesLoading(false);
    }
  };

  const handleStructureChange = (e) => {
    const id = e.target.value;
    setSelectedStructureId(id);
    setSearchParams({ structureId: id });
  };

  const runSimulation = async (structId = selectedStructureId, inputs = simInputs) => {
    if (!structId) return;
    try {
      setSimLoading(true);
      const res = await payrollService.simulateCalculation({
        structureId: structId,
        wage: parseFloat(inputs.wage || 0),
        scheduledDays: parseFloat(inputs.scheduledDays || 22),
        workedDays: parseFloat(inputs.workedDays || 22),
        unpaidLeaveDays: parseFloat(inputs.unpaidLeaveDays || 0),
        overtimeHours: parseFloat(inputs.overtimeHours || 0)
      });
      setSimResult(res);
    } catch (err) {
      console.error('Error running simulation:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const openAddRuleModal = () => {
    setEditingRuleId(null);
    setRuleFormData({
      name: '',
      code: '',
      category: 'ALLOWANCE',
      sequence: 60,
      type: 'FORMULA',
      fixed_amount: '0.00',
      percentage_rate: '0.00',
      base_code: 'BASIC',
      formula: ''
    });
    setIsModalOpen(true);
  };

  const openEditRuleModal = (rule) => {
    setEditingRuleId(rule.id);
    setRuleFormData({
      name: rule.name,
      code: rule.code,
      category: rule.category,
      sequence: rule.sequence,
      type: rule.type,
      fixed_amount: rule.fixed_amount || '0.00',
      percentage_rate: rule.percentage_rate || '0.00',
      base_code: rule.base_code || 'BASIC',
      formula: rule.formula || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!ruleFormData.name || !ruleFormData.code) {
      setFeedback({ type: 'error', message: 'Rule Name and Code are required.' });
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingRuleId) {
        await payrollService.updateRule(editingRuleId, ruleFormData);
        setFeedback({ type: 'success', message: `Rule ${ruleFormData.code} updated successfully.` });
      } else {
        await payrollService.createRule(selectedStructureId, ruleFormData);
        setFeedback({ type: 'success', message: `Rule ${ruleFormData.code} added successfully.` });
      }
      setIsModalOpen(false);
      loadRules(selectedStructureId);
    } catch (err) {
      console.error('Error saving rule:', err);
      const errMsg = err.response?.data?.message || 'Failed to save salary rule.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId, code) => {
    if (!window.confirm(`Are you sure you want to delete rule '${code}'?`)) return;
    try {
      await payrollService.deleteRule(ruleId);
      setFeedback({ type: 'success', message: `Rule ${code} deleted.` });
      loadRules(selectedStructureId);
    } catch (err) {
      console.error('Failed to delete rule:', err);
      setFeedback({ type: 'error', message: 'Could not delete rule.' });
    }
  };

  const formatINR = (val) => {
    const num = parseFloat(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  const selectedStructure = structures.find(s => s.id === selectedStructureId);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8faff] p-6 lg:p-8 space-y-6">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium ${
          feedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Formula Engine & Kahn DAG
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Rules & Formula Sequence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure sequential mathematical rules (10 → 200) with real-time Kahn's topological sort cycle validation.
          </p>
        </div>

        {/* Structure Selector & Add Button */}
        <div className="flex items-center gap-3">
          <select
            value={selectedStructureId}
            onChange={handleStructureChange}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            {structures.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openAddRuleModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Rules Table on Left, Live Simulator on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Rules Table (8 cols) */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Rules Sequence for {selectedStructure?.name || 'Selected Structure'}</span>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedStructure?.code}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rules execute in strictly ascending sequence order. Kahn's algorithm validates acyclic dependencies.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {rules.length} Configured Rules
            </span>
          </div>

          {rulesLoading ? (
            <div className="flex items-center justify-center p-12">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-2" />
              <span className="text-sm text-slate-500">Loading rules...</span>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No rules configured for this structure yet. Click "Add Rule" to configure one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Seq</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Computation / Formula</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">{rule.sequence}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{rule.code}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{rule.name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          rule.category === 'BASIC'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : rule.category === 'ALLOWANCE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : rule.category === 'GROSS'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : rule.category === 'DEDUCTION'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {rule.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{rule.type}</td>
                      <td className="py-3 px-3">
                        {rule.type === 'FIXED' ? (
                          <span className="font-mono text-slate-900 font-bold">{formatINR(rule.fixed_amount)}</span>
                        ) : rule.type === 'PERCENTAGE' ? (
                          <span className="font-mono text-slate-700">
                            {rule.percentage_rate}% of <span className="font-bold text-indigo-600">{rule.base_code}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title={rule.formula}>
                            {rule.formula}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditRuleModal(rule)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit rule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id, rule.code)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Live Simulator Card (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Live Salary Simulator</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                INR Formula Evaluator
              </span>
            </div>

            {/* Parameter Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contract Wage (₹ / Month)</label>
                <input
                  type="number"
                  value={simInputs.wage}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSimInputs({ ...simInputs, wage: val });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Schedule Days</label>
                  <input
                    type="number"
                    value={simInputs.scheduledDays}
                    onChange={(e) => setSimInputs({ ...simInputs, scheduledDays: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Worked Days</label>
                  <input
                    type="number"
                    value={simInputs.workedDays}
                    onChange={(e) => setSimInputs({ ...simInputs, workedDays: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unpaid Leaves</label>
                  <input
                    type="number"
                    value={simInputs.unpaidLeaveDays}
                    onChange={(e) => setSimInputs({ ...simInputs, unpaidLeaveDays: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Overtime (Hours)</label>
                  <input
                    type="number"
                    value={simInputs.overtimeHours}
                    onChange={(e) => setSimInputs({ ...simInputs, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => runSimulation()}
                disabled={simLoading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs disabled:opacity-60 mt-2"
              >
                <Play className={`w-3.5 h-3.5 ${simLoading ? 'animate-spin' : ''}`} />
                <span>Run Engine Simulation</span>
              </button>
            </div>

            {/* Calculated Breakdown Display */}
            {simResult && (
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Basic Salary (10):</span>
                  <span className="font-mono font-bold text-slate-800">{formatINR(simResult.basic)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Gross Salary (100):</span>
                  <span className="font-mono font-bold text-slate-800">{formatINR(simResult.gross)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Deductions (140):</span>
                  <span className="font-mono font-bold text-rose-600">-{formatINR(simResult.deductions)}</span>
                </div>

                {/* Net Salary Highlight */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 mt-2">
                  <span className="font-bold">Calculated Net Salary:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700">
                    {formatINR(simResult.net_salary)}
                  </span>
                </div>

                {/* Detailed Line Breakdown Accordion */}
                <div className="mt-3 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evaluated Lines</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {simResult.lines?.map((l) => (
                      <div key={l.rule_code} className="flex items-center justify-between text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded">
                        <span className="font-mono font-semibold">{l.rule_code}</span>
                        <span className="font-mono">{formatINR(l.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingRuleId ? 'Edit Salary Rule' : 'Add New Salary Rule'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Allowance"
                    value={ruleFormData.name}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPECIAL"
                    value={ruleFormData.code}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={ruleFormData.category}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="ALLOWANCE">ALLOWANCE</option>
                    <option value="GROSS">GROSS</option>
                    <option value="DEDUCTION">DEDUCTION</option>
                    <option value="NET">NET</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sequence (10–200) *</label>
                  <input
                    type="number"
                    required
                    value={ruleFormData.sequence}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, sequence: parseInt(e.target.value, 10) || 10 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Computation Type *</label>
                <select
                  value={ruleFormData.type}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, type: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="FIXED">FIXED (Fixed Currency Amount)</option>
                  <option value="PERCENTAGE">PERCENTAGE (Percentage of Base Rule)</option>
                  <option value="FORMULA">FORMULA (Dynamic Math Expression)</option>
                </select>
              </div>

              {ruleFormData.type === 'FIXED' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fixed Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleFormData.fixed_amount}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, fixed_amount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              {ruleFormData.type === 'PERCENTAGE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Percentage Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ruleFormData.percentage_rate}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, percentage_rate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Base Rule Code</label>
                    <input
                      type="text"
                      placeholder="BASIC"
                      value={ruleFormData.base_code}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, base_code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              {ruleFormData.type === 'FORMULA' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Formula Expression</label>
                    <span className="text-[10px] text-slate-400">Context: CONTRACT_WAGE, WORKED_DAYS, etc.</span>
                  </div>
                  <textarea
                    rows="3"
                    value={ruleFormData.formula}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, formula: e.target.value })}
                    placeholder="e.g. BASIC + HRA + SPECIAL"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kahn's Topological Sort Validator will inspect this formula on submit to safeguard against circular loops.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold disabled:opacity-60"
                >
                  {formSubmitting ? 'Validating & Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default SalaryRules;
