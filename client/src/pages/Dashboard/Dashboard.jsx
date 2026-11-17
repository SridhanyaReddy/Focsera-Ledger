import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  Briefcase,
  Users,
  ShieldAlert,
  Wallet,
  Layers,
  BarChart3,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
} from 'lucide-react';
import api from '../../api';
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
    totalUnallocatedAdvances: 0,
    activeProjects: 0,
    totalClients: 0,
  };

  const aging = data?.charts?.agingBuckets || {
    current: 0,
    days16to30: 0,
    days31to60: 0,
    days60plus: 0,
  };

  const collectionRate =
    metrics.totalInvoiced > 0
      ? Math.min(100, Math.round((metrics.totalReceived / metrics.totalInvoiced) * 100))
      : 0;

  const DIVISION_COLORS = [
    '#14243A', '#233D5B', '#52799D', '#287A57', '#B98232', '#7599BD', '#345275', '#B84B4B', '#697586'
  ];

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* 1. Header with Period & Division Filter Controls (No Shortcuts) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E7ED]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182333] tracking-tight font-display">
            Financial & Operational Intelligence
          </h1>
          <p className="text-xs text-[#697586] mt-0.5 font-sans">
            Executive cashflow health, division performance & receivables risk monitoring
          </p>
        </div>

        {/* Analytical Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="inline-flex items-center p-0.5 bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] text-xs font-sans">
            {[
              { id: 'this_month', label: 'Month' },
              { id: 'this_quarter', label: 'Quarter' },
              { id: 'this_fy', label: 'FY 2026-27' },
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
              className="appearance-none pl-3 pr-8 py-1.5 bg-[#FFFFFF] border border-[#E2E7ED] rounded-lg text-xs font-sans font-medium text-[#182333] outline-none focus:border-[#52799D] transition-colors cursor-pointer"
            >
              <option value="all">All 9 Business Divisions</option>
              {divisions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Critical Warning Banner for Overdue Risk */}
      {metrics.overdueAmount > 0 && (
        <div className="bg-[#FDEFEF] border border-[#F7C6C6] rounded-lg p-3.5 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-[#B84B4B] shrink-0" />
          <span className="text-xs text-[#182333] font-sans">
            <span className="font-semibold text-[#B84B4B]">Aging Risk Alert:</span>{' '}
            <span className="font-financial font-medium">{formatINR(metrics.overdueAmount)}</span> is past agreed payment terms across client accounts.
          </span>
        </div>
      )}

      {/* 3. Executive KPI Suite: 4 Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cleared Cash Inflow */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Realized Cash Collections</span>
            <TrendingUp className="w-4 h-4 text-[#287A57]" />
          </div>
          <div className="text-2xl font-bold text-[#287A57] font-financial">
            {formatINR(metrics.totalReceived)}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            {collectionRate}% effective collection rate
          </div>
        </div>

        {/* Net Receivables Balance */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Receivables Outstanding</span>
            <Clock className="w-4 h-4 text-[#B98232]" />
          </div>
          <div className="text-2xl font-bold text-[#B98232] font-financial">
            {formatINR(metrics.totalOutstanding)}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Net pending across accounts
          </div>
        </div>

        {/* Unallocated Retainers in Hand */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Advances in Hand</span>
            <Wallet className="w-4 h-4 text-[#52799D]" />
          </div>
          <div className="text-2xl font-bold text-[#52799D] font-financial">
            {formatINR(metrics.totalUnallocatedAdvances || 0)}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Unbilled retainer liquidity
          </div>
        </div>

        {/* Operational Portfolio Volume */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586] font-sans">Active Enterprise Scope</span>
            <Briefcase className="w-4 h-4 text-[#233D5B]" />
          </div>
          <div className="text-2xl font-bold text-[#182333] font-financial">
            {metrics.activeProjects || 0} Projects
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Across {metrics.totalClients || 0} active corporate accounts
          </div>
        </div>
      </div>

      {/* 4. Receivables Aging Distribution (Cashflow Risk Breakdown) */}
      <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E2E7ED] shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Receivables Aging Analysis
            </h3>
            <p className="text-xs text-[#697586] font-sans">
              Maturity breakdown of outstanding balances across maturity buckets
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#697586] bg-[#F4F7FA] px-2 py-0.5 rounded border border-[#E2E7ED] self-start sm:self-auto">
            Statutory Accounting Norms
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E7ED]">
            <span className="text-[11px] font-semibold text-[#287A57] uppercase tracking-wider block">0 – 15 Days (Current)</span>
            <span className="text-lg font-bold text-[#182333] font-financial mt-1 block">
              {formatINR(aging.current)}
            </span>
            <span className="text-[10px] text-[#697586]">Regular billing window</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E7ED]">
            <span className="text-[11px] font-semibold text-[#52799D] uppercase tracking-wider block">16 – 30 Days</span>
            <span className="text-lg font-bold text-[#182333] font-financial mt-1 block">
              {formatINR(aging.days16to30)}
            </span>
            <span className="text-[10px] text-[#697586]">Follow-up window</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
            <span className="text-[11px] font-semibold text-[#B98232] uppercase tracking-wider block">31 – 60 Days</span>
            <span className="text-lg font-bold text-[#B98232] font-financial mt-1 block">
              {formatINR(aging.days31to60)}
            </span>
            <span className="text-[10px] text-[#B98232]">Escalated payment review</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
            <span className="text-[11px] font-semibold text-[#B84B4B] uppercase tracking-wider block">60+ Days (Critical)</span>
            <span className="text-lg font-bold text-[#B84B4B] font-financial mt-1 block">
              {formatINR(aging.days60plus)}
            </span>
            <span className="text-[10px] text-[#B84B4B]">Requires executive action</span>
          </div>
        </div>
      </div>

      {/* 5. Monthly Cash Inflow Trends & Division Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Cashflow Analytics */}
        <div className="lg:col-span-2 bg-[#FFFFFF] p-5 rounded-lg border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#182333] font-display">
                Monthly Inflows vs Collections
              </h3>
              <p className="text-xs text-[#697586] font-sans">
                Realized collections tracking compared against historical revenue
              </p>
            </div>
            <span className="text-[11px] font-financial text-[#697586] bg-[#F4F7FA] px-2 py-0.5 rounded border border-[#E2E7ED]">
              INR (₹)
            </span>
          </div>

          <div className="h-64 w-full pt-1">
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
                  <Bar dataKey="received" name="Cleared Cash" fill="#287A57" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="invoiced" name="Billed Amount" fill="#14243A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#697586] font-sans">
                <span>No historical transaction data recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* 9-Division Contribution Breakdown */}
        <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-[#182333] font-display">
                Division Contribution
              </h3>
              <span className="text-[11px] font-mono text-[#52799D] font-medium">9 DIVISIONS</span>
            </div>
            <p className="text-xs text-[#697586] font-sans">Revenue distribution across Focsera verticals</p>
          </div>

          <div className="py-4 flex-1 flex flex-col justify-center">
            {data?.charts?.divisionRevenue?.length > 0 ? (
              <div className="space-y-3">
                {data.charts.divisionRevenue.slice(0, 6).map((divItem, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#182333] truncate max-w-[150px] text-xs font-medium">
                        {divItem.name}
                      </span>
                      <span className="font-financial font-medium text-[#182333] text-xs">
                        {formatINR(divItem.amount)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EEF4F8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: DIVISION_COLORS[idx % DIVISION_COLORS.length],
                          width: `${Math.min(
                            100,
                            Math.round((divItem.amount / (metrics.totalInvoiced || 1)) * 100)
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
                <span>No division revenue recorded yet</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-center text-[11px] font-mono text-[#697586] border-t border-[#E2E7ED]">
            Focsera Multi-Division Chart of Accounts
          </div>
        </div>
      </div>

      {/* 6. Active Project Milestone Horizon & Client Financial Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Project Milestone Health */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="mb-3 pb-2 border-b border-[#E2E7ED]">
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Enterprise Project Milestones
            </h3>
            <p className="text-xs text-[#697586] font-sans">Active contract values and completion horizon</p>
          </div>

          <div className="divide-y divide-[#EEF2F6]">
            {data?.projectHealth?.length > 0 ? (
              data.projectHealth.map((prj) => (
                <div key={prj._id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#182333] text-xs">{prj.name}</div>
                      <div className="text-[11px] text-[#697586] font-sans">
                        {prj.clientName} • <span className="text-[#52799D] font-medium">{prj.divisionName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#182333] font-financial">
                        {formatINR(prj.agreedValue)}
                      </div>
                      <div className="text-[10px] text-[#697586] font-sans">
                        {prj.completedMilestones}/{prj.totalMilestones} Milestones Paid
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-[#EEF4F8] rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-[#287A57] rounded-full"
                      style={{ width: `${prj.milestoneProgress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#697586] font-sans">
                No active projects in progress.
              </div>
            )}
          </div>
        </div>

        {/* Top Client Exposure & Liquidity Concentration */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="mb-3 pb-2 border-b border-[#E2E7ED]">
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Client Account Exposure
            </h3>
            <p className="text-xs text-[#697586] font-sans">Concentration of contracted revenue & pending balances</p>
          </div>

          <div className="divide-y divide-[#EEF2F6]">
            {data?.topClientExposures?.length > 0 ? (
              data.topClientExposures.map((cl, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center font-bold text-[11px] text-[#52799D]">
                      {cl.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#182333]">{cl.name}</div>
                      <div className="text-[11px] text-[#697586]">
                        Total Contracted: <span className="font-financial">{formatINR(cl.billed)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold font-financial text-[#B98232]">
                      {formatINR(cl.balanceDue)}
                    </div>
                    <div className="text-[10px] text-[#697586]">Balance Due</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#697586] font-sans">
                No client concentration data recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
