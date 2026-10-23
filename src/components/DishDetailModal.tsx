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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 bg-[#181214] border border-[#cba158]/30 rounded-2xl overflow-hidden text-stone-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-stone-300 hover:text-white rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dish Image */}
        <div className="relative h-60 sm:h-72 w-full bg-stone-900 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/public/assets/aistudio/WhatsApp_Image_2026-10-23_at_8.37.33_AM_822d0b5b.jpeg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181214] via-transparent to-black/30 pointer-events-none" />

          {/* Badges */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${
              item.isVeg ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-red-950/80 border border-red-500/50 text-red-300'
            }`}>
              {item.isVeg ? 'Pure Veg' : 'Awadhi Non-Veg'}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-black/60 border border-stone-700 text-stone-300 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              {item.spiceLevel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-xl font-serif font-bold text-white leading-tight">
                {item.name}
              </h3>
              <div className="text-right shrink-0">
                <span className="text-xl font-mono font-bold text-[#f8ecd4] tabular-nums">
                  ₹{basePrice}
                </span>
                {item.discountedPrice && (
                  <span className="block text-xs font-mono text-stone-500 line-through">
                    ₹{item.price}
                  </span>
                )}
              </div>
            </div>

            {item.hindiName && (
              <p className="text-xs text-[#cba158] font-serif mt-0.5">{item.hindiName}</p>
            )}

            <p className="text-xs text-stone-300 mt-2 leading-relaxed font-light">
              {item.description}
            </p>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-stone-400">
              <span>Portion: <strong className="text-stone-200">{item.portionSize}</strong></span>
              <span>Prep Time: <strong className="text-stone-200">~{item.preparationTimeMinutes} mins</strong></span>
            </div>
          </div>

          {/* Customization Options */}
          {item.customizationGroups && item.customizationGroups.length > 0 && (
            <div className="pt-3 border-t border-stone-800 space-y-3">
              {item.customizationGroups.map(grp => (
                <div key={grp.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#cba158]" />
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
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#cba158]/15 border-[#cba158]/50 text-white'
                              : 'bg-stone-900/50 border-stone-800 text-stone-300 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-[#cba158] bg-stone-800 border-stone-600 rounded focus:ring-0"
                            />
                            <span>{opt.name}</span>
                          </div>
                          <span className="font-mono text-[11px] text-[#e6c989] tabular-nums">
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
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Special Kitchen Note (e.g. less oil, extra crispy, spicy)
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Tell our chefs any special preference..."
              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#cba158]"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-4">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-stone-700 rounded-lg bg-stone-900/90 overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-mono font-bold text-sm text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAdd}
              className="flex-1 py-3 px-4 bg-[#cba158] hover:bg-[#dfb872] text-[#181214] font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-between shadow-lg"
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
