import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  ShieldCheck,
  History,
} from 'lucide-react';
import api from '../../api';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';

export default function TransactionsPage() {
  const { error } = useToast();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, categoryFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/transactions?category=${categoryFilter}&search=${encodeURIComponent(search)}`
      );
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      error('Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/audit-logs');
      if (res.data.success) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const rows = transactions.map((t) => ({
      'Transaction ID': t.transactionId,
      Date: formatDate(t.date),
      Client: t.client?.name || '-',
      Division: t.division?.name || '-',
      Category: t.category,
      'Reference No': t.referenceNumber,
      Description: t.description,
      'Debit (INR)': t.debit,
      'Credit (INR)': t.credit,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'Focsera_Transaction_History.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">TRANSACTION & AUDIT TRAIL</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized immutable transaction history & administrative activity audits
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'transactions'
                ? 'bg-focsera-600 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            All Financial Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'audit'
                ? 'bg-focsera-600 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            System Audit Trail ({auditLogs.length})
          </button>
        </div>

        {activeTab === 'transactions' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Invoice">Invoices</option>
              <option value="Payment">Payments</option>
              <option value="Advance">Advances</option>
              <option value="Allocation">Advance Allocations</option>
              <option value="Refund">Refunds</option>
              <option value="Credit Note">Credit Notes</option>
              <option value="Debit Note">Debit Notes</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Centralized Transactions */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Division</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Reference No</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Debit (+)</th>
                  <th className="py-3 px-3 text-right">Credit (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] font-bold text-focsera-700">
                      {t.transactionId}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{t.client?.name || '-'}</td>
                    <td className="py-3 px-3 text-focsera-700 font-semibold">{t.division?.name || '-'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{t.referenceNumber}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{t.description}</td>
                    <td className="py-3 px-3 text-right font-bold text-rose-700">
                      {t.debit > 0 ? formatINR(t.debit) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {t.credit > 0 ? formatINR(t.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.length === 0 && !loading && (
              <div className="py-12 text-center text-xs text-slate-400">No transactions recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity</th>
                  <th className="py-3 px-3">Performed By</th>
                  <th className="py-3 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt, true)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{log.entity}</td>
                    <td className="py-3 px-3 text-slate-600">{log.performedBy}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {auditLogs.length === 0 && !loading && (
              <div className="py-12 text-center text-xs text-slate-400">No audit logs recorded yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

