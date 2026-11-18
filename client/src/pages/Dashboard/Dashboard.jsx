import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Milestone,
} from 'lucide-react';
import api from '../../api';
import { formatINR, formatDate } from '../../utils/formatters';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [division, setDivision] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalContractValue: 0,
    milestoneCompletionRate: 0,
    totalMilestonesCount: 0,
    completedMilestonesCount: 0,
  };

  const projectAnalysis = data?.projectAnalysis || {
    statusCounts: {},
    detailedProjects: [],
    divisionProjects: [],
  };

  const revenueSummary = data?.revenueSummary || {
    totalInvoiced: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    collectionRate: 0,
    recentInvoices: [],
  };

  const filteredProjects = projectAnalysis.detailedProjects.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* 1. Header (Only Projects Focused, Zero Shortcuts) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E7ED]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182333] tracking-tight font-display">
            Project Operations & Delivery Intelligence
          </h1>
          <p className="text-xs text-[#697586] mt-0.5 font-sans">
            Enterprise project pipeline, milestone completion tracking, and division capacity analysis
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

      {/* 2. Project Health & Scale Metrics (Top Overview) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Active Contracts */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Active Engagements</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#233D5B]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#182333] font-financial">
            {metrics.activeProjects}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Out of {metrics.totalProjects} total initiated
          </div>
        </div>

        {/* Total Contracted Project Value */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Contracted Portfolio</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#52799D]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#52799D] font-financial">
            {formatINR(metrics.totalContractValue)}
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            Total committed engagement value
          </div>
        </div>

        {/* Milestone Completion Rate */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Milestone Velocity</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#287A57]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#287A57] font-financial">
            {metrics.milestoneCompletionRate}%
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            {metrics.completedMilestonesCount}/{metrics.totalMilestonesCount} milestones delivered
          </div>
        </div>

        {/* Completed Delivery */}
        <div className="bg-white rounded-lg p-5 border border-[#E2E7ED] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#697586]">Delivery Status</span>
            <div className="w-8 h-8 rounded bg-[#F4F7FA] border border-[#E2E7ED] flex items-center justify-center text-[#B98232]">
              <Milestone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#182333] font-financial">
            {metrics.completedProjects} Completed
          </div>
          <div className="text-[11px] text-[#697586] mt-1 font-sans">
            {metrics.onHoldProjects > 0 ? `${metrics.onHoldProjects} on hold` : 'All projects on schedule'}
          </div>
        </div>
      </div>

      {/* 3. Division Project Capacity & Status Distribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project Pipeline by Status */}
        <div className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="mb-4 pb-2 border-b border-[#E2E7ED]">
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Pipeline Stage Breakdown
            </h3>
            <p className="text-xs text-[#697586] font-sans">Active contract lifecycle distribution</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'In Progress', count: projectAnalysis.statusCounts['In Progress'] || 0, color: 'bg-[#287A57]' },
              { label: 'Approved', count: projectAnalysis.statusCounts['Approved'] || 0, color: 'bg-[#52799D]' },
              { label: 'Completed', count: projectAnalysis.statusCounts['Completed'] || 0, color: 'bg-[#233D5B]' },
              { label: 'Quotation Sent', count: projectAnalysis.statusCounts['Quotation Sent'] || 0, color: 'bg-[#B98232]' },
              { label: 'On Hold', count: projectAnalysis.statusCounts['On Hold'] || 0, color: 'bg-[#B84B4B]' },
            ].map((stage, idx) => {
              const pct = metrics.totalProjects > 0 ? Math.round((stage.count / metrics.totalProjects) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="text-[#182333] font-medium">{stage.label}</span>
                    <span className="text-[#697586] font-mono">{stage.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EEF4F8] rounded-full overflow-hidden">
                    <div className={`h-full ${stage.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Division Engagement & Scale Distribution */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#E2E7ED] shadow-subtle p-5">
          <div className="mb-4 pb-2 border-b border-[#E2E7ED]">
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Division Project Allocation & Portfolio Scale
            </h3>
            <p className="text-xs text-[#697586] font-sans">
              Contract value distribution across Focsera's 9 business verticals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projectAnalysis.divisionProjects.length > 0 ? (
              projectAnalysis.divisionProjects.map((div, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E7ED] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#182333] block truncate max-w-[160px]">
                      {div.name}
                    </span>
                    <span className="text-[11px] text-[#697586]">
                      {div.count} active project{div.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-financial font-medium text-xs text-[#52799D] block">
                      {formatINR(div.totalValue)}
                    </span>
                    <span className="text-[10px] text-[#697586]">Committed</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-[#697586]">
                No division projects currently allocated.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Detailed Project Execution & Milestone Horizon Table */}
      <div className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-[#E2E7ED] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#182333] font-display">
              Enterprise Project Portfolio & Milestone Tracking
            </h3>
            <p className="text-xs text-[#697586] font-sans">
              In-depth execution health, client accounts, timeline, and upcoming deliverables
            </p>
          </div>

          {/* Filter by Status */}
          <div className="inline-flex items-center gap-1.5">
            <span className="text-[11px] text-[#697586]">Filter Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E7ED] rounded text-xs text-[#182333] outline-none"
            >
              <option value="all">All Stages</option>
              <option value="In Progress">In Progress</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#FFFFFF] border-b border-[#E2E7ED] text-[#697586] uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Project ID & Name</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Division</th>
                <th className="py-3 px-4 text-right">Agreed Value</th>
                <th className="py-3 px-4">Milestone Progress</th>
                <th className="py-3 px-4">Next Deliverable</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((prj) => (
                  <tr key={prj._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#182333] text-xs">{prj.name}</div>
                      <div className="text-[10px] font-mono text-[#697586]">{prj.projectId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#182333] font-medium">{prj.client?.name || 'Client Account'}</div>
                      {prj.client?.businessName && (
                        <div className="text-[10px] text-[#697586]">{prj.client.businessName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#EEF4F8] text-[#52799D] font-medium text-[10px] border border-[#DCE7F0]">
                        {prj.division?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-financial font-medium text-[#182333]">
                      {formatINR(prj.agreedProjectValue)}
                    </td>
                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#697586]">
                          {prj.milestonesPaid}/{prj.milestonesCount} Paid
                        </span>
                        <span className="font-medium text-[#182333] font-financial">{prj.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EEF4F8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#287A57] rounded-full"
                          style={{ width: `${prj.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {prj.nextMilestone ? (
                        <div>
                          <span className="font-medium text-[#182333] block truncate max-w-[150px]">
                            {prj.nextMilestone.name}
                          </span>
                          <span className="text-[10px] text-[#697586] font-financial">
                            {formatINR(prj.nextMilestone.amount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#697586] text-[11px] italic">Completed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F4F7FA] text-[#182333] border border-[#E2E7ED]">
                        {prj.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-xs text-[#697586]">
                    No projects found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Lowest Priority: Financial & Revenue Snapshot (At the Very Bottom) */}
      <div className="pt-4 border-t border-[#E2E7ED]">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#697586]" />
          <h3 className="text-xs font-semibold text-[#697586] uppercase tracking-wider font-mono">
            Secondary Reference: Invoicing & Revenue Snapshot
          </h3>
        </div>

        <div className="bg-white rounded-lg border border-[#E2E7ED] p-4 shadow-subtle grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E7ED]">
            <span className="text-[11px] text-[#697586] block">Total Invoiced</span>
            <span className="text-base font-bold text-[#182333] font-financial mt-0.5 block">
              {formatINR(revenueSummary.totalInvoiced)}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E7ED]">
            <span className="text-[11px] text-[#697586] block">Cleared Collections</span>
            <span className="text-base font-bold text-[#287A57] font-financial mt-0.5 block">
              {formatINR(revenueSummary.totalReceived)}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E7ED]">
            <span className="text-[11px] text-[#697586] block">Outstanding Receivables</span>
            <span className="text-base font-bold text-[#B98232] font-financial mt-0.5 block">
              {formatINR(revenueSummary.totalOutstanding)}
            </span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E7ED]">
            <span className="text-[11px] text-[#697586] block">Collection Efficiency</span>
            <span className="text-base font-bold text-[#52799D] font-financial mt-0.5 block">
              {revenueSummary.collectionRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
