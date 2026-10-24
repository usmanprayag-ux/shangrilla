import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Receipt, Star, RotateCcw, AlertCircle } from 'lucide-react';
import { Order, MenuItem } from '../types/models';
import { api } from '../services/api';

interface OrderHistoryModalProps {
  onClose: () => void;
  onViewBill: (order: Order) => void;
  onTrackOrder: (orderId: string) => void;
  onOpenFeedback: (order: Order) => void;
  onRepeatOrder: (items: { item: MenuItem; quantity: number }[]) => void;
  menuItems: MenuItem[];
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  onClose,
  onViewBill,
  onTrackOrder,
  onOpenFeedback,
  onRepeatOrder,
  menuItems
}) => {
  const [phone, setPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shangrilla_customer_phone') || '';
    }
    return '';
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchHistory = async (searchPhone: string) => {
    if (!searchPhone.trim()) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setSearched(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('shangrilla_customer_phone', searchPhone.trim());
      }
      const data = await api.getOrderHistory(searchPhone.trim());
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone.trim()) {
      fetchHistory(phone);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(phone);
  };

  const handleRepeat = (order: Order) => {
    const matchedItems: { item: MenuItem; quantity: number }[] = [];
    for (const it of order.items) {
      const found = menuItems.find(m => m.id === it.menuItemId);
      if (found) {
        matchedItems.push({ item: found, quantity: it.quantity });
      }
    }
    if (matchedItems.length > 0) {
      onRepeatOrder(matchedItems);
      onClose();
    } else {
      alert('These items are currently being updated by the chef.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto animate-apple-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl my-8 bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 text-stone-800 shadow-[0_25px_65px_rgba(0,0,0,0.22)] flex flex-col max-h-[90vh] animate-apple-modal z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-all apple-press cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-stone-200">
          <span className="text-[10px] uppercase tracking-widest text-[#996e1e] font-bold">
            SHANGRILLA LUCKNOW
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
            My Order History
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Look up previous bills, leave chef reviews, or quickly repeat your favorite dishes.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="tel"
                placeholder="Enter 10-digit phone number (e.g. 9839012345)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#faf8f5] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#cba158] focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-md disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? 'Finding...' : 'Find Orders'}
            </button>
          </form>

          {errorMsg && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs animate-pulse">
              Retrieving your past orders...
            </div>
          ) : orders.length === 0 && searched ? (
            <div className="py-12 text-center text-stone-500">
              <AlertCircle className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-serif font-bold text-stone-700">No orders found for this phone number.</p>
              <p className="text-xs text-stone-500 mt-1">
                Make sure you entered the same phone number used during checkout.
              </p>
            </div>
          ) : !searched ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              Enter your phone number above to pull up all your previous dining receipts and bills.
            </div>
          ) : (
            orders.map((ord) => {
              const formattedDate = new Date(ord.createdAt).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });

              return (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-[#faf8f5] border border-stone-200 hover:border-[#cba158]/60 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-0.5 bg-[#cba158] text-stone-950 font-mono font-bold text-sm rounded-lg shadow-xs">
                        #{ord.displayNumber}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">
                          {ord.locationName}
                        </span>
                        <span className="text-[10px] text-stone-500 block font-mono">
                          {formattedDate} · {ord.orderType === 'DINE_IN' ? ord.tableNumber || 'Dine-In' : ord.orderType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.kitchenStatus === 'READY' || ord.kitchenStatus === 'COLLECTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {ord.kitchenStatus}
                      </span>
                      <span className="font-mono font-bold text-sm text-[#855e18] tabular-nums">
                        ₹{ord.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Items Brief */}
                  <div className="text-xs text-stone-700 divide-y divide-stone-100">
                    {ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="py-1 flex justify-between">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-mono text-stone-500 tabular-nums font-medium">₹{it.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewBill(ord)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#996e1e]" />
                        Digital Bill
                      </button>

                      {ord.kitchenStatus !== 'COLLECTED' && ord.kitchenStatus !== 'CANCELLED' && (
                        <button
                          onClick={() => onTrackOrder(ord.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Track Status
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenFeedback(ord)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          ord.hasFeedback
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-[#cba158]/15 hover:bg-[#cba158]/25 border border-[#cba158]/40 text-[#855e18]'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 text-[#996e1e]" />
                        <span>{ord.hasFeedback ? 'Feedback Sent ✓' : 'Rate Experience'}</span>
                      </button>

                      <button
                        onClick={() => handleRepeat(ord)}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-md text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                        title="Add these dishes to your cart"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
