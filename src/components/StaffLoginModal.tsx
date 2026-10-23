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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#161214] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-stone-800/80 bg-gradient-to-r from-[#1f1719] to-[#171214] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#e5c179]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4972e]">
                Staff Portal
              </span>
            </div>
            <h2 className="font-['Oswald',sans-serif] text-2xl text-white font-bold uppercase tracking-tight">
              Operational Access
            </h2>
            <p className="text-xs text-stone-400 font-light">
              Secure authentication for authorized restaurant personnel only.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Quick Selector */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'admin'
                  ? 'bg-[#261c1f] text-[#f5d78e] shadow-sm border border-[#d4972e]/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-[#d4972e]" />
              <span className="font-['Oswald',sans-serif] uppercase tracking-wider text-[11px]">Master Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('cashier')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'cashier'
                  ? 'bg-[#261c1f] text-[#f5d78e] shadow-sm border border-[#d4972e]/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4 text-[#d4972e]" />
              <span className="font-['Oswald',sans-serif] uppercase tracking-wider text-[11px]">Cashier POS</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('kitchen')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                selectedRole === 'kitchen'
                  ? 'bg-[#261c1f] text-[#f5d78e] shadow-sm border border-[#d4972e]/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4 text-[#d4972e]" />
              <span className="font-['Oswald',sans-serif] uppercase tracking-wider text-[11px]">Kitchen Display</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                Staff Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, cashier, kitchen"
                  required
                  className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                Staff Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff security key"
                  required
                  className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#d4972e] hover:bg-[#e5a83b] disabled:opacity-50 text-black font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
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
          <div className="pt-3 border-t border-stone-800/80">
            <span className="text-[10px] font-mono text-stone-500 uppercase block mb-2">
              Staff Account Directory (Click to Autofill)
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleFillDemo('kitchen')}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border border-white/5 text-left transition-colors"
              >
                <div className="font-semibold text-[#f5d78e]">Kitchen</div>
                <div className="font-mono text-[9px] text-stone-500">kitchen / chef123</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('cashier')}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border border-white/5 text-left transition-colors"
              >
                <div className="font-semibold text-[#f5d78e]">Cashier</div>
                <div className="font-mono text-[9px] text-stone-500">cashier / pos123</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border border-white/5 text-left transition-colors"
              >
                <div className="font-semibold text-[#f5d78e]">Admin</div>
                <div className="font-mono text-[9px] text-stone-500">admin / shangrilla2026</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
