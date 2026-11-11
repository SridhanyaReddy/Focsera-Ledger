import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  Users,
  FileText,
  CreditCard,
} from 'lucide-react';
import api from '../../api';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';

const REPORTS_LIST = [
  { id: 'monthly_invoicing', name: '1. Monthly Invoicing Report' },
  { id: 'annual_invoicing', name: '2. Annual Invoicing Report' },
  { id: 'monthly_collection', name: '3. Monthly Collection Report' },
  { id: 'client_revenue', name: '4. Client-Wise Revenue' },
  { id: 'division_revenue', name: '5. Division-Wise Revenue' },
  { id: 'project_financials', name: '6. Project-Wise Financial Report' },
  { id: 'outstanding_payments', name: '7. Outstanding Payments' },
  { id: 'overdue_invoices', name: '8. Overdue Invoices' },
  { id: 'advance_payments', name: '9. Advance Payments' },
  { id: 'refund_report', name: '10. Refund Report' },
  { id: 'credit_note_report', name: '11. Credit Note Report' },
  { id: 'tax_summary', name: '12. Tax Summary (GST)' },
  { id: 'transaction_history', name: '13. Transaction History' },
  { id: 'receivables_aging', name: '14. Receivables Aging Report' },
];

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { error } = useToast();

  const [selectedReport, setSelectedReport] = useState(searchParams.get('type') || 'receivables_aging');
  const [reportData, setReportData] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState('this_fy');
  const [divisionFilter, setDivisionFilter] = useState('all');

  useEffect(() => {
    api.get('/divisions').then((res) => {
      if (res.data.success) setDivisions(res.data.data);
    });
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedReport, period, divisionFilter]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/reports/data?reportType=${selectedReport}&period=${period}&division=${divisionFilter}`
      );
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    let exportRows = [];

    if (Array.isArray(reportData)) {
      exportRows = reportData;
    } else if (selectedReport === 'receivables_aging') {
      const buckets = reportData.buckets || {};
      Object.values(buckets).forEach((b) => {
        b.invoices.forEach((inv) => {
          exportRows.push({
            'Aging Category': b.label,
            'Invoice #': inv.invoiceNumber,
            Client: inv.client?.name,
            'Invoice Date': formatDate(inv.invoiceDate),
            'Due Date': formatDate(inv.dueDate),
            'Grand Total (INR)': inv.grandTotal,
            'Outstanding Balance (INR)': inv.outstandingBalance,
          });
        });
      });
    } else {
      exportRows = [reportData];
    }

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
    XLSX.writeFile(wb, `Focsera_${selectedReport}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">FINANCIAL REPORTS</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade business intelligence, revenue analytics & receivables aging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* Reports Selection & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              Select Financial Report (14 Required Reports)
            </label>
            <select
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value);
                setSearchParams({ type: e.target.value });
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-xs text-slate-900 font-bold"
            >
              {REPORTS_LIST.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">Reporting Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-xs text-slate-900"
            >
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_fy">This Financial Year (2026-27)</option>
              <option value="all">All-Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Body */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        {loading && <div className="py-12 text-center text-xs text-slate-400">Loading financial report...</div>}

        {!loading && selectedReport === 'receivables_aging' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Receivables Aging Analysis</h3>
                <p className="text-xs text-slate-500">
                  Categorized by overdue age brackets: Not Due, 1–30, 31–60, 61–90, & &gt;90 Days
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Receivables</span>
                <div className="text-xl font-black text-rose-700">
                  {formatINR(reportData?.totalReceivable)}
                </div>
              </div>
            </div>

            {/* 5 Aging Brackets */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {reportData?.buckets &&
                Object.values(reportData.buckets).map((b, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      idx === 0
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : idx === 1
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                    }`}
                  >
                    <span className="text-[11px] font-bold block">{b.label}</span>
                    <div className="text-lg font-black mt-1">{formatINR(b.amount)}</div>
                    <span className="text-[10px] opacity-75 mt-0.5 block">{b.count} invoices</span>
                  </div>
                ))}
            </div>

            {/* Invoices List under Aging */}
            <div className="overflow-x-auto pt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <th className="py-3 px-3">Bracket</th>
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3">Invoice Date</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Invoice Total</th>
                    <th className="py-3 px-3 text-right">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData?.buckets &&
                    Object.values(reportData.buckets).map((b) =>
                      b.invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-semibold text-slate-700">{b.label}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3 text-slate-800">{inv.client?.name}</td>
                          <td className="py-3 px-3 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium">{formatDate(inv.dueDate)}</td>
                          <td className="py-3 px-3 text-right font-medium text-slate-900">
                            {formatINR(inv.grandTotal)}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-rose-700">
                            {formatINR(inv.outstandingBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tax Summary Report */}
        {!loading && selectedReport === 'tax_summary' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900">GST Tax Liability Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 text-xs font-semibold uppercase">Total Taxable Value</span>
                <div className="text-xl font-black text-slate-900 mt-1">{formatINR(reportData?.totalTaxable)}</div>
              </div>
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-blue-700 text-xs font-semibold uppercase">CGST Collected</span>
                <div className="text-xl font-black text-blue-900 mt-1">{formatINR(reportData?.totalCGST)}</div>
              </div>
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-blue-700 text-xs font-semibold uppercase">SGST Collected</span>
                <div className="text-xl font-black text-blue-900 mt-1">{formatINR(reportData?.totalSGST)}</div>
              </div>
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-purple-700 text-xs font-semibold uppercase">IGST Collected</span>
                <div className="text-xl font-black text-purple-900 mt-1">{formatINR(reportData?.totalIGST)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabular Reports */}
        {!loading && selectedReport !== 'receivables_aging' && selectedReport !== 'tax_summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  {Array.isArray(reportData) && reportData.length > 0 &&
                    Object.keys(reportData[0])
                      .filter((k) => !['_id', '__v'].includes(k))
                      .map((key) => (
                        <th key={key} className="py-3 px-3">
                          {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.isArray(reportData) &&
                  reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      {Object.entries(row)
                        .filter(([k]) => !['_id', '__v'].includes(k))
                        .map(([k, v], cellIdx) => (
                          <td key={cellIdx} className="py-3 px-3">
                            {typeof v === 'number' && (k.toLowerCase().includes('total') || k.toLowerCase().includes('invoiced') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('collected') || k.toLowerCase().includes('received') || k.toLowerCase().includes('outstanding'))
                              ? formatINR(v)
                              : typeof v === 'object' && v !== null
                              ? v.name || JSON.stringify(v)
                              : String(v || '-')}
                          </td>
                        ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

