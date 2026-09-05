import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Plus, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Layers, 
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { payrollService } from '../services/payrollService';

export function SalaryStructures() {
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', is_active: true });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadStructures();
  }, []);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getStructures();
      setStructures(data || []);
    } catch (err) {
      console.error('Failed to load salary structures:', err);
      setFeedback({ type: 'error', message: 'Failed to fetch salary structures.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setFeedback({ type: 'error', message: 'Please provide both Structure Name and Code.' });
      return;
    }

    try {
      setFormSubmitting(true);
      await payrollService.createStructure(formData);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', is_active: true });
      setFeedback({ type: 'success', message: 'Salary Structure created successfully.' });
      loadStructures();
    } catch (err) {
      console.error('Error creating structure:', err);
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to create salary structure.' 
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredStructures = structures.filter((s) => {
    const q = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8faff] p-6 lg:p-8 space-y-6">
      
      {/* Header Notification Feedback */}
      {feedback && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium ${
          feedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
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
              <Sliders className="w-3.5 h-3.5" /> Phase 6 Configuration
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Structures</h1>
          <p className="text-sm text-slate-500 mt-1">
            Standard compensation framework definitions and formula sequencing matrices for Indian operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Structure</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search structure by name, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredStructures.length}</span> of {structures.length} structures
        </div>
      </div>

      {/* Grid of Salary Structures */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-2" />
          <span className="text-sm text-slate-600">Loading structures...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStructures.map((structure) => (
            <div
              key={structure.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {structure.code}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    structure.is_active 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${structure.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {structure.is_active ? 'Active' : 'Archived'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight">{structure.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Indian standard compensation structure incorporating Basic, HRA, Conveyance, PF, PT, and Net rules.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Salary Rules</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      {structure.rule_count || 0} Rules
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Contracts</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      {structure.active_contracts_count || 0} Contracts
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/payroll/rules?structureId=${structure.id}`)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors border border-slate-200"
                >
                  <span>Configure Rules Sequence</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Salary Structure</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Structure Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Tech India"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code / Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXEC_TECH_IN"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-700">
                  Set as Active Immediately
                </label>
              </div>

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
                  {formSubmitting ? 'Creating...' : 'Create Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default SalaryStructures;
