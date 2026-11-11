import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Layers,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import api from '../../api';
import StatusBadge from '../../components/common/StatusBadge';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function ProjectDetailPage({ projectId, onBack }) {
  const { error } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectOverview();
  }, [projectId]);

  const fetchProjectOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      error('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading project financials...</div>;
  }

  if (!data?.project) return null;

  const {
    project,
    agreedProjectValue,
    totalInvoiced,
    totalReceived,
    advanceReceived,
    milestonePayments,
    outstandingAmount,
    upcomingMilestone,
    paymentStatus,
    invoices = [],
    payments = [],
  } = data;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Project Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
              <span className="font-mono text-xs text-focsera-700 bg-focsera-50 px-2 py-0.5 rounded border border-focsera-200">
                {project.projectId}
              </span>
              <StatusBadge status={project.status} type="project" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span>
                <span className="font-semibold text-slate-700">Client:</span> {project.client?.name}
              </span>
              <span>
                <span className="font-semibold text-slate-700">Division:</span>{' '}
                <span className="text-focsera-700 font-semibold">{project.division?.name}</span>
              </span>
              {project.startDate && (
                <span>
                  <span className="font-semibold text-slate-700">Timeline:</span> {formatDate(project.startDate)} -{' '}
                  {formatDate(project.expectedCompletionDate)}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Settlement Status
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{paymentStatus}</div>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#F4F7FA] rounded-lg border border-[#E2E7ED]">
            <span className="text-[11px] font-medium text-[#697586] uppercase tracking-wider font-sans">
              Total Agreed Project Value
            </span>
            <div className="text-2xl font-bold text-[#182333] font-financial mt-1">
              {formatINR(agreedProjectValue)}
            </div>
            <span className="text-[11px] text-[#697586] mt-0.5 block">Approved contract sum</span>
          </div>

          <div className="p-4 bg-white rounded-lg border border-[#E2E7ED]">
            <span className="text-[11px] font-medium text-[#697586] uppercase tracking-wider font-sans">
              Client & Division
            </span>
            <div className="text-base font-semibold text-[#182333] font-sans mt-1">
              {project.client?.name}
            </div>
            <span className="text-xs text-[#233D5B] font-medium mt-0.5 block">
              {project.division?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Associated Invoices & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Project Invoices</h3>
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                  <div className="text-slate-400 text-[11px]">{formatDate(inv.invoiceDate)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatINR(inv.grandTotal)}</div>
                  <StatusBadge status={inv.status} type="invoice" />
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">No invoices issued for this project.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Project Collections</h3>
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{p.paymentNumber}</span>
                  <div className="text-slate-400 text-[11px]">
                    {p.paymentMethod} • {formatDate(p.paymentDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-700">+{formatINR(p.amount)}</div>
                  <span className="text-[10px] text-slate-500">{p.paymentType}</span>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">No payments recorded for this project.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

