import React, { useState } from 'react';
import {
  X,
  Calendar,
  Users,
  Building,
  Utensils,
  CheckCircle2,
  Phone,
  Mail,
  User,
  PartyPopper,
  Send
} from 'lucide-react';
import { EventBooking, EventType } from '../types/models';
import { api } from '../services/api';

interface BookEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocationId?: string;
  onEventCreated?: (event: EventBooking) => void;
}

const EVENT_TYPES: { type: EventType; icon: string; description: string }[] = [
  {
    type: 'Wedding & Reception',
    icon: '💍',
    description: 'Grand royal wedding celebrations with imperial silver dastarkhwan dining.'
  },
  {
    type: 'Corporate Conference & Dinner',
    icon: '💼',
    description: 'Executive dinners, brand launches, and AV-equipped conference banquets.'
  },
  {
    type: 'Birthday Celebration',
    icon: '🎂',
    description: 'Vibrant celebrations with customized decor, live snacks, and highway lawns.'
  },
  {
    type: 'Anniversary Gala',
    icon: '🥂',
    description: 'Intimate royal fine dining with personalized menus and vintage Awadhi ambiance.'
  },
  {
    type: 'Awadhi Dastarkhwan Family Feast',
    icon: '🥘',
    description: 'Traditional multi-course slow-cooked Awadhi heritage feasts for 20+ guests.'
  },
  {
    type: 'Kitty Party & Hi-Tea',
    icon: '☕',
    description: 'Afternoon gatherings with live chaat, tandoori starters & kulhad chai.'
  },
  {
    type: 'Cocktail & Sangeet',
    icon: '✨',
    description: 'Evening celebrations with open-air lawns, live grill counters & music spaces.'
  },
  {
    type: 'Other Special Occasion',
    icon: '🎉',
    description: 'Custom celebratory packages tailored to your exact party requirements.'
  }
];

const PACKAGES = [
  {
    id: 'Royal Awadhi Platinum',
    name: 'Royal Awadhi Platinum Feast',
    pricePerHead: 1650,
    highlights: ['Galouti Kebabs & Kakori', 'Mutton Awadhi Biryani', 'Ulte Tawe Parathas', 'Shahi Tukda & Kulfi', 'Silver Service']
  },
  {
    id: 'Royal Awadhi Gold',
    name: 'Awadhi Classic Gold Banquet',
    pricePerHead: 1200,
    highlights: ['Chicken Seekh & Paneer Tikka', 'Dum Biryani & Dal Makhani', 'Assorted Naans & Rotis', 'Zafrani Phirni']
  },
  {
    id: 'Highway Tandoor BBQ Buffet',
    name: 'Highway Tandoor & Grill Buffet',
    pricePerHead: 850,
    highlights: ['Live Charcoal Angithi', 'Bhatti Murgh & Seekh', 'Butter Chicken & Naan', 'Matka Rabri Jalebi']
  },
  {
    id: 'Custom Imperial Dastarkhwan',
    name: 'Custom Imperial Menu',
    pricePerHead: 2100,
    highlights: ['Bespoke 7-course curated menu', 'Personal Master Chef on-site', 'Imperial bone china & silver', 'Vintage Awadhi paan counter']
  }
];

