import React, { useState } from 'react';
import { Crown, Phone, User, Mail, Calendar, CheckCircle2, ArrowRight, X, Gift } from 'lucide-react';
import { api } from '../services/api';
import { Location } from '../types/models';

interface BecomeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onMemberRegistered?: (phone: string, name: string) => void;
}

export const BecomeMemberModal: React.FC<BecomeMemberModalProps> = ({
  isOpen,
  onClose,
  locations,
  onMemberRegistered
}) => {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [preferredVenue, setPreferredVenue] = useState<string>(locations[0]?.id || 'shangrilla-hazratganj');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredMember, setRegisteredMember] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.registerMember({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        birthday: birthday || undefined,
        preferredLocationId: preferredVenue
      });

      // Save phone to localStorage for automatic loyalty tracking and order history
      if (typeof window !== 'undefined') {
        localStorage.setItem('shangrilla_customer_phone', cleanPhone);
        localStorage.setItem('shangrilla_customer_name', name.trim());
      }

      setRegisteredMember(res);
      if (onMemberRegistered) {
        onMemberRegistered(cleanPhone, name.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-apple-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-stone-200/90 rounded-3xl shadow-[0_25px_65px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col max-h-[90vh] animate-apple-modal z-10">
        {/* Header */}
        <div className="px-6 py-6 border-b border-stone-200 bg-gradient-to-r from-[#faf8f5] via-white to-[#faf8f5] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#cba158]/20 border border-[#cba158]/35 flex items-center justify-center text-[#855e18] shadow-xs">
                <Crown className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#996e1e] font-bold">
                SHANGRILLA Royal Club
              </span>
            </div>
            <h2 className="font-['Oswald',sans-serif] text-2xl sm:text-3xl text-stone-900 font-bold uppercase tracking-tight">
              {registeredMember ? 'Welcome to the Royalty' : 'Become a Royal Member'}
            </h2>
            <p className="text-xs text-stone-600">
              {registeredMember
                ? 'Your exclusive digital pass has been activated with 100 welcome bonus points!'
                : 'Enjoy 5% cashback on every meal, priority dining privileges & exclusive Awadhi specials.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-all apple-press cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-white">
          {registeredMember ? (
            /* Digital Royal Member Card View */
            <div className="space-y-6 animate-modal-pop">
              {/* Virtual Card */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#1c1917] border-2 border-[#cba158] shadow-2xl overflow-hidden text-white flex flex-col justify-between min-h-[220px] transform hover:scale-[1.02] transition-transform duration-300">
                {/* Decorative background glow */}
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#cba158]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <span className="font-['Oswald',sans-serif] font-bold text-lg tracking-wider text-white">
                      SHANGRILLA
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#e5c179] block font-bold">
                      ROYAL DINING CLUB PASS
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-[#cba158]/25 text-[#f8ecd4] border border-[#cba158]/50 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {registeredMember.tier || 'BRONZE'} TIER
                  </span>
                </div>

                <div className="py-4 relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                      Cardholder
                    </span>
                    <h3 className="font-['Oswald',sans-serif] text-xl font-bold uppercase tracking-wide text-white">
                      {registeredMember.customerName}
                    </h3>
                    <p className="text-xs font-mono text-stone-300">
                      {registeredMember.phone}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                      Royal Points
                    </span>
                    <span className="font-mono text-2xl font-bold text-[#f5d78e] tabular-nums block">
                      {registeredMember.points || 100} PTS
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      ≈ ₹{((registeredMember.points || 100) * 0.5).toFixed(0)} Redeemable
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-stone-400 relative z-10">
                  <span>ID: {registeredMember.memberId || 'SHG-VIP-MEMBER'}</span>
                  <span className="text-[#e5c179] font-bold">100 Welcome Points Added</span>
                </div>
              </div>

              {/* Success Alert & Actions */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-900">Membership successfully activated!</div>
                  <div className="text-[11px] text-emerald-700">
                    Your 100 Royal Points can be redeemed at checkout on your upcoming orders.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-lg hover:shadow-[#cba158]/20 text-stone-950 font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Start Dining & Redeem Points</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Welcome Bonus Callout */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#fdfbf7] to-[#f7f0e3] border border-[#cba158]/40 flex items-center gap-3 shadow-xs">
                <span className="w-9 h-9 rounded-xl bg-[#cba158]/20 flex items-center justify-center text-[#855e18] shrink-0 border border-[#cba158]/30">
                  <Gift className="w-4 h-4 text-[#996e1e]" />
                </span>
                <div className="text-xs">
                  <div className="font-bold text-stone-900 font-['Oswald',sans-serif] uppercase tracking-wide">
                    Instant 100 Welcome Royal Points
                  </div>
                  <div className="text-[11px] text-stone-600">
                    Join today and get ₹50 discount credit applied to your digital loyalty account immediately.
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nawab Asad Ali Khan"
                    required
                    className="w-full bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Mobile Number (Used for points & receipts) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number (e.g. 9839012345)"
                    required
                    className="w-full bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none font-mono transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. asad@royalmail.com"
                    className="w-full bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Birthday (Birthday Feast Gift)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-stone-800 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Preferred Dining Venue
                  </label>
                  <select
                    value={preferredVenue}
                    onChange={(e) => setPreferredVenue(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none transition-colors"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#cba158] via-[#dfb872] to-[#cba158] hover:shadow-lg hover:shadow-[#cba158]/20 disabled:opacity-50 text-stone-950 font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? (
                    <span>Creating Digital Pass...</span>
                  ) : (
                    <>
                      <span>Activate Royal Membership & Claim 100 Points</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-stone-500 text-center leading-relaxed">
                By joining, you agree to receive dining receipts and points notifications via WhatsApp / SMS. No spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
