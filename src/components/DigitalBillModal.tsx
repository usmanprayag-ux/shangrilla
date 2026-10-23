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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-[#181214] border border-[#cba158]/40 rounded-2xl p-6 sm:p-8 text-stone-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center pb-4 border-b border-stone-800">
          <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#cba158] font-medium">
            SHANGRILLA · {order.locationName}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
            Order Confirmed
          </h2>
          
          {/* Prominent Short Order Number */}
          <div className="mt-3 inline-flex flex-col items-center justify-center bg-[#241a1e] border-2 border-[#cba158] rounded-xl px-6 py-2.5 shadow-lg">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">Your Order Number</span>
            <span className="text-4xl font-mono font-bold tracking-tight text-[#f8ebd0]">
              {order.displayNumber}
            </span>
          </div>
        </div>

        {/* Screenshot Reminder Callout */}
        <div className="my-5 p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200/90 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
            <Camera className="w-4 h-4 shrink-0 text-[#cba158]" />
            Screenshot Reminder
          </div>
          <p className="italic text-stone-300">
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
        <div id="printable-bill" className="bg-[#21171b] border border-stone-800 rounded-xl p-5 text-xs text-stone-300 space-y-3 font-sans">
          <div className="flex justify-between items-center text-stone-400 text-[11px] pb-2 border-b border-stone-800">
            <span>Date: {formattedDate}</span>
            <span className="font-mono text-stone-300">ID: {order.id.slice(0, 14)}</span>
          </div>

          <div className="flex justify-between items-center text-stone-300 text-[11px]">
            <span>Type: <strong className="text-white">{order.orderType}</strong></span>
            {order.tableNumber && <span>Table: <strong className="text-white">{order.tableNumber}</strong></span>}
            <span>Guest: <strong className="text-white">{order.customerName}</strong></span>
          </div>

          {/* Items Table */}
          <div className="pt-2 border-t border-stone-800">
            <div className="grid grid-cols-12 text-stone-400 font-medium pb-1.5 border-b border-stone-800/60 text-[11px]">
              <span className="col-span-7">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>
            <div className="divide-y divide-stone-800/40">
              {order.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 py-2 text-stone-200">
                  <div className="col-span-7 pr-2">
                    <p className="font-medium text-white">{it.name}</p>
                    {it.selectedAddons && it.selectedAddons.length > 0 && (
                      <p className="text-[10px] text-stone-400">
                        + {it.selectedAddons.map(a => `${a.name} (₹${a.price})`).join(', ')}
                      </p>
                    )}
                    {it.specialInstructions && (
                      <p className="text-[10px] text-amber-300/80 italic">"{it.specialInstructions}"</p>
                    )}
                  </div>
                  <span className="col-span-2 text-center font-mono">{it.quantity}</span>
                  <span className="col-span-3 text-right font-mono tabular-nums text-white">₹{it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pt-2 border-t border-stone-800 space-y-1 text-stone-300 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({order.couponCode || 'Promo'}):</span>
                <span className="font-mono tabular-nums">-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-400">
              <span>CGST (2.5%):</span>
              <span className="font-mono tabular-nums">₹{order.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>SGST (2.5%):</span>
              <span className="font-mono tabular-nums">₹{order.sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-stone-800">
              <span>Total Payable:</span>
              <span className="font-mono text-base text-[#f8ecd4] tabular-nums">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800/60 flex justify-between items-center text-[11px] text-stone-400">
            <span>Payment: <strong className="text-stone-200">{order.paymentMethod.replace(/_/g, ' ')}</strong></span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              order.paymentStatus === 'PAID' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
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
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4 text-[#cba158]" />
              Print / Save PDF
            </button>
            <button
              onClick={() => onTrackOrder(order.id)}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#cba158] hover:bg-[#dfb872] text-[#181214] text-xs font-semibold rounded-lg transition-colors shadow-md"
            >
              <Clock className="w-4 h-4" />
              Track Live Kitchen Status
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {onOpenFeedback && (
            <button
              onClick={() => onOpenFeedback(order)}
              className="w-full py-2 bg-[#22171b] hover:bg-[#2c1d22] border border-[#cba158]/50 text-[#f8ecd4] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Star className="w-4 h-4 text-[#cba158] fill-[#cba158]" />
              Rate Dining Experience & Review Dishes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
