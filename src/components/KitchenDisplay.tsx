import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, CheckCircle, Clock, AlertTriangle, Printer, RefreshCw, Flame, Check } from 'lucide-react';
import { Order, Location } from '../types/models';
import { api } from '../services/api';
import { kitchenAudio } from '../services/audio';

interface KitchenDisplayProps {
  locations: Location[];
  onExit: () => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ locations, onExit }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(kitchenAudio.isEnabled());
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  // Time tracker for preparation counters
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders({
        locationId: selectedLocationId,
        // Show active kitchen orders (received, accepted, preparing, ready)
      });
      // Filter out collected and cancelled for primary kitchen view
      const active = data.filter(o => o.kitchenStatus !== 'COLLECTED' && o.kitchenStatus !== 'CANCELLED');
      setOrders(active);
    } catch (e) {
      console.error('Failed to load kitchen orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedLocationId]);

  // Subscribe to SSE for new orders and status updates
  useEffect(() => {
    const unsubscribe = api.subscribe((event) => {
      if (event.type === 'new_order') {
        const newOrder: Order = event.data;
        if (selectedLocationId === 'all' || newOrder.locationId === selectedLocationId) {
          setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
          setHighlightOrderId(newOrder.id);
          kitchenAudio.playOrderBell();
          setTimeout(() => setHighlightOrderId(null), 10000);
        }
      } else if (event.type === 'order_status_updated') {
        const { orderId, kitchenStatus } = event.data;
        setOrders(prev => {
          if (kitchenStatus === 'COLLECTED' || kitchenStatus === 'CANCELLED') {
            return prev.filter(o => o.id !== orderId);
          }
          return prev.map(o => (o.id === orderId ? { ...o, kitchenStatus } : o));
        });
      }
    });

    return () => unsubscribe();
  }, [selectedLocationId]);

  const handleEnableAudio = () => {
    const success = kitchenAudio.enable();
    setAudioEnabled(success);
  };

  const updateStatus = async (orderId: string, nextStatus: any) => {
    try {
      await api.updateOrderStatus(orderId, nextStatus, 'Kitchen Chef');
      setOrders(prev => {
        if (nextStatus === 'COLLECTED') {
          return prev.filter(o => o.id !== orderId);
        }
        return prev.map(o => (o.id === orderId ? { ...o, kitchenStatus: nextStatus } : o));
      });
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const elapsedSec = Math.floor((now - new Date(createdAt).getTime()) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#0e0a0c] text-stone-100 flex flex-col font-sans select-none">
      {/* KDS Header Bar */}
      <header className="px-4 py-3 bg-[#181114] border-b border-[#cba158]/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition-colors"
          >
            ← Exit KDS
          </button>
          <div>
            <h1 className="font-serif font-bold text-lg text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              SHANGRILLA LIVE KITCHEN DISPLAY
            </h1>
            <p className="text-[11px] text-stone-400">Tablet Landscape Mode · Auto Real-Time Synchronization</p>
          </div>
        </div>

        {/* Location selector and controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedLocationId('all')}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                selectedLocationId === 'all' ? 'bg-[#cba158] text-[#140e11] font-bold' : 'text-stone-400'
              }`}
            >
              All Kitchens
            </button>
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  selectedLocationId === loc.id ? 'bg-[#cba158] text-[#140e11] font-bold' : 'text-stone-400'
                }`}
              >
                {loc.code === 'RESTAURANT' ? 'Hazratganj' : 'Highway Dhaba'}
              </button>
            ))}
          </div>

          <button
            onClick={handleEnableAudio}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              audioEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                : 'bg-amber-950/80 text-amber-300 border border-amber-600 animate-bounce'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioEnabled ? 'Audio Alert On' : 'Enable Bell Sound'}</span>
          </button>

          <button
            onClick={loadOrders}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
            title="Refresh"
            aria-label="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Grid of Order Tickets */}
      <main className="flex-1 p-4 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center text-stone-500">
            <CheckCircle className="w-16 h-16 text-emerald-600/40 mb-3" />
            <h3 className="text-xl font-serif text-stone-300 font-semibold">All Orders Cleared</h3>
            <p className="text-xs text-stone-500 mt-1">Kitchen queue is calm. New incoming orders will ring the bell immediately.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => {
              const isHighlighted = highlightOrderId === order.id;
              const isReceived = order.kitchenStatus === 'RECEIVED';
              const isPreparing = order.kitchenStatus === 'PREPARING';
              const isReady = order.kitchenStatus === 'READY';

              return (
                <div
                  key={order.id}
                  className={`flex flex-col rounded-xl overflow-hidden border transition-all duration-300 shadow-xl ${
                    isHighlighted
                      ? 'border-amber-400 ring-2 ring-amber-400/50 bg-[#281b20]'
                      : isReady
                      ? 'border-emerald-600/50 bg-[#161f1a]'
                      : isPreparing
                      ? 'border-blue-500/50 bg-[#141a24]'
                      : 'border-stone-800 bg-[#1c1417]'
                  }`}
                >
                  {/* Card Header with Huge Number */}
                  <div className="p-3.5 border-b border-stone-800/80 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-[#cba158] text-[#140e11] font-mono font-bold text-2xl rounded-lg">
                        {order.displayNumber}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#e6c989] block">
                          {order.orderType === 'DINE_IN' ? order.tableNumber || 'Table 1' : order.orderType}
                        </span>
                        <span className="text-[10px] text-stone-400 block truncate max-w-[130px]">
                          {order.locationName.replace('SHANGRILLA ', '')}
                        </span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-black/60 text-amber-400">
                        <Clock className="w-3 h-3" />
                        <span>{getElapsedTime(order.createdAt)}</span>
                      </div>
                      <span className={`block text-[10px] font-semibold mt-0.5 ${
                        order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {order.paymentStatus} · {order.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Customer and Special Notes */}
                  {(order.customerNotes || order.customerName) && (
                    <div className="px-3 py-2 bg-stone-900/50 border-b border-stone-800/60 text-xs">
                      <span className="text-stone-400 text-[10px]">Guest: </span>
                      <span className="font-medium text-stone-200 text-[11px]">{order.customerName}</span>
                      {order.customerNotes && (
                        <p className="mt-0.5 text-[11px] text-amber-300/90 font-medium italic">
                          ⚠️ Note: {order.customerNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 border-b border-stone-800/40 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-[#cba158]/20 text-[#f8ecd4] border border-[#cba158]/40 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {it.quantity}x
                            </span>
                            <span className="text-sm font-semibold text-white leading-tight">
                              {it.name}
                            </span>
                          </div>
                          {it.selectedAddons && it.selectedAddons.length > 0 && (
                            <p className="text-[10px] text-stone-400 ml-8 mt-0.5">
                              + {it.selectedAddons.map(a => a.name).join(', ')}
                            </p>
                          )}
                          {it.specialInstructions && (
                            <p className="text-[10px] text-amber-300 italic ml-8 mt-0.5">
                              "{it.specialInstructions}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Kitchen Action Bar */}
                  <div className="p-3 border-t border-stone-800/80 bg-black/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">Current Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isReady
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : isPreparing
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}>
                        {order.kitchenStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {isReceived && (
                        <>
                          <button
                            onClick={() => updateStatus(order.id, 'ACCEPTED')}
                            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Accept Order
                          </button>
                          <button
                            onClick={() => updateStatus(order.id, 'PREPARING')}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md"
                          >
                            Start Preparing
                          </button>
                        </>
                      )}

                      {order.kitchenStatus === 'ACCEPTED' && (
                        <button
                          onClick={() => updateStatus(order.id, 'PREPARING')}
                          className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          Start Preparing Now
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          onClick={() => updateStatus(order.id, 'READY')}
                          className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Mark Order as Ready
                        </button>
                      )}

                      {isReady && (
                        <button
                          onClick={() => updateStatus(order.id, 'COLLECTED')}
                          className="col-span-2 py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Guest Collected
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
