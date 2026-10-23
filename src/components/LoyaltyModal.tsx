import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Sparkles,
  Award,
  Gift,
  Coins,
  History,
  TrendingUp,
  Search,
  Phone,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Star
} from 'lucide-react';
import { LoyaltyAccount, LoyaltySettings, LoyaltyTier } from '../types/models';
import { api } from '../services/api';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  onSelectRedeem?: (points: number, rupeesOff: number) => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  isOpen,
  onClose,
  initialPhone = '',
  onSelectRedeem
}) => {
  const [phoneInput, setPhoneInput] = useState<string>(initialPhone);
  const [account, setAccount] = useState<any | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState<number>(50);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      // If phone is provided or in localStorage, search immediately
      const savedPhone = initialPhone || localStorage.getItem('shangrilla_customer_phone') || '';
      if (savedPhone) {
        setPhoneInput(savedPhone);
        lookupPhone(savedPhone);
      }
    }
  }, [isOpen, initialPhone]);

  const loadSettings = async () => {
    try {
      const s = await api.getLoyaltySettings();
      setSettings(s);
    } catch (err) {
      console.error('Failed to load loyalty settings:', err);
    }
  };

  const lookupPhone = async (targetPhone: string) => {
    const clean = targetPhone.trim();
    if (!clean || clean.replace(/\D/g, '').length < 6) {
      setSearchError('Please enter a valid phone number to check points.');
      return;
    }

    setIsLoading(true);
    setSearchError('');
    try {
      const data = await api.getLoyaltyAccount(clean);
      setAccount(data);
      if (data && data.phone) {
        localStorage.setItem('shangrilla_customer_phone', data.phone);
      }
      if (data.points) {
        setPointsToRedeemInput(Math.min(data.points, 100));
      }
    } catch (err: any) {
      setSearchError(err.message || 'Could not find account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupPhone(phoneInput);
  };

  if (!isOpen) return null;

  const currentTier = account?.tier || 'BRONZE';
  const points = account?.points || 0;
  const rupeeValuePerPoint = settings?.redemptionValuePerPoint || 0.5;
  const rupeeWorth = Math.round(points * rupeeValuePerPoint * 100) / 100;

  // Next tier threshold
  const tierThresholds = [
    { name: 'BRONZE', label: 'Bronze Member', minSpent: 0, next: 'SILVER', nextMin: 2500 },
    { name: 'SILVER', label: 'Silver Nawabi', minSpent: 2500, next: 'GOLD', nextMin: 7500 },
    { name: 'GOLD', label: 'Gold Dastarkhwan', minSpent: 7500, next: 'SHAHI_ROYAL', nextMin: 20000 },
    { name: 'SHAHI_ROYAL', label: 'Shahi Royal VIP', minSpent: 20000, next: null, nextMin: 20000 }
  ];

  const currentTierMeta = tierThresholds.find(t => t.name === currentTier) || tierThresholds[0];
  const totalSpent = account?.totalSpent || 0;
  const progressPercent = currentTierMeta.next
    ? Math.min(100, Math.round((totalSpent / currentTierMeta.nextMin) * 100))
    : 100;
  const amountNeededForNext = currentTierMeta.next ? Math.max(0, currentTierMeta.nextMin - totalSpent) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-auto bg-[#171415] border border-[#cba158]/30 rounded-2xl shadow-2xl overflow-hidden text-[#f5efe6]">
        {/* Header Bar */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#221c1d] via-[#2d2325] to-[#221c1d] border-b border-[#cba158]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#cba158] to-[#9f7d37] flex items-center justify-center text-black shadow-md shadow-[#cba158]/20">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#cba158] font-bold">
                  Loyalty & Dining Rewards
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#cba158]/10 text-[#e5c179] border border-[#cba158]/30 font-semibold">
                  SHANGRILLA CLUB
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fdfbf7] font-['Oswald',sans-serif] uppercase">
                Royal Rewards Portal
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9f9188] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Phone Lookup Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#8e8178]" />
              <input
                type="tel"
                placeholder="Enter mobile number to view balance (e.g., 9839012345)"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#201a1b] border border-white/15 focus:border-[#cba158] focus:ring-1 focus:ring-[#cba158] text-white text-xs outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#cba158] hover:bg-[#d8b067] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Check Balance
            </button>
          </form>

          {searchError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              {searchError}
            </div>
          )}

          {/* Account Balance Card */}
          {account && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#241d1e] via-[#2a2224] to-[#1c1718] border border-[#cba158]/35 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#baa99b]">Member:</span>
                    <strong className="text-white text-sm font-semibold">{account.customerName}</strong>
                    <span className="text-xs text-[#8e8178]">({account.phone})</span>
                  </div>
                  <div className="text-[11px] text-[#baa99b] mt-0.5">
                    Total Lifetime Spend: <strong className="text-white">₹{account.totalSpent?.toLocaleString('en-IN') || 0}</strong> across {account.totalOrdersCount || 0} orders
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                    currentTier === 'SHAHI_ROYAL'
                      ? 'bg-purple-900/40 border-purple-400 text-purple-200'
                      : currentTier === 'GOLD'
                      ? 'bg-amber-900/40 border-amber-400 text-amber-200'
                      : currentTier === 'SILVER'
                      ? 'bg-slate-800 border-slate-300 text-slate-100'
                      : 'bg-[#2b2223] border-[#cba158]/40 text-[#e5c179]'
                  }`}>
                    <Crown className="w-3 h-3" />
                    {account.tierLabel || currentTier}
                  </span>
                </div>
              </div>

              {/* Points Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] text-[#8e8178] uppercase tracking-wider block">Available Points</span>
                  <div className="text-2xl font-bold font-mono text-[#e5c179] mt-0.5 flex items-center gap-1.5">
                    <Coins className="w-5 h-5 text-[#cba158]" />
                    {points} <span className="text-xs font-sans text-[#baa99b]">pts</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] text-[#8e8178] uppercase tracking-wider block">Redeemable Value</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                    ₹{rupeeWorth.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-[#8e8178]">1 Point = ₹{rupeeValuePerPoint.toFixed(2)} discount</span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] text-[#8e8178] uppercase tracking-wider block">Reward Earn Rate</span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {Math.round((settings?.earnRatePercent || 5) * (account.tierMultiplier || 1.0) * 10) / 10}%
                  </div>
                  <span className="text-[9px] text-[#8e8178]">({account.tierMultiplier || 1.0}x Tier Multiplier)</span>
                </div>
              </div>

              {/* Tier Progress Bar */}
              {currentTierMeta.next && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#a89b91]">
                      Spend <strong className="text-[#e5c179]">₹{amountNeededForNext.toLocaleString('en-IN')}</strong> more to reach{' '}
                      <strong className="text-white">{currentTierMeta.next.replace('_', ' ')}</strong>
                    </span>
                    <span className="font-mono text-[#baa99b]">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#cba158] to-[#f4d187] rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Redeem CTA if points are available and callback provided */}
              {points >= (settings?.minPointsToRedeem || 50) && onSelectRedeem && (
                <div className="p-3 rounded-xl bg-[#cba158]/10 border border-[#cba158]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-semibold text-white">Apply your points at checkout?</span>
                    <p className="text-[11px] text-[#baa99b]">Redeem {points} points for an instant ₹{rupeeWorth} off your meal.</p>
                  </div>
                  <button
                    onClick={() => {
                      onSelectRedeem(points, rupeeWorth);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#cba158] hover:bg-[#d8b067] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-md"
                  >
                    Apply ₹{rupeeWorth} Off Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tier Overview Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#cba158] font-bold">
                Royal Tiers & Exclusive Perks
              </span>
              <span className="text-[10px] text-[#8e8178]">Points earned on every meal automatically</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(settings?.tiers || []).map((t) => {
                const isCurrent = account && account.tier === t.name;
                return (
                  <div
                    key={t.name}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#cba158]/15 border-[#cba158] ring-1 ring-[#cba158]'
                        : 'bg-[#1e191a] border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Crown className={`w-4 h-4 ${isCurrent ? 'text-[#cba158]' : 'text-[#8e8178]'}`} />
                        <h4 className="font-bold text-xs text-white">{t.label}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#cba158] bg-[#cba158]/10 px-2 py-0.5 rounded border border-[#cba158]/20">
                        {t.multiplier}x Points
                      </span>
                    </div>

                    <div className="text-[10px] text-[#8e8178] mb-2.5">
                      {t.minSpent === 0 ? 'Free on First Order' : `Min. Spend: ₹${t.minSpent.toLocaleString('en-IN')}`}
                    </div>

                    <ul className="text-[11px] text-[#baa99b] space-y-1">
                      {t.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3 h-3 text-[#cba158] mt-0.5 shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account History (if loaded) */}
          {account && account.history && account.history.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <span className="text-xs uppercase tracking-wider text-[#cba158] font-bold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Recent Points Activity
              </span>

              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#1b1718] overflow-hidden">
                {account.history.slice(0, 5).map((h: any, idx: number) => {
                  const isPositive = h.pointsChange > 0;
                  return (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-white">{h.reason}</div>
                        <div className="text-[10px] text-[#8e8178]">
                          {new Date(h.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+${h.pointsChange}` : h.pointsChange} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Information & Rules Footnote */}
          <div className="p-3.5 rounded-xl bg-[#201a1b] border border-white/5 text-[11px] text-[#8e8178] space-y-1">
            <p className="font-semibold text-[#baa99b]">Program Details & Terms:</p>
            <p>• Royal Points can be redeemed against up to 50% of your food subtotal at both Hazratganj Royal Restaurant and Highway Express Dhaba.</p>
            <p>• Points are linked with your 10-digit mobile number and never expire as long as you visit once every 12 months.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