export const BookEventModal: React.FC<BookEventModalProps> = ({
  isOpen,
  onClose,
  defaultLocationId = 'shangrilla-hazratganj',
  onEventCreated
}) => {
  const [eventType, setEventType] = useState<EventType>('Wedding & Reception');
  const [headcount, setHeadcount] = useState<number>(50);
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [timeSlot, setTimeSlot] = useState<'LUNCH' | 'DINNER' | 'FULL_DAY'>('DINNER');
  const [preferredLocationId, setPreferredLocationId] = useState<string>(defaultLocationId);
  const [preferredHallOrArea, setPreferredHallOrArea] = useState<string>('Royal Darbar Hall');
  const [packagePreference, setPackagePreference] = useState<string>('Royal Awadhi Platinum');

  // Customer contact details
  const [customerName, setCustomerName] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('shangrilla_customer_name') || '') : '';
  });
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('shangrilla_customer_phone') || '') : '';
  });
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submittedBooking, setSubmittedBooking] = useState<EventBooking | null>(null);

  if (!isOpen) return null;

  const selectedPkg = PACKAGES.find((p) => p.id === packagePreference) || PACKAGES[0];
  const estimatedSubtotal = selectedPkg.pricePerHead * headcount;
  const estimatedTax = Math.round(estimatedSubtotal * 0.05);
  const estimatedGrandTotal = estimatedSubtotal + estimatedTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full contact name.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('shangrilla_customer_name', customerName.trim());
        localStorage.setItem('shangrilla_customer_phone', customerPhone.trim());
      }

      const created = await api.createEvent({
        eventType,
        headcount,
        date,
        timeSlot,
        preferredLocationId,
        preferredHallOrArea: preferredLocationId === 'shangrilla-hazratganj' ? preferredHallOrArea : 'Highway Open Lawn & Pavilions',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        packagePreference: selectedPkg.id,
        estimatedBudgetPerHead: selectedPkg.pricePerHead,
        totalEstimatedAmount: estimatedGrandTotal,
        specialRequests: specialRequests.trim() || undefined
      });

      setSubmittedBooking(created);
      if (onEventCreated) {
        onEventCreated(created);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit event booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md overflow-y-auto animate-apple-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-4xl my-auto bg-white border border-stone-200/90 rounded-3xl shadow-[0_25px_65px_rgba(0,0,0,0.22)] overflow-hidden text-stone-800 animate-apple-modal z-10">
        {/* Header Bar */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[#faf8f5] via-white to-[#faf8f5] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#cba158]/20 border border-[#cba158]/35 flex items-center justify-center text-[#855e18] shadow-xs">
              <PartyPopper className="w-5 h-5 text-[#996e1e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#996e1e] font-bold">
                  Banquets & Celebrations
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#cba158]/15 text-[#855e18] border border-[#cba158]/25 font-bold">
                  SHANGRILLA LUCKNOW
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-['Oswald',sans-serif] uppercase">
                Book an Event & Banquet
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all apple-press cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {submittedBooking ? (
          // Success Screen
          <div className="p-8 sm:p-12 text-center space-y-6 bg-white animate-modal-pop">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#996e1e] font-bold">
                Request Successfully Received
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-['Oswald',sans-serif] text-stone-900 uppercase">
                Thank You, {submittedBooking.customerName}!
              </h3>
              <p className="text-sm text-stone-600 max-w-lg mx-auto">
                Your banquet request for <strong className="text-stone-900">{submittedBooking.eventType}</strong> on{' '}
                <strong className="text-stone-900">{new Date(submittedBooking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> has been logged.
              </p>
            </div>

            {/* Booking Reference Box */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-[#faf8f5] border border-stone-200 space-y-3 text-left shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                <span className="text-xs text-stone-600 font-medium">Booking Reference</span>
                <span className="font-mono text-base font-bold text-[#855e18] bg-[#cba158]/20 px-2.5 py-0.5 rounded border border-[#cba158]/35">
                  {submittedBooking.bookingReference}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-500 block">Venue Branch</span>
                  <span className="font-bold text-stone-900">
                    {submittedBooking.preferredLocationId === 'shangrilla-hazratganj'
                      ? 'Hazratganj Royal Restaurant'
                      : 'Highway Express Dhaba'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Guest Count</span>
                  <span className="font-bold text-stone-900">{submittedBooking.headcount} Guests ({submittedBooking.timeSlot})</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Package</span>
                  <span className="font-bold text-stone-900">{submittedBooking.packagePreference}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Est. Total</span>
                  <span className="font-bold text-emerald-700 font-mono">₹{submittedBooking.totalEstimatedAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 max-w-lg mx-auto text-xs text-stone-600 space-y-1">
              <p className="font-bold text-stone-900">What happens next?</p>
              <p>Our Banquet Concierge will call you within 2 business hours on <strong className="text-stone-900">{submittedBooking.customerPhone}</strong> to review tastings, finalize menu courses, and confirm your booking advance.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/919839012345?text=${encodeURIComponent(
                  `Hello SHANGRILLA Banquets, I just requested an event booking (${submittedBooking.bookingReference}) for ${submittedBooking.eventType} on ${submittedBooking.date}. Please assist.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Chat on WhatsApp (+91 98390 12345)
              </a>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs tracking-wide transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          // Form View
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-white">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {errorMessage}
              </div>
            )}

            {/* Step 1: Event Type */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-[#996e1e] font-bold">
                1. Select Event Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {EVENT_TYPES.map((et) => {
                  const isSelected = eventType === et.type;
                  return (
                    <button
                      key={et.type}
                      type="button"
                      onClick={() => setEventType(et.type)}
                      className={`p-3 rounded-xl border text-left transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#cba158]/15 border-[#cba158] shadow-sm ring-1 ring-[#cba158]'
                          : 'bg-[#faf8f5] border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{et.icon}</div>
                      <div>
                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#855e18]' : 'text-stone-800'}`}>
                          {et.type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Headcount, Date & Venue */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Headcount */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#996e1e] font-bold">
                  <Users className="w-3.5 h-3.5" />
                  2. Headcount (Guests) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={headcount}
                    onChange={(e) => setHeadcount(Math.max(1, parseInt(e.target.value, 10) || 10))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white text-stone-900 text-sm font-bold outline-none"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-stone-500 font-medium">Pax</span>
                </div>
                {/* Quick Pax Pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {[25, 50, 100, 200, 350].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setHeadcount(count)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        headcount === count
                          ? 'bg-[#cba158] text-stone-950 border-[#cba158]'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#996e1e] font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  3. Event Date *
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white text-stone-900 text-sm font-medium outline-none"
                  required
                />
                {/* Time slot picker */}
                <div className="flex gap-1.5">
                  {(['LUNCH', 'DINNER', 'FULL_DAY'] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                        timeSlot === slot
                          ? 'bg-[#cba158]/20 text-[#855e18] border-[#cba158]'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:text-stone-900'
                      }`}
                    >
                      {slot === 'FULL_DAY' ? 'Full Day' : slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue Branch */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#996e1e] font-bold">
                  <Building className="w-3.5 h-3.5" />
                  4. Preferred Venue Branch *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreferredLocationId('shangrilla-hazratganj');
                      setPreferredHallOrArea('Royal Darbar Hall');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      preferredLocationId === 'shangrilla-hazratganj'
                        ? 'bg-[#cba158]/15 border-[#cba158] text-stone-900'
                        : 'bg-[#faf8f5] border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-stone-900">Hazratganj Royal</div>
                    <div className="text-[10px] text-stone-500">Imperial Banquet (150 Pax)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreferredLocationId('shangrilla-highway-dhaba');
                      setPreferredHallOrArea('Highway Open Lawn & Pavilions');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      preferredLocationId === 'shangrilla-highway-dhaba'
                        ? 'bg-[#cba158]/15 border-[#cba158] text-stone-900'
                        : 'bg-[#faf8f5] border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-stone-900">Highway Dhaba</div>
                    <div className="text-[10px] text-stone-500">Grand Lawn (500 Pax)</div>
                  </button>
                </div>

                {preferredLocationId === 'shangrilla-hazratganj' && (
                  <select
                    value={preferredHallOrArea}
                    onChange={(e) => setPreferredHallOrArea(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#faf8f5] border border-stone-200 text-xs text-[#855e18] font-bold outline-none"
                  >
                    <option value="Royal Darbar Hall">Royal Darbar Hall (Up to 150 Pax)</option>
                    <option value="Mughal Private Dining Suite">Mughal Private Dining Suite (Up to 40 Pax)</option>
                    <option value="Rooftop Shahi Terrace">Rooftop Shahi Terrace (Up to 90 Pax)</option>
                  </select>
                )}
              </div>
            </div>

            {/* Step 3: Food & Menu Package Selection */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#996e1e] font-bold">
                <Utensils className="w-3.5 h-3.5" />
                5. Select Food & Dining Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PACKAGES.map((pkg) => {
                  const isSelected = packagePreference === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setPackagePreference(pkg.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#cba158]/10 border-[#cba158] shadow-sm ring-1 ring-[#cba158]'
                          : 'bg-[#faf8f5] border-stone-200 hover:border-[#cba158]/50 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-xs font-bold text-stone-900 leading-snug">{pkg.name}</h4>
                          <span className="text-xs font-bold text-[#855e18] ml-2 whitespace-nowrap">
                            ₹{pkg.pricePerHead}/head
                          </span>
                        </div>
                        <ul className="text-[10px] text-stone-600 space-y-1 mt-2">
                          {pkg.highlights.map((h, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-[#996e1e]">•</span> {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3 pt-2 border-t border-stone-200 flex justify-between items-center text-[10px]">
                        <span className="text-stone-500">For {headcount} guests</span>
                        <span className="font-bold text-stone-900 font-mono">₹{(pkg.pricePerHead * headcount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Contact Information */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs uppercase tracking-wider text-[#996e1e] font-bold">
                6. Contact Details for Banquet Manager *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white text-stone-900 text-xs outline-none"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="Mobile Number (10 Digits) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white text-stone-900 text-xs outline-none font-mono"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    placeholder="Email Address (Optional)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white text-stone-900 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Special Requests */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-[#996e1e] font-bold">
                7. Special Requests or Arrangements
              </label>
              <textarea
                rows={2}
                placeholder="E.g., live ghazal music, projector & sound system, floral decoration, specific Awadhi dessert additions, stage requirements..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-stone-200 focus:border-[#cba158] focus:bg-white text-stone-900 text-xs outline-none resize-none"
              />
            </div>

            {/* Live Estimation Bar & Submit Button */}
            <div className="p-4 rounded-xl bg-[#faf8f5] border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-medium">Estimated Quote (Incl. 5% GST)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-[#855e18]">
                    ₹{estimatedGrandTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    (₹{selectedPkg.pricePerHead}/head × {headcount} guests + ₹{estimatedTax.toLocaleString('en-IN')} GST)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-lg hover:shadow-[#cba158]/25 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Banquet Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
