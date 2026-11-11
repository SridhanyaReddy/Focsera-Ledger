import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Plus,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Briefcase,
  BookOpen,
  Printer,
  Download,
} from 'lucide-react';
import api from '../../api';
import StatusBadge from '../../components/common/StatusBadge';
import ClientModal from '../../components/forms/ClientModal';
import RecordPaymentModal from '../../components/forms/RecordPaymentModal';
import ProjectModal from '../../components/forms/ProjectModal';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';

export default function ClientDetailPage({ clientId, onBack }) {
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');

  // Ledger Filter states
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [ledgerProjectFilter, setLedgerProjectFilter] = useState('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    fetchClientProfile();
  }, [clientId, ledgerStartDate, ledgerEndDate, ledgerProjectFilter]);

  const fetchClientProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/clients/${clientId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      error('Failed to load client details.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data?.ledgerEntries) return;
    const rows = data.ledgerEntries.map((e) => ({
      Date: formatDate(e.date),
      'Transaction ID': e.transactionId,
      'Entry Type': e.entryType,
      'Reference No': e.referenceNumber,
      Description: e.description,
      'Debit (INR)': e.debit,
      'Credit (INR)': e.credit,
      'Running Balance (INR)': e.runningBalance,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Client Ledger');
    XLSX.writeFile(wb, `${data.client.name.replace(/\s+/g, '_')}_Ledger.xlsx`);
  };

  const handlePrintLedger = () => {
    window.print();
  };

  if (loading && !data) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading client profile...</div>;
  }

  if (!data?.client) return null;

  const { client, financials, projects = [], quotations = [], invoices = [], payments = [], ledgerEntries = [] } = data;

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Client List</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Client Overview Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-focsera-50 border border-focsera-200 text-focsera-700 font-black text-2xl flex items-center justify-center shrink-0">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
                <span className="font-mono text-xs text-focsera-700 bg-focsera-50 px-2 py-0.5 rounded border border-focsera-200">
                  {client.clientId}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                  {client.clientType}
                </span>
              </div>
              {client.businessName && (
                <div className="text-sm font-semibold text-slate-600 mt-0.5">{client.businessName}</div>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {client.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {client.state || 'Telangana'} (Code: {client.stateCode || '36'})
                </span>
                {client.gstin && (
                  <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border">
                    GSTIN: {client.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Financial Profile Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {formatINR(financials?.totalInvoiced)}
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Total Received
            </span>
            <div className="text-xl font-black text-emerald-900 mt-1">
              {formatINR(financials?.totalReceived)}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              financials?.outstandingBalance > 0
                ? 'bg-rose-50/60 border-rose-200/60'
                : 'bg-emerald-50/60 border-emerald-200/60'
            }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                financials?.outstandingBalance > 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              Current Outstanding
            </span>
            <div
              className={`text-xl font-black mt-1 ${
                financials?.outstandingBalance > 0 ? 'text-rose-900' : 'text-emerald-900'
              }`}
            >
              {formatINR(financials?.outstandingBalance)}
            </div>
          </div>

          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/60">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
              Unallocated Advances
            </span>
            <div className="text-xl font-black text-indigo-900 mt-1">
              {formatINR(financials?.unallocatedAdvances)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold print:hidden">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-focsera-600 text-focsera-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Client Receivables Ledger</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {ledgerEntries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-focsera-600 text-focsera-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-focsera-600 text-focsera-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments & Receipts</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'projects'
              ? 'border-focsera-600 text-focsera-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Projects</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'quotations'
              ? 'border-focsera-600 text-focsera-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Quotations</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {quotations.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Client Ledger (Core Module - Section 15) */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chronological Client Ledger</h3>
              <p className="text-xs text-slate-500">
                Audited transaction ledger with progressive running balance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintLedger}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Reference No</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Debit (+)</th>
                  <th className="py-3 px-3 text-right">Credit (-)</th>
                  <th className="py-3 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">{formatDate(e.date)}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-focsera-700">{e.transactionId}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {e.entryType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{e.referenceNumber}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{e.description}</td>
                    <td className="py-3 px-3 text-right font-semibold text-rose-700">
                      {e.debit > 0 ? formatINR(e.debit) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                      {e.credit > 0 ? formatINR(e.credit) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatINR(e.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ledgerEntries.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No financial transactions recorded in ledger yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-3 px-3">Invoice Number</th>
                <th className="py-3 px-3">Date & Due</th>
                <th className="py-3 px-3">Project & Division</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{inv.project?.name || 'General'}</div>
                    <div className="text-slate-400 text-[11px]">{inv.division?.name}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                    {formatINR(inv.paidAmount + inv.advanceAdjusted)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-700">
                    {formatINR(inv.outstandingBalance)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={inv.status} type="invoice" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">No invoices issued to this client.</div>
          )}
        </div>
      )}

      {/* Tab 3: Payments & Receipts */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-3 px-3">Payment #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Method & Type</th>
                <th className="py-3 px-3">Reference / UTR</th>
                <th className="py-3 px-3 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-bold text-slate-900">{p.paymentNumber}</td>
                  <td className="py-3 px-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                    <span className="ml-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                      {p.paymentType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{p.referenceNumber || '-'}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-700">
                    +{formatINR(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">No payments recorded for this client.</div>
          )}
        </div>
      )}

      {/* Tab 4: Projects */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-3 px-3">Project ID & Name</th>
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3 text-right">Agreed Value</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((prj) => (
                <tr key={prj._id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{prj.name}</div>
                    <span className="font-mono text-[10px] text-slate-400">{prj.projectId}</span>
                  </td>
                  <td className="py-3 px-3 text-focsera-700 font-semibold">{prj.division?.name}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatINR(prj.agreedProjectValue)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={prj.status} type="project" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">No projects associated with this client.</div>
          )}
        </div>
      )}

      {/* Tab 5: Quotations */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-3 px-3">Quotation Number</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map((q) => (
                <tr key={q._id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-bold text-slate-900">{q.quotationNumber}</td>
                  <td className="py-3 px-3 text-slate-600">{formatDate(q.quotationDate)}</td>
                  <td className="py-3 px-3 text-slate-700">{q.division?.name}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(q.grandTotal)}</td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={q.status} type="quotation" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quotations.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">No quotations generated for this client.</div>
          )}
        </div>
      )}

      {/* Modals */}
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
        onSuccess={fetchClientProfile}
      />
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        initialClient={client}
        invoices={invoices}
        clients={[client]}
        onSuccess={fetchClientProfile}
      />
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        clients={[client]}
        divisions={data?.divisions || []}
        onSuccess={fetchClientProfile}
      />
    </div>
  );
}

