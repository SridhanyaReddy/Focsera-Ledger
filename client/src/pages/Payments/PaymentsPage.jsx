import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Receipt as ReceiptIcon,
  RotateCcw,
  Download,
  Share2,
} from 'lucide-react';
import api from '../../api';
import RecordPaymentModal from '../../components/forms/RecordPaymentModal';
import AllocateAdvanceModal from '../../components/forms/AllocateAdvanceModal';
import ReceiptTemplate from '../../components/documents/ReceiptTemplate';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedPaymentForAllocation, setSelectedPaymentForAllocation] = useState(null);

  const viewReceiptId = searchParams.get('receipt');
  const recordParam = searchParams.get('record') === 'true';

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    } else {
      fetchReceipts();
    }
  }, [activeTab, methodFilter, typeFilter]);

  useEffect(() => {
    if (recordParam) {
      setIsPaymentModalOpen(true);
    }
  }, [recordParam]);

  const fetchMetadata = async () => {
    try {
      const [cRes, iRes, compRes] = await Promise.all([
        api.get('/clients?isArchived=false'),
        api.get('/invoices'),
        api.get('/company'),
      ]);
      if (cRes.data.success) setClients(cRes.data.data);
      if (iRes.data.success) setInvoices(resFilter(iRes.data.data));
      if (compRes.data.success) setCompany(compRes.data.data);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  const resFilter = (invs) => invs.filter((i) => i.status !== 'Cancelled');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/payments?search=${encodeURIComponent(search)}&paymentMethod=${methodFilter}&paymentType=${typeFilter}`
      );
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      error('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payments/receipts/list?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setReceipts(res.data.data);
      }
    } catch (err) {
      error('Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  };

  // If viewing a single Receipt
  if (viewReceiptId) {
    const selectedReceipt = receipts.find((r) => r._id === viewReceiptId) || payments.find((p) => p.receipt?._id === viewReceiptId || p.receipt === viewReceiptId)?.receipt;
    return (
      <ReceiptTemplate
        receipt={selectedReceipt}
        company={company}
        onBack={() => setSearchParams({})}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">PAYMENTS & RECEIPTS</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Recorded bank/UPI collections, advance allocations & official receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearchParams({});
              setIsPaymentModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment / Advance</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'payments'
                ? 'bg-focsera-600 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            Payments Ledger ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'receipts'
                ? 'bg-focsera-600 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            Payment Receipts ({receipts.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {activeTab === 'payments' && (
            <>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
              >
                <option value="all">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="IMPS">IMPS</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
              >
                <option value="all">All Types</option>
                <option value="Advance">Advance Payment</option>
                <option value="Partial">Partial Payment</option>
                <option value="Milestone">Milestone</option>
                <option value="Full">Full Payment</option>
                <option value="Final Settlement">Final Settlement</option>
                <option value="Refund">Refund</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: Payments List */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3.5 px-4">Payment #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Target Document</th>
                  <th className="py-3.5 px-4">Method & Type</th>
                  <th className="py-3.5 px-4">Reference / UTR</th>
                  <th className="py-3.5 px-4 text-right">Amount Received</th>
                  <th className="py-3.5 px-4 text-center">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono text-xs">{p.paymentNumber}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.transactionId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{p.client?.name}</div>
                      <div className="text-slate-400 text-[11px]">{p.client?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="py-3.5 px-4">
                      {p.invoice ? (
                        <div>
                          <span className="font-semibold text-slate-800">{p.invoice.invoiceNumber}</span>
                          <span className="block text-[11px] text-slate-400 font-medium">Invoice</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-indigo-700">Client Advance</span>
                          {p.unallocatedAmount > 0 && (
                            <span className="block text-[11px] text-slate-500">
                              Unallocated: {formatINR(p.unallocatedAmount)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                      <span className="ml-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                        {p.paymentType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.referenceNumber || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                      +{formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.receipt && (
                          <button
                            onClick={() => setSearchParams({ receipt: p.receipt._id || p.receipt })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[11px] border border-emerald-200 transition-colors"
                            title="View / Print Receipt"
                          >
                            <ReceiptIcon className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                        {p.unallocatedAmount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedPaymentForAllocation(p);
                              setIsAllocateModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-[10px] border border-indigo-200 transition-colors"
                            title="Allocate Advance to Invoice"
                          >
                            <span>Allocate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && !loading && (
              <EmptyState
                icon={CreditCard}
                title="No Payments Recorded"
                description="Record advance deposits, milestone settlements, or invoice payments via UPI, NEFT, Cheque or Cash."
                actionLabel="Record Payment"
                onAction={() => setIsPaymentModalOpen(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Receipts List */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Invoice / Purpose</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-xs">{r.receiptNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(r.receiptDate)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{r.client?.name}</div>
                      <div className="text-slate-400 text-[11px]">{r.client?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {r.invoice?.invoiceNumber ? `Invoice ${r.invoice.invoiceNumber}` : 'Client Advance'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                      {formatINR(r.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSearchParams({ receipt: r._id })}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {receipts.length === 0 && !loading && (
              <EmptyState
                icon={ReceiptIcon}
                title="No Receipts Generated"
                description="Payment receipts are automatically generated whenever client payments or advances are recorded."
              />
            )}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clients={clients}
        invoices={invoices}
        onSuccess={() => {
          fetchPayments();
          fetchReceipts();
        }}
      />

      {/* Allocate Advance Modal */}
      <AllocateAdvanceModal
        isOpen={isAllocateModalOpen}
        onClose={() => {
          setIsAllocateModalOpen(false);
          setSelectedPaymentForAllocation(null);
        }}
        payment={selectedPaymentForAllocation}
        invoices={invoices}
        onSuccess={() => {
          fetchPayments();
          fetchReceipts();
        }}
      />
    </div>
  );
}

