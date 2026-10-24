import React, { useState } from 'react';
import { X, Plus, Minus, Flame, Sparkles } from 'lucide-react';
import { MenuItem } from '../types/models';

interface DishDetailModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, selectedAddonIds: string[], specialInstructions?: string) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  item,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string>('');

  const basePrice = item.discountedPrice ?? item.price;

  // Calculate current total
  let addonsSum = 0;
  if (item.customizationGroups) {
    for (const grp of item.customizationGroups) {
      for (const opt of grp.options) {
        if (selectedAddonIds.includes(opt.id)) {
          addonsSum += opt.price;
        }
      }
    }
  }

  const finalTotal = (basePrice + addonsSum) * quantity;

  const toggleAddon = (id: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    onAddToCart(item, quantity, selectedAddonIds, instructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-apple-backdrop overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg my-6 bg-white border border-stone-200/90 rounded-3xl overflow-hidden text-stone-900 shadow-[0_25px_65px_rgba(0,0,0,0.22)] animate-apple-modal z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white text-stone-700 hover:text-black rounded-full shadow-md transition-all apple-press cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dish Image */}
        <div className="relative h-60 sm:h-72 w-full bg-stone-100 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 pointer-events-none" />

          {/* Badges */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase shadow-sm ${
              item.isVeg ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' : 'bg-red-50 border border-red-300 text-red-800'
            }`}>
              {item.isVeg ? 'Pure Veg' : 'Awadhi Non-Veg'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/90 border border-stone-200 text-stone-700 flex items-center gap-1 shadow-sm">
              <Flame className="w-3 h-3 text-amber-500" />
              {item.spiceLevel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-xl font-serif font-bold text-stone-900 leading-tight">
                {item.name}
              </h3>
              <div className="text-right shrink-0">
                <span className="text-xl font-mono font-bold text-stone-900 tabular-nums">
                  ₹{basePrice}
                </span>
                {item.discountedPrice && (
                  <span className="block text-xs font-mono text-stone-400 line-through">
                    ₹{item.price}
                  </span>
                )}
              </div>
            </div>

            {item.hindiName && (
              <p className="text-xs text-[#b8860b] font-serif mt-0.5 font-medium">{item.hindiName}</p>
            )}

            <p className="text-xs text-stone-600 mt-2 leading-relaxed font-light">
              {item.description}
            </p>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-stone-500">
              <span>Portion: <strong className="text-stone-800">{item.portionSize}</strong></span>
              <span>Prep Time: <strong className="text-stone-800">~{item.preparationTimeMinutes} mins</strong></span>
            </div>
          </div>

          {/* Customization Options */}
          {item.customizationGroups && item.customizationGroups.length > 0 && (
            <div className="pt-3 border-t border-stone-200 space-y-3">
              {item.customizationGroups.map(grp => (
                <div key={grp.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#b8860b]" />
                      {grp.name}
                    </span>
                    <span className="text-[10px] text-stone-400">Optional</span>
                  </div>

                  <div className="space-y-1.5">
                    {grp.options.map(opt => {
                      const isChecked = selectedAddonIds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          onClick={() => toggleAddon(opt.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[#cba158]/10 border-[#cba158] text-stone-900 font-medium'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-[#cba158] bg-white border-stone-300 rounded focus:ring-0"
                            />
                            <span>{opt.name}</span>
                          </div>
                          <span className="font-mono text-[11px] text-[#b8860b] tabular-nums font-semibold">
                            +₹{opt.price}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kitchen Special Instructions */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Special Kitchen Note (e.g. less oil, extra crispy, spicy)
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Tell our chefs any special preference..."
              className="w-full px-3 py-2 bg-[#faf8f5] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#cba158] focus:ring-2 focus:ring-[#cba158]/20 transition-all"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-4">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-stone-200 rounded-xl bg-stone-100/80 overflow-hidden shadow-sm">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-mono font-bold text-sm text-stone-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAdd}
              className="flex-1 py-3 px-5 bg-[#cba158] hover:bg-[#b8860b] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-between shadow-md spatial-interactive"
            >
              <span>Add to Cart</span>
              <span className="font-mono font-bold tabular-nums">₹{finalTotal}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
