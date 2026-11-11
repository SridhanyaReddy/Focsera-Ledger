import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Archive,
  Phone,
  Mail,
  Building,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../api';
import ClientModal from '../../components/forms/ClientModal';
import RecordPaymentModal from '../../components/forms/RecordPaymentModal';
import ClientDetailPage from './ClientDetailPage';
import { formatINR } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const viewClientId = searchParams.get('view');

  useEffect(() => {
    fetchClients();
  }, [typeFilter, showArchived]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/clients?search=${encodeURIComponent(search)}&type=${typeFilter}&isArchived=${showArchived}`
      );
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (err) {
      error('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClients();
  };

  const handleArchiveToggle = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/clients/${id}/archive`);
      success(res.data.message);
      fetchClients();
    } catch (err) {
      error('Failed to update archive status.');
    }
  };

  if (viewClientId) {
    return <ClientDetailPage clientId={viewClientId} onBack={() => setSearchParams({})} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Clients</h1>
          <p className="text-xs font-sans text-slate-500 mt-0.5">
            Client profiles, receivable ledger summaries and project associations
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedClient(null);
            setIsClientModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#52799D] hover:bg-[#233D5B] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, phone, ID..."
            className="w-full pl-10 pr-4 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] text-xs font-sans outline-none text-[#182333] transition-all"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none"
          >
            <option value="all">All Client Types</option>
            <option value="Individual">Individual</option>
            <option value="Business">Business</option>
            <option value="Institution">Institution</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium font-sans transition-colors ${
              showArchived
                ? 'bg-[#FDF6EB] text-[#B98232] border-[#F5DCB4]'
                : 'bg-[#F4F7FA] text-[#697586] border-[#E2E7ED] hover:bg-slate-100'
            }`}
          >
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E7ED] text-[#697586] uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Client ID & Name</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Type & State</th>
                <th className="py-3.5 px-4 text-right">Total Invoiced</th>
                <th className="py-3.5 px-4 text-right">Total Received</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7ED]">
              {clients.map((c) => (
                <tr
                  key={c._id}
                  onClick={() => setSearchParams({ view: c._id })}
                  className="hover:bg-[#F4F7FA] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#182333] text-sm">{c.name}</div>
                    {c.businessName && <div className="text-[#697586] text-xs">{c.businessName}</div>}
                    <span className="font-financial text-[11px] text-[#233D5B] bg-[#EEF4F8] px-2 py-0.5 rounded border border-[#DCE7F0]">
                      {c.clientId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5 font-sans">
                    <div className="text-[#182333] flex items-center gap-1.5 font-financial text-xs">
                      <Phone className="w-3 h-3 text-[#697586]" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="text-[#697586] flex items-center gap-1.5 text-xs">
                        <Mail className="w-3 h-3 text-[#697586]" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="px-2.5 py-0.5 bg-[#EEF4F8] rounded text-[11px] font-medium text-[#233D5B] border border-[#DCE7F0]">
                      {c.clientType}
                    </span>
                    <div className="text-[#697586] text-[11px] mt-1">{c.state || 'Telangana'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-financial font-medium text-[#182333]">
                    {formatINR(c.totalInvoiced)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-financial font-medium text-[#287A57]">
                    {formatINR(c.totalReceived)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-financial font-semibold">
                    <span className={c.outstandingBalance > 0 ? 'text-[#B84B4B]' : 'text-[#287A57]'}>
                      {formatINR(c.outstandingBalance)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSearchParams({ view: c._id })}
                        className="p-1.5 text-[#697586] hover:text-[#52799D] rounded hover:bg-[#EEF4F8] transition-colors"
                        title="View Profile & Ledger"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClient(c);
                          setIsClientModalOpen(true);
                        }}
                        className="p-1.5 text-[#697586] hover:text-[#233D5B] rounded hover:bg-[#EEF4F8] transition-colors"
                        title="Edit Client"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleArchiveToggle(c._id, e)}
                        className={`p-1.5 rounded transition-colors ${
                          c.isArchived
                            ? 'text-[#B98232] hover:bg-[#FDF6EB]'
                            : 'text-[#697586] hover:text-[#182333] hover:bg-slate-100'
                        }`}
                        title={c.isArchived ? 'Restore' : 'Archive'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clients.length === 0 && !loading && (
            <EmptyState
              icon={Users}
              title="No Clients Registered"
              description="Register your corporate or individual clients to start tracking projects, quotations, and receivables."
              actionLabel="Add New Client"
              onAction={() => {
                setSelectedClient(null);
                setIsClientModalOpen(true);
              }}
            />
          )}
        </div>
      </div>

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={selectedClient}
        onSuccess={fetchClients}
      />
    </div>
  );
}

