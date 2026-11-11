import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Filter, Edit2, Tag } from 'lucide-react';
import api from '../../api';
import Modal from '../../components/common/Modal';
import { formatINR } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function ServicesPage() {
  const { success, error } = useToast();
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');

  // Filters
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');

  // Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    divisionId: '',
    category: '',
    description: '',
    defaultRate: '',
    unitType: 'service',
    taxPercentage: 18,
    notes: '',
  });

  useEffect(() => {
    fetchDivisions();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [divisionFilter]);

  const fetchDivisions = async () => {
    try {
      const res = await api.get('/divisions');
      if (res.data.success) {
        setDivisions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching divisions:', err);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const sRes = await api.get(`/services?division=${divisionFilter}&search=${encodeURIComponent(search)}`);
      if (sRes.data.success) setServices(sRes.data.data);
    } catch (err) {
      error('Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (srv = null) => {
    if (srv) {
      setSelectedService(srv);
      setFormData({
        name: srv.name,
        divisionId: srv.division?._id || srv.division || '',
        category: srv.category,
        description: srv.description || '',
        defaultRate: srv.defaultRate || '',
        unitType: srv.unitType || 'service',
        taxPercentage: srv.taxPercentage || 18,
        notes: srv.notes || '',
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        divisionId: divisions[0]?._id || '',
        category: '',
        description: '',
        defaultRate: '',
        unitType: 'service',
        taxPercentage: 18,
        notes: '',
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.divisionId || !formData.category.trim()) {
      error('Name, division, and category are required.');
      return;
    }

    try {
      if (selectedService) {
        await api.put(`/services/${selectedService._id}`, formData);
        success('Service template updated.');
      } else {
        await api.post('/services', formData);
        success('Service template created.');
      }
      setIsServiceModalOpen(false);
      fetchServices();
    } catch (err) {
      error('Failed to save service.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#182333] tracking-tight">Services</h1>
          <p className="text-xs font-sans text-[#697586] mt-0.5">
            Predefined service library & subcategories across Focsera divisions
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#52799D] hover:bg-[#233D5B] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium font-sans text-[#182333]">
            Active Catalog ({services.length} services across {divisions.length} divisions)
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none w-full sm:w-auto"
          >
            <option value="all">All Divisions (9)</option>
            {divisions.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compact Multi-Column Grid of Division Cards */}
      {(() => {
        // Group services by Division
        const groups = {};
        services.forEach((srv) => {
          const divName = srv.division?.name || 'General Corporate Services';
          const divCategory = srv.division?.category || '';
          if (!groups[divName]) {
            groups[divName] = {
              divisionName: divName,
              divisionCategory: divCategory,
              subcategories: {},
            };
          }

          const subcat = srv.category || 'General';
          if (!groups[divName].subcategories[subcat]) {
            groups[divName].subcategories[subcat] = [];
          }
          groups[divName].subcategories[subcat].push(srv);
        });

        const divisionKeys = Object.keys(groups);

        if (divisionKeys.length === 0 && !loading) {
          return (
            <div className="bg-white rounded-lg border border-[#E2E7ED] p-8 text-center text-xs text-[#697586] font-sans">
              No services found for the selected division filter.
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {divisionKeys.map((divName) => {
              const grp = groups[divName];
              const subcatKeys = Object.keys(grp.subcategories);

              return (
                <div
                  key={divName}
                  className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col justify-between overflow-hidden"
                >
                  {/* Division Header */}
                  <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E7ED] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-[#182333] font-display tracking-tight truncate">
                        {divName}
                      </h2>
                      {grp.divisionCategory && (
                        <p className="text-[10px] text-[#52799D] font-medium font-sans truncate">
                          {grp.divisionCategory}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EEF4F8] text-[#233D5B] border border-[#DCE7F0] shrink-0 font-medium">
                      {subcatKeys.length} subcat{subcatKeys.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Compact Subcategories & Tags */}
                  <div className="p-3.5 space-y-2.5 flex-1">
                    {subcatKeys.map((subcat) => {
                      const items = grp.subcategories[subcat];

                      return (
                        <div key={subcat} className="space-y-1">
                          <span className="text-[10px] font-semibold text-[#697586] uppercase tracking-wider block font-sans">
                            {subcat}
                          </span>

                          <div className="flex flex-wrap gap-1.5">
                            {items.map((srv) => (
                              <div
                                key={srv._id}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#F4F7FA] border border-[#E2E7ED] hover:bg-white hover:border-[#52799D] transition-colors group cursor-default"
                              >
                                <span className="font-medium text-[#182333] text-[11px] font-sans">
                                  {srv.name}
                                </span>
                                <button
                                  onClick={() => handleOpenModal(srv)}
                                  className="text-[#697586] hover:text-[#52799D] opacity-30 group-hover:opacity-100 transition-opacity"
                                  title="Edit Service"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Service Template Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={selectedService ? 'Edit Service Template' : 'Add Service Template'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Luxury Stage Decor, Wedding Photography"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Events, Studios, Digital"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Rate (INR ₹)</label>
              <input
                type="number"
                min="0"
                value={formData.defaultRate}
                onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                placeholder="Optional default rate"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Unit Type</label>
              <input
                type="text"
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                placeholder="per event, per day, units, sq.ft"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Scope of service, inclusions, deliverables..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-focsera-600 hover:bg-focsera-700 text-white rounded-xl font-medium shadow-sm transition-colors"
            >
              Save Service
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

