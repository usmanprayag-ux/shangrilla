import { X, Printer, Camera, ArrowRight, CheckCircle2, Clock, Star } from 'lucide-react';
import { Order } from '../types/models';

interface DigitalBillModalProps {
  order: Order;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
  onOpenFeedback?: (order: Order) => void;
}

export const DigitalBillModal: React.FC<DigitalBillModalProps> = ({
  order,
  onClose,
  onTrackOrder,
  onOpenFeedback
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto animate-apple-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg my-8 bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 text-stone-800 shadow-[0_25px_65px_rgba(0,0,0,0.22)] animate-apple-modal z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-all apple-press cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center pb-4 border-b border-stone-200">
          <div className="w-12 h-12 bg-emerald-50 border-2 border-emerald-400 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#996e1e] font-bold">
            SHANGRILLA · {order.locationName}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
            Order Confirmed
          </h2>
          
          {/* Prominent Short Order Number */}
          <div className="mt-3 inline-flex flex-col items-center justify-center bg-gradient-to-br from-[#fdfbf7] to-[#f7f0e3] border-2 border-[#cba158] rounded-xl px-6 py-2.5 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">Your Order Number</span>
            <span className="text-4xl font-mono font-bold tracking-tight text-[#855e18]">
              {order.displayNumber}
            </span>
          </div>
        </div>

        {/* Screenshot Reminder Callout */}
        <div className="my-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <Camera className="w-4 h-4 shrink-0 text-[#996e1e]" />
            Screenshot Reminder
          </div>
          <p className="italic text-stone-600">
            "Your order has been placed successfully!
            <br />
            <strong>Order Number: {order.displayNumber}</strong>
            <br />
            Please save or take a screenshot of your bill for easy reference when collecting your order.
            <br />
            You can use your order number to check your order status on the SHANGRILLA collection display.
            <br />
            Thank you for choosing SHANGRILLA!"
          </p>
        </div>

        {/* Printable Bill Area */}
        <div id="printable-bill" className="bg-[#faf8f5] border border-stone-200 rounded-xl p-5 text-xs text-stone-700 space-y-3 font-sans shadow-xs">
          <div className="flex justify-between items-center text-stone-500 text-[11px] pb-2 border-b border-stone-200">
            <span>Date: {formattedDate}</span>
            <span className="font-mono text-stone-600 font-medium">ID: {order.id.slice(0, 14)}</span>
          </div>

          <div className="flex justify-between items-center text-stone-700 text-[11px]">
            <span>Type: <strong className="text-stone-900">{order.orderType}</strong></span>
            {order.tableNumber && <span>Table: <strong className="text-stone-900">{order.tableNumber}</strong></span>}
            <span>Guest: <strong className="text-stone-900">{order.customerName}</strong></span>
          </div>

          {/* Items Table */}
          <div className="pt-2 border-t border-stone-200">
            <div className="grid grid-cols-12 text-stone-500 font-bold pb-1.5 border-b border-stone-200 text-[11px]">
              <span className="col-span-7">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>
            <div className="divide-y divide-stone-100">
              {order.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 py-2 text-stone-800">
                  <div className="col-span-7 pr-2">
                    <p className="font-bold text-stone-900">{it.name}</p>
                    {it.selectedAddons && it.selectedAddons.length > 0 && (
                      <p className="text-[10px] text-stone-500">
                        + {it.selectedAddons.map(a => `${a.name} (₹${a.price})`).join(', ')}
                      </p>
                    )}
                    {it.specialInstructions && (
                      <p className="text-[10px] text-[#996e1e] italic">"{it.specialInstructions}"</p>
                    )}
                  </div>
                  <span className="col-span-2 text-center font-mono font-bold">{it.quantity}</span>
                  <span className="col-span-3 text-right font-mono tabular-nums font-bold text-stone-900">₹{it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pt-2 border-t border-stone-200 space-y-1 text-stone-600 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums font-medium">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount ({order.couponCode || 'Promo'}):</span>
                <span className="font-mono tabular-nums">-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-500">
              <span>CGST (2.5%):</span>
              <span className="font-mono tabular-nums">₹{order.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>SGST (2.5%):</span>
              <span className="font-mono tabular-nums">₹{order.sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Total Payable:</span>
              <span className="font-mono text-base text-[#855e18] tabular-nums font-bold">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-[11px] text-stone-500">
            <span>Payment: <strong className="text-stone-900">{order.paymentMethod.replace(/_/g, ' ')}</strong></span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handlePrint}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#996e1e]" />
              Print / Save PDF
            </button>
            <button
              onClick={() => onTrackOrder(order.id)}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-lg hover:shadow-[#cba158]/25 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Clock className="w-4 h-4" />
              Track Live Kitchen Status
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {onOpenFeedback && (
            <button
              onClick={() => onOpenFeedback(order)}
              className="w-full py-2.5 bg-[#faf8f5] hover:bg-stone-100 border border-[#cba158]/40 text-[#855e18] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Star className="w-4 h-4 text-[#996e1e] fill-[#cba158]" />
              Rate Dining Experience & Review Dishes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
