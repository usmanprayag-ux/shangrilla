import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, Edit3, ArrowRight, Receipt, UtensilsCrossed, Star } from 'lucide-react';
import { Order, KitchenStatus } from '../types/models';
import { api } from '../services/api';

interface OrderTrackerModalProps {
  orderId: string;
  onClose: () => void;
  onViewBill: (order: Order) => void;
  onOpenFeedback?: (order: Order) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  orderId,
  onClose,
  onViewBill,
  onOpenFeedback
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [editedNote, setEditedNote] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrder = async () => {
    try {
      const data = await api.getOrderById(orderId);
      setOrder(data);
      if (data.customerNotes) setEditedNote(data.customerNotes);
    } catch (e) {
      console.error('Failed to load order for tracker:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Listen to SSE status updates
  useEffect(() => {
    const unsub = api.subscribe((evt) => {
      if (evt.type === 'order_status_updated' && evt.data.orderId === orderId) {
        setOrder(prev => (prev ? { ...prev, kitchenStatus: evt.data.kitchenStatus } : null));
      } else if (evt.type === 'payment_updated' && evt.data.orderId === orderId) {
        setOrder(prev => (prev ? { ...prev, paymentStatus: evt.data.paymentStatus } : null));
      }
    });
    return () => unsub();
  }, [orderId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-stone-300">
        <div className="animate-pulse">Loading live order status...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#181214] border border-stone-800 p-6 rounded-2xl text-center">
          <p className="text-stone-300 text-sm">Order not found.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-stone-800 text-xs rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  // Calculate 3-minute window remaining
  const createdTime = new Date(order.createdAt).getTime();
  const elapsedMs = now - createdTime;
  const threeMinsMs = 3 * 60 * 1000;
  const remainingMs = Math.max(0, threeMinsMs - elapsedMs);
  const remainingMins = Math.floor(remainingMs / 60000);
  const remainingSecs = Math.floor((remainingMs % 60000) / 1000);
  const canModifyOrCancel = remainingMs > 0 && order.kitchenStatus === 'RECEIVED';

  const handleSaveNote = async () => {
    try {
      const updated = await api.modifyOrder(order.id, editedNote);
      setOrder(updated);
      setIsEditingNote(false);
      setStatusMsg('Special kitchen note updated successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to modify order note');
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order? (Allowed within 3 mins of placement)')) return;
    try {
      const updated = await api.updateOrderStatus(order.id, 'CANCELLED', 'Customer');
      setOrder(updated);
      alert('Your order has been cancelled.');
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const steps: KitchenStatus[] = ['RECEIVED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED'];
  const currentStepIdx = steps.indexOf(order.kitchenStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#181214] border border-[#cba158]/40 rounded-2xl p-6 sm:p-8 text-stone-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-4 border-b border-stone-800">
          <span className="text-xs uppercase tracking-widest text-[#cba158] font-semibold">
            {order.locationName}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
            Live Order Status
          </h2>
          <div className="mt-3 inline-flex flex-col items-center justify-center bg-[#241a1e] border-2 border-[#cba158] rounded-xl px-6 py-2 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-stone-400">Order Number</span>
            <span className="text-4xl font-mono font-bold text-[#f8ecd4]">{order.displayNumber}</span>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="my-6">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-stone-800 w-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#cba158] transition-all duration-500 z-0"
              style={{
                width: order.kitchenStatus === 'CANCELLED'
                  ? '0%'
                  : `${Math.min(100, Math.max(0, (currentStepIdx / (steps.length - 1)) * 100))}%`
              }}
            />

            {steps.map((st, i) => {
              const isPastOrCurrent = currentStepIdx >= i && order.kitchenStatus !== 'CANCELLED';
              const isCurrent = order.kitchenStatus === st;
              return (
                <div key={st} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#cba158] text-[#140e11] ring-4 ring-[#cba158]/30 shadow-lg'
                        : isPastOrCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {isPastOrCurrent ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                    isCurrent ? 'text-[#cba158] font-bold' : isPastOrCurrent ? 'text-stone-300' : 'text-stone-600'
                  }`}>
                    {st === 'RECEIVED' ? 'Received' : st === 'ACCEPTED' ? 'Accepted' : st === 'PREPARING' ? 'Preparing' : st === 'READY' ? 'Ready' : 'Collected'}
                  </span>
                </div>
              );
            })}
          </div>

          {order.kitchenStatus === 'CANCELLED' && (
            <div className="mt-4 p-3 bg-red-950/60 border border-red-700/60 rounded-xl text-center text-red-300 text-xs font-semibold">
              This order has been cancelled.
            </div>
          )}
        </div>

        {/* 3-Minute Modification & Cancellation Notice */}
        {canModifyOrCancel && (
          <div className="mb-4 p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5 text-amber-300">
                <Clock className="w-4 h-4" />
                3-Minute Modification Window
              </span>
              <span className="font-mono font-bold bg-amber-900/80 px-2 py-0.5 rounded text-amber-100">
                {remainingMins}:{remainingSecs < 10 ? '0' : ''}{remainingSecs}
              </span>
            </div>
            <p className="text-[11px] text-stone-300">
              Need to add instructions or cancel? You can update your order before the kitchen begins cooking.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditingNote(!isEditingNote)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-semibold rounded-lg flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3 text-[#cba158]" />
                {isEditingNote ? 'Close Editor' : 'Edit Special Note'}
              </button>

              <button
                onClick={handleCancelOrder}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-[11px] font-semibold rounded-lg"
              >
                Cancel Order
              </button>
            </div>

            {isEditingNote && (
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  placeholder="Update note for chefs..."
                  className="flex-1 px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white"
                />
                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1.5 bg-[#cba158] text-[#140e11] font-bold text-xs rounded-lg"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        )}

        {statusMsg && (
          <p className="mb-3 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg text-center">
            {statusMsg}
          </p>
        )}

        {/* Order Details Brief */}
        <div className="p-4 bg-[#20161a] border border-stone-800 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between text-stone-400 text-[11px]">
            <span>Type: <strong className="text-stone-200">{order.orderType === 'DINE_IN' ? order.tableNumber || 'Dine-In' : order.orderType}</strong></span>
            <span>Payment: <strong className="text-stone-200">{order.paymentStatus} ({order.paymentMethod.replace(/_/g, ' ')})</strong></span>
          </div>

          <div className="pt-2 border-t border-stone-800/80 space-y-1">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-stone-300">
                <span>{it.quantity}x {it.name}</span>
                <span className="font-mono text-white tabular-nums">₹{it.totalPrice}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-800 flex justify-between text-sm font-bold text-white">
            <span>Total:</span>
            <span className="font-mono text-[#f8ecd4] tabular-nums">₹{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* View Bill & Feedback Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={() => onViewBill(order)}
              className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Receipt className="w-4 h-4 text-[#cba158]" />
              View Digital Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white text-xs font-medium rounded-lg"
            >
              Close
            </button>
          </div>

          {onOpenFeedback && (order.kitchenStatus === 'READY' || order.kitchenStatus === 'COLLECTED') && (
            <button
              onClick={() => onOpenFeedback(order)}
              className="w-full py-2 bg-[#22171b] hover:bg-[#2c1d22] border border-[#cba158]/50 text-[#f8ecd4] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Star className="w-4 h-4 text-[#cba158] fill-[#cba158]" />
              Rate Food Quality & Review Dishes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
