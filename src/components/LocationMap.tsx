import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Phone, Clock, ExternalLink, Calendar, Check, Utensils } from 'lucide-react';
import { Location } from '../types/models';

interface LocationMapProps {
  locations: Location[];
  activeLocationId?: string;
  onSelectLocation?: (location: Location) => void;
  onBookTable?: (locationId: string) => void;
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

export const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  activeLocationId,
  onSelectLocation,
  onBookTable
}) => {
  const [currentLocId, setCurrentLocId] = useState<string>(
    activeLocationId || locations[0]?.id || 'shangrilla-hazratganj'
  );

  useEffect(() => {
    if (activeLocationId) {
      setCurrentLocId(activeLocationId);
    }
  }, [activeLocationId]);

  const activeVenue = locations.find(l => l.id === currentLocId) || locations[0];
  const coords = VENUE_COORDS[currentLocId] || VENUE_COORDS['shangrilla-hazratganj'];
  const isDhaba = activeVenue?.code === 'DHABA';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${activeVenue.name}, ${activeVenue.address}`
  )}`;

  return (
    <div className="w-full bg-[#181315] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Venue Switcher Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-800/80 bg-[#140F11] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#e5c179]">
            <Compass className="w-4 h-4" />
          </span>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#d4972e]">
              Live GPS Synced Map
            </div>
            <div className="font-['Oswald',sans-serif] text-sm sm:text-base text-white font-bold uppercase">
              {activeVenue.name}
            </div>
          </div>
        </div>

        {/* Tab Buttons to quickly switch venues on map */}
        <div className="flex items-center gap-1.5 p-1 bg-black/50 rounded-xl border border-stone-800">
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
                    ? 'bg-[#d4972e] text-black font-bold shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
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
        <div className="relative lg:col-span-7 bg-[#100D0E] min-h-[300px] lg:min-h-[420px] overflow-hidden flex flex-col justify-end">
          {/* Real OpenStreetMap / Google Maps Embed */}
          <iframe
            title={`Live Map of ${activeVenue.name}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              `${activeVenue.name}, ${activeVenue.address}`
            )}&t=&z=${coords.zoom}&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full min-h-[320px] lg:min-h-full border-0 filter invert-[0.9] hue-rotate-180 contrast-125 opacity-90 hover:opacity-100 transition-opacity"
            loading="lazy"
            allowFullScreen
          />

          {/* Floating Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white shadow-xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-stone-300">
                Live Venue Pin · Lat {coords.lat.toFixed(4)}, Lng {coords.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Bottom GPS Action Bar */}
          <div className="relative z-10 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between gap-2">
            <span className="text-[11px] text-stone-400 truncate">
              {coords.landmark}
            </span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#d4972e] hover:bg-[#e5a83b] text-black font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow whitespace-nowrap shrink-0 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Venue Information Panel */}
        <div className="lg:col-span-5 p-6 bg-[#161214] border-t lg:border-t-0 lg:border-l border-stone-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4972e] font-semibold">
                {isDhaba ? 'Highway 24/7 Dining Oasis' : 'Heritage Fine Dining & Banquet'}
              </span>
              <h3 className="font-['Oswald',sans-serif] text-2xl font-bold text-white uppercase tracking-tight">
                {activeVenue.name}
              </h3>
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                {isDhaba
                  ? 'Perched on the Lucknow-Ayodhya National Highway, featuring open-air charpais under starlit skies, fragrant coal smoke from clay sigris, and 24-hour non-stop service.'
                  : 'Located in the historic heart of Hazratganj, offering air-conditioned Nawabi royal dining halls, crystal chandeliers, and artisanal Awadhi dastarkhwan delicacies.'}
              </p>
            </div>

            {/* Address & Specs */}
            <div className="p-4 rounded-xl bg-black/40 border border-stone-800/80 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#d4972e] shrink-0 mt-0.5" />
                <span className="text-stone-300 font-light leading-relaxed">
                  {activeVenue.address}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#d4972e] shrink-0" />
                <span className="text-stone-300 font-mono">
                  {activeVenue.openingHours}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#d4972e] shrink-0" />
                <a
                  href={`tel:${activeVenue.phone}`}
                  className="text-[#f5d78e] hover:underline font-mono"
                >
                  {activeVenue.phone}
                </a>
              </div>
            </div>

            {/* Quick Features List */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-[#d4972e]">✓</span>
                <span>{isDhaba ? 'Charpai & Lawn Seating' : 'AC Royal Darbar Hall'}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-[#d4972e]">✓</span>
                <span>{isDhaba ? '24/7 Valet Parking' : 'Hazratganj Valet'}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-[#d4972e]">✓</span>
                <span>UPI & Digital QR Billing</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-[#d4972e]">✓</span>
                <span>{isDhaba ? 'Highway Lawns (500 Pax)' : 'Darbar Hall (150 Pax)'}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {onBookTable && (
              <button
                type="button"
                onClick={() => onBookTable(activeVenue.id)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#d4972e] hover:bg-[#e5a83b] text-black font-['Oswald',sans-serif] uppercase tracking-wider text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve Table</span>
              </button>
            )}

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-['Oswald',sans-serif] uppercase tracking-wider text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4 text-[#d4972e]" />
              <span>Navigate Live</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
