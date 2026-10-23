import React, { useState } from 'react';
import { Crown, Sparkles, Phone, User, Mail, Calendar, MapPin, CheckCircle2, QrCode, ArrowRight, X, Gift } from 'lucide-react';
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
  const [anniversary, setAnniversary] = useState<string>('');
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
        anniversary: anniversary || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#161214] border border-[#cba158]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-6 border-b border-stone-800/80 bg-gradient-to-r from-[#21181b] via-[#281c20] to-[#1a1215] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#cba158]/20 border border-[#cba158]/40 flex items-center justify-center text-[#e5c179]">
                <Crown className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4972e]">
                SHANGRILLA Royal Club
              </span>
            </div>
            <h2 className="font-['Oswald',sans-serif] text-2xl sm:text-3xl text-white font-bold uppercase tracking-tight">
              {registeredMember ? 'Welcome to the Royalty' : 'Become a Royal Member'}
            </h2>
            <p className="text-xs text-stone-300 font-light">
              {registeredMember
                ? 'Your exclusive digital pass has been activated with 100 welcome bonus points!'
                : 'Enjoy 5% cashback on every meal, priority banquet reservations & secret Awadhi specials.'}
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

        <div className="p-6 overflow-y-auto space-y-6">
          {registeredMember ? (
            /* Digital Royal Member Card View */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              {/* Virtual Card */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#2a1e22] via-[#38262c] to-[#1c1316] border border-[#d4972e]/40 shadow-2xl overflow-hidden text-white flex flex-col justify-between min-h-[220px]">
                {/* Decorative background glow */}
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#d4972e]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <span className="font-['Oswald',sans-serif] font-bold text-lg tracking-wider text-white">
                      SHANGRILLA
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#d4972e] block">
                      ROYAL DINING CLUB PASS
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-[#d4972e]/20 text-[#f5d78e] border border-[#d4972e]/40 text-[10px] font-mono font-bold uppercase tracking-wider">
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

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-stone-400 relative z-10">
                  <span>ID: {registeredMember.memberId || 'SHG-VIP-MEMBER'}</span>
                  <span className="text-[#d4972e]">100 Welcome Points Added</span>
                </div>
              </div>

              {/* Success Alert & Actions */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-emerald-300">Membership successfully linked!</div>
                  <div className="text-[11px] text-emerald-400/80">
                    Your 100 Royal Points can be redeemed at checkout on your first order.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#d4972e] hover:bg-[#e5a83b] text-black font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Start Dining & Redeem Points</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Welcome Bonus Callout */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#d4972e]/15 to-[#e5a83b]/10 border border-[#d4972e]/30 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#d4972e]/20 flex items-center justify-center text-[#f5d78e] shrink-0">
                  <Gift className="w-4 h-4" />
                </span>
                <div className="text-xs">
                  <div className="font-bold text-white font-['Oswald',sans-serif] uppercase tracking-wide">
                    Instant 100 Welcome Royal Points
                  </div>
                  <div className="text-[11px] text-stone-300 font-light">
                    Join today and get ₹50 discount credit applied to your digital loyalty account immediately.
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nawab Asad Ali Khan"
                    required
                    className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  Mobile Number (Used for points & receipts) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number (e.g. 9839012345)"
                    required
                    className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. asad@royalmail.com"
                    className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                    Birthday (Birthday Feast Gift)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                    Preferred Dining Venue
                  </label>
                  <select
                    value={preferredVenue}
                    onChange={(e) => setPreferredVenue(e.target.value)}
                    className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl px-3 py-2.5 text-xs text-stone-200 focus:outline-none"
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
                  className="w-full py-3 bg-[#d4972e] hover:bg-[#e5a83b] disabled:opacity-50 text-black font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
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

              <p className="text-[10px] text-stone-500 text-center font-light leading-relaxed">
                By joining, you agree to receive dining receipts and points notifications via WhatsApp / SMS. No spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
