import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Building2, ShieldCheck, ArrowRight, Check } from 'lucide-react';

export default function InitialSetup() {
  const { initializeSystem } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Admin Account Details
  const [adminEmail, setAdminEmail] = useState('admin@focsera.in');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('Focsera Lead Admin');

  // Focsera Company Profile
  const [companyDetails, setCompanyDetails] = useState({
    legalName: 'Focsera Innovations Private Limited',
    brandName: 'Focsera',
    tagline: 'Events • Studios • Marketing • Digital • Interiors',
    street: 'Plot No. 42, Hitech City Main Road, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    stateCode: '36',
    postalCode: '500081',
    contactNumber: '+91 95158 03954',
    businessEmail: 'info.focsera@gmail.com',
    website: 'https://www.focsera.in/',
    gstin: '36AABCF9515M1Z9',
    currency: 'INR',
    financialYear: '2026-27',
    bankHolder: 'Focsera Innovations Private Limited',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088921432',
    ifsc: 'HDFC0001628',
    branch: 'Madhapur Branch, Hyderabad',
    upiId: 'focsera@hdfcbank',
    signatoryName: 'Managing Director',
    signatoryDesignation: 'Director',
    invoicePrefix: 'FOC/INV',
    quotationPrefix: 'FOC/QUO',
    receiptPrefix: 'FOC/REC',
  });

  const handleCompleteSetup = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      error('Admin email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        companyDetails: {
          legalName: companyDetails.legalName,
          brandName: companyDetails.brandName,
          tagline: companyDetails.tagline,
          registeredAddress: {
            street: companyDetails.street,
            city: companyDetails.city,
            state: companyDetails.state,
            stateCode: companyDetails.stateCode,
            postalCode: companyDetails.postalCode,
            country: 'India',
          },
          contactNumber: companyDetails.contactNumber,
          businessEmail: companyDetails.businessEmail,
          website: companyDetails.website,
          gstin: companyDetails.gstin,
          state: companyDetails.state,
          stateCode: companyDetails.stateCode,
          currency: 'INR',
          financialYear: companyDetails.financialYear,
          bankDetails: {
            accountHolderName: companyDetails.bankHolder,
            bankName: companyDetails.bankName,
            accountNumber: companyDetails.accountNumber,
            ifsc: companyDetails.ifsc,
            branch: companyDetails.branch,
            upiId: companyDetails.upiId,
          },
          authorizedSignatory: {
            name: companyDetails.signatoryName,
            designation: companyDetails.signatoryDesignation,
          },
          numberingPrefixes: {
            invoice: companyDetails.invoicePrefix,
            quotation: companyDetails.quotationPrefix,
            receipt: companyDetails.receiptPrefix,
          },
        },
      };

      await initializeSystem(payload);
      success('Focsera system initialized successfully!');
      navigate('/');
    } catch (err) {
      error(err.message || 'Initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 flex items-center justify-center relative">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-8 sm:p-12 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-focsera-700 to-sky-500 flex items-center justify-center font-black text-white text-3xl shadow-lg mb-4">
            F
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">FOCSERA INITIAL SETUP</h1>
          <p className="text-xs font-semibold text-focsera-600 uppercase tracking-widest mt-1">
            One-Time Company & Financial Ledger Configuration
          </p>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center justify-center gap-3 mb-8 text-xs font-semibold">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              step === 1 ? 'bg-focsera-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>1</span>
            <span>Admin Credentials</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              step === 2 ? 'bg-focsera-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>2</span>
            <span>Focsera Profile & Bank Details</span>
          </div>
        </div>

        <form onSubmit={handleCompleteSetup}>
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Step 1: Create Administrator Account</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Administrator Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Admin Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Admin Master Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!adminEmail || !adminPassword) {
                      error('Please enter admin email and password.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-6 py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2"
                >
                  <span>Continue to Company Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Step 2: Focsera Company & Banking Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Legal Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyDetails.legalName}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, legalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={companyDetails.brandName}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, brandName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={companyDetails.contactNumber}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Business Email</label>
                  <input
                    type="email"
                    required
                    value={companyDetails.businessEmail}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, businessEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Website</label>
                  <input
                    type="text"
                    required
                    value={companyDetails.website}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={companyDetails.gstin}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Registered Address</label>
                  <input
                    type="text"
                    value={companyDetails.street}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, street: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                {/* Bank Account */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs mb-2">Primary Bank Account Details</div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={companyDetails.bankHolder}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, bankHolder: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={companyDetails.bankName}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Number</label>
                  <input
                    type="text"
                    value={companyDetails.accountNumber}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">IFSC Code & UPI ID</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={companyDetails.ifsc}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, ifsc: e.target.value.toUpperCase() })}
                      placeholder="IFSC"
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-mono uppercase"
                    />
                    <input
                      type="text"
                      value={companyDetails.upiId}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, upiId: e.target.value })}
                      placeholder="UPI ID"
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Initializing...' : 'Complete Setup & Launch Dashboard'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

