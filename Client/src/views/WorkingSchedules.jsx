import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  AlertCircle, 
  X, 
  Check, 
  RefreshCw,
  Sun
} from 'lucide-react';
import contractService from '../services/contractService';
import { Modal } from '../components/Modal';

export const WorkingSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    weekly_hours: 40.00,
    lines: [
      { day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
      { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
      { day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
      { day_of_week: 4, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
      { day_of_week: 5, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 }
    ]
  });

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractService.getSchedules();
      setSchedules(data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setError(err.response?.data?.message || 'Failed to fetch working schedules.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = async (s) => {
    try {
      const details = await contractService.getSchedule(s.id);
      setSelectedSchedule(details);
      setFormData({
        name: details.name,
        weekly_hours: details.weekly_hours,
        lines: details.lines?.length > 0 ? details.lines : [
          { day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
          { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
          { day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
          { day_of_week: 4, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
          { day_of_week: 5, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 }
        ]
      });
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load schedule details');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (selectedSchedule) {
        await contractService.updateSchedule(selectedSchedule.id, formData);
      } else {
        await contractService.createSchedule(formData);
      }
      await loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save working schedule.');
    } finally {
      setIsModalOpen(false);
      setSelectedSchedule(null);
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this working schedule?')) return;
    try {
      await contractService.deleteSchedule(id);
      await loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule.');
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Working Schedules</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure shift timings, weekly baseline hours, and automated overtime derivation rules.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSchedule(null);
            setFormData({
              name: '',
              weekly_hours: 40.00,
              lines: [
                { day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
                { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
                { day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
                { day_of_week: 4, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 },
                { day_of_week: 5, start_time: '09:00:00', end_time: '18:00:00', break_hours: 1.00 }
              ]
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Working Schedule</span>
        </button>
      </div>

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

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
            <span>Loading schedules...</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            No working schedules configured.
          </div>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-blue-600" />
                        <strong>{parseFloat(s.weekly_hours).toFixed(1)} hrs</strong> / week
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-slate-400" />
                        {s.assigned_employees_count} employees assigned
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-50 transition"
                      title="Edit Schedule"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                      title="Delete Schedule"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Weekly Standard Schedule
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dIdx) => (
                      <div key={day} className="bg-white p-1.5 rounded border border-slate-200/80">
                        <span className="font-bold text-slate-700 block text-[10px]">{day}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">9:00 - 18:00</span>
                        <span className="text-[9px] text-slate-400 block">(1h break)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Overtime threshold: Daily &gt; 8.0 hrs</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedSchedule(null); }}
        title={selectedSchedule ? 'Edit Working Schedule' : 'Create Working Schedule'}
        subtitle="Set baseline hours and shift timings for automated overtime calculations."
        maxWidth="max-w-lg"
        preventClose={submitting}
      >
        <form onSubmit={handleSaveSchedule} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Schedule Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Standard 40h Work Schedule"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Weekly Target Hours *
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={formData.weekly_hours}
              onChange={(e) => setFormData({ ...formData, weekly_hours: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setSelectedSchedule(null); }}
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
              {submitting ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkingSchedules;
