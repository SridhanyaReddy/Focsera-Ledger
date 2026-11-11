import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api';
import { useToast } from '../../context/ToastContext';

export default function ClientModal({ isOpen, onClose, client, onSuccess }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    street: '',
    city: 'Hyderabad',
    state: 'Telangana',
    stateCode: '36',
    postalCode: '',
    gstin: '',
    clientType: 'Individual',
    notes: '',
    openingBalance: 0,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        businessName: client.businessName || '',
        phone: client.phone || '',
        email: client.email || '',
        street: client.billingAddress?.street || '',
        city: client.billingAddress?.city || 'Hyderabad',
        state: client.state || client.billingAddress?.state || 'Telangana',
        stateCode: client.stateCode || client.billingAddress?.stateCode || '36',
        postalCode: client.billingAddress?.postalCode || '',
        gstin: client.gstin || '',
        clientType: client.clientType || 'Individual',
        notes: client.notes || '',
        openingBalance: client.openingBalance || 0,
      });
    } else {
      setFormData({
        name: '',
        businessName: '',
        phone: '',
        email: '',
        street: '',
        city: 'Hyderabad',
        state: 'Telangana',
        stateCode: '36',
        postalCode: '',
        gstin: '',
        clientType: 'Individual',
        notes: '',
        openingBalance: 0,
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      error('Client name and phone number are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        businessName: formData.businessName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        billingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          stateCode: formData.stateCode,
          postalCode: formData.postalCode,
          country: 'India',
        },
        gstin: formData.gstin.trim(),
        state: formData.state,
        stateCode: formData.stateCode,
        clientType: formData.clientType,
        notes: formData.notes,
        openingBalance: Number(formData.openingBalance) || 0,
      };

      if (client) {
        await api.put(`/clients/${client._id}`, payload);
        success('Client updated successfully.');
      } else {
        await api.post('/clients', payload);
        success('Client created successfully.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save client.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Edit Client Details' : 'Add New Client'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Radhika Sharma"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Company / Business Name</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="e.g. Sharma Luxe Living"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. radhika@example.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Client Type</label>
            <select
              value={formData.clientType}
              onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
              <option value="Institution">Institution</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">GSTIN (Optional)</label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              placeholder="e.g. 36AABCS1429B1ZB"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">Street Address</label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="e.g. Road No. 36, Jubilee Hills"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">State & Code</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Telangana"
                className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
              />
              <input
                type="text"
                value={formData.stateCode}
                onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                placeholder="36"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 text-center font-mono"
              />
            </div>
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
            {loading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

