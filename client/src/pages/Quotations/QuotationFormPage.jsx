import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileSpreadsheet,
  Check,
  Percent,
} from 'lucide-react';
import api from '../../api';
import { formatINR } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function QuotationFormPage({ onBack, onSuccess }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  // Prerequisites
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [serviceTemplates, setServiceTemplates] = useState([]);

  // Form State
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDays, setValidityDays] = useState(30);
  const [paymentSchedule, setPaymentSchedule] = useState('50% advance before execution, 50% upon delivery');
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState([
    {
      serviceName: 'Event Decor & Styling',
      description: 'Comprehensive venue styling, custom entrance and stage lighting',
      quantity: 1,
      unit: 'service',
      rate: 75000,
      discount: 0,
      taxPercentage: 18,
    },
  ]);

  // Additional Charges
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [cRes, dRes, sRes] = await Promise.all([
        api.get('/clients?isArchived=false'),
        api.get('/divisions'),
        api.get('/services'),
      ]);
      if (cRes.data.success) {
        setClients(cRes.data.data);
        if (cRes.data.data.length > 0) setClientId(cRes.data.data[0]._id);
      }
      if (dRes.data.success) {
        setDivisions(dRes.data.data);
        if (dRes.data.data.length > 0) setDivisionId(dRes.data.data[0]._id);
      }
      if (sRes.data.success) setServiceTemplates(sRes.data.data);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  useEffect(() => {
    if (clientId) {
      api.get(`/projects?client=${clientId}`).then((res) => {
        if (res.data.success) setProjects(res.data.data);
      });
    }
  }, [clientId]);

  // Dynamic Item Management
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        serviceName: '',
        description: '',
        quantity: 1,
        unit: 'units',
        rate: 0,
        discount: 0,
        taxPercentage: 18,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSelectTemplate = (index, templateId) => {
    const tmpl = serviceTemplates.find((s) => s._id === templateId);
    if (!tmpl) return;
    const updated = [...items];
    updated[index].serviceName = tmpl.name;
    updated[index].description = tmpl.description;
    updated[index].rate = tmpl.defaultRate || 0;
    updated[index].unit = tmpl.unitType || 'service';
    updated[index].taxPercentage = tmpl.taxPercentage || 18;
    setItems(updated);
  };

  // Additional Charges Management
  const handleAddCharge = () => {
    setAdditionalCharges([...additionalCharges, { description: 'Transport & Logistics', amount: 0 }]);
  };

  const handleRemoveCharge = (index) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const handleChargeChange = (index, field, value) => {
    const updated = [...additionalCharges];
    updated[index][field] = value;
    setAdditionalCharges(updated);
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let itemDiscounts = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate) || 0;
      const disc = Number(item.discount) || 0;
      const tax = Number(item.taxPercentage) || 0;

      const lineGross = qty * rate;
      const lineTaxable = Math.max(0, lineGross - disc);
      const lineTax = (lineTaxable * tax) / 100;

      subtotal += lineGross;
      itemDiscounts += disc;
      totalTax += lineTax;
    });

    const parsedInvoiceDiscount = Number(invoiceDiscount) || 0;
    const chargesTotal = additionalCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const taxableSubtotal = Math.max(0, subtotal - itemDiscounts - parsedInvoiceDiscount);
    const grandTotal = Math.round(taxableSubtotal + totalTax + chargesTotal);

    return {
      subtotal,
      itemDiscounts,
      invoiceDiscount: parsedInvoiceDiscount,
      taxableSubtotal,
      totalTax,
      chargesTotal,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (status = 'Sent') => {
    if (!clientId || !divisionId) {
      error('Client and Division are required.');
      return;
    }
    if (items.length === 0 || !items[0].serviceName) {
      error('Please add at least one valid service item.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        clientId,
        projectId: projectId || undefined,
        divisionId,
        quotationDate: new Date(quotationDate),
        validityDays: Number(validityDays),
        items: items.map((i) => ({
          ...i,
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
          discount: Number(i.discount) || 0,
          taxPercentage: Number(i.taxPercentage) || 0,
        })),
        additionalCharges: additionalCharges.map((c) => ({
          description: c.description,
          amount: Number(c.amount) || 0,
        })),
        invoiceDiscount: Number(invoiceDiscount) || 0,
        paymentSchedule,
        notes,
        status,
      };

      const res = await api.post('/quotations', payload);
      success('Quotation generated successfully!');
      onSuccess(res.data.data);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create quotation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('Draft')}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('Sent')}
            className="px-5 py-2 bg-focsera-600 hover:bg-focsera-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            {loading ? 'Creating...' : 'Save & Issue Quotation'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Create New Quotation</h2>
          <p className="text-xs text-slate-500">
            Sequential number will be assigned automatically upon generation
          </p>
        </div>

        {/* Client & Division Select */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Select Client <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ''}
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
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
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
            <label className="block text-slate-700 font-semibold mb-1">Link to Project (Optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            >
              <option value="">None / General Quotation</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Quotation Date</label>
            <input
              type="date"
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Validity (Days)</label>
            <input
              type="number"
              min="1"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-bold text-slate-900 text-xs">Quotation Line Items</span>
              <p className="text-[11px] text-slate-500">Pick from service catalog or type custom line items</p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-focsera-50 hover:bg-focsera-100 text-focsera-700 font-semibold text-xs rounded-xl border border-focsera-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs relative"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Service Name (e.g. Wedding Photography)"
                        value={item.serviceName}
                        onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-semibold text-slate-900 text-xs"
                      />
                    </div>
                    {serviceTemplates.length > 0 && (
                      <select
                        onChange={(e) => handleSelectTemplate(idx, e.target.value)}
                        className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-600"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select from Catalog...
                        </option>
                        {serviceTemplates.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({formatINR(s.defaultRate)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <textarea
                  rows="1"
                  placeholder="Service description, inclusions, specifications..."
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-600 resize-none"
                />

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-xs text-right font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Rate (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-xs text-right font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Discount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.discount}
                      onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-xs text-right text-emerald-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">GST (%)</label>
                    <select
                      value={item.taxPercentage}
                      onChange={(e) => handleItemChange(idx, 'taxPercentage', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-xs text-right"
                    >
                      <option value="0">0% (Exempt)</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18% (Standard)</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end text-right">
                    <span className="text-[10px] text-slate-400 font-semibold">Line Amount</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {formatINR(
                        Math.max(0, (Number(item.quantity) || 1) * (Number(item.rate) || 0) - (Number(item.discount) || 0)) *
                          (1 + (Number(item.taxPercentage) || 0) / 100)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Charges */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-bold text-slate-900 text-xs">Additional Charges</span>
              <p className="text-[11px] text-slate-500">Transportation, equipment rentals, installations</p>
            </div>
            <button
              type="button"
              onClick={handleAddCharge}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Charge</span>
            </button>
          </div>

          <div className="space-y-2">
            {additionalCharges.map((ch, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Charge description"
                  value={ch.description}
                  onChange={(e) => handleChargeChange(idx, 'description', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                />
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={ch.amount}
                  onChange={(e) => handleChargeChange(idx, 'amount', e.target.value)}
                  className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-right font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCharge(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Schedule</label>
              <input
                type="text"
                value={paymentSchedule}
                onChange={(e) => setPaymentSchedule(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Notes / Scope Highlights</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Exclusions, validity terms, special considerations..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Live Calculation Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatINR(totals.subtotal)}</span>
            </div>
            {totals.itemDiscounts > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Item Level Discounts:</span>
                <span>-{formatINR(totals.itemDiscounts)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600">Invoice Level Discount:</span>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  value={invoiceDiscount}
                  onChange={(e) => setInvoiceDiscount(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-right font-bold text-emerald-600"
                />
              </div>
            </div>
            <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200">
              <span>Taxable Subtotal:</span>
              <span>{formatINR(totals.taxableSubtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Applicable Taxes:</span>
              <span>{formatINR(totals.totalTax)}</span>
            </div>
            {totals.chargesTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Additional Charges:</span>
                <span>{formatINR(totals.chargesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-base font-black text-slate-900">
              <span>Grand Total:</span>
              <span>{formatINR(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

