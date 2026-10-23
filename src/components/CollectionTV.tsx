import React, { useEffect, useState } from 'react';
import { Tv, Sparkles, Volume2, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { Location } from '../types/models';
import { api } from '../services/api';

interface CollectionTVProps {
  locations: Location[];
  onExit: () => void;
}

export const CollectionTV: React.FC<CollectionTVProps> = ({ locations, onExit }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<any[]>([]);
  const [playlistIndex, setPlaylistIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  const promotionalSlides = [
    {
      title: 'SHANGRILLA ROYAL AWADHI DASTARKHWAN',
      tagline: 'Centuries of Nawabi Bawarchi culinary recipes slow-dum over charcoal embers.',
      badge: 'Hazratganj Fine Dining'
    },
    {
      title: 'HIGHWAY EXPRESS DHABA · CLAY KULHAD CHAI',
      tagline: 'Piping hot ginger-cardamom kadak chai brewed 24/7 along the Lucknow highway.',
      badge: 'Highway Dhaba Specials'
    },
    {
      title: 'MELT-IN-MOUTH GALOUTI KEBABS',
      tagline: 'Smoked with live cloves and pure desi ghee, served on warm Ulte Tawe Ka Paratha.',
      badge: 'Chef Signature Dish'
    }
  ];

  // Rotate slides every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaylistIndex(prev => (prev + 1) % promotionalSlides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTvOrders = async () => {
    try {
      const data = await api.getTvOrders(selectedLocationId);
      setReadyOrders(data.ready || []);
      setPreparingOrders(data.preparing || []);
    } catch (e) {
      console.error('Failed to load TV orders:', e);
    }
  };

  useEffect(() => {
    loadTvOrders();
  }, [selectedLocationId]);

  // Real-time synchronization
  useEffect(() => {
    const unsub = api.subscribe((evt) => {
      if (evt.type === 'order_status_updated' || evt.type === 'new_order') {
        loadTvOrders();
      }
    });
    return () => unsub();
  }, [selectedLocationId]);

  const currentSlide = promotionalSlides[playlistIndex];

  return (
    <div className="min-h-screen bg-[#0d090b] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* TV Header */}
      <header className="px-6 py-4 bg-[#181114] border-b border-[#cba158]/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
            title="Exit TV Display"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs uppercase tracking-widest text-[#cba158] font-bold block">
              SHANGRILLA LUCKNOW
            </span>
            <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
              ORDER COLLECTION DISPLAY
            </h1>
          </div>
        </div>

        {/* Location selector and live time */}
        <div className="flex items-center gap-6">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200"
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          <div className="text-right">
            <span className="font-mono text-xl font-bold tracking-wider text-[#e6c989] block tabular-nums">
              {currentTime}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400">Asia/Kolkata (IST)</span>
          </div>
        </div>
      </header>

      {/* Main Split TV Layout */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Ready Orders Column (High Focus) */}
        <section className="col-span-12 lg:col-span-7 bg-[#16211a] border-2 border-emerald-500/50 rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <CheckCircle className="w-48 h-48 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-emerald-800/60 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-300 tracking-wide">
                NOW READY FOR PICKUP
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-950/80 border border-emerald-700 rounded-full">
              {readyOrders.length} Ready
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
              <Clock className="w-16 h-16 text-emerald-600/40 mb-3 animate-pulse" />
              <p className="text-lg font-serif text-stone-300">All ready orders have been collected!</p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Chef is currently preparing freshly placed tickets in the kitchen.
              </p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto content-start">
              {readyOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-black/60 border-2 border-emerald-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg transform hover:scale-105 transition-transform"
                >
                  <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white mb-1">
                    {order.displayNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                    {order.orderType === 'DINE_IN' ? order.tableNumber || 'Dine-In' : 'Takeaway'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-300/80">
            <span>Please present your digital bill / screenshot at the collection counter.</span>
            <span className="font-mono text-emerald-400 font-medium">Counter #1 & #2</span>
          </div>
        </section>

        {/* Right Side: Preparing Orders + Promotional Slide */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          {/* Preparing Orders List */}
          <section className="flex-1 bg-[#151922] border border-blue-500/40 rounded-3xl p-5 flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60 mb-4">
              <h3 className="text-lg font-serif font-bold text-blue-300 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                NOW PREPARING IN KITCHEN
              </h3>
              <span className="text-xs font-mono font-bold text-blue-400">
                {preparingOrders.length} In Progress
              </span>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-stone-500">
                No orders in preparation.
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto content-start">
                {preparingOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-black/50 border border-blue-500/40 rounded-xl p-2.5 text-center"
                  >
                    <span className="text-2xl font-mono font-bold text-blue-100">
                      {order.displayNumber}
                    </span>
                    <span className="block text-[10px] text-stone-400 mt-0.5">
                      {order.orderType === 'DINE_IN' ? order.tableNumber || 'Dine-in' : 'Takeaway'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Promotional Carousel Slide */}
          <section className="h-48 bg-gradient-to-br from-[#24171c] to-[#160f12] border border-[#cba158]/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-15">
              <Sparkles className="w-32 h-32 text-[#cba158]" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#cba158]/20 text-[#f8ecd4] border border-[#cba158]/40">
                {currentSlide.badge}
              </span>
              <h4 className="text-lg sm:text-xl font-serif font-bold text-white mt-2 leading-snug">
                {currentSlide.title}
              </h4>
              <p className="text-xs text-stone-300 font-light mt-1">
                {currentSlide.tagline}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-800 pt-2">
              <span>Scan table QR code on your phone to add more dishes</span>
              <span className="text-[#cba158] font-semibold">Lucknow, UP</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
