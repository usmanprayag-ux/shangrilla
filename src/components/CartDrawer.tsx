import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, Check, ShoppingBag, ArrowRight, Utensils, QrCode, Crown, Coins } from 'lucide-react';
import { Location, MenuItem, OrderType, PaymentMethod, Order } from '../types/models';
import { api } from '../services/api';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  selectedAddonIds: string[];
  specialInstructions?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  location: Location;
  initialTable?: string;
  onOrderSuccess: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  location,
  initialTable,
  onOrderSuccess
}) => {
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableNumber, setTableNumber] = useState<string>(initialTable || 'Table 1');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('shangrilla_customer_phone') || '') : '';
  });
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('30 mins from now');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI_QR');

  // Coupon state
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Loyalty Points state
  const [loyaltyAccount, setLoyaltyAccount] = useState<any | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [checkingLoyalty, setCheckingLoyalty] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Calculate local line prices
  const getItemPrice = (cartItem: CartItem) => {
    const base = cartItem.item.discountedPrice ?? cartItem.item.price;
    let addons = 0;
    if (cartItem.item.customizationGroups && cartItem.selectedAddonIds) {
      for (const grp of cartItem.item.customizationGroups) {
        for (const opt of grp.options) {
          if (cartItem.selectedAddonIds.includes(opt.id)) {
            addons += opt.price;
          }
        }
      }
    }
    return base + addons;
  };

  const subtotal = cart.reduce((sum, it) => sum + getItemPrice(it) * it.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const pointsDiscount = redeemPoints > 0 ? Math.round(redeemPoints * 0.5 * 100) / 100 : 0;
  const taxable = Math.max(0, subtotal - discount - pointsDiscount);
  const cgst = Math.round(((taxable * 2.5) / 100) * 100) / 100;
  const sgst = Math.round(((taxable * 2.5) / 100) * 100) / 100;
  const estimatedTotal = Math.round((taxable + cgst + sgst) * 100) / 100;

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponInput.trim()) return;
    try {
      const res = await api.validateCoupon(couponInput.trim(), subtotal);
      setAppliedCoupon({ code: res.code, discount: res.discount });
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const handleCheckLoyalty = async () => {
    const clean = customerPhone.trim();
    if (!clean || clean.replace(/\D/g, '').length < 6) return;
    setCheckingLoyalty(true);
    try {
      const acc = await api.getLoyaltyAccount(clean);
      setLoyaltyAccount(acc);
      if (acc && acc.points >= 50) {
        const maxPtsBySubtotal = Math.floor((subtotal * 0.5) / 0.5);
        setRedeemPoints(Math.min(acc.points, maxPtsBySubtotal));
      }
    } catch {
      // ignore
    } finally {
      setCheckingLoyalty(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (customerPhone.trim()) {
        localStorage.setItem('shangrilla_customer_phone', customerPhone.trim());
      }

      const payload = {
        locationId: location.id,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        customerName: customerName.trim() || 'Valued Guest',
        customerPhone: customerPhone.trim(),
        customerNotes: customerNotes.trim() || undefined,
        pickupTime: orderType === 'PRE_ORDER' ? pickupTime : undefined,
        items: cart.map(it => ({
          menuItemId: it.item.id,
          quantity: it.quantity,
          selectedAddonIds: it.selectedAddonIds,
          specialInstructions: it.specialInstructions
        })),
        couponCode: appliedCoupon?.code,
        pointsToRedeem: redeemPoints > 0 ? redeemPoints : undefined,
        paymentMethod
      };

      const placedOrder = await api.createOrder(payload);
      onOrderSuccess(placedOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check all details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#181214] border-l border-[#cba158]/30 text-stone-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#1f171b]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#cba158]" />
              <div>
                <h3 className="font-serif font-bold text-base text-white">Your Order</h3>
                <p className="text-[11px] text-stone-400">{location.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
                <Utensils className="w-12 h-12 text-stone-600 mb-3" />
                <p className="text-sm font-medium">Your cart is currently empty</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Browse our Awadhi specials or Highway Dhaba classics to add delicious dishes.
                </p>
              </div>
            ) : (
              <>
                {/* Order Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Dining Preference
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-900 rounded-lg border border-stone-800">
                    {(['DINE_IN', 'TAKEAWAY', 'PRE_ORDER'] as OrderType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type)}
                        className={`py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                          orderType === type
                            ? 'bg-[#cba158] text-[#140e11] font-semibold shadow-sm'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {type === 'DINE_IN' ? 'Dine-In' : type === 'TAKEAWAY' ? 'Takeaway' : 'Pre-Order'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dine In Table Selector */}
                {orderType === 'DINE_IN' && (
                  <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-300 font-medium">Table Number</span>
                      <span className="text-[10px] text-[#cba158]">Table QR Connected</span>
                    </div>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                    >
                      {Array.from({ length: location.tablesCount || 15 }).map((_, i) => (
                        <option key={i} value={`Table ${i + 1}`}>
                          Table {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pre-order time */}
                {orderType === 'PRE_ORDER' && (
                  <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800 space-y-2">
                    <label className="block text-xs text-stone-300 font-medium">
                      Desired Pickup / Serving Time
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#cba158]"
                    >
                      <option value="30 mins from now">In 30 minutes</option>
                      <option value="45 mins from now">In 45 minutes</option>
                      <option value="1 hour from now">In 1 hour</option>
                      <option value="Tonight 8:30 PM">Tonight at 8:30 PM</option>
                      <option value="Tonight 9:30 PM">Tonight at 9:30 PM</option>
                    </select>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Selected Items ({cart.length})
                  </div>
                  <div className="divide-y divide-stone-800 border-y border-stone-800">
                    {cart.map((cartItem, idx) => {
                      const unitPrice = getItemPrice(cartItem);
                      const totalItemPrice = unitPrice * cartItem.quantity;
                      return (
                        <div key={idx} className="py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-white leading-tight">
                              {cartItem.item.name}
                            </h4>
                            <p className="text-[11px] font-mono text-[#e6c989] mt-0.5 tabular-nums">
                              ₹{unitPrice}
                            </p>
                            {cartItem.specialInstructions && (
                              <p className="text-[10px] text-stone-400 italic mt-0.5">
                                "{cartItem.specialInstructions}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border border-stone-700 rounded bg-stone-900">
                              <button
                                type="button"
                                onClick={() => {
                                  if (cartItem.quantity > 1) {
                                    onUpdateQuantity(idx, cartItem.quantity - 1);
                                  } else {
                                    onRemoveItem(idx);
                                  }
                                }}
                                className="p-1 text-stone-400 hover:text-white"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-mono font-bold text-white">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(idx, cartItem.quantity + 1)}
                                className="p-1 text-stone-400 hover:text-white"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="w-14 text-right font-mono text-xs font-bold text-white tabular-nums">
                              ₹{totalItemPrice}
                            </span>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(idx)}
                              className="text-stone-500 hover:text-red-400 p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Guest Information
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#cba158]"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (for loyalty/bill)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#cba158]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="General order instructions or allergen note..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#cba158]"
                  />
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#cba158]" />
                    <span>Have a Coupon Code?</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. LUCKNOWFIRST or ROYAL100"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 uppercase focus:outline-none focus:border-[#cba158]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Coupon <strong>{appliedCoupon.code}</strong> applied
                      </span>
                      <span className="font-mono font-bold">-₹{appliedCoupon.discount}</span>
                    </div>
                  )}
                </div>

                {/* Royal Rewards Points Redemption */}
                <div className="space-y-2 pt-2 p-3 rounded-xl bg-[#20181b] border border-[#cba158]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#e5c179]">
                      <Crown className="w-3.5 h-3.5 text-[#cba158]" />
                      <span>Redeem Royal Points</span>
                    </div>
                    {customerPhone && (
                      <button
                        type="button"
                        onClick={handleCheckLoyalty}
                        disabled={checkingLoyalty}
                        className="text-[10px] text-[#cba158] hover:underline"
                      >
                        {checkingLoyalty ? 'Checking...' : loyaltyAccount ? 'Refresh Balance' : 'Check Points'}
                      </button>
                    )}
                  </div>

                  {loyaltyAccount ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-stone-300">
                        <span>Available Balance:</span>
                        <strong className="text-[#e5c179] font-mono">
                          {loyaltyAccount.points} pts (₹{(loyaltyAccount.points * 0.5).toFixed(0)} value)
                        </strong>
                      </div>

                      {loyaltyAccount.points >= 50 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-stone-400">Points to Redeem:</label>
                            <span className="font-mono text-emerald-400 font-bold">
                              {redeemPoints} pts = -₹{pointsDiscount.toFixed(2)} off
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.min(loyaltyAccount.points, Math.floor((subtotal * 0.5) / 0.5))}
                            step={10}
                            value={redeemPoints}
                            onChange={(e) => setRedeemPoints(parseInt(e.target.value, 10) || 0)}
                            className="w-full accent-[#cba158] cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-stone-500">
                            <span>0 pts (₹0)</span>
                            <button
                              type="button"
                              onClick={() => {
                                const maxPts = Math.min(loyaltyAccount.points, Math.floor((subtotal * 0.5) / 0.5));
                                setRedeemPoints(maxPts);
                              }}
                              className="text-[#cba158] hover:underline"
                            >
                              Redeem Max
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400">
                          Minimum 50 points required to redeem. Current balance: {loyaltyAccount.points} pts. Keep ordering to earn 5% points on this meal!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>Enter phone above to apply rewards points</span>
                      {customerPhone && (
                        <button
                          type="button"
                          onClick={handleCheckLoyalty}
                          className="px-2 py-1 rounded bg-[#cba158]/20 text-[#e5c179] border border-[#cba158]/30 hover:bg-[#cba158]/30 text-[10px] font-semibold"
                        >
                          Check My Points
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Payment Method
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI_QR')}
                      className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1 ${
                        paymentMethod === 'UPI_QR'
                          ? 'bg-[#cba158]/15 border-[#cba158] text-white'
                          : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                        <QrCode className="w-3.5 h-3.5 text-[#cba158]" />
                        <span>UPI QR</span>
                      </div>
                      <span className="text-[10px] text-stone-400">Scan at table or counter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH_AT_COUNTER')}
                      className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1 ${
                        paymentMethod === 'CASH_AT_COUNTER'
                          ? 'bg-[#cba158]/15 border-[#cba158] text-white'
                          : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                        <span>Cash at Counter</span>
                      </div>
                      <span className="text-[10px] text-stone-400">Pay cashier after ordering</span>
                    </button>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="p-3.5 rounded-xl bg-[#21171b] border border-stone-800 space-y-1.5 text-xs text-stone-300">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono tabular-nums">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Coupon Discount ({appliedCoupon?.code}):</span>
                      <span className="font-mono tabular-nums">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Royal Points Discount ({redeemPoints} pts):</span>
                      <span className="font-mono tabular-nums">-₹{pointsDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-400">
                    <span>CGST (2.5%):</span>
                    <span className="font-mono tabular-nums">₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>SGST (2.5%):</span>
                    <span className="font-mono tabular-nums">₹{sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-stone-800">
                    <span>Final Amount:</span>
                    <span className="font-mono text-base text-[#f8ecd4] tabular-nums">
                      ₹{estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2 rounded-lg">
                    {errorMsg}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-800 bg-[#1f171b]">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#cba158] hover:bg-[#dfb872] disabled:opacity-50 text-[#181214] font-bold text-sm rounded-xl transition-all shadow-xl flex items-center justify-between"
              >
                <span>{isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
                <span className="flex items-center gap-1 font-mono tabular-nums">
                  ₹{estimatedTotal.toFixed(2)}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </button>
              <p className="text-[10px] text-stone-500 text-center mt-2">
                Order will be transmitted live to the kitchen display immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
