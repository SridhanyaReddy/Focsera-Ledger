import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  FileText,
  CreditCard,
  Building2,
  AlertCircle,
  Phone,
  Mail,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../api';
import { formatINR, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { company } = useAuth();
  const [data, setData] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [division, setDivision] = useState('all');

  useEffect(() => {
    fetchDivisions();
    fetchDashboardMetrics();
  }, [division]);

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
      const res = await api.get(`/reports/dashboard?division=${division}`);
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
    activeProjects: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingQuotations: 0,
    totalInvoiced: 0,
    totalReceived: 0,
    totalOutstanding: 0,
  };

  const projectHealth = data?.projectHealth || [];
  const recentClients = data?.recentClients || [];
  const upcomingFollowups = data?.upcomingFollowups || [];
  const pendingTodos = data?.pendingTodos || [];
  const recentInvoices = data?.recent?.invoices || [];

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* 1. Header with Operational Focus & Division Filter (No Shortcuts) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E7ED]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182333] tracking-tight font-display">
            Operations & Engagements Overview
          </h1>
          <p className="text-xs text-[#697586] mt-0.5 font-sans">
            Client accounts, enterprise project milestones, meetings & operational delivery
          </p>
        </div>

        {/* Division Filter */}
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

      {/* 2. Primary Operational KPI Cards (Top Priority: Projects & Clients) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Projects */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Active Projects</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#233D5B]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#182333] font-financial">
            {metrics.activeProjects}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            In progress & scheduled
          </div>
        </div>

        {/* Total Corporate Clients */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Client Portfolio</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#52799D]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#182333] font-financial">
            {metrics.totalClients}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Active client accounts
          </div>
        </div>

        {/* Scheduled Follow-ups & Meetings */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Follow-ups & Reviews</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#B98232]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#B98232] font-financial">
            {upcomingFollowups.length}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Scheduled client sessions
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Pending Action Tasks</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#287A57]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#287A57] font-financial">
            {pendingTodos.length}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Operational deliverables
          </div>
        </div>
      </div>

      {/* 3. Priority Row 1: Active Project Milestones & Progress (High Priority) */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E7ED]">
          <div>
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Active Project Engagements & Milestone Progress
            </h3>
            <p className="text-xs text-[#697586] font-sans">
              Ongoing contracts, division assignments, and delivery execution status
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#52799D] font-medium bg-[#F4F7FA] px-2.5 py-1 rounded border border-[#E2E7ED]">
            {projectHealth.length} Active Engagements
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectHealth.length > 0 ? (
            projectHealth.map((prj) => (
              <div key={prj._id} className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E7ED] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[#182333] text-xs leading-snug line-clamp-1">
                      {prj.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#EEF4F8] text-[#52799D] border border-[#DCE7F0] shrink-0">
                      {prj.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#697586] mt-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-[#697586]" />
                    <span className="truncate">{prj.clientName}</span>
                  </div>

                  <div className="text-[11px] text-[#52799D] font-medium mt-1 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-[#52799D]" />
                    <span>{prj.divisionName}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E7ED]">
                  <div className="flex items-center justify-between text-[11px] font-sans mb-1.5">
                    <span className="text-[#697586]">Milestone Execution</span>
                    <span className="font-medium text-[#182333] font-financial">
                      {prj.completedMilestones}/{prj.totalMilestones} Cleared ({prj.milestoneProgress}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2E7ED] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#287A57] rounded-full transition-all duration-300"
                      style={{ width: `${prj.milestoneProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-[#697586]">
              No active project engagements.
            </div>
          )}
        </div>
      </div>

      {/* 4. Priority Row 2: Client Accounts & Operational Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Client Accounts */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="mb-3 pb-2 border-b border-[#E2E7ED]">
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Client Portfolio & Corporate Accounts
            </h3>
            <p className="text-xs text-[#697586] font-sans">
              Recently onboarded clients, organization contacts & billing profiles
            </p>
          </div>

          <div className="divide-y divide-[#EEF2F6]">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <div key={client._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center font-bold text-xs text-[#52799D] shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#182333] truncate">
                        {client.name}
                        {client.businessName && (
                          <span className="text-[#697586] font-normal ml-1">({client.businessName})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#697586] flex items-center gap-2 mt-0.5 font-mono">
                        <span>{client.clientId}</span>
                        <span>•</span>
                        <span>{client.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-[#F4F7FA] text-[#697586] border border-[#E2E7ED] shrink-0">
                    {client.clientType || 'Corporate'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#697586]">
                No client profiles found.
              </div>
            )}
          </div>
        </div>

        {/* Operational Follow-ups & Scheduled Reviews */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="mb-3 pb-2 border-b border-[#E2E7ED]">
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Upcoming Follow-ups & Milestone Reviews
            </h3>
            <p className="text-xs text-[#697586] font-sans">
              Client consultations, milestone review meetings & next actions
            </p>
          </div>

          <div className="divide-y divide-[#EEF2F6]">
            {upcomingFollowups.length > 0 ? (
              upcomingFollowups.map((f) => (
                <div key={f._id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-[#182333] flex items-center gap-2">
                      <span>{f.title}</span>
                      <span className="px-1.5 py-0.2 bg-[#F4F7FA] border border-[#E2E7ED] rounded text-[10px] font-mono text-[#52799D]">
                        {f.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#697586] mt-0.5">
                      Project: <span className="font-medium text-[#182333]">{f.project?.name || 'General'}</span>
                    </div>
                    <p className="text-[11px] text-[#697586] italic mt-1 line-clamp-1">
                      "{f.notes}"
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-[#697586] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E2E7ED] block">
                      {formatDate(f.meetingDate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#697586]">
                No pending meetings or reviews scheduled.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Lowest Priority Section: Invoices & Revenue Summary (Placed at the very bottom) */}
      <div className="pt-2 border-t border-[#E2E7ED]">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#697586]" />
          <h3 className="text-xs font-semibold text-[#697586] uppercase tracking-wider font-mono">
            Secondary Reference: Invoicing & Revenue Snapshot
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Invoices Table (Compact, Low Priority) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-[#E2E7ED] p-4 shadow-subtle">
            <span className="text-xs font-medium text-[#182333] block mb-2">Recent Invoicing Records</span>
            <div className="divide-y divide-[#EEF2F6]">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <div key={inv._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-financial font-medium text-[#182333]">{inv.invoiceNumber}</span>
                      <span className="text-[#697586] ml-2 text-[11px]">{inv.client?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-financial font-medium text-[#182333]">{formatINR(inv.grandTotal)}</span>
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-[#F4F7FA] text-[#697586] border border-[#E2E7ED]">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#697586]">No invoices recorded.</div>
              )}
            </div>
          </div>

          {/* Revenue Totals (Minimized) */}
          <div className="bg-white rounded-lg border border-[#E2E7ED] p-4 shadow-subtle flex flex-col justify-between">
            <span className="text-xs font-medium text-[#182333] block">Revenue Summary</span>
            <div className="space-y-3 py-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#697586]">Total Invoiced</span>
                <span className="font-financial font-medium text-[#182333]">{formatINR(metrics.totalInvoiced)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#697586]">Cleared Collections</span>
                <span className="font-financial font-medium text-[#287A57]">{formatINR(metrics.totalReceived)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#697586]">Outstanding Receivables</span>
                <span className="font-financial font-medium text-[#B98232]">{formatINR(metrics.totalOutstanding)}</span>
              </div>
            </div>
            <div className="text-[10px] text-[#697586] text-center pt-2 border-t border-[#EEF2F6]">
              Financial year totals
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
