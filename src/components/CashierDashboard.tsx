import React, { useEffect, useState } from 'react';
import { Search, CheckCircle2, Clock, Printer, QrCode, Banknote, ShieldCheck, RefreshCw, X, Receipt } from 'lucide-react';
import { Order, Location } from '../types/models';
import { api } from '../services/api';
import { DigitalBillModal } from './DigitalBillModal';

interface CashierDashboardProps {
  locations: Location[];
  onExit: () => void;
}

export const CashierDashboard: React.FC<CashierDashboardProps> = ({ locations, onExit }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Payment Confirmation Modal State
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH_AT_COUNTER' | 'UPI_QR'>('CASH_AT_COUNTER');
  const [upiRef, setUpiRef] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('Cashier Desk 1');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [viewBillOrder, setViewBillOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders({
        locationId: selectedLocationId,
        paymentStatus: paymentFilter !== 'ALL' ? paymentFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      setOrders(data);
    } catch (e) {
      console.error('Failed to load cashier orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedLocationId, paymentFilter]);

  // Subscribe to real-time events
  useEffect(() => {
    const unsub = api.subscribe((evt) => {
      if (evt.type === 'new_order' || evt.type === 'payment_updated' || evt.type === 'order_status_updated') {
        loadOrders();
      }
    });
    return () => unsub();
  }, [selectedLocationId, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const confirmPayment = async () => {
    if (!settlingOrder) return;
    setIsSubmitting(true);
    try {
      const updated = await api.updateOrderPayment(
        settlingOrder.id,
        'PAID',
        payMethod,
        payMethod === 'UPI_QR' ? upiRef.trim() || 'UPI-VERIFIED-COUNTER' : 'CASH-SETTLED',
        operatorName.trim() || 'Cashier Desk'
      );
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      setSettlingOrder(null);
      setUpiRef('');
    } catch (err: any) {
      alert(err.message || 'Payment confirmation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#110d0f] text-stone-100 flex flex-col font-sans">
      {/* Cashier Header */}
      <header className="px-4 py-3 bg-[#191215] border-b border-[#cba158]/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition-colors"
          >
            ← Exit Cashier
          </button>
          <div>
            <h1 className="font-serif font-bold text-lg text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#cba158]" />
              CASHIER & PAYMENT SETTLEMENT POS
            </h1>
            <p className="text-[11px] text-stone-400">Verify UPI & Cash receipts · Issue digital & printed bills</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
          >
            <option value="all">All Locations</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#140e11] border-b border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search order # (e.g. 024) or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#cba158]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg transition-colors"
          >
            Find
          </button>
        </form>

        {/* Payment Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-900 rounded-lg border border-stone-800 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'PENDING', 'PAID', 'REFUNDED'].map(status => (
            <button
              key={status}
              onClick={() => setPaymentFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                paymentFilter === status
                  ? 'bg-[#cba158] text-[#140e11] shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="bg-[#181114] border border-stone-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-black/40 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Type & Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Kitchen</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-sans">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500 text-xs">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-base text-white px-2.5 py-1 bg-[#cba158]/20 border border-[#cba158]/40 rounded-md">
                          {order.displayNumber}
                        </span>
                        <span className="block text-[10px] text-stone-500 font-mono mt-1">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-200 block">
                          {order.orderType === 'DINE_IN' ? order.tableNumber || 'Dine-In' : order.orderType}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {order.locationName.replace('SHANGRILLA ', '')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-white block">{order.customerName}</span>
                        {order.customerPhone && (
                          <span className="text-[11px] font-mono text-stone-400">{order.customerPhone}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="truncate text-stone-300">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-sm text-[#f8ecd4] tabular-nums">
                          ₹{order.total.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.kitchenStatus === 'READY'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : order.kitchenStatus === 'PREPARING'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-stone-900 text-stone-400 border border-stone-800'
                        }`}>
                          {order.kitchenStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-700'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          <span className="block text-[10px] text-stone-400">
                            {order.paymentMethod.replace(/_/g, ' ')}
                          </span>
                          {order.paidVerifiedBy && (
                            <span className="block text-[9px] text-stone-500">
                              by {order.paidVerifiedBy}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setViewBillOrder(order)}
                            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md transition-colors"
                            title="View Receipt"
                            aria-label="View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {order.paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => {
                                setSettlingOrder(order);
                                setPayMethod(order.paymentMethod === 'UPI_QR' ? 'UPI_QR' : 'CASH_AT_COUNTER');
                              }}
                              className="px-3 py-1.5 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Settle Payment Confirmation Modal */}
      {settlingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#191215] border border-[#cba158]/50 rounded-2xl p-6 text-stone-100 shadow-2xl">
            <button
              onClick={() => setSettlingOrder(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1">
              Confirm Payment Settlement
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Order #{settlingOrder.displayNumber} · {settlingOrder.customerName}
            </p>

            <div className="p-3.5 bg-black/40 border border-stone-800 rounded-xl mb-4 flex justify-between items-center">
              <span className="text-xs text-stone-300">Amount Due:</span>
              <span className="font-mono text-xl font-bold text-[#f8ecd4] tabular-nums">
                ₹{settlingOrder.total.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Settled Via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH_AT_COUNTER')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      payMethod === 'CASH_AT_COUNTER'
                        ? 'bg-[#cba158] text-[#140e11] border-[#cba158]'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    Cash Received
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('UPI_QR')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      payMethod === 'UPI_QR'
                        ? 'bg-[#cba158] text-[#140e11] border-[#cba158]'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    UPI QR Verified
                  </button>
                </div>
              </div>

              {payMethod === 'UPI_QR' && (
                <div>
                  <label className="block text-xs text-stone-300 mb-1">
                    UPI Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 329048123984 or Last 4 digits"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-stone-300 mb-1">
                  Cashier Operator Name
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettlingOrder(null)}
                  className="w-1/2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Preview Modal */}
      {viewBillOrder && (
        <DigitalBillModal
          order={viewBillOrder}
          onClose={() => setViewBillOrder(null)}
          onTrackOrder={() => setViewBillOrder(null)}
        />
      )}
    </div>
  );
};
