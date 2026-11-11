import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/formatters';

export default function AllocateAdvanceModal({
  isOpen,
  onClose,
  payment,
  invoices = [],
  onSuccess,
}) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');

  const availableInvoices = invoices.filter(
    (inv) =>
      (!payment?.client || (inv.client?._id || inv.client) === (payment.client?._id || payment.client)) &&
      inv.outstandingBalance > 0 &&
      inv.status !== 'Cancelled'
  );

  const selectedInvoice = availableInvoices.find((i) => i._id === selectedInvoiceId);

  useEffect(() => {
    if (availableInvoices.length > 0 && !selectedInvoiceId) {
      const first = availableInvoices[0];
      setSelectedInvoiceId(first._id);
      const maxAllocatable = Math.min(payment?.unallocatedAmount || 0, first.outstandingBalance || 0);
      setAmount(maxAllocatable > 0 ? maxAllocatable.toString() : '');
    }
  }, [availableInvoices, payment, selectedInvoiceId]);

  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    const inv = availableInvoices.find((i) => i._id === invId);
    if (inv) {
      const maxAllocatable = Math.min(payment?.unallocatedAmount || 0, inv.outstandingBalance || 0);
      setAmount(maxAllocatable > 0 ? maxAllocatable.toString() : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allocAmount = Number(amount);
    if (!selectedInvoiceId) {
      error('Please select an invoice to allocate advance towards.');
      return;
    }
    if (!allocAmount || allocAmount <= 0) {
      error('Please enter a valid allocation amount.');
      return;
    }
    if (allocAmount > (payment?.unallocatedAmount || 0)) {
      error(`Cannot allocate more than available unallocated advance (${formatINR(payment?.unallocatedAmount)}).`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/payments/allocate-advance', {
        paymentId: payment._id,
        invoiceId: selectedInvoiceId,
        amount: allocAmount,
      });

      success(`Successfully allocated ${formatINR(allocAmount)} advance to invoice!`);
      onSuccess();
      onClose();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to allocate advance.');
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate Client Advance" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-focsera-50/70 border border-focsera-200/60 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-medium">Available Unallocated Advance:</span>
            <div className="text-xl font-bold text-focsera-900 mt-0.5 font-mono">
              {formatINR(payment.unallocatedAmount)}
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-focsera-200 rounded-lg text-focsera-700">
            {payment.paymentNumber}
          </span>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Target Invoice <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={selectedInvoiceId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
          >
            <option value="">Select Invoice</option>
            {availableInvoices.map((inv) => (
              <option key={inv._id} value={inv._id}>
                {inv.invoiceNumber} - Due: {formatINR(inv.outstandingBalance)} (Total: {formatINR(inv.grandTotal)})
              </option>
            ))}
          </select>
        </div>

        {selectedInvoice && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Invoice Total:</span>
              <span className="font-semibold text-slate-800">{formatINR(selectedInvoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Outstanding Balance:</span>
              <span className="font-bold text-rose-700">{formatINR(selectedInvoice.outstandingBalance)}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Amount to Allocate (INR ₹) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            max={Math.min(payment.unallocatedAmount, selectedInvoice?.outstandingBalance || payment.unallocatedAmount)}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-bold text-base"
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
            disabled={loading || availableInvoices.length === 0}
            className="px-5 py-2 bg-focsera-600 hover:bg-focsera-700 text-white rounded-xl font-medium shadow-sm transition-colors"
          >
            {loading ? 'Allocating...' : 'Confirm Allocation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

