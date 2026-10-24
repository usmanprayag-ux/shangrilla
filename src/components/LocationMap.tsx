import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Phone, Clock, ExternalLink, Calendar, Check, Utensils } from 'lucide-react';
import { Location } from '../types/models';

interface LocationMapProps {
  locations: Location[];
  activeLocationId?: string;
  onSelectLocation?: (location: Location) => void;
}

interface VenueCoordinates {
  lat: number;
  lng: number;
  zoom: number;
  embedQuery: string;
  landmark: string;
}

const VENUE_COORDS: Record<string, VenueCoordinates> = {
  'shangrilla-hazratganj': {
    lat: 26.8500,
    lng: 80.9499,
    zoom: 16,
    embedQuery: 'Hazratganj+Lucknow+Uttar+Pradesh',
    landmark: 'Adjacent to Mayfair Cinema & Janpath Market'
  },
  'shangrilla-highway-dhaba': {
    lat: 26.9200,
    lng: 81.1800,
    zoom: 14,
    embedQuery: 'Lucknow+Ayodhya+Highway+NH27+Barabanki',
    landmark: 'NH-27 Ayodhya Expressway Milestone 18, Lucknow-Barabanki Border'
  }
};

const DEFAULT_FALLBACK_VENUE: Location = {
  id: 'shangrilla-hazratganj',
  name: 'Shangrilla Fine Dining Restaurant & Darbar Hall (Hazratganj)',
  code: 'RESTAURANT',
  tagline: 'Royal Awadhi Fine Dining & Imperial Darbar Hall',
  address: '45 Hazratganj Marg, Near Mayfair Cinema, Hazratganj, Lucknow, UP 226001',
  phone: '+91 522 261 4000',
  upiId: 'shangrilla.royal@icici',
  upiName: 'SHANGRILLA RESTAURANT',
  gstNumber: '09AAACS1420P1Z1',
  gstRate: 5,
  openingHours: '12:00 PM – 11:30 PM',
  tablesCount: 28
};

export const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  activeLocationId,
  onSelectLocation
}) => {
  const [currentLocId, setCurrentLocId] = useState<string>(
    activeLocationId || locations[0]?.id || 'shangrilla-hazratganj'
  );

  useEffect(() => {
    if (activeLocationId) {
      setCurrentLocId(activeLocationId);
    } else if (locations.length > 0 && locations[0]?.id) {
      setCurrentLocId(locations[0].id);
    }
  }, [activeLocationId, locations]);

  const activeVenue =
    locations.find(l => l.id === currentLocId) ||
    locations[0] ||
    DEFAULT_FALLBACK_VENUE;

  const coords = VENUE_COORDS[activeVenue.id] || VENUE_COORDS['shangrilla-hazratganj'];
  const isDhaba = activeVenue.code === 'DHABA';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${activeVenue.name}, ${activeVenue.address}`
  )}`;


  return (
    <div className="w-full bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xl spatial-card">
      {/* Venue Switcher Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200 bg-[#faf8f5] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#b8860b]">
            <Compass className="w-4 h-4" />
          </span>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#b8860b] font-semibold">
              Live GPS Synced Map
            </div>
            <div className="font-['Oswald',sans-serif] text-sm sm:text-base text-stone-900 font-bold uppercase">
              {activeVenue.name}
            </div>
          </div>
        </div>

        {/* Tab Buttons to quickly switch venues on map */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
          {locations.map(loc => {
            const isSelected = loc.id === currentLocId;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setCurrentLocId(loc.id);
                  if (onSelectLocation) onSelectLocation(loc);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Oswald',sans-serif] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#cba158] text-white font-bold shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{loc.code === 'DHABA' ? 'Highway Dhaba' : 'Hazratganj'}</span>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Venue Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* Interactive Map Embed Window */}
        <div className="relative lg:col-span-7 bg-stone-100 min-h-[300px] lg:min-h-[420px] overflow-hidden flex flex-col justify-end">
          {/* Real OpenStreetMap / Google Maps Embed without dark inversion */}
          <iframe
            title={`Live Map of ${activeVenue.name}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              `${activeVenue.name}, ${activeVenue.address}`
            )}&t=&z=${coords.zoom}&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full min-h-[320px] lg:min-h-full border-0 opacity-95 hover:opacity-100 transition-opacity"
            loading="lazy"
            allowFullScreen
          />

          {/* Floating Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200 text-stone-800 shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-stone-700 font-medium">
                Live Venue Pin · Lat {coords.lat.toFixed(4)}, Lng {coords.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Bottom GPS Action Bar */}
          <div className="relative z-10 p-3 bg-gradient-to-t from-white via-white/90 to-transparent flex items-center justify-between gap-2 border-t border-stone-200/80">
            <span className="text-[11px] text-stone-600 truncate font-medium">
              {coords.landmark}
            </span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-[#cba158] hover:bg-[#b8860b] text-white font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 transition-all spatial-interactive"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Venue Information Panel */}
        <div className="lg:col-span-5 p-6 bg-white border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#b8860b] font-semibold">
                {isDhaba ? 'Highway 24/7 Dining Oasis' : 'Heritage Fine Dining & Banquet'}
              </span>
              <h3 className="font-['Oswald',sans-serif] text-2xl font-bold text-stone-900 uppercase tracking-tight">
                {activeVenue.name}
              </h3>
              <p className="text-xs text-stone-600 font-light leading-relaxed">
                {isDhaba
                  ? 'Perched on the Lucknow-Ayodhya National Highway, featuring open-air charpais under starlit skies, fragrant coal smoke from clay sigris, and 24-hour non-stop service.'
                  : 'Located in the historic heart of Hazratganj, offering air-conditioned Nawabi royal dining halls, crystal chandeliers, and artisanal Awadhi dastarkhwan delicacies.'}
              </p>
            </div>

            {/* Address & Specs */}
            <div className="p-4 rounded-xl bg-[#faf8f5] border border-stone-200 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#b8860b] shrink-0 mt-0.5" />
                <span className="text-stone-700 font-light leading-relaxed">
                  {activeVenue.address}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#b8860b] shrink-0" />
                <span className="text-stone-700 font-mono font-medium">
                  {activeVenue.openingHours}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#b8860b] shrink-0" />
                <a
                  href={`tel:${activeVenue.phone}`}
                  className="text-[#b8860b] hover:underline font-mono font-medium"
                >
                  {activeVenue.phone}
                </a>
              </div>
            </div>

            {/* Quick Features List */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-700">
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2">
                <span className="text-[#b8860b] font-bold">✓</span>
                <span>{isDhaba ? 'Charpai & Lawn Seating' : 'AC Royal Darbar Hall'}</span>
              </div>
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2">
                <span className="text-[#b8860b] font-bold">✓</span>
                <span>{isDhaba ? '24/7 Valet Parking' : 'Hazratganj Valet'}</span>
              </div>
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2">
                <span className="text-[#b8860b] font-bold">✓</span>
                <span>UPI & Digital QR Billing</span>
              </div>
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2">
                <span className="text-[#b8860b] font-bold">✓</span>
                <span>{isDhaba ? 'Highway Lawns (500 Pax)' : 'Darbar Hall (150 Pax)'}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#cba158] hover:bg-[#b8860b] text-white font-['Oswald',sans-serif] uppercase tracking-wider text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md spatial-interactive"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>Get Live GPS Directions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
