import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin, CheckCircle2, ArrowRight, X, Sparkles, Phone, User, Mail, Utensils } from 'lucide-react';
import { api } from '../services/api';
import { Location, TableBooking } from '../types/models';

interface TableBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  defaultLocationId?: string;
  onBookingConfirmed?: (booking: TableBooking) => void;
}

export const TableBookingModal: React.FC<TableBookingModalProps> = ({
  isOpen,
  onClose,
  locations,
  defaultLocationId,
  onBookingConfirmed
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    defaultLocationId || locations[0]?.id || 'shangrilla-hazratganj'
  );
  const [customerName, setCustomerName] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('shangrilla_customer_name')) || '';
  });
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('shangrilla_customer_phone')) || '';
  });
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState<string>('19:30');
  const [guestCount, setGuestCount] = useState<number>(4);
  const [seatingArea, setSeatingArea] = useState<string>('AC Royal Darbar Hall');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<TableBooking | null>(null);

  if (!isOpen) return null;

  const activeLoc = locations.find(l => l.id === selectedLocationId) || locations[0];
  const isDhaba = activeLoc?.code === 'DHABA';

  const seatingOptions = isDhaba
    ? [
        { label: 'Highway Charpai Lawn Under the Stars', desc: 'Traditional rustic woven charpai seating in open air' },
        { label: 'AC Family Glass Lounge', desc: 'Climate controlled comfort overlooking highway lawns' },
        { label: 'Live Tandoor Gazebo', desc: 'Near the live firewood sigris and kulhad chai counter' }
      ]
    : [
        { label: 'AC Royal Darbar Hall', desc: 'Fine dining under crystal chandeliers and Awadhi archways' },
        { label: 'Family VIP Cabin', desc: 'Quiet secluded booth for family gatherings' },
        { label: 'Couples Alcove', desc: 'Intimate candle-lit seating with dedicated table service' }
      ];

  const timeSlots = isDhaba
    ? ['13:00', '14:00', '19:00', '20:00', '21:00', '22:30', '00:00 (Midnight)', '02:00 (Late Night)']
    : ['12:30', '13:15', '14:00', '19:00', '19:45', '20:30', '21:15', '22:00'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please provide your name.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createTableBooking({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        locationId: activeLoc.id,
        locationName: activeLoc.name,
        date,
        timeSlot,
        guestCount,
        seatingArea,
        specialRequests: specialRequests.trim() || undefined
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('shangrilla_customer_name', customerName.trim());
        localStorage.setItem('shangrilla_customer_phone', cleanPhone);
      }

      setConfirmedBooking(res);
      if (onBookingConfirmed) {
        onBookingConfirmed(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#161214] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-6 border-b border-stone-800/80 bg-gradient-to-r from-[#21171a] via-[#281b1f] to-[#181215] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#e5c179]">
                <Utensils className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4972e]">
                Table Reservation
              </span>
            </div>
            <h2 className="font-['Oswald',sans-serif] text-2xl sm:text-3xl text-white font-bold uppercase tracking-tight">
              {confirmedBooking ? 'Table Reserved' : 'Book a Dining Table'}
            </h2>
            <p className="text-xs text-stone-400 font-light">
              Reserve your table in advance with zero wait time upon arrival.
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

        <div className="p-6 overflow-y-auto space-y-5">
          {confirmedBooking ? (
            /* Booking Confirmation View */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-6 rounded-2xl bg-[#1f171a] border border-[#d4972e]/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <span className="text-xs uppercase font-mono text-[#d4972e] tracking-widest">
                    Reservation Confirmed
                  </span>
                  <span className="font-mono text-sm font-bold text-white bg-white/10 px-2.5 py-1 rounded">
                    {confirmedBooking.bookingRef}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-['Oswald',sans-serif] text-xl font-bold text-white uppercase">
                    {confirmedBooking.customerName}
                  </h3>
                  <div className="text-xs text-stone-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#d4972e]" />
                      <span>{confirmedBooking.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#d4972e]" />
                      <span>Date: <strong className="text-white">{confirmedBooking.date}</strong> at <strong className="text-[#f5d78e]">{confirmedBooking.timeSlot}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#d4972e]" />
                      <span>Guests: <strong className="text-white">{confirmedBooking.guestCount} People</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Utensils className="w-3.5 h-3.5 text-[#d4972e]" />
                      <span>Area: <strong className="text-white">{confirmedBooking.seatingArea}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-stone-800 text-[11px] text-stone-400">
                  A reservation confirmation SMS has been prepared for <strong className="text-white">{confirmedBooking.customerPhone}</strong>. Please show this screen or reference upon your arrival at the host desk.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-[#d4972e] hover:bg-[#e5a83b] text-black font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Done / View Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                  {error}
                </div>
              )}

              {/* Venue Selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  Select Venue Branch *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {locations.map(loc => {
                    const isSelected = selectedLocationId === loc.id;
                    return (
                      <button
                        type="button"
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocationId(loc.id);
                          setSeatingArea(loc.code === 'DHABA' ? 'Highway Charpai Lawn Under the Stars' : 'AC Royal Darbar Hall');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#261c1f] border-[#d4972e] text-white ring-1 ring-[#d4972e]'
                            : 'bg-[#1b1517] border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-mono text-[#d4972e] font-semibold">
                          {loc.code === 'DHABA' ? 'Highway 24/7' : 'Fine Dining'}
                        </div>
                        <div className="font-['Oswald',sans-serif] text-xs font-bold uppercase truncate">
                          {loc.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date, Time & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                    Time Slot *
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                    Guests *
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(c => (
                      <option key={c} value={c}>
                        {c} {c === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seating Area */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  Preferred Seating Ambience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {seatingOptions.map(opt => {
                    const isSelected = seatingArea === opt.label;
                    return (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => setSeatingArea(opt.label)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#261c1f] border-[#d4972e] text-white'
                            : 'bg-[#1b1517] border-stone-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">{opt.label}</div>
                        <div className="text-[10px] text-stone-500 line-clamp-1">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                    Your Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Adil Tabassum"
                      required
                      className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                    Mobile Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit phone"
                      required
                      className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  Special Occasion or Dietary Preferences (Optional)
                </label>
                <input
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Birthday anniversary, child booster chair, extra mild spice"
                  className="w-full bg-[#1b1517] border border-stone-800 focus:border-[#d4972e] rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#d4972e] hover:bg-[#e5a83b] disabled:opacity-50 text-black font-['Oswald',sans-serif] uppercase tracking-wider font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <span>Confirming Table...</span>
                  ) : (
                    <>
                      <span>Reserve Table at {activeLoc.name.split(' ')[0]}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
