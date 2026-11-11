import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Eye,
  Check,
  Building,
  CreditCard,
  Percent,
} from 'lucide-react';
import api from '../../api';
import { formatINR, formatDate, numberToIndianWords } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function InvoiceFormPage({ onBack, onSuccess }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  // Prerequisites
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [company, setCompany] = useState(null);

  // Form Header States
  const [invoiceType, setInvoiceType] = useState('Tax Invoice');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [placeOfSupply, setPlaceOfSupply] = useState('Telangana');
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState('36');
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 15 days of invoice date.');
  const [notes, setNotes] = useState('');

  // Line Items
  const [items, setItems] = useState([
    {
      serviceName: 'Comprehensive Interior Execution',
      description: 'Precision painting, custom wardrobes and electrical lighting setup',
      quantity: 1,
      unit: 'service',
      rate: 150000,
      discount: 0,
      taxPercentage: 18,
    },
  ]);

  // Additional Charges & Invoice Discount
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [cRes, dRes, sRes, compRes] = await Promise.all([
        api.get('/clients?isArchived=false'),
        api.get('/divisions'),
        api.get('/services'),
        api.get('/company'),
      ]);
      if (cRes.data.success) {
        setClients(cRes.data.data);
        if (cRes.data.data.length > 0) {
          setClientId(cRes.data.data[0]._id);
          setPlaceOfSupply(cRes.data.data[0].state || 'Telangana');
          setPlaceOfSupplyStateCode(cRes.data.data[0].stateCode || '36');
        }
      }
      if (dRes.data.success) {
        setDivisions(dRes.data.data);
        if (dRes.data.data.length > 0) setDivisionId(dRes.data.data[0]._id);
      }
      if (sRes.data.success) setServiceTemplates(sRes.data.data);
      if (compRes.data.success) setCompany(compRes.data.data);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  useEffect(() => {
    if (clientId) {
      const selected = clients.find((c) => c._id === clientId);
      if (selected) {
        setPlaceOfSupply(selected.state || 'Telangana');
        setPlaceOfSupplyStateCode(selected.stateCode || '36');
      }
      api.get(`/projects?client=${clientId}`).then((res) => {
        if (res.data.success) {
          setProjects(res.data.data);
          if (res.data.data.length > 0) setProjectId(res.data.data[0]._id);
          else setProjectId('');
        }
      });
    }
  }, [clientId, clients]);

  // Items Management
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

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const handleSelectTemplate = (idx, templateId) => {
    const tmpl = serviceTemplates.find((s) => s._id === templateId);
    if (!tmpl) return;
    const updated = [...items];
    updated[idx].serviceName = tmpl.name;
    updated[idx].description = tmpl.description;
    updated[idx].rate = tmpl.defaultRate || 0;
    updated[idx].unit = tmpl.unitType || 'service';
    updated[idx].taxPercentage = tmpl.taxPercentage || 18;
    setItems(updated);
  };

  // Additional Charges
  const handleAddCharge = () => {
    setAdditionalCharges([...additionalCharges, { description: 'Site Logistics & Travel', amount: 0 }]);
  };

  const handleRemoveCharge = (idx) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== idx));
  };

  const handleChargeChange = (idx, field, val) => {
    const updated = [...additionalCharges];
    updated[idx][field] = val;
    setAdditionalCharges(updated);
  };

  // Live Financial Calculation
  const isInterState = String(company?.stateCode || '36').trim() !== String(placeOfSupplyStateCode).trim();

  const calculateLiveTotals = () => {
    let subtotal = 0;
    let itemDiscounts = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const computedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate) || 0;
      const disc = Number(item.discount) || 0;
      const taxPct = Number(item.taxPercentage) || 0;

      const gross = qty * rate;
      const taxable = Math.max(0, gross - disc);

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (taxPct > 0) {
        if (isInterState) {
          igst = (taxable * taxPct) / 100;
        } else {
          cgst = (taxable * (taxPct / 2)) / 100;
          sgst = (taxable * (taxPct / 2)) / 100;
        }
      }

      subtotal += gross;
      itemDiscounts += disc;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;

      return {
        ...item,
        taxable,
        cgst,
        sgst,
        igst,
        total: taxable + cgst + sgst + igst,
      };
    });

    const parsedInvoiceDiscount = Number(invoiceDiscount) || 0;
    const taxableSubtotal = Math.max(0, subtotal - itemDiscounts - parsedInvoiceDiscount);
    const totalTax = totalCGST + totalSGST + totalIGST;
    const chargesTotal = additionalCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

    const rawGrandTotal = taxableSubtotal + totalTax + chargesTotal;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = Math.round((roundedGrandTotal - rawGrandTotal) * 100) / 100;

    return {
      subtotal,
      itemDiscounts,
      invoiceDiscount: parsedInvoiceDiscount,
      taxableSubtotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax,
      chargesTotal,
      roundOff,
      grandTotal: roundedGrandTotal,
      computedItems,
    };
  };

  const totals = calculateLiveTotals();
  const currentClient = clients.find((c) => c._id === clientId);
  const currentProject = projects.find((p) => p._id === projectId);
  const currentDivision = divisions.find((d) => d._id === divisionId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId || !projectId || !divisionId) {
      error('Client, Project, and Division are required.');
      return;
    }
    if (items.length === 0 || !items[0].serviceName.trim()) {
      error('Please enter at least one valid service item.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        invoiceType,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        clientId,
        projectId,
        divisionId,
        placeOfSupply,
        placeOfSupplyStateCode,
        items: items.map((i) => ({
          serviceName: i.serviceName.trim(),
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unit: i.unit,
          rate: Number(i.rate) || 0,
          discount: Number(i.discount) || 0,
          taxPercentage: Number(i.taxPercentage) || 0,
        })),
        additionalCharges: additionalCharges.map((c) => ({
          description: c.description,
          amount: Number(c.amount) || 0,
        })),
        invoiceDiscount: Number(invoiceDiscount) || 0,
        paymentTerms,
        notes,
        status: 'Issued',
      };

      const res = await api.post('/invoices', payload);
      success(`Tax Invoice ${res.data.data.invoiceNumber} generated & recorded in ledger!`);
      onSuccess(res.data.data);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? 'Generating...' : 'Issue Invoice & Post to Ledger'}</span>
        </button>
      </div>

      {/* 2-Column Split: Form Inputs on Left, Real-Time Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Invoice Parameters</h2>
            <p className="text-xs text-slate-500">
              Select client and service deliverables. GST will calculate dynamically.
            </p>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Invoice Type</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-medium"
              >
                <option value="Tax Invoice">Tax Invoice</option>
                <option value="Bill of Supply">Bill of Supply</option>
                <option value="Proforma Invoice">Proforma Invoice</option>
                <option value="Advance Invoice">Advance Invoice</option>
                <option value="Final Invoice">Final Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Client <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
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
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Division <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              >
                <option value="">Select Division</option>
                {divisions.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Place of supply */}
            <div className="sm:col-span-3 grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5 text-[11px]">
                  Place of Supply (State)
                </label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5 text-[11px]">
                  State Code & GST Regime
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={placeOfSupplyStateCode}
                    onChange={(e) => setPlaceOfSupplyStateCode(e.target.value)}
                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-mono text-center font-bold"
                  />
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-md border ${
                      !isInterState
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {!isInterState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-xs">Line Items</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-focsera-50 text-focsera-700 font-bold text-xs rounded-lg border border-focsera-200 hover:bg-focsera-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Service Name"
                        value={item.serviceName}
                        onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)}
                        className="sm:col-span-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                      />
                      {serviceTemplates.length > 0 && (
                        <select
                          onChange={(e) => handleSelectTemplate(idx, e.target.value)}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Catalog template...
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Description / deliverables..."
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                  />

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Quantity</span>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Rate (₹)</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Discount (₹)</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.discount}
                        onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-right text-emerald-600 font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">GST Rate</span>
                      <select
                        value={item.taxPercentage}
                        onChange={(e) => handleItemChange(idx, 'taxPercentage', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-medium"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Charges */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-xs">Additional Charges</span>
              <button
                type="button"
                onClick={handleAddCharge}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-200"
              >
                + Charge
              </button>
            </div>
            <div className="space-y-2">
              {additionalCharges.map((ch, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={ch.description}
                    onChange={(e) => handleChargeChange(idx, 'description', e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Amount ₹"
                    value={ch.amount}
                    onChange={(e) => handleChargeChange(idx, 'amount', e.target.value)}
                    className="w-28 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCharge(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Invoice Notes</label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes to appear on invoice footer..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Live Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 self-start">
          <div className="bg-white p-6 rounded-2xl border-2 border-focsera-200 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-focsera-800 uppercase tracking-wider text-[11px]">
                Live Document Preview
              </span>
              <span className="font-mono text-slate-400 font-bold">FOC/INV/2026-27/###</span>
            </div>

            {/* Header snippet */}
            <div>
              <div className="font-black text-slate-900 text-sm">{company?.legalName || 'Focsera'}</div>
              <p className="text-slate-500 text-[11px]">{company?.contactNumber} | {company?.website}</p>
            </div>

            {/* Client snippet */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Billed To</div>
              <div className="font-bold text-slate-900 text-xs">{currentClient?.name || 'Selected Client'}</div>
              <div className="text-slate-500 text-[11px]">{currentClient?.phone}</div>
              <div className="text-slate-600 text-[11px] font-semibold">
                Project: {currentProject?.name || 'Assigned Project'}
              </div>
            </div>

            {/* Items summary */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-slate-100">
              {totals.computedItems.map((item, idx) => (
                <div key={idx} className="pt-1.5 flex justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-800">{item.serviceName || 'Custom Service'}</span>
                    <span className="text-slate-400 ml-1">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatINR(item.total)}</span>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="pt-3 border-t-2 border-slate-900 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-semibold text-slate-800">{formatINR(totals.taxableSubtotal)}</span>
              </div>
              {!isInterState ? (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>CGST:</span>
                    <span>{formatINR(totals.totalCGST)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>SGST:</span>
                    <span>{formatINR(totals.totalSGST)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-purple-700 font-semibold text-[11px]">
                  <span>IGST (Inter-State):</span>
                  <span>{formatINR(totals.totalIGST)}</span>
                </div>
              )}
              {totals.chargesTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Additional Charges:</span>
                  <span>{formatINR(totals.chargesTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-b border-slate-900 text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="text-focsera-700">{formatINR(totals.grandTotal)}</span>
              </div>
              <div className="text-[10px] text-slate-500 italic mt-1 font-medium">
                {numberToIndianWords(totals.grandTotal)}
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="w-full py-3 bg-focsera-600 hover:bg-focsera-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              {loading ? 'Processing...' : 'Issue Final Invoice Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

