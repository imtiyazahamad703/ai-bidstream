import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { Mail, Lock, ArrowRight, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.resetPassword(formData);
      setSuccess(response.message);
      // Automatically redirect to login after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check if email exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050B14] p-6 relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <div className="w-full max-w-[440px] relative z-10 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transform transition-transform duration-500 hover:scale-105 hover:rotate-3 mb-6 relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl"></div>
            <KeyRound className="w-10 h-10 relative z-10" />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Reset Password</h2>
          <p className="text-base text-slate-400 font-medium">
            Enter your email and choose a new password.
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="bg-[#0B1221]/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-10 sm:p-12 shadow-2xl relative overflow-hidden group">
          
          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-sm text-rose-400 animate-shake">
              <span className="mt-0.5 text-rose-500">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-sm text-emerald-400 animate-fade-in-up">
              <span className="mt-0.5 text-emerald-500">✓</span>
              <span className="font-medium">{success} <br/> Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#111A2C] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base hover:border-white/10 shadow-inner"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-slate-300 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full bg-[#111A2C] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base hover:border-white/10 shadow-inner tracking-widest font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-slate-300 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#111A2C] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base hover:border-white/10 shadow-inner tracking-widest font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-4 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-base shadow-[0_10px_20px_-10px_rgba(79,70,229,0.6)] transition-all hover:shadow-[0_15px_25px_-10px_rgba(79,70,229,0.8)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:hover:-translate-y-0 mt-8"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white/80" />
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Section */}
        <div className="mt-12 text-center space-y-5">
          <p className="text-base text-slate-400 font-medium">
            Remembered your password?{' '}
            <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-all hover:underline underline-offset-4">
              Back to Login
            </Link>
          </p>
        </div>

      </div>
      
      {/* Global Style for animations */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ForgotPasswordPage;

