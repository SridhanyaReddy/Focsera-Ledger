import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email) {
      error('Please enter admin email.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.resetToken) {
        setToken(res.data.resetToken);
      }
      success('Reset token generated. Enter your new password below.');
      setStep(2);
    } catch (err) {
      error(err.response?.data?.message || 'Error generating reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!token || !newPassword) {
      error('Token and new password are required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      success('Password reset successfully! You can now log in.');
      setStep(3);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-focsera-50 border border-focsera-200 flex items-center justify-center text-focsera-600 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Admin Password Recovery</h1>
          <p className="text-xs text-slate-500 mt-1">Recover secure access to Focsera Financials</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestToken} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@focsera.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-focsera-600 hover:bg-focsera-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              {loading ? 'Processing...' : 'Generate Reset Token'}
            </button>
            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-focsera-500 outline-none text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Password successfully updated.</p>
            <Link
              to="/login"
              className="inline-block px-5 py-2 bg-focsera-600 hover:bg-focsera-700 text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              Sign In Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

