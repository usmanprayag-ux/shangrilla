import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, Check, ShoppingBag, ArrowRight, Utensils, QrCode, Crown, Sparkles } from 'lucide-react';
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
  initialCouponCode?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  location,
  initialTable,
  onOrderSuccess,
  initialCouponCode
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
  const [couponInput, setCouponInput] = useState<string>(initialCouponCode || '');
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
      if (acc && acc.name && !customerName) {
        setCustomerName(acc.name);
      }
    } catch {
      setLoyaltyAccount(null);
    } finally {
      setCheckingLoyalty(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerPhone.trim()) {
      setErrorMsg('Please enter your phone number to receive digital bill receipt and earn points.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('shangrilla_customer_phone', customerPhone.trim());
        if (customerName.trim()) {
          localStorage.setItem('shangrilla_customer_name', customerName.trim());
        }
      }

      const payload = {
        locationId: location.id,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        customerName: customerName.trim() || undefined,
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/35 backdrop-blur-md animate-apple-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="pointer-events-auto w-screen max-w-md bg-white border-l border-stone-200/90 text-stone-800 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.25)] animate-apple-drawer-right">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-[#faf8f5]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#cba158]/15 border border-[#cba158]/30 flex items-center justify-center text-[#996e1e] shadow-xs">
                <ShoppingBag className="w-5 h-5 text-[#996e1e]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">Your Order</h3>
                <p className="text-[11px] text-stone-500 font-medium">{location.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-all apple-press cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-white">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                  <Utensils className="w-8 h-8 text-stone-400" />
                </div>
                <p className="text-sm font-semibold text-stone-700">Your order cart is empty</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Browse our Lucknowi royal galouti kebabs, dum biryanis, or Highway Dhaba classics to begin.
                </p>
              </div>
            ) : (
              <>
                {/* Order Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Dining Preference
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
                    {(['DINE_IN', 'TAKEAWAY', 'PRE_ORDER'] as OrderType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                          orderType === type
                            ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                        }`}
                      >
                        {type === 'DINE_IN' ? 'Dine-In' : type === 'TAKEAWAY' ? 'Takeaway' : 'Pre-Order'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dine In Table Selector */}
                {orderType === 'DINE_IN' && (
                  <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-stone-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-700 font-semibold">Table Assignment</span>
                      <span className="text-[10px] text-[#996e1e] font-semibold bg-[#cba158]/10 px-2 py-0.5 rounded-full border border-[#cba158]/20">
                        Table QR Linked
                      </span>
                    </div>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:border-[#cba158] focus:ring-1 focus:ring-[#cba158]"
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
                  <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-stone-200 space-y-2">
                    <label className="block text-xs text-stone-700 font-semibold">
                      Desired Pickup / Serving Time
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:border-[#cba158]"
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
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Selected Items ({cart.length})
                  </div>
                  <div className="divide-y divide-stone-100 border-y border-stone-200">
                    {cart.map((cartItem, idx) => {
                      const unitPrice = getItemPrice(cartItem);
                      const totalItemPrice = unitPrice * cartItem.quantity;
                      return (
                        <div key={idx} className="py-3 flex items-start justify-between gap-3 group hover:bg-[#faf8f5]/60 rounded-lg px-1 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-stone-900 leading-tight">
                              {cartItem.item.name}
                            </h4>
                            <p className="text-[11px] font-mono font-semibold text-[#996e1e] mt-0.5 tabular-nums">
                              ₹{unitPrice}
                            </p>
                            {cartItem.specialInstructions && (
                              <p className="text-[10px] text-stone-500 italic mt-0.5">
                                "{cartItem.specialInstructions}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border border-stone-200 rounded-lg bg-white shadow-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  if (cartItem.quantity > 1) {
                                    onUpdateQuantity(idx, cartItem.quantity - 1);
                                  } else {
                                    onRemoveItem(idx);
                                  }
                                }}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-l-lg transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-mono font-bold text-stone-900">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(idx, cartItem.quantity + 1)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-r-lg transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="w-14 text-right font-mono text-xs font-bold text-stone-900 tabular-nums">
                              ₹{totalItemPrice}
                            </span>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(idx)}
                              className="text-stone-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
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
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Guest Information
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="px-3 py-2 bg-[#faf8f5] border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#cba158] focus:bg-white"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (for loyalty/bill)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="px-3 py-2 bg-[#faf8f5] border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#cba158] focus:bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="General order instructions or allergen note..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf8f5] border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#cba158] focus:bg-white"
                  />
                </div>

                {/* 5% Grand Feast Discount Progress (Orders ₹3k+) */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#fdfbf7] via-white to-[#f7f0e3] border border-[#cba158]/40 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <span className="w-5 h-5 rounded-md bg-[#cba158]/20 text-[#855e18] flex items-center justify-center text-xs">
                        🎁
                      </span>
                      <span>5% Grand Feast Offer (₹3,000+)</span>
                    </div>
                    {subtotal >= 3000 ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        Unlocked!
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#855e18] font-bold">
                        Add ₹{(3000 - subtotal).toFixed(0)} more
                      </span>
                    )}
                  </div>

                  {subtotal < 3000 ? (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#cba158] to-[#dfb872] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((subtotal / 3000) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-stone-500">
                        Orders of ₹3,000+ unlock 5% instant discount with coupon code <strong>ROYAL3K</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-emerald-800 font-medium">
                        Save <strong>₹{(subtotal * 0.05).toFixed(0)}</strong> with code <strong>ROYAL3K</strong>
                      </span>
                      {(!appliedCoupon || appliedCoupon.code !== 'ROYAL3K') && (
                        <button
                          type="button"
                          onClick={() => {
                            setCouponInput('ROYAL3K');
                            api.validateCoupon('ROYAL3K', subtotal)
                              .then(res => setAppliedCoupon({ code: res.code, discount: res.discount }))
                              .catch(() => {});
                          }}
                          className="px-2.5 py-1 bg-[#cba158] hover:bg-[#dfb872] text-stone-950 text-[10px] font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                        >
                          Apply 5% Off
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#996e1e]" />
                    <span>Have a Coupon Code?</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. LUCKNOWFIRST or ROYAL100"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-[#faf8f5] border border-stone-200 rounded-lg text-xs font-semibold text-stone-900 placeholder-stone-400 uppercase focus:outline-none focus:border-[#cba158] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-all shadow-xs shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 font-medium">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Coupon <strong>{appliedCoupon.code}</strong> applied
                      </span>
                      <span className="font-mono font-bold">-₹{appliedCoupon.discount}</span>
                    </div>
                  )}
                </div>

                {/* Royal Rewards Points Redemption */}
                <div className="space-y-2 pt-2 p-3.5 rounded-xl bg-gradient-to-br from-[#fdfbf7] to-[#f9f4ea] border border-[#cba158]/35 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#855e18]">
                      <Crown className="w-3.5 h-3.5 text-[#996e1e]" />
                      <span>Redeem Royal Points</span>
                    </div>
                    {customerPhone && (
                      <button
                        type="button"
                        onClick={handleCheckLoyalty}
                        disabled={checkingLoyalty}
                        className="text-[10px] text-[#996e1e] font-bold hover:underline"
                      >
                        {checkingLoyalty ? 'Checking...' : loyaltyAccount ? 'Refresh Balance' : 'Check Points'}
                      </button>
                    )}
                  </div>

                  {loyaltyAccount ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-stone-700">
                        <span>Available Balance:</span>
                        <strong className="text-[#996e1e] font-mono font-bold">
                          {loyaltyAccount.points} pts (₹{(loyaltyAccount.points * 0.5).toFixed(0)} value)
                        </strong>
                      </div>

                      {loyaltyAccount.points >= 50 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-stone-600">Points to Redeem:</label>
                            <span className="font-mono text-emerald-700 font-bold">
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
                              className="text-[#996e1e] font-bold hover:underline"
                            >
                              Redeem Max
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-500">
                          Minimum 50 points required to redeem. Current balance: {loyaltyAccount.points} pts. Keep ordering to earn 5% points on this meal!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-stone-600">
                      <span>Enter phone above to apply rewards points</span>
                      {customerPhone && (
                        <button
                          type="button"
                          onClick={handleCheckLoyalty}
                          className="px-2.5 py-1 rounded-lg bg-[#cba158]/20 text-[#855e18] border border-[#cba158]/40 hover:bg-[#cba158]/30 text-[10px] font-bold transition-colors"
                        >
                          Check My Points
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Payment Method
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI_QR')}
                      className={`p-3 rounded-xl border text-left transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex flex-col gap-1 ${
                        paymentMethod === 'UPI_QR'
                          ? 'bg-[#cba158]/10 border-[#cba158] shadow-sm text-stone-900 ring-1 ring-[#cba158]'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                        <QrCode className="w-3.5 h-3.5 text-[#996e1e]" />
                        <span>UPI QR</span>
                      </div>
                      <span className="text-[10px] text-stone-500">Instant scan & pay via phone</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH_AT_COUNTER')}
                      className={`p-3 rounded-xl border text-left transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex flex-col gap-1 ${
                        paymentMethod === 'CASH_AT_COUNTER'
                          ? 'bg-[#cba158]/10 border-[#cba158] shadow-sm text-stone-900 ring-1 ring-[#cba158]'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                        <Sparkles className="w-3.5 h-3.5 text-[#996e1e]" />
                        <span>Cash / Card</span>
                      </div>
                      <span className="text-[10px] text-stone-500">Settle at cashier desk</span>
                    </button>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-stone-200 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium text-stone-800 tabular-nums">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon Discount ({appliedCoupon?.code}):</span>
                      <span className="font-mono tabular-nums">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Royal Points Discount ({redeemPoints} pts):</span>
                      <span className="font-mono tabular-nums">-₹{pointsDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-500">
                    <span>CGST (2.5%):</span>
                    <span className="font-mono tabular-nums">₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>SGST (2.5%):</span>
                    <span className="font-mono tabular-nums">₹{sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Final Amount:</span>
                    <span className="font-mono text-base text-[#996e1e] tabular-nums font-bold">
                      ₹{estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                    {errorMsg}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-[#faf8f5]">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#cba158] via-[#dfb872] to-[#cba158] hover:shadow-lg hover:shadow-[#cba158]/25 text-stone-950 font-bold text-sm rounded-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between cursor-pointer"
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
