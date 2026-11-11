import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Calendar,
  Filter,
  Lock,
  UserCheck,
  Activity,
  Clock,
  Database,
  Info,
} from 'lucide-react';
import api from '../../api';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function AuditsPage() {
  const { error } = useToast();
  const [activeTab, setActiveTab] = useState('detailed'); // 'detailed' | 'sessions'
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalLogs: 0, authLogs: 0, activityLogs: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [activeTab, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'sessions' ? 'auth' : 'activity';
      const dateParam = dateFilter ? `&date=${dateFilter}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/audits?type=${typeParam}${dateParam}${searchParam}`);
      if (res.data.success) {
        setLogs(res.data.data);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#182333] tracking-tight">System Audits</h1>
          <p className="text-xs font-sans text-[#697586] mt-0.5">
            Immutable chronological compliance audits and security access records
          </p>
        </div>

        {/* Immutability Banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF4F8] border border-[#DCE7F0] rounded-lg text-xs font-medium text-[#233D5B]">
          <Lock className="w-3.5 h-3.5 text-[#52799D]" />
          <span>Strict Immutability Active • Read-Only Logs</span>
        </div>
      </div>

      {/* Security Disclaimer Alert */}
      <div className="bg-white rounded-lg border border-[#E2E7ED] p-4 flex items-start gap-3 shadow-subtle">
        <Database className="w-4 h-4 text-[#52799D] shrink-0 mt-0.5" />
        <div className="text-xs text-[#697586] font-sans">
          <span className="font-semibold text-[#182333]">Audit Protection Policy:</span> These audit records are permanently recorded in the database engine. In accordance with strict compliance protocols, <strong className="text-[#182333]">neither users nor administrators have permission to alter or delete any audit entry</strong>. Deletions are exclusively restricted to direct database administration.
        </div>
      </div>

      {/* Audit Type Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-lg border border-[#E2E7ED] shadow-subtle">
        <div className="inline-flex p-1 bg-[#F4F7FA] rounded-lg text-xs font-medium font-sans">
          <button
            onClick={() => {
              setActiveTab('detailed');
              setDateFilter('');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded transition-colors ${
              activeTab === 'detailed'
                ? 'bg-white text-[#182333] font-semibold shadow-subtle'
                : 'text-[#697586] hover:text-[#182333]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#52799D]" />
            <span>Time & Day Activity Audits</span>
            <span className="text-[10px] font-financial px-1.5 py-0.2 rounded bg-[#EEF4F8] text-[#233D5B]">
              {stats.activityLogs}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sessions');
              setDateFilter('');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded transition-colors ${
              activeTab === 'sessions'
                ? 'bg-white text-[#182333] font-semibold shadow-subtle'
                : 'text-[#697586] hover:text-[#182333]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#287A57]" />
            <span>Login & Session Access Audits</span>
            <span className="text-[10px] font-financial px-1.5 py-0.2 rounded bg-[#EEF4F8] text-[#233D5B]">
              {stats.authLogs}
            </span>
          </button>
        </div>

        {/* Search & Single Day Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#F4F7FA] px-2.5 py-1.5 border border-[#E2E7ED] rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-[#697586]" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-financial text-[#182333] outline-none"
              title="Filter audit entries for a specific day"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[10px] text-[#697586] hover:text-[#B84B4B] ml-1 font-sans"
              >
                Clear
              </button>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[#697586] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, IP, user..."
              className="pl-8 pr-3 py-1.5 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans outline-none focus:bg-white focus:border-[#52799D] text-[#182333] w-48 sm:w-56"
            />
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E7ED] text-[#697586] uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Exact Timestamp</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Entity & Target ID</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Technical Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7ED]">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-[#F4F7FA] transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-financial text-xs text-[#182333]">
                      {formatDate(log.createdAt)}
                    </div>
                    <div className="text-[11px] font-financial text-[#697586]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        log.action.includes('LOGIN')
                          ? 'bg-[#E9F5EF] text-[#287A57] border border-[#BBE2CF]'
                          : log.action.includes('LOGOUT')
                          ? 'bg-[#EEF4F8] text-[#233D5B] border border-[#DCE7F0]'
                          : log.action.includes('CANCEL') || log.action.includes('DELETE')
                          ? 'bg-[#FDEFEF] text-[#B84B4B] border border-[#F7C6C6]'
                          : 'bg-[#F4F7FA] text-[#182333] border border-[#E2E7ED]'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#182333]">{log.entity}</div>
                    {log.entityId && (
                      <span className="font-financial text-[11px] text-[#52799D]">
                        {log.entityId}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#182333]">
                    <span className="font-medium">{log.performedBy || 'System Admin'}</span>
                  </td>
                  <td className="py-3 px-4 font-financial text-[11px] text-[#697586]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4 text-[#697586] max-w-xs truncate">
                    {log.details ? (
                      <span className="font-mono text-[11px] bg-[#F4F7FA] px-1.5 py-0.5 rounded border border-[#E2E7ED]">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && !loading && (
            <EmptyState
              icon={ShieldAlert}
              title="No Audit Logs Recorded"
              description="No audit events matched the selected filters. Audits post automatically as administrative actions and logins occur."
            />
          )}
        </div>
      </div>
    </div>
  );
}

