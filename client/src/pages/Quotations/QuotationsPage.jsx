import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Download,
} from 'lucide-react';
import api from '../../api';
import QuotationTemplate from '../../components/documents/QuotationTemplate';
import QuotationFormPage from './QuotationFormPage';
import StatusBadge from '../../components/common/StatusBadge';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

export default function QuotationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [quotations, setQuotations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const viewQuotationId = searchParams.get('view');
  const isCreateMode = searchParams.get('create') === 'true';

  useEffect(() => {
    fetchDivisionsAndCompany();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [divisionFilter, statusFilter]);

  const fetchDivisionsAndCompany = async () => {
    try {
      const [dRes, cRes] = await Promise.all([api.get('/divisions'), api.get('/company')]);
      if (dRes.data.success) setDivisions(dRes.data.data);
      if (cRes.data.success) setCompany(cRes.data.data);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/quotations?search=${encodeURIComponent(search)}&division=${divisionFilter}&status=${statusFilter}`
      );
      if (res.data.success) {
        setQuotations(res.data.data);
      }
    } catch (err) {
      error('Failed to load quotations.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async (quotation) => {
    try {
      const res = await api.post(`/quotations/${quotation._id}/convert`, {});
      success(res.data.message || 'Quotation converted to Tax Invoice successfully!');
      navigate(`/invoices?view=${res.data.data.invoice._id}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to convert quotation.');
    }
  };

  // If in Create Mode
  if (isCreateMode) {
    return (
      <QuotationFormPage
        onBack={() => setSearchParams({})}
        onSuccess={(newQuo) => {
          setSearchParams({ view: newQuo._id });
        }}
      />
    );
  }

  // If in View Mode
  if (viewQuotationId) {
    const selectedQuotation = quotations.find((q) => q._id === viewQuotationId);
    return (
      <QuotationTemplate
        quotation={selectedQuotation}
        company={company}
        onBack={() => setSearchParams({})}
        onConvertToInvoice={handleConvertToInvoice}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">QUOTATIONS</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cost proposals, customized service packages & 1-click invoice conversion
          </p>
        </div>

        <button
          onClick={() => setSearchParams({ create: 'true' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quotation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchQuotations()}
            placeholder="Search quotation number, client..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 text-xs outline-none text-slate-900 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Converted">Converted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3.5 px-4">Quotation #</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Division & Project</th>
                <th className="py-3.5 px-4">Date & Validity</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map((q) => (
                <tr
                  key={q._id}
                  onClick={() => setSearchParams({ view: q._id })}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-mono text-xs">{q.quotationNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{q.client?.name}</div>
                    {q.client?.businessName && (
                      <div className="text-slate-400 text-[11px]">{q.client.businessName}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-focsera-700">{q.division?.name}</div>
                    {q.project?.name && <div className="text-slate-400 text-[11px]">{q.project.name}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div>{formatDate(q.quotationDate)}</div>
                    <div className="text-[11px] text-slate-400">Valid: {formatDate(q.validUntil)}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                    {formatINR(q.grandTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={q.status} type="quotation" />
                  </td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSearchParams({ view: q._id })}
                        className="p-1.5 text-slate-400 hover:text-focsera-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View Quotation"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {q.status !== 'Converted' && (
                        <button
                          onClick={() => handleConvertToInvoice(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] border border-indigo-200 transition-colors"
                          title="Convert to Invoice"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {quotations.length === 0 && !loading && (
            <EmptyState
              icon={FileSpreadsheet}
              title="No Quotations Created"
              description="Generate formal project estimates, event proposals, or design quotations with 1-click invoice conversion."
              actionLabel="Draft New Quotation"
              onAction={() => setSearchParams({ create: 'true' })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

