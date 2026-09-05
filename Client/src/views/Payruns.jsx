import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  ArrowRight, 
  FileSpreadsheet, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  X,
  Eye,
  Sliders
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { payrollService } from '../services/payrollService';

export function Payruns() {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [computingId, setComputingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayrunDetails, setSelectedPayrunDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // New payrun form state
  const [formData, setFormData] = useState({
    name: '',
    structure_id: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payrunsData, structuresData] = await Promise.all([
        payrollService.getPayruns(),
        payrollService.getStructures()
      ]);
      setPayruns(payrunsData || []);
      setStructures(structuresData || []);
      if (structuresData && structuresData.length > 0 && !formData.structure_id) {
        setFormData(prev => ({ ...prev, structure_id: structuresData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load payrun data:', err);
      setFeedback({ type: 'error', message: 'Could not load payruns list.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompute = async (payrunId) => {
    try {
      setComputingId(payrunId);
      const res = await payrollService.computePayrun(payrunId);
      setFeedback({ 
        type: 'success', 
        message: res.message || 'Calculation engine evaluated payslips successfully.' 
      });
      loadData();
    } catch (err) {
      console.error('Computation error:', err);
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || 'Calculation engine execution failed.' 
      });
    } finally {
      setComputingId(null);
    }
  };

  const handleViewDetails = async (payrunId) => {
    try {
      setDetailsLoading(true);
      const details = await payrollService.getPayrun(payrunId);
      setSelectedPayrunDetails(details);
    } catch (err) {
      console.error('Failed to load payrun details:', err);
      setFeedback({ type: 'error', message: 'Could not load payrun details.' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreatePayrun = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.structure_id) {
      setFeedback({ type: 'error', message: 'Please provide batch name and salary structure.' });
      return;
    }

    try {
      setSubmitting(true);
      await payrollService.createPayrun(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        structure_id: structures[0]?.id || '',
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      });
      setFeedback({ type: 'success', message: 'Payrun batch created in DRAFT status.' });
      loadData();
    } catch (err) {
      console.error('Failed to create payrun:', err);
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to create payrun batch.' 
      });
    } finally {
      setSubmitting(false);
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

  const filteredPayruns = payruns.filter(p => {
    const q = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.structure_name && p.structure_name.toLowerCase().includes(q));
  });

  const totalDisbursedAll = payruns.reduce((acc, curr) => acc + parseFloat(curr.total_net || 0), 0);
  const totalPayslipsAll = payruns.reduce((acc, curr) => acc + (curr.payslip_count || 0), 0);

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

      {/* Top Banner Linking to Control Center */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PCC Risk Telemetry Active
            </span>
            <span className="text-xs text-slate-300">Indian Operations (₹ / INR)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Looking for the Risk Cockpit & Governance Telemetry?</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Audit executive risk scores, monitor departmental Q4 budget variances, and resolve compliance blockers in the Payroll Control Center.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/payroll/control')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Control Center</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/payroll/structures')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/10"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Structures & Rules</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" /> Payroll / Payruns Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payruns & Batch Processing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate candidate payslips, execute calculation rules, and disburse compensation batches.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Payrun</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Batches</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{payruns.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Managed payruns</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Disbursed (Net)</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(totalDisbursedAll)}</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">Computed in INR</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Payslips</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{totalPayslipsAll}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Generated records</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Engine Status</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" /> Active
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Phase 6 Engine Online</span>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search payrun batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredPayruns.length}</span> batches
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-2" />
            <span className="text-sm text-slate-600">Loading payruns...</span>
          </div>
        ) : filteredPayruns.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No payrun batches found. Click "New Payrun" to create a payroll cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Payrun Batch Name</th>
                  <th className="py-3 px-4">Salary Structure</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Headcount</th>
                  <th className="py-3 px-4">Total Net (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayruns.map((payrun) => (
                  <tr key={payrun.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{payrun.name}</div>
                      <span className="text-[11px] text-slate-400 font-mono">{payrun.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-medium">{payrun.structure_name || 'Standard'}</span>
                      <span className="block font-mono text-[10px] text-slate-400">{payrun.structure_code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(payrun.period_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} –{' '}
                      {new Date(payrun.period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {payrun.payslip_count} Employees
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatINR(payrun.total_net)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        payrun.status === 'COMPUTED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : payrun.status === 'VALIDATED'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : payrun.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          payrun.status === 'PAID' ? 'bg-emerald-500' : payrun.status === 'COMPUTED' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></span>
                        {payrun.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCompute(payrun.id)}
                          disabled={computingId === payrun.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 shadow-2xs"
                        >
                          <Play className={`w-3 h-3 ${computingId === payrun.id ? 'animate-spin' : ''}`} />
                          <span>{payrun.status === 'DRAFT' ? 'Compute' : 'Recompute'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewDetails(payrun.id)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="View Payslips"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Payrun Payslips Modal */}
      {selectedPayrunDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPayrunDetails.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Structure: {selectedPayrunDetails.structure_name} • Status: {selectedPayrunDetails.status}
                </p>
              </div>
              <button onClick={() => setSelectedPayrunDetails(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Generated Employee Payslips ({selectedPayrunDetails.payslips?.length || 0})
              </div>

              <div className="space-y-3">
                {selectedPayrunDetails.payslips?.map((slip) => (
                  <div key={slip.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-900">
                          {slip.first_name} {slip.last_name}
                        </span>
                        <span className="text-xs font-mono text-slate-400 ml-2">({slip.employee_code})</span>
                        <span className="text-xs text-slate-500 block">{slip.department} • {slip.job_position}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Net Disbursed</span>
                        <span className="text-base font-extrabold font-mono text-emerald-700">
                          {formatINR(slip.net_salary)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                      <div>
                        <span className="text-slate-400">Basic:</span>{' '}
                        <span className="font-mono font-semibold text-slate-700">{formatINR(slip.basic)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Gross:</span>{' '}
                        <span className="font-mono font-semibold text-slate-700">{formatINR(slip.gross)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Deductions:</span>{' '}
                        <span className="font-mono font-semibold text-rose-600">-{formatINR(slip.deductions)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayrunDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Payrun Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Payrun Batch</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayrun} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payrun Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PR-2024-12-M • December 2024 Regular"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salary Structure *</label>
                <select
                  required
                  value={formData.structure_id}
                  onChange={(e) => setFormData({ ...formData, structure_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period Start</label>
                  <input
                    type="date"
                    required
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period End</label>
                  <input
                    type="date"
                    required
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
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
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Payruns;
