import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/formatters';

export default function RecordPaymentModal({
  isOpen,
  onClose,
  initialInvoice,
  initialClient,
  clients = [],
  invoices = [],
  onSuccess,
}) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    invoiceId: '',
    amount: '',
    paymentMethod: 'UPI',
    paymentType: 'Full',
    referenceNumber: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (initialInvoice) {
      setFormData((prev) => ({
        ...prev,
        clientId: initialInvoice.client?._id || initialInvoice.client || '',
        invoiceId: initialInvoice._id,
        amount: initialInvoice.outstandingBalance || '',
        paymentType: 'Full',
      }));
      setSelectedInvoice(initialInvoice);
    } else if (initialClient) {
      setFormData((prev) => ({
        ...prev,
        clientId: initialClient._id,
        invoiceId: '',
        amount: '',
        paymentType: 'Advance',
      }));
      setSelectedInvoice(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        clientId: clients[0]?._id || '',
        invoiceId: '',
        amount: '',
        paymentType: 'Full',
      }));
      setSelectedInvoice(null);
    }
  }, [initialInvoice, initialClient, isOpen, clients]);

  const handleInvoiceSelect = (invId) => {
    const inv = invoices.find((i) => i._id === invId);
    setSelectedInvoice(inv || null);
    setFormData((prev) => ({
      ...prev,
      invoiceId: invId,
      clientId: inv?.client?._id || inv?.client || prev.clientId,
      amount: inv ? inv.outstandingBalance : prev.amount,
      paymentType: inv ? (prev.paymentType === 'Advance' ? 'Full' : prev.paymentType) : 'Advance',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(formData.amount);
    if (!formData.clientId) {
      error('Please select a client.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      error('Please enter a valid payment amount greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/payments', {
        clientId: formData.clientId,
        invoiceId: formData.invoiceId || undefined,
        amount: parsedAmount,
        paymentMethod: formData.paymentMethod,
        paymentType: formData.paymentType,
        referenceNumber: formData.referenceNumber,
        paymentDate: new Date(formData.paymentDate),
        notes: formData.notes,
      });

      success(`Payment recorded successfully! Receipt ${res.data.data.receipt?.receiptNumber || ''} generated.`);
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices for the chosen client if client is selected
  const availableInvoices = invoices.filter(
    (inv) =>
      (!formData.clientId || (inv.client?._id || inv.client) === formData.clientId) &&
      inv.outstandingBalance > 0 &&
      inv.status !== 'Cancelled'
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment / Advance" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Client <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={formData.clientId}
            onChange={(e) => {
              setFormData({ ...formData, clientId: e.target.value, invoiceId: '' });
              setSelectedInvoice(null);
            }}
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
            Apply Against Specific Invoice (Optional)
          </label>
          <select
            value={formData.invoiceId}
            onChange={(e) => handleInvoiceSelect(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
          >
            <option value="">None (Record as General Client Advance)</option>
            {availableInvoices.map((inv) => (
              <option key={inv._id} value={inv._id}>
                {inv.invoiceNumber} - Due: {formatINR(inv.outstandingBalance)} (Total: {formatINR(inv.grandTotal)})
              </option>
            ))}
          </select>
          {selectedInvoice && (
            <div className="mt-1.5 p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-lg flex items-center justify-between text-slate-700">
              <span>Invoice Outstanding:</span>
              <span className="font-bold text-focsera-900">{formatINR(selectedInvoice.outstandingBalance)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Amount Received (INR ₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-bold text-base"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
              <option value="IMPS">IMPS</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Type</label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="Advance">Advance Payment</option>
              <option value="Partial">Partial Payment</option>
              <option value="Milestone">Milestone Payment</option>
              <option value="Full">Full Payment</option>
              <option value="Final Settlement">Final Settlement</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Transaction Ref / UTR / Cheque #</label>
          <input
            type="text"
            value={formData.referenceNumber}
            onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            placeholder="e.g. UPI Ref 3829182390 or Bank UTR HDFC001928"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Notes / Remarks</label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Received with thanks, project milestone 1..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors"
          >
            {loading ? 'Recording...' : 'Record Payment & Generate Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

