import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@focsera.in');
  const [password, setPassword] = useState('focsera@15');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      error(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4 relative font-sans text-[#182333]">
      <div className="w-full max-w-sm bg-[#FFFFFF] rounded border border-[#E2E7ED] shadow-sm overflow-hidden relative z-10 p-7 sm:p-8 animate-in fade-in duration-150">
        <div className="text-center mb-6">
          <div className="w-10 h-10 mx-auto rounded bg-[#14243A] flex items-center justify-center font-display font-bold text-white text-base tracking-wider mb-3">
            F
          </div>
          <h1 className="text-xl font-bold text-[#182333] tracking-tight font-display">
            FOCSERA
          </h1>
          <p className="text-[11px] font-sans text-[#697586] uppercase tracking-wider mt-1">
            Financial Ledger & Invoicing System
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F4F7FA] text-[#697586] rounded text-[11px] font-medium mt-3 border border-[#E2E7ED]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#287A57]" />
            <span>Single-Company • Admin Access</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#182333] mb-1 font-sans">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#697586] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@focsera.in"
                className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E7ED] rounded focus:border-[#52799D] focus:ring-1 focus:ring-[#52799D] text-xs outline-none text-[#182333] font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#182333] font-sans">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#52799D] hover:underline font-sans"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#697586] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E7ED] rounded focus:border-[#52799D] focus:ring-1 focus:ring-[#52799D] text-xs outline-none text-[#182333] font-mono transition-colors"
              />
            </div>
          </div>

          {/* Institutional Credentials Capsule */}
          <div className="p-2.5 bg-[#F4F7FA] border border-[#E2E7ED] rounded flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <KeyRound className="w-3.5 h-3.5 text-[#52799D] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#697586] uppercase font-sans tracking-wider block">
                  Default Credentials
                </span>
                <span className="text-[11px] font-mono text-[#182333] truncate block">
                  admin@focsera.in • Admin@Focsera2026
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@focsera.in');
                setPassword('focsera@15');
              }}
              className="px-2 py-0.5 bg-[#FFFFFF] hover:bg-[#EEF4F8] text-[#52799D] text-xs font-semibold rounded border border-[#E2E7ED] transition-colors"
            >
              Fill
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 px-4 bg-[#52799D] hover:bg-[#233D5B] text-white font-medium text-xs rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Admin'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E2E7ED] text-center text-[11px] text-[#697586]">
          Authorized Focsera Finance Management Only
        </div>
      </div>
    </div>
  );
}
