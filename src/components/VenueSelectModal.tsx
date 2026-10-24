import React from 'react';
import { MapPin, Clock, Check, X, Compass } from 'lucide-react';
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
  if (!isOpen || locations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-apple-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-stone-200/90 rounded-3xl shadow-[0_25px_65px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col max-h-[90vh] animate-apple-modal z-10">
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-stone-200 bg-gradient-to-r from-[#faf8f5] via-white to-[#faf8f5]">
          {onClose && !isInitialPrompt && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-all apple-press cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-[#cba158]/20 border border-[#cba158]/35 flex items-center justify-center text-[#855e18] shadow-xs">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#996e1e] font-bold">
              Welcome to SHANGRILLA
            </span>
          </div>
          <h2 className="font-['Oswald',sans-serif] text-2xl sm:text-3xl text-stone-900 font-bold uppercase tracking-tight">
            Where are you dining today?
          </h2>
          <p className="text-xs text-stone-600 font-normal mt-1">
            Choose your venue branch to view authentic Awadhi specials and live kitchen status.
          </p>
        </div>

        {/* Venues Grid */}
        <div className="p-6 overflow-y-auto space-y-4 bg-white">
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
                  className={`group relative p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#fdfbf7] to-[#f7f0e3] border-[#cba158] shadow-lg shadow-[#cba158]/15 ring-2 ring-[#cba158]'
                      : 'bg-[#faf8f5] border-stone-200 hover:border-[#cba158]/60 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#cba158]/15 text-[#855e18] border border-[#cba158]/25">
                        {isDhaba ? 'Highway 24/7 Express' : 'Fine Dining & Darbar'}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#855e18]">
                          <Check className="w-3.5 h-3.5 text-[#996e1e]" />
                          <span>Active Venue</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-['Oswald',sans-serif] text-lg font-bold text-stone-900 uppercase group-hover:text-[#996e1e] transition-colors leading-snug">
                      {loc.name}
                    </h3>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {isDhaba
                        ? 'Open-air charpai seating under the stars, live charcoal tandoor, kulhad chai, highway lawns, and 24-hour service.'
                        : 'Air-conditioned royal banquet hall, crystal chandeliers, authentic Lucknowi Awadhi dastarkhwan, and fine table service.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-200 space-y-1.5 text-[11px] text-stone-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#996e1e] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{loc.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#996e1e] shrink-0" />
                      <span className="font-mono font-medium text-stone-800">{loc.openingHours}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl text-xs font-['Oswald',sans-serif] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#cba158] to-[#dfb872] text-stone-950 shadow-md'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-300'
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
        <div className="px-6 py-4 bg-[#faf8f5] border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <span className="text-[11px]">
            You can switch venues anytime from the top bar or locations section.
          </span>
          {isInitialPrompt && locations.length > 0 && (
            <button
              onClick={() => {
                const defaultLoc = locations.find(l => l.id === activeLocationId) || locations[0];
                onSelectLocation(defaultLoc);
                if (onClose) onClose();
              }}
              className="text-[#996e1e] hover:underline font-bold text-xs whitespace-nowrap ml-4 cursor-pointer"
            >
              Continue with {locations[0]?.name.split(' ')[0]} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
