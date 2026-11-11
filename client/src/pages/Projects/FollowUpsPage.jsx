import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  Briefcase,
  Users,
  Calendar,
  Trash2,
} from 'lucide-react';
import api from '../../api';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function FollowUpsPage() {
  const { success, error } = useToast();
  const [followUps, setFollowUps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [projectFilter, setProjectFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    project: '',
    meetingDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [projectFilter]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.success) {
        setProjects(res.data.data);
        if (res.data.data.length > 0 && !formData.project) {
          setFormData((prev) => ({ ...prev, project: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const pParam = projectFilter !== 'all' ? `&project=${projectFilter}` : '';
      const sParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/followups?${pParam}${sParam}`);
      if (res.data.success) {
        setFollowUps(res.data.data);
      }
    } catch (err) {
      error('Failed to load project follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFollowUps();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project || !formData.notes.trim()) {
      return error('Project and Notes are required.');
    }
    setSaving(true);
    try {
      const payload = {
        project: formData.project,
        title: 'Project Discussion & Followup',
        meetingDate: formData.meetingDate,
        notes: formData.notes.trim(),
      };

      const res = await api.post('/followups', payload);
      if (res.data.success) {
        success('Follow-up recorded');
        setIsModalOpen(false);
        setFormData({
          project: projects[0]?._id || '',
          meetingDate: new Date().toISOString().slice(0, 10),
          notes: '',
        });
        fetchFollowUps();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save follow-up');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this follow-up entry?')) return;
    try {
      const res = await api.delete(`/followups/${id}`);
      if (res.data.success) {
        success('Follow-up deleted');
        fetchFollowUps();
      }
    } catch (err) {
      error('Failed to remove follow-up');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#182333] tracking-tight">Follow-ups</h1>
          <p className="text-xs font-sans text-[#697586] mt-0.5">
            Client name, project name, date of discussion, and meeting points
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#52799D] hover:bg-[#233D5B] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Follow-up</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#697586] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussion points, project..."
            className="w-full pl-10 pr-4 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] text-xs font-sans outline-none text-[#182333] transition-all"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.client?.name ? `${p.client.name} — ` : ''}{p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clean Follow-ups Cards: Client, Project, Date, and Points */}
      <div className="space-y-3">
        {followUps.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-lg border border-[#E2E7ED] p-4 shadow-subtle hover:border-[#DCE7F0] transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E2E7ED]">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                {/* Client Name */}
                <div className="flex items-center gap-1.5 font-semibold text-[#182333]">
                  <Users className="w-3.5 h-3.5 text-[#52799D]" />
                  <span>{item.client?.name || item.project?.client?.name || 'Client'}</span>
                </div>

                <span className="text-[#E2E7ED]">•</span>

                {/* Project Name */}
                <div className="flex items-center gap-1.5 font-medium text-[#233D5B]">
                  <Briefcase className="w-3.5 h-3.5 text-[#697586]" />
                  <span>{item.project?.name}</span>
                </div>
              </div>

              {/* Date & Actions */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-financial text-xs text-[#697586] bg-[#F4F7FA] px-2 py-0.5 rounded border border-[#E2E7ED]">
                  <Calendar className="w-3.5 h-3.5 text-[#52799D]" />
                  {formatDate(item.meetingDate)}
                </span>
                <button
                  onClick={(e) => handleDelete(item._id, e)}
                  className="p-1 text-[#697586] hover:text-[#B84B4B] hover:bg-[#FDEFEF] rounded transition-colors"
                  title="Delete follow-up"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Follow-up Notes / Discussion Points */}
            <div className="mt-2.5 text-xs text-[#182333] leading-relaxed whitespace-pre-wrap font-sans">
              {item.notes}
            </div>
          </div>
        ))}

        {followUps.length === 0 && !loading && (
          <EmptyState
            icon={CalendarClock}
            title="No Follow-ups Logged"
            description="Record client discussions, meeting dates, and project points here."
          />
        )}
      </div>

      {/* Add Follow-up Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Follow-up"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#182333] mb-1 font-sans">
              Client & Project <span className="text-[#B84B4B]">*</span>
            </label>
            <select
              required
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.client?.name ? `${p.client.name} — ` : ''}{p.name} ({p.projectId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#182333] mb-1 font-sans">
              Date <span className="text-[#B84B4B]">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.meetingDate}
              onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-financial text-[#182333] outline-none focus:border-[#52799D]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#182333] mb-1 font-sans">
              Notes & Discussion Points <span className="text-[#B84B4B]">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter discussion points, client updates, agreements, or meeting notes..."
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E7ED]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#F4F7FA] hover:bg-[#EEF4F8] text-[#697586] text-xs font-medium font-sans rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#52799D] hover:bg-[#233D5B] text-white text-xs font-medium font-sans rounded-lg transition-colors shadow-subtle disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
