import React from 'react';
import { MapPin, Clock, Utensils, Sparkles, Check, X, Compass } from 'lucide-react';
import { Location } from '../types/models';

interface VenueSelectModalProps {
  isOpen: boolean;
  onClose?: () => void;
  locations: Location[];
  activeLocationId?: string;
  onSelectLocation: (location: Location) => void;
  isInitialPrompt?: boolean;
}

export const VenueSelectModal: React.FC<VenueSelectModalProps> = ({
  isOpen,
  onClose,
  locations,
  activeLocationId,
  onSelectLocation,
  isInitialPrompt = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#161214] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-stone-800/80 bg-gradient-to-r from-[#1c1517] via-[#22181b] to-[#1a1315]">
          {onClose && !isInitialPrompt && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#e5c179]">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4972e]">
              Welcome to SHANGRILLA
            </span>
          </div>
          <h2 className="font-['Oswald',sans-serif] text-2xl sm:text-3xl text-white font-bold uppercase tracking-tight">
            Where are you dining today?
          </h2>
          <p className="text-xs text-stone-400 font-light mt-1">
            Select your venue to view real-time table availability, venue-specific menus, and live kitchen dispatch.
          </p>
        </div>

        {/* Venues Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => {
              const isSelected = activeLocationId === loc.id;
              const isDhaba = loc.code === 'DHABA';

              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc);
                    if (onClose) onClose();
                  }}
                  className={`group relative p-5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-[#231a1d] border-[#d4972e] shadow-lg shadow-[#d4972e]/10 ring-1 ring-[#d4972e]'
                      : 'bg-[#1b1517] border-stone-800 hover:border-stone-700 hover:bg-[#20181b]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-[#d4972e] border border-white/5">
                        {isDhaba ? 'Highway 24/7 Express' : 'Fine Dining & Darbar'}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#d4972e]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-['Oswald',sans-serif] text-lg font-bold text-white uppercase group-hover:text-[#f5d78e] transition-colors leading-snug">
                      {loc.name}
                    </h3>

                    <p className="text-xs text-stone-400 leading-relaxed font-light">
                      {isDhaba
                        ? 'Open-air charpai seating under the stars, live charcoal tandoor, kulhad chai, highway lawns, and 24-hour service.'
                        : 'Air-conditioned royal banquet hall, crystal chandeliers, authentic Lucknowi Awadhi dastarkhwan, and fine table service.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 space-y-1.5 text-[11px] text-stone-400">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#d4972e] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{loc.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#d4972e] shrink-0" />
                      <span className="font-mono text-stone-300">{loc.openingHours}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-lg text-xs font-['Oswald',sans-serif] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#d4972e] text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <span>{isSelected ? 'Currently Selected' : 'Choose This Venue'}</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-[#140F11] border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
          <span className="text-[11px]">
            You can switch venues at any time from the top bar or locations section.
          </span>
          {isInitialPrompt && locations.length > 0 && (
            <button
              onClick={() => {
                const defaultLoc = locations.find(l => l.id === activeLocationId) || locations[0];
                onSelectLocation(defaultLoc);
                if (onClose) onClose();
              }}
              className="text-[#d4972e] hover:underline font-medium text-xs whitespace-nowrap ml-4"
            >
              Continue with {locations[0]?.name.split(' ')[0]} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
