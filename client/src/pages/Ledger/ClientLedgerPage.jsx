import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Layers,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import api from '../../api';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';
import EmptyState from '../../components/common/EmptyState';

export default function ClientLedgerPage() {
  const { error } = useToast();
  const [viewMode, setViewMode] = useState('client'); // 'client' or 'company'
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [divisions, setDivisions] = useState([]);
  const [ledgerData, setLedgerData] = useState(null);
  const [companyLedgerData, setCompanyLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState('all');
  const [searchRef, setSearchRef] = useState('');

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    if (viewMode === 'client' && selectedClientId) {
      fetchClientLedger();
    } else if (viewMode === 'company') {
      fetchCompanyLedger();
    }
  }, [viewMode, selectedClientId, startDate, endDate, divisionFilter, entryTypeFilter]);

  const fetchPrerequisites = async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        api.get('/clients?isArchived=false'),
        api.get('/divisions'),
      ]);
      if (cRes.data.success && cRes.data.data.length > 0) {
        setClients(cRes.data.data);
        setSelectedClientId(cRes.data.data[0]._id);
      }
      if (dRes.data.success) {
        setDivisions(dRes.data.data);
      }
    } catch (err) {
      console.error('Error loading ledger prerequisites:', err);
    }
  };

  const fetchClientLedger = async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const query = `/ledger/client/${selectedClientId}?startDate=${startDate}&endDate=${endDate}&division=${divisionFilter}&entryType=${entryTypeFilter}&search=${encodeURIComponent(searchRef)}`;
      const res = await api.get(query);
      if (res.data.success) {
        setLedgerData(res.data.data);
      }
    } catch (err) {
      error('Failed to load client ledger.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyLedger = async () => {
    setLoading(true);
    try {
      const query = `/ledger/company?startDate=${startDate}&endDate=${endDate}&division=${divisionFilter}&entryType=${entryTypeFilter}&search=${encodeURIComponent(searchRef)}`;
      const res = await api.get(query);
      if (res.data.success) {
        setCompanyLedgerData(res.data.data);
      }
    } catch (err) {
      error('Failed to load company ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const entries = viewMode === 'client' ? ledgerData?.entries : companyLedgerData?.entries;
    if (!entries || entries.length === 0) return;

    const rows = entries.map((e) => ({
      Date: formatDate(e.date),
      'Transaction ID': e.transactionId,
      'Client / Party': e.client?.name || ledgerData?.client?.name || 'Client',
      'Entry Type': e.entryType,
      'Reference No': e.referenceNumber,
      Description: e.description,
      'Debit (INR)': e.debit,
      'Credit (INR)': e.credit,
      'Running Balance (INR)': e.runningBalance,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Ledger');
    const filename =
      viewMode === 'client'
        ? `${ledgerData?.client?.name || 'Client'}_Ledger.xlsx`
        : `Focsera_Company_Ledger.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentClient = clients.find((c) => c._id === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#182333] tracking-tight">Financial Ledger</h1>
          <p className="text-xs font-sans text-[#697586] mt-0.5">
            Progressive chronological receivables ledger and centralized company transaction audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Mode */}
          <div className="flex items-center bg-white border border-[#E2E7ED] rounded-lg p-1 shadow-subtle text-xs font-medium font-sans">
            <button
              onClick={() => setViewMode('client')}
              className={`px-3 py-1.5 rounded transition-colors ${
                viewMode === 'client'
                  ? 'bg-[#52799D] text-white'
                  : 'text-[#697586] hover:text-[#182333]'
              }`}
            >
              Client Ledger
            </button>
            <button
              onClick={() => setViewMode('company')}
              className={`px-3 py-1.5 rounded transition-colors ${
                viewMode === 'company'
                  ? 'bg-[#52799D] text-white'
                  : 'text-[#697586] hover:text-[#182333]'
              }`}
            >
              Consolidated Company Ledger
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#233D5B] hover:bg-[#14243A] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#287A57] hover:bg-[#1e5d42] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Client Selector Header */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E7ED] shadow-subtle space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {viewMode === 'client' && (
            <div className="md:col-span-2">
              <label className="block text-[#182333] font-medium font-sans mb-1 text-xs">
                Select Client Account <span className="text-[#B84B4B]">*</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] outline-none text-xs text-[#182333] font-medium font-sans"
              >
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.clientId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[#697586] font-medium font-sans mb-1 text-xs">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] outline-none text-xs text-[#182333] font-sans"
            />
          </div>

          <div>
            <label className="block text-[#697586] font-medium font-sans mb-1 text-xs">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] outline-none text-xs text-[#182333] font-sans"
            />
          </div>

          <div>
            <label className="block text-[#697586] font-medium font-sans mb-1 text-xs">Transaction Type</label>
            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] outline-none text-xs text-[#182333] font-sans"
            >
              <option value="all">All Transaction Types</option>
              <option value="INVOICE_ISSUED">Invoice Issued (Debit)</option>
              <option value="PAYMENT_RECEIVED">Payment Received (Credit)</option>
              <option value="ADVANCE_RECEIVED">Advance Received (Credit)</option>
              <option value="ADVANCE_ALLOCATED">Advance Allocated</option>
              <option value="REFUND_ISSUED">Refund Issued (Debit)</option>
              <option value="CREDIT_NOTE">Credit Note (Credit)</option>
              <option value="DEBIT_NOTE">Debit Note (Debit)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#697586] font-medium font-sans mb-1 text-xs">Division Filter</label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] outline-none text-xs text-[#182333] font-sans"
            >
              <option value="all">All Divisions</option>
              {divisions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Summary Cards */}
        {viewMode === 'client' && ledgerData?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-[#E2E7ED] text-xs font-sans">
            <div className="p-3 bg-[#F4F7FA] rounded-lg border border-[#E2E7ED]">
              <span className="text-[10px] text-[#697586] font-semibold uppercase tracking-wider">Opening Balance</span>
              <div className="text-base font-semibold font-financial text-[#182333] mt-0.5">
                {formatINR(ledgerData.summary.openingBalance)}
              </div>
            </div>
            <div className="p-3 bg-[#FDEFEF] border border-[#F7C6C6] rounded-lg">
              <span className="text-[10px] text-[#B84B4B] font-semibold uppercase tracking-wider">Total Debits (+)</span>
              <div className="text-base font-semibold font-financial text-[#B84B4B] mt-0.5">
                {formatINR(ledgerData.summary.totalDebit)}
              </div>
            </div>
            <div className="p-3 bg-[#E9F5EF] border border-[#BBE2CF] rounded-lg">
              <span className="text-[10px] text-[#287A57] font-semibold uppercase tracking-wider">Total Credits (-)</span>
              <div className="text-base font-semibold font-financial text-[#287A57] mt-0.5">
                {formatINR(ledgerData.summary.totalCredit)}
              </div>
            </div>
            <div className="p-3 bg-[#EEF4F8] border border-[#DCE7F0] rounded-lg">
              <span className="text-[10px] text-[#233D5B] font-semibold uppercase tracking-wider">Unallocated Advances</span>
              <div className="text-base font-semibold font-financial text-[#233D5B] mt-0.5">
                {formatINR(ledgerData.summary.unallocatedAdvances)}
              </div>
            </div>
            <div
              className={`p-3 rounded-lg border ${
                ledgerData.summary.currentOutstanding > 0
                  ? 'bg-[#FDEFEF] border-[#F7C6C6]'
                  : 'bg-[#E9F5EF] border-[#BBE2CF]'
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  ledgerData.summary.currentOutstanding > 0 ? 'text-[#B84B4B]' : 'text-[#287A57]'
                }`}
              >
                Current Outstanding Due
              </span>
              <div
                className={`text-base font-semibold font-financial mt-0.5 ${
                  ledgerData.summary.currentOutstanding > 0 ? 'text-[#B84B4B]' : 'text-[#287A57]'
                }`}
              >
                {formatINR(ledgerData.summary.currentOutstanding)}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'company' && companyLedgerData?.summary && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E2E7ED] text-xs font-sans">
            <div className="p-3 bg-[#FDEFEF] border border-[#F7C6C6] rounded-lg">
              <span className="text-[10px] text-[#B84B4B] font-semibold uppercase tracking-wider">Company Total Debits (+)</span>
              <div className="text-lg font-semibold font-financial text-[#B84B4B] mt-0.5">
                {formatINR(companyLedgerData.summary.totalDebit)}
              </div>
            </div>
            <div className="p-3 bg-[#E9F5EF] border border-[#BBE2CF] rounded-lg">
              <span className="text-[10px] text-[#287A57] font-semibold uppercase tracking-wider">Company Total Credits (-)</span>
              <div className="text-lg font-semibold font-financial text-[#287A57] mt-0.5">
                {formatINR(companyLedgerData.summary.totalCredit)}
              </div>
            </div>
            <div className="p-3 bg-[#F4F7FA] rounded-lg border border-[#E2E7ED]">
              <span className="text-[10px] text-[#697586] font-semibold uppercase tracking-wider">Net Company Receivables</span>
              <div className="text-lg font-semibold font-financial text-[#182333] mt-0.5">
                {formatINR(companyLedgerData.summary.netReceivables)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E7ED] text-[#697586] font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Transaction ID</th>
                {viewMode === 'company' && <th className="py-3 px-3">Client</th>}
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Reference Document</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Debit (INR +)</th>
                <th className="py-3 px-3 text-right">Credit (INR -)</th>
                <th className="py-3 px-3 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7ED]">
              {(viewMode === 'client' ? ledgerData?.entries : companyLedgerData?.entries)?.map((e) => (
                <tr key={e._id} className="hover:bg-[#F4F7FA] transition-colors">
                  <td className="py-3 px-3 whitespace-nowrap text-[#697586] font-financial">
                    {formatDate(e.date)}
                  </td>
                  <td className="py-3 px-3 font-financial text-[11px] font-semibold text-[#233D5B]">
                    {e.transactionId}
                  </td>
                  {viewMode === 'company' && (
                    <td className="py-3 px-3 font-semibold text-[#182333]">{e.client?.name}</td>
                  )}
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium font-sans uppercase ${
                        e.debit > 0
                          ? 'bg-[#FDEFEF] text-[#B84B4B] border border-[#F7C6C6]'
                          : e.credit > 0
                          ? 'bg-[#E9F5EF] text-[#287A57] border border-[#BBE2CF]'
                          : 'bg-[#F4F7FA] text-[#697586] border border-[#E2E7ED]'
                      }`}
                    >
                      {e.entryType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-financial text-xs text-[#182333]">{e.referenceNumber}</td>
                  <td className="py-3 px-3 text-[#697586] max-w-sm truncate">{e.description}</td>
                  <td className="py-3 px-3 text-right font-financial font-medium text-[#B84B4B]">
                    {e.debit > 0 ? formatINR(e.debit) : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-financial font-medium text-[#287A57]">
                    {e.credit > 0 ? formatINR(e.credit) : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-financial font-semibold text-[#182333]">
                    {formatINR(e.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {((viewMode === 'client' && (!ledgerData?.entries || ledgerData?.entries?.length === 0)) ||
            (viewMode === 'company' && (!companyLedgerData?.entries || companyLedgerData?.entries?.length === 0))) && !loading && (
            <EmptyState
              icon={BookOpen}
              title="Clean Ledger Balance"
              description="No debit or credit entries have been posted yet. Entries will post automatically as invoices and payments are recorded."
            />
          )}
        </div>
      </div>
    </div>
  );
}

