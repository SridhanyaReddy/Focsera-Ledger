import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Building,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import api from '../../api';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const EXPENSE_CATEGORIES = [
  'Operations',
  'Salaries & Freelancers',
  'Marketing & Ads',
  'Software & Subscriptions',
  'Office & Equipment',
  'Travel & Lodging',
  'Vendor Payouts',
  'Utilities',
  'Taxes & Legal',
  'Miscellaneous',
];

const PAYMENT_METHODS = ['Bank Transfer', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit Card', 'Cash'];

export default function ExpensesPage() {
  const { success, error } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ count: 0, totalAmount: 0 });
  const [divisions, setDivisions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Operations',
    division: '',
    project: '',
    vendor: '',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, divisionFilter]);

  const fetchPrerequisites = async () => {
    try {
      const [dRes, pRes] = await Promise.all([api.get('/divisions'), api.get('/projects')]);
      if (dRes.data.success) setDivisions(dRes.data.data);
      if (pRes.data.success) setProjects(pRes.data.data);
    } catch (err) {
      console.error('Error loading prerequisites:', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/expenses?category=${categoryFilter}&division=${divisionFilter}&search=${encodeURIComponent(
          search
        )}`
      );
      if (res.data.success) {
        setExpenses(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (err) {
      error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      return error('Please enter a valid expense amount');
    }
    setSaving(true);
    try {
      const res = await api.post('/expenses', formData);
      if (res.data.success) {
        success('Expense recorded successfully');
        setIsModalOpen(false);
        setFormData({
          category: 'Operations',
          division: '',
          project: '',
          vendor: '',
          amount: '',
          expenseDate: new Date().toISOString().slice(0, 10),
          paymentMethod: 'Bank Transfer',
          referenceNumber: '',
          description: '',
          notes: '',
        });
        fetchExpenses();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.data.success) {
        success('Expense deleted');
        fetchExpenses();
      }
    } catch (err) {
      error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#182333] tracking-tight">Expenses</h1>
          <p className="text-xs font-sans text-[#697586] mt-0.5">
            Operational costs, vendor payouts, and division-wise corporate expenses
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#52799D] hover:bg-[#233D5B] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-[#E2E7ED] shadow-subtle">
          <span className="text-xs font-medium text-[#697586] font-sans">Total Expenses</span>
          <div className="text-2xl font-bold text-[#B84B4B] font-financial mt-1">
            {formatINR(summary.totalAmount)}
          </div>
          <span className="text-[11px] text-[#697586] mt-1 block">Recorded corporate payouts</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E7ED] shadow-subtle">
          <span className="text-xs font-medium text-[#697586] font-sans">Total Transactions</span>
          <div className="text-2xl font-bold text-[#182333] font-financial mt-1">
            {summary.count}
          </div>
          <span className="text-[11px] text-[#697586] mt-1 block">Expense entries</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E7ED] shadow-subtle">
          <span className="text-xs font-medium text-[#697586] font-sans">Active Categories</span>
          <div className="text-2xl font-bold text-[#233D5B] font-financial mt-1">
            {EXPENSE_CATEGORIES.length}
          </div>
          <span className="text-[11px] text-[#697586] mt-1 block">Internal expense heads</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E7ED] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#697586] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, reference, note..."
            className="w-full pl-10 pr-4 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg focus:bg-white focus:border-[#52799D] text-xs font-sans outline-none text-[#182333] transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-medium font-sans text-[#182333] outline-none"
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

      {/* Expenses Table */}
      <div className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E7ED] text-[#697586] uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Expense ID & Date</th>
                <th className="py-3.5 px-4">Vendor & Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Division / Project</th>
                <th className="py-3.5 px-4">Method & Ref</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7ED]">
              {expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-[#F4F7FA] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#182333] font-financial text-xs">
                      {exp.expenseNumber}
                    </div>
                    <div className="text-[#697586] text-[11px] font-financial">
                      {formatDate(exp.expenseDate)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#182333]">{exp.vendor}</div>
                    {exp.description && (
                      <div className="text-[#697586] text-[11px] truncate max-w-xs">{exp.description}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF4F8] text-[#233D5B] border border-[#DCE7F0]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#697586] text-xs">
                    <div className="text-[#182333] font-medium">
                      {exp.division?.name || 'General Operations'}
                    </div>
                    {exp.project && (
                      <div className="text-[11px] text-[#697586]">{exp.project.name}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[#182333] text-xs">{exp.paymentMethod}</div>
                    {exp.referenceNumber && (
                      <div className="text-[#697586] text-[11px] font-financial">
                        Ref: {exp.referenceNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-financial font-semibold text-[#B84B4B] text-sm">
                    {formatINR(exp.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => handleDelete(exp._id, e)}
                      className="p-1.5 text-[#697586] hover:text-[#B84B4B] hover:bg-[#FDEFEF] rounded transition-colors"
                      title="Delete expense record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expenses.length === 0 && !loading && (
            <EmptyState
              icon={Receipt}
              title="No Expense Records"
              description="No operational expenses recorded yet. Click 'Record Expense' to log vendor payments and corporate costs."
            />
          )}
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Corporate Expense"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Amount (INR ₹) <span className="text-[#B84B4B]">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-financial text-[#182333] outline-none focus:border-[#52799D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Expense Date <span className="text-[#B84B4B]">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-financial text-[#182333] outline-none focus:border-[#52799D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Category <span className="text-[#B84B4B]">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Division
              </label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
              >
                <option value="">General Corporate (No Division)</option>
                {divisions.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Vendor / Payee Name
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g. AWS, Adobe, Landlord"
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Reference / Transaction #
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="Bank UTR / Transaction reference / Cheque #"
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-financial text-[#182333] outline-none focus:border-[#52799D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#182333] mb-1">
                Description / Memo
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add brief details regarding this expense..."
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E7ED]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#F4F7FA] hover:bg-[#EEF4F8] text-[#697586] text-xs font-medium font-sans rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#52799D] hover:bg-[#233D5B] text-white text-xs font-medium font-sans rounded-lg transition-colors shadow-subtle disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

