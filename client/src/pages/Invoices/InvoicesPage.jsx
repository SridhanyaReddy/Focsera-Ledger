import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  CreditCard,
  Ban,
  Download,
} from 'lucide-react';
import api from '../../api';
import InvoiceTemplate from '../../components/documents/InvoiceTemplate';
import InvoiceFormPage from './InvoiceFormPage';
import RecordPaymentModal from '../../components/forms/RecordPaymentModal';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

export default function InvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState(null);

  const viewInvoiceId = searchParams.get('view');
  const isCreateMode = searchParams.get('create') === 'true';

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [divisionFilter, statusFilter, typeFilter]);

  const fetchPrerequisites = async () => {
    try {
      const [dRes, cRes] = await Promise.all([api.get('/divisions'), api.get('/company')]);
      if (dRes.data.success) setDivisions(dRes.data.data);
      if (cRes.data.success) setCompany(cRes.data.data);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/invoices?search=${encodeURIComponent(search)}&division=${divisionFilter}&status=${statusFilter}&invoiceType=${typeFilter}`
      );
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!cancelModalInvoice) return;
    try {
      await api.post(`/invoices/${cancelModalInvoice._id}/cancel`, {
        reason: 'Cancelled by admin',
      });
      success(`Invoice ${cancelModalInvoice.invoiceNumber} cancelled.`);
      setCancelModalInvoice(null);
      fetchInvoices();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel invoice.');
    }
  };

  // Create Mode
  if (isCreateMode) {
    return (
      <InvoiceFormPage
        onBack={() => setSearchParams({})}
        onSuccess={(newInv) => {
          setSearchParams({ view: newInv._id });
        }}
      />
    );
  }

  // View Mode
  if (viewInvoiceId) {
    const selectedInvoice = invoices.find((i) => i._id === viewInvoiceId);
    return (
      <InvoiceTemplate
        invoice={selectedInvoice}
        company={company}
        onBack={() => setSearchParams({})}
        onRecordPayment={(inv) => {
          setPaymentTargetInvoice(inv);
          setIsPaymentModalOpen(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#182333] tracking-tight">Invoices</h1>
          <p className="text-xs font-sans text-[#697586] mt-0.5">
            Single-company billing, GST calculations and payment tracking
          </p>
        </div>

        <button
          onClick={() => setSearchParams({ create: 'true' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#52799D] hover:bg-[#233D5B] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Tax Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#697586] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
            placeholder="Search invoice number, client..."
            className="w-full pl-10 pr-4 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] text-xs font-sans outline-none text-[#182333] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none"
          >
            <option value="all">All Divisions</option>
            {divisions.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Issued">Issued</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none"
          >
            <option value="all">All Types</option>
            <option value="Tax Invoice">Tax Invoice</option>
            <option value="Bill of Supply">Bill of Supply</option>
            <option value="Proforma Invoice">Proforma Invoice</option>
            <option value="Advance Invoice">Advance Invoice</option>
            <option value="Credit Note">Credit Note</option>
            <option value="Debit Note">Debit Note</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E7ED] text-[#697586] uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Invoice # & Type</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Project & Division</th>
                <th className="py-3.5 px-4">Date & Due Date</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7ED]">
              {invoices.map((inv) => (
                <tr
                  key={inv._id}
                  onClick={() => setSearchParams({ view: inv._id })}
                  className="hover:bg-[#F4F7FA] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#182333] font-financial text-xs">{inv.invoiceNumber}</div>
                    <span className="text-[10px] text-[#697586] font-medium font-sans">{inv.invoiceType}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#182333]">{inv.client?.name}</div>
                    {inv.client?.businessName && (
                      <div className="text-[#697586] text-[11px]">{inv.client.businessName}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#182333]">{inv.project?.name || 'General Project'}</div>
                    <div className="text-[#233D5B] text-[11px] font-medium">{inv.division?.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#697586]">
                    <div className="font-financial text-xs text-[#182333]">{formatDate(inv.invoiceDate)}</div>
                    <div
                      className={`text-[11px] font-financial ${
                        new Date(inv.dueDate) < new Date() && inv.outstandingBalance > 0
                          ? 'text-[#B84B4B] font-semibold'
                          : 'text-[#697586]'
                      }`}
                    >
                      Due: {formatDate(inv.dueDate)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-financial font-semibold text-[#182333] text-sm">
                    {formatINR(inv.grandTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-financial font-medium text-[#287A57]">
                    {formatINR(inv.paidAmount + inv.advanceAdjusted)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-financial font-semibold">
                    <span className={inv.outstandingBalance > 0 ? 'text-[#B84B4B]' : 'text-[#287A57]'}>
                      {formatINR(inv.outstandingBalance)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={inv.status} type="invoice" />
                  </td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSearchParams({ view: inv._id })}
                        className="p-1.5 text-[#697586] hover:text-[#52799D] rounded hover:bg-[#EEF4F8] transition-colors"
                        title="View / Print Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {inv.outstandingBalance > 0 && inv.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            setPaymentTargetInvoice(inv);
                            setIsPaymentModalOpen(true);
                          }}
                          className="p-1.5 text-[#287A57] hover:text-[#1e5d42] bg-[#E9F5EF] hover:bg-[#D5EEDB] rounded transition-colors"
                          title="Record Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      {inv.status === 'Issued' && inv.paidAmount === 0 && (
                        <button
                          onClick={() => setCancelModalInvoice(inv)}
                          className="p-1.5 text-[#697586] hover:text-[#B84B4B] rounded hover:bg-[#FDEFEF] transition-colors"
                          title="Cancel Invoice"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && !loading && (
            <EmptyState
              icon={FileText}
              title="No Invoices Issued Yet"
              description="Create and issue professional tax invoices with live side-by-side A4 preview and GST calculations."
              actionLabel="Create First Invoice"
              onAction={() => setSearchParams({ create: 'true' })}
            />
          )}
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTargetInvoice(null);
        }}
        initialInvoice={paymentTargetInvoice}
        invoices={invoices}
        clients={paymentTargetInvoice?.client ? [paymentTargetInvoice.client] : []}
        onSuccess={fetchInvoices}
      />

      <ConfirmDialog
        isOpen={Boolean(cancelModalInvoice)}
        onClose={() => setCancelModalInvoice(null)}
        onConfirm={handleCancelInvoice}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice ${cancelModalInvoice?.invoiceNumber}? It will be retained in history as Cancelled.`}
        isDestructive={true}
        confirmText="Cancel Invoice"
      />
    </div>
  );
}

