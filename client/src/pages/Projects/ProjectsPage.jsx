import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Calendar,
  Layers,
  ArrowRight,
  User,
} from 'lucide-react';
import api from '../../api';
import ProjectModal from '../../components/forms/ProjectModal';
import ProjectDetailPage from './ProjectDetailPage';
import StatusBadge from '../../components/common/StatusBadge';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const viewProjectId = searchParams.get('view');

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [divisionFilter, statusFilter]);

  const fetchPrerequisites = async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        api.get('/clients?isArchived=false'),
        api.get('/divisions'),
      ]);
      if (cRes.data.success) setClients(cRes.data.data);
      if (dRes.data.success) setDivisions(dRes.data.data);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/projects?search=${encodeURIComponent(search)}&division=${divisionFilter}&status=${statusFilter}`
      );
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  if (viewProjectId) {
    return <ProjectDetailPage projectId={viewProjectId} onBack={() => setSearchParams({})} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">PROJECT MANAGEMENT</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client engagements, division assignments & milestone payment tracking
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProject(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project name, ID, category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 text-xs outline-none text-slate-900 transition-all"
          />
        </form>

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
            <option value="In Progress">In Progress</option>
            <option value="Approved">Approved</option>
            <option value="Quotation Sent">Quotation Sent</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-3.5 px-4">Project ID & Name</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Division</th>
                <th className="py-3.5 px-4 text-right">Agreed Value</th>
                <th className="py-3.5 px-4 text-right">Collected</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr
                  key={p._id}
                  onClick={() => setSearchParams({ view: p._id })}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                    <span className="font-mono text-[10px] text-focsera-600 bg-focsera-50 px-1.5 py-0.5 rounded border border-focsera-100">
                      {p.projectId}
                    </span>
                    {p.serviceCategory && (
                      <span className="ml-2 text-slate-400 text-[11px]">{p.serviceCategory}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{p.client?.name}</div>
                    <div className="text-slate-400 text-[11px]">{p.client?.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-focsera-700">{p.division?.name}</div>
                    <div className="text-slate-400 text-[11px]">{p.division?.category}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatINR(p.agreedProjectValue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                    {formatINR(p.totalReceived)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                    {formatINR(p.outstandingAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={p.status} type="project" />
                  </td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSearchParams({ view: p._id })}
                        className="p-1.5 text-slate-400 hover:text-focsera-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View Financial Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(p);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {projects.length === 0 && !loading && (
            <EmptyState
              icon={Briefcase}
              title="No Projects Initiated"
              description="Create projects assigned to clients and Focsera divisions to manage milestone schedules and agreed values."
              actionLabel="Create First Project"
              onAction={() => {
                setSelectedProject(null);
                setIsModalOpen(true);
              }}
            />
          )}
        </div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
        clients={clients}
        divisions={divisions}
        onSuccess={fetchProjects}
      />
    </div>
  );
}

