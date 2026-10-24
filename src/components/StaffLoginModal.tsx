import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, ChefHat, Receipt, Shield, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: 'kitchen' | 'cashier' | 'admin', name: string) => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'cashier' | 'kitchen'>('admin');
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role: 'admin' | 'cashier' | 'kitchen') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('');
    } else if (role === 'cashier') {
      setUsername('cashier');
      setPassword('');
    } else {
      setUsername('kitchen');
      setPassword('');
    }
  };

  const handleFillDemo = (role: 'admin' | 'cashier' | 'kitchen') => {
    setSelectedRole(role);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('shangrilla2026');
    } else if (role === 'cashier') {
      setUsername('cashier');
      setPassword('pos123');
    } else {
      setUsername('kitchen');
      setPassword('chef123');
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.staffLogin({ username, password });
      onLoginSuccess(res.role, res.name);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-apple-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-stone-200/90 rounded-3xl shadow-[0_25px_65px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col animate-apple-modal z-10">
        {/* Header */}
        <div className="px-6 py-6 border-b border-stone-200 bg-gradient-to-r from-[#faf8f5] via-white to-[#faf8f5] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#cba158]/20 border border-[#cba158]/35 flex items-center justify-center text-[#855e18] shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#996e1e] font-bold">
                Staff Portal
              </span>
            </div>
            <h2 className="font-['Oswald',sans-serif] text-2xl text-stone-900 font-bold uppercase tracking-tight">
              Operational Access
            </h2>
            <p className="text-xs text-stone-500">
              Secure authentication for authorized restaurant personnel only.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Quick Selector */}
        <div className="p-6 space-y-5 bg-white">
          <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Shield className="w-4 h-4 text-[#996e1e]" />
              <span className="font-['Oswald',sans-serif] uppercase tracking-wider text-[11px]">Master Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('cashier')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'cashier'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Receipt className="w-4 h-4 text-[#996e1e]" />
              <span className="font-['Oswald',sans-serif] uppercase tracking-wider text-[11px]">Cashier POS</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('kitchen')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'kitchen'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-4 h-4 text-[#996e1e]" />
              <span className="font-['Oswald',sans-serif] uppercase tracking-wider text-[11px]">Kitchen Display</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Staff Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, cashier, kitchen"
                  required
                  className="w-full bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Staff Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff security key"
                  required
                  className="w-full bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white rounded-xl pl-9 pr-10 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-lg hover:shadow-[#cba158]/25 disabled:opacity-50 text-stone-950 font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Unlock {selectedRole === 'admin' ? 'Master Admin' : selectedRole === 'cashier' ? 'Cashier POS' : 'Kitchen KDS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Helper */}
          <div className="pt-3 border-t border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
              Staff Account Directory (Click to Autofill)
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleFillDemo('kitchen')}
                className="p-2 rounded-xl bg-[#faf8f5] hover:bg-stone-100 text-stone-700 border border-stone-200 text-left transition-colors cursor-pointer transform hover:-translate-y-0.5"
              >
                <div className="font-bold text-[#855e18]">Kitchen</div>
                <div className="font-mono text-[9px] text-stone-500">kitchen / chef123</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('cashier')}
                className="p-2 rounded-xl bg-[#faf8f5] hover:bg-stone-100 text-stone-700 border border-stone-200 text-left transition-colors cursor-pointer transform hover:-translate-y-0.5"
              >
                <div className="font-bold text-[#855e18]">Cashier</div>
                <div className="font-mono text-[9px] text-stone-500">cashier / pos123</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="p-2 rounded-xl bg-[#faf8f5] hover:bg-stone-100 text-stone-700 border border-stone-200 text-left transition-colors cursor-pointer transform hover:-translate-y-0.5"
              >
                <div className="font-bold text-[#855e18]">Admin</div>
                <div className="font-mono text-[9px] text-stone-500">admin / shangrilla2026</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
