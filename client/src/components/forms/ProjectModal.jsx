import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2 } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function ProjectModal({ isOpen, onClose, project, clients = [], divisions = [], onSuccess }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    divisionId: '',
    serviceCategory: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    expectedCompletionDate: '',
    agreedProjectValue: 0,
    paymentTerms: '',
    status: 'In Progress',
    internalNotes: '',
    milestones: [],
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        clientId: project.client?._id || project.client || '',
        divisionId: project.division?._id || project.division || '',
        serviceCategory: project.serviceCategory || '',
        description: project.description || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
        expectedCompletionDate: project.expectedCompletionDate
          ? new Date(project.expectedCompletionDate).toISOString().slice(0, 10)
          : '',
        agreedProjectValue: project.agreedProjectValue || 0,
        paymentTerms: project.paymentTerms || '',
        status: project.status || 'In Progress',
        internalNotes: project.internalNotes || '',
        milestones: project.milestones || [],
      });
    } else {
      setFormData({
        name: '',
        clientId: clients[0]?._id || '',
        divisionId: divisions[0]?._id || '',
        serviceCategory: '',
        description: '',
        startDate: new Date().toISOString().slice(0, 10),
        expectedCompletionDate: '',
        agreedProjectValue: 0,
        paymentTerms: '50% advance, balance on milestone completion.',
        status: 'In Progress',
        internalNotes: '',
        milestones: [
          { milestoneId: 'M-1', name: 'Project Advance', percentage: 50, amount: 0, status: 'Pending' },
          { milestoneId: 'M-2', name: 'Final Delivery & Handover', percentage: 50, amount: 0, status: 'Pending' },
        ],
      });
    }
  }, [project, isOpen, clients, divisions]);

  const handleAddMilestone = () => {
    const nextIdx = formData.milestones.length + 1;
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          milestoneId: `M-${nextIdx}`,
          name: `Milestone ${nextIdx}`,
          percentage: 0,
          amount: 0,
          status: 'Pending',
        },
      ],
    });
  };

  const handleRemoveMilestone = (index) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
  };

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...formData.milestones];
    updated[index][field] = value;

    if (field === 'percentage') {
      const val = Number(formData.agreedProjectValue) || 0;
      updated[index].amount = Math.round((val * Number(value)) / 100);
    } else if (field === 'amount') {
      const val = Number(formData.agreedProjectValue) || 0;
      if (val > 0) {
        updated[index].percentage = Math.round((Number(value) / val) * 100);
      }
    }

    setFormData({ ...formData, milestones: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.clientId || !formData.divisionId) {
      error('Project name, client, and division are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        clientId: formData.clientId,
        divisionId: formData.divisionId,
        serviceCategory: formData.serviceCategory.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        expectedCompletionDate: formData.expectedCompletionDate
          ? new Date(formData.expectedCompletionDate)
          : undefined,
        agreedProjectValue: Number(formData.agreedProjectValue) || 0,
        paymentTerms: formData.paymentTerms,
        status: formData.status,
        internalNotes: formData.internalNotes,
        milestones: formData.milestones,
      };

      if (project) {
        await api.put(`/projects/${project._id}`, payload);
        success('Project updated successfully.');
      } else {
        await api.post('/projects', payload);
        success('Project created successfully.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project Details' : 'Create New Project'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Radhika Sharma Luxury Wedding"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Client <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.clientId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Focsera Division <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.divisionId}
              onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="">Select Division</option>
              {divisions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Service Category</label>
            <input
              type="text"
              value={formData.serviceCategory}
              onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
              placeholder="e.g. Wedding Decor, Studios, Social Media"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Project Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="Enquiry">Enquiry</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Expected Completion</label>
            <input
              type="date"
              value={formData.expectedCompletionDate}
              onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#182333] mb-1">
              Total Agreed Project Value (INR ₹) <span className="text-[#B84B4B]">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.agreedProjectValue}
              onChange={(e) => setFormData({ ...formData, agreedProjectValue: Number(e.target.value) || 0 })}
              placeholder="e.g. 150000"
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] outline-none text-[#182333] font-financial font-bold text-base"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E7ED]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E7ED] text-[#697586] rounded-lg hover:bg-[#F4F7FA] font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[#52799D] hover:bg-[#233D5B] text-white rounded-lg font-medium text-xs shadow-subtle transition-colors"
          >
            {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

