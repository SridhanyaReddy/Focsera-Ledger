import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  Hash,
  ShieldCheck,
  Download,
  Layers,
  Save,
  Lock,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage() {
  const { admin, updateCompany } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState([]);

  // Company & Financial Settings Form
  const [companyForm, setCompanyForm] = useState({
    legalName: '',
    brandName: '',
    tagline: '',
    street: '',
    city: '',
    state: '',
    stateCode: '',
    postalCode: '',
    contactNumber: '',
    businessEmail: '',
    website: '',
    gstin: '',
    financialYear: '',
    defaultPaymentTerms: '',
    bankHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    upiId: '',
    invoicePrefix: 'FOC/INV',
    quotationPrefix: 'FOC/QUO',
    receiptPrefix: 'FOC/REC',
    creditNotePrefix: 'FOC/CN',
    debitNotePrefix: 'FOC/DN',
  });

  // Security Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Division Modal
  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
  const [newDivision, setNewDivision] = useState({ name: '', category: '', description: '' });

  useEffect(() => {
    fetchSettings();
    fetchDivisions();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/company');
      if (res.data.success) {
        const c = res.data.data;
        setCompanyForm({
          legalName: c.legalName || '',
          brandName: c.brandName || '',
          tagline: c.tagline || '',
          street: c.registeredAddress?.street || '',
          city: c.registeredAddress?.city || '',
          state: c.registeredAddress?.state || '',
          stateCode: c.registeredAddress?.stateCode || '',
          postalCode: c.registeredAddress?.postalCode || '',
          contactNumber: c.contactNumber || '',
          businessEmail: c.businessEmail || '',
          website: c.website || '',
          gstin: c.gstin || '',
          financialYear: c.financialYear || '',
          defaultPaymentTerms: c.defaultPaymentTerms || '',
          bankHolder: c.bankDetails?.accountHolderName || '',
          bankName: c.bankDetails?.bankName || '',
          accountNumber: c.bankDetails?.accountNumber || '',
          ifsc: c.bankDetails?.ifsc || '',
          branch: c.bankDetails?.branch || '',
          upiId: c.bankDetails?.upiId || '',
          invoicePrefix: c.numberingPrefixes?.invoice || 'FOC/INV',
          quotationPrefix: c.numberingPrefixes?.quotation || 'FOC/QUO',
          receiptPrefix: c.numberingPrefixes?.receipt || 'FOC/REC',
          creditNotePrefix: c.numberingPrefixes?.creditNote || 'FOC/CN',
          debitNotePrefix: c.numberingPrefixes?.debitNote || 'FOC/DN',
        });
      }
    } catch (err) {
      console.error('Error loading company settings:', err);
    }
  };

  const fetchDivisions = async () => {
    try {
      const res = await api.get('/divisions?includeInactive=true');
      if (res.data.success) setDivisions(res.data.data);
    } catch (err) {
      console.error('Error loading divisions:', err);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        legalName: companyForm.legalName,
        brandName: companyForm.brandName,
        tagline: companyForm.tagline,
        registeredAddress: {
          street: companyForm.street,
          city: companyForm.city,
          state: companyForm.state,
          stateCode: companyForm.stateCode,
          postalCode: companyForm.postalCode,
          country: 'India',
        },
        contactNumber: companyForm.contactNumber,
        businessEmail: companyForm.businessEmail,
        website: companyForm.website,
        gstin: companyForm.gstin,
        state: companyForm.state,
        stateCode: companyForm.stateCode,
        financialYear: companyForm.financialYear,
        defaultPaymentTerms: companyForm.defaultPaymentTerms,
        bankDetails: {
          accountHolderName: companyForm.bankHolder,
          bankName: companyForm.bankName,
          accountNumber: companyForm.accountNumber,
          ifsc: companyForm.ifsc,
          branch: companyForm.branch,
          upiId: companyForm.upiId,
        },
        numberingPrefixes: {
          invoice: companyForm.invoicePrefix,
          quotation: companyForm.quotationPrefix,
          receipt: companyForm.receiptPrefix,
          creditNote: companyForm.creditNotePrefix,
          debitNote: companyForm.debitNotePrefix,
        },
      };

      const res = await api.put('/company', payload);
      success('Focsera company profile updated successfully.');
      updateCompany(res.data.data);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('New password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      success('Admin password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDivision = async (div) => {
    try {
      await api.put(`/divisions/${div._id}`, { isActive: !div.isActive });
      success(`Division ${div.name} ${div.isActive ? 'deactivated' : 'activated'}.`);
      fetchDivisions();
    } catch (err) {
      error('Failed to toggle division status.');
    }
  };

  const handleCreateDivision = async (e) => {
    e.preventDefault();
    if (!newDivision.name.trim() || !newDivision.category.trim()) {
      error('Name and category are required.');
      return;
    }
    try {
      await api.post('/divisions', newDivision);
      success('New division created.');
      setIsDivisionModalOpen(false);
      setNewDivision({ name: '', category: '', description: '' });
      fetchDivisions();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add division.');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await api.get('/company/backup/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Focsera_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      success('Complete JSON database backup exported.');
    } catch (err) {
      error('Failed to export backup.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SYSTEM SETTINGS</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Centralized Focsera company profile, document prefixes, banking & admin security
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'company'
              ? 'bg-focsera-600 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Company Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('banking')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'banking'
              ? 'bg-focsera-600 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Bank & UPI Details</span>
        </button>

        <button
          onClick={() => setActiveTab('numbering')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'numbering'
              ? 'bg-focsera-600 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Numbering Series</span>
        </button>

        <button
          onClick={() => setActiveTab('divisions')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'divisions'
              ? 'bg-focsera-600 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Focsera Divisions ({divisions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'security'
              ? 'bg-focsera-600 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'backup'
              ? 'bg-focsera-600 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Database Backup</span>
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Legal Company Information</h2>
            <p className="text-xs text-slate-500">Appears on all official invoices, quotations and payment receipts</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Legal Company Name</label>
              <input
                type="text"
                required
                value={companyForm.legalName}
                onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={companyForm.brandName}
                onChange={(e) => setCompanyForm({ ...companyForm, brandName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Brand Tagline / Philosophy</label>
              <input
                type="text"
                value={companyForm.tagline}
                onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business Contact Phone</label>
              <input
                type="text"
                required
                value={companyForm.contactNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, contactNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
              <input
                type="email"
                required
                value={companyForm.businessEmail}
                onChange={(e) => setCompanyForm({ ...companyForm, businessEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official Website</label>
              <input
                type="text"
                required
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">GSTIN</label>
              <input
                type="text"
                value={companyForm.gstin}
                onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Registered Address</label>
              <input
                type="text"
                value={companyForm.street}
                onChange={(e) => setCompanyForm({ ...companyForm, street: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">City</label>
              <input
                type="text"
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">State & State Code</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={companyForm.state}
                  onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                  className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
                />
                <input
                  type="text"
                  value={companyForm.stateCode}
                  onChange={(e) => setCompanyForm({ ...companyForm, stateCode: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-center font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Banking & UPI */}
      {activeTab === 'banking' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Banking & Digital Payment Channels</h2>
            <p className="text-xs text-slate-500">Printed on invoice footers and receipt acknowledgments</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Account Holder Name</label>
              <input
                type="text"
                value={companyForm.bankHolder}
                onChange={(e) => setCompanyForm({ ...companyForm, bankHolder: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
              <input
                type="text"
                value={companyForm.bankName}
                onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank Account Number</label>
              <input
                type="text"
                value={companyForm.accountNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, accountNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">IFSC Code</label>
              <input
                type="text"
                value={companyForm.ifsc}
                onChange={(e) => setCompanyForm({ ...companyForm, ifsc: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank Branch</label>
              <input
                type="text"
                value={companyForm.branch}
                onChange={(e) => setCompanyForm({ ...companyForm, branch: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">UPI ID (VPA)</label>
              <input
                type="text"
                value={companyForm.upiId}
                onChange={(e) => setCompanyForm({ ...companyForm, upiId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-bold text-focsera-700"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Bank Details'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Numbering Series */}
      {activeTab === 'numbering' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sequential Numbering Series (Section 12)</h2>
            <p className="text-xs text-slate-500">Atomic sequential counters by document type with financial year format</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={companyForm.invoicePrefix}
                onChange={(e) => setCompanyForm({ ...companyForm, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Output example: FOC/INV/2026-27/001</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Quotation Prefix</label>
              <input
                type="text"
                value={companyForm.quotationPrefix}
                onChange={(e) => setCompanyForm({ ...companyForm, quotationPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Output example: FOC/QUO/2026-27/001</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Receipt Prefix</label>
              <input
                type="text"
                value={companyForm.receiptPrefix}
                onChange={(e) => setCompanyForm({ ...companyForm, receiptPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Output example: FOC/REC/2026-27/001</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Credit Note Prefix</label>
              <input
                type="text"
                value={companyForm.creditNotePrefix}
                onChange={(e) => setCompanyForm({ ...companyForm, creditNotePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Prefixes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Divisions Management */}
      {activeTab === 'divisions' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Focsera Business Divisions (Section 4)</h2>
              <p className="text-xs text-slate-500">Internal operational categories sharing the single centralized ledger</p>
            </div>
            <button
              onClick={() => setIsDivisionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-focsera-600 hover:bg-focsera-700 text-white rounded-xl font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Division</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {divisions.map((div) => (
              <div key={div._id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{div.name}</span>
                    {div.isPredefined && (
                      <span className="px-2 py-0.5 bg-focsera-50 text-focsera-700 border border-focsera-200 rounded text-[10px] font-bold">
                        Predefined
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        div.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {div.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    Category: <span className="text-slate-700 font-semibold">{div.category}</span> • {div.description}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleToggleDivision(div)}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors border ${
                      div.isActive
                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {div.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Security */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs max-w-xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Admin Security Credentials</h2>
            <p className="text-xs text-slate-500">Update master admin password</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Master Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 6: Backup & Export */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs max-w-xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Complete Database Backup</h2>
            <p className="text-xs text-slate-500">
              Export all 18 collections (Invoices, Quotations, Clients, Projects, Ledger, Payments, Receipts, Transactions) as formatted JSON.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-600">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Single-Company Consolidated Backup</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Guarantees zero data loss. Can be exported anytime for off-site disaster recovery.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Database Backup (.JSON)</span>
          </button>
        </div>
      )}

      {/* Add Division Modal */}
      <Modal
        isOpen={isDivisionModalOpen}
        onClose={() => setIsDivisionModalOpen(false)}
        title="Add New Division"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateDivision} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Division Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newDivision.name}
              onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
              placeholder="e.g. Focsera Luxury Suites"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newDivision.category}
              onChange={(e) => setNewDivision({ ...newDivision, category: e.target.value })}
              placeholder="e.g. Hospitality & Staging"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description</label>
            <textarea
              rows="2"
              value={newDivision.description}
              onChange={(e) => setNewDivision({ ...newDivision, description: e.target.value })}
              placeholder="Purpose and business scope..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDivisionModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-focsera-600 hover:bg-focsera-700 text-white rounded-xl font-bold shadow-sm"
            >
              Add Division
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

