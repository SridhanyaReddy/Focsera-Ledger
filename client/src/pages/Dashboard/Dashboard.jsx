import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  Briefcase,
  Users,
  FileText,
  FileSpreadsheet,
  ArrowUpRight,
  CreditCard,
  Plus,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';
import api from '../../api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { formatINR, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [data, setData] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [period, setPeriod] = useState('this_fy');
  const [division, setDivision] = useState('all');

  useEffect(() => {
    fetchDivisions();
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [period, division]);

  const fetchDivisions = async () => {
    try {
      const res = await api.get('/divisions');
      if (res.data.success) {
        setDivisions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching divisions:', err);
    }
  };

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/dashboard?period=${period}&division=${division}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics || {
    totalInvoiced: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    activeProjects: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingQuotations: 0,
  };

  const collectionRate =
    metrics.totalInvoiced > 0
      ? Math.min(100, Math.round((metrics.totalReceived / metrics.totalInvoiced) * 100))
      : 0;

  const isCleanSlate = (metrics.totalClients || 0) === 0 && (metrics.totalInvoices || 0) === 0;

  const DIVISION_COLORS = [
    '#14243A', '#233D5B', '#52799D', '#287A57', '#B98232', '#7599BD', '#345275', '#B84B4B', '#697586'
  ];

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* 1. Header with Space Grotesk Title and Geist Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E7ED]">
        <div>
          <h1 className="text-2xl font-bold text-[#182333] tracking-tight font-display">
            Dashboard
          </h1>
          <p className="text-xs text-[#697586] mt-0.5 font-sans">
            Overview of invoicing, payment collections, and receivables
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="inline-flex items-center p-0.5 bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] text-xs font-sans">
            {[
              { id: 'this_month', label: 'Month' },
              { id: 'this_quarter', label: 'Quarter' },
              { id: 'this_fy', label: 'Financial Year' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  period === tab.id
                    ? 'bg-[#14243A] text-white font-medium shadow-subtle'
                    : 'text-[#697586] hover:text-[#182333]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Division Selector */}
          <div className="relative">
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 bg-[#FFFFFF] border border-[#E2E7ED] rounded-lg text-xs font-sans font-medium text-[#182333] outline-none focus:border-[#52799D] transition-colors cursor-pointer"
            >
              <option value="all">All Divisions</option>
              {divisions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-[#697586] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Action Trigger */}
          <button
            onClick={() => navigate('/invoices?create=true')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#52799D] hover:bg-[#233D5B] text-white text-xs font-medium font-sans rounded-lg transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Critical Warning Banner if past-due invoices exist */}
      {metrics.overdueAmount > 0 && (
        <div className="bg-[#FDEFEF] border border-[#F7C6C6] rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-[#B84B4B] shrink-0" />
            <span className="text-xs text-[#182333] font-sans">
              <span className="font-semibold text-[#B84B4B]">Overdue:</span>{' '}
              <span className="font-financial font-medium">{formatINR(metrics.overdueAmount)}</span> is past due date across client accounts.
            </span>
          </div>
          <button
            onClick={() => navigate('/reports?type=overdue_invoices')}
            className="text-xs font-sans font-medium text-[#B84B4B] hover:underline shrink-0"
          >
            View overdue invoices →
          </button>
        </div>
      )}

      {/* 3. Core Financial Overview: 4 Subtle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Total Invoiced</span>
            <FileText className="w-4 h-4 text-[#52799D]" />
          </div>
          <div className="text-2xl font-bold text-[#182333] font-financial">
            {formatINR(metrics.totalInvoiced)}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            {metrics.totalInvoices} invoice{metrics.totalInvoices === 1 ? '' : 's'} issued
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Total Received</span>
            <TrendingUp className="w-4 h-4 text-[#287A57]" />
          </div>
          <div className="text-2xl font-bold text-[#287A57] font-financial">
            {formatINR(metrics.totalReceived)}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            {collectionRate}% collection rate
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Outstanding Balance</span>
            <Clock className="w-4 h-4 text-[#B98232]" />
          </div>
          <div className="text-2xl font-bold text-[#B98232] font-financial">
            {formatINR(metrics.totalOutstanding)}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Net receivable due
          </div>
        </div>

        {/* Operational Scope */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Active Overview</span>
            <Briefcase className="w-4 h-4 text-[#233D5B]" />
          </div>
          <div className="text-2xl font-bold text-[#182333] font-financial">
            {metrics.activeProjects || 0}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            {metrics.totalClients || 0} clients • {metrics.pendingQuotations || 0} pending quotes
          </div>
        </div>
      </div>

      {/* 4. Clean Slate Gentle Guide (When database is empty) */}
      {isCleanSlate && (
        <div className="bg-white rounded-lg border border-[#E2E7ED] p-6 shadow-subtle">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-[#182333] font-display">
              Ready for operations
            </h2>
            <p className="text-xs text-[#697586] mt-1 font-sans">
              Get started by adding a client or issuing your first invoice. All ledger balances and division metrics will update automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-4">
            <button
              onClick={() => navigate('/clients?create=true')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FA] hover:bg-[#EEF4F8] text-[#182333] text-xs font-medium font-sans rounded-lg border border-[#E2E7ED] transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#52799D]" />
              <span>Add Client</span>
            </button>
            <button
              onClick={() => navigate('/projects?create=true')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FA] hover:bg-[#EEF4F8] text-[#182333] text-xs font-medium font-sans rounded-lg border border-[#E2E7ED] transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#233D5B]" />
              <span>Create Project</span>
            </button>
            <button
              onClick={() => navigate('/invoices?create=true')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#52799D] hover:bg-[#233D5B] text-white text-xs font-medium font-sans rounded-lg transition-colors shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Invoicing Trend & Division Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#FFFFFF] p-5 rounded-lg border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#182333] font-display">
                Monthly Invoicing vs Collections
              </h3>
              <p className="text-xs text-[#697586] font-sans">
                Billed amounts compared against cleared payments
              </p>
            </div>
            <span className="text-[11px] font-financial text-[#697586] bg-[#F4F7FA] px-2 py-0.5 rounded border border-[#E2E7ED]">
              INR (₹)
            </span>
          </div>

          <div className="h-60 w-full pt-1">
            {data?.charts?.monthlyTrends?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.monthlyTrends}>
                  <XAxis
                    dataKey="month"
                    stroke="#697586"
                    fontSize={11}
                    fontFamily="IBM Plex Mono"
                  />
                  <YAxis
                    stroke="#697586"
                    fontSize={11}
                    fontFamily="IBM Plex Mono"
                    tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + 'k' : v}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatINR(val), '']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      color: '#182333',
                      borderRadius: '6px',
                      border: '1px solid #E2E7ED',
                      fontFamily: 'IBM Plex Mono',
                      fontSize: '11px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="invoiced" name="Invoiced" fill="#14243A" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="received" name="Received" fill="#287A57" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#697586] font-sans">
                <span>No monthly transaction data recorded yet.</span>
                <span className="text-[11px] text-[#697586]/70 mt-1">Data will populate automatically as invoices and payments are recorded</span>
              </div>
            )}
          </div>
        </div>

        {/* Division Breakdown */}
        <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-[#182333] font-display">
                Division Revenue
              </h3>
              <span className="text-[11px] font-mono text-[#52799D] font-medium">9 DIVISIONS</span>
            </div>
            <p className="text-xs text-[#697586] font-sans">Revenue contribution by internal division</p>
          </div>

          <div className="py-4 flex-1 flex flex-col justify-center">
            {data?.charts?.divisionBreakup?.length > 0 ? (
              <div className="space-y-2.5">
                {data.charts.divisionBreakup.slice(0, 5).map((divItem, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#182333] truncate max-w-[140px] text-xs font-medium">
                        {divItem.name}
                      </span>
                      <span className="font-financial font-medium text-[#182333] text-xs">
                        {formatINR(divItem.value)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EEF4F8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: DIVISION_COLORS[idx % DIVISION_COLORS.length],
                          width: `${Math.min(
                            100,
                            Math.round((divItem.value / (metrics.totalInvoiced || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-xs text-[#697586] font-sans text-center">
                <Layers className="w-5 h-5 text-[#697586]/60 mb-2" />
                <span>No division revenue yet</span>
                <span className="text-[11px] text-[#697586]/70 mt-0.5">Predefined divisions active</span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/reports?type=division_revenue')}
            className="w-full py-2 bg-[#F4F7FA] hover:bg-[#EEF4F8] text-[#182333] text-xs font-sans font-medium rounded-lg border border-[#E2E7ED] transition-colors"
          >
            View all divisions →
          </button>
        </div>
      </div>

      {/* 6. Recent Invoices & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Invoices */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2E7ED]">
            <div>
              <h3 className="text-sm font-semibold text-[#182333] font-display">
                Recent Invoices
              </h3>
              <p className="text-xs text-[#697586] font-sans">Latest billing documents</p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-sans font-medium text-[#52799D] hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="divide-y divide-[#EEF2F6]">
            {data?.recent?.invoices?.length > 0 ? (
              data.recent.invoices.map((inv) => (
                <div
                  key={inv._id}
                  onClick={() => navigate(`/invoices?view=${inv._id}`)}
                  className="py-2.5 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-financial font-medium text-[#182333] text-xs">
                        {inv.invoiceNumber}
                      </span>
                      <StatusBadge status={inv.status} type="invoice" />
                    </div>
                    <div className="text-[11px] text-[#697586] mt-0.5 font-sans">
                      {inv.client?.name} • {formatDate(inv.invoiceDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#182333] font-financial">
                      {formatINR(inv.grandTotal)}
                    </div>
                    <div className="text-[11px] font-financial text-[#697586]">
                      Bal: {formatINR(inv.outstandingBalance)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#697586] font-sans">
                No invoices issued yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Collections */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2E7ED]">
            <div>
              <h3 className="text-sm font-semibold text-[#182333] font-display">
                Recent Collections
              </h3>
              <p className="text-xs text-[#697586] font-sans">Cleared receipts and settlements</p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="text-xs font-sans font-medium text-[#52799D] hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="divide-y divide-[#EEF2F6]">
            {data?.recent?.payments?.length > 0 ? (
              data.recent.payments.map((p) => (
                <div
                  key={p._id}
                  onClick={() =>
                    p.receipt && navigate(`/payments?receipt=${p.receipt._id || p.receipt}`)
                  }
                  className="py-2.5 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-financial font-medium text-[#182333] text-xs">
                        {p.paymentNumber}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#E9F5EF] text-[#287A57] border border-[#BBE2CF] rounded text-[10px] font-sans font-medium">
                        {p.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#697586] mt-0.5 font-sans">
                      {p.client?.name} • {formatDate(p.paymentDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#287A57] font-financial">
                      +{formatINR(p.amount)}
                    </div>
                    <div className="text-[10px] text-[#697586] font-financial">
                      {p.referenceNumber || 'Direct'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#697586] font-sans">
                No payment receipts recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
