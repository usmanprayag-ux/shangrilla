import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2, MessageSquare, Utensils, ThumbsUp } from 'lucide-react';
import { Order, DishFeedback } from '../types/models';
import { api } from '../services/api';

interface CustomerFeedbackModalProps {
  order: Order;
  onClose: () => void;
  onFeedbackSubmitted?: () => void;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  order,
  onClose,
  onFeedbackSubmitted
}) => {
  const [overallRating, setOverallRating] = useState<number>(5);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  // Per-dish ratings and comments initialized from order items
  const [dishReviews, setDishReviews] = useState<Record<string, { rating: number; comment: string }>>(
    () => {
      const initial: Record<string, { rating: number; comment: string }> = {};
      for (const it of order.items) {
        initial[it.menuItemId] = { rating: 5, comment: '' };
      }
      return initial;
    }
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleDishRatingChange = (menuItemId: string, rating: number) => {
    setDishReviews(prev => ({
      ...prev,
      [menuItemId]: { ...(prev[menuItemId] || { comment: '' }), rating }
    }));
  };

  const handleDishCommentChange = (menuItemId: string, comment: string) => {
    setDishReviews(prev => ({
      ...prev,
      [menuItemId]: { ...(prev[menuItemId] || { rating: 5 }), comment }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formattedDishReviews: DishFeedback[] = order.items.map(it => ({
        menuItemId: it.menuItemId,
        dishName: it.name,
        rating: dishReviews[it.menuItemId]?.rating ?? 5,
        comment: dishReviews[it.menuItemId]?.comment?.trim() || undefined
      }));

      await api.submitFeedback({
        orderId: order.id,
        displayNumber: order.displayNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        overallRating,
        foodQualityRating: foodRating,
        serviceRating,
        dishReviews: formattedDishReviews,
        comment: comment.trim(),
        locationId: order.locationId
      });

      setSubmitted(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    currentRating: number,
    onRate: (val: number) => void,
    size: string = 'w-6 h-6'
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="p-1 hover:scale-110 transition-transform focus:outline-none"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`${size} ${
                star <= currentRating
                  ? 'fill-[#cba158] text-[#cba158]'
                  : 'text-stone-600 hover:text-stone-400'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

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

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white">
              Shukriya! Thank You
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-sm mx-auto leading-relaxed font-light">
              Your feedback on Order <strong className="text-[#cba158]">#{order.displayNumber}</strong> helps our Lucknowi Bawarchis and staff preserve culinary excellence.
            </p>
            <div className="p-3 bg-[#22171b] border border-stone-800 rounded-xl text-xs text-stone-400">
              Your honest reviews have been recorded in our kitchen audit logs.
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="text-center pb-4 border-b border-stone-800">
              <span className="text-[10px] uppercase tracking-widest text-[#cba158] font-bold">
                {order.locationName}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                How Was Your Experience?
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Order <strong className="font-mono text-white">#{order.displayNumber}</strong> · {order.customerName}
              </p>
            </div>

            {/* Overall Rating */}
            <div className="bg-[#20161a] border border-stone-800 rounded-xl p-4 text-center space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-stone-300 block">
                Overall Experience Rating
              </span>
              <div className="flex justify-center">
                {renderStars(overallRating, setOverallRating, 'w-8 h-8')}
              </div>
              <span className="text-xs text-[#e6c989] font-medium block">
                {overallRating === 5 ? 'Exceptional · Nawabi Royalty' : overallRating === 4 ? 'Very Good' : overallRating === 3 ? 'Average' : overallRating === 2 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>

            {/* Split Ratings: Food & Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-900/60 border border-stone-800 rounded-xl space-y-1.5">
                <span className="font-semibold text-stone-300 block">Food Flavor & Quality</span>
                {renderStars(foodRating, setFoodRating, 'w-5 h-5')}
              </div>
              <div className="p-3 bg-stone-900/60 border border-stone-800 rounded-xl space-y-1.5">
                <span className="font-semibold text-stone-300 block">Service & Speed</span>
                {renderStars(serviceRating, setServiceRating, 'w-5 h-5')}
              </div>
            </div>

            {/* Dish-by-Dish Rating Section */}
            <div className="space-y-3 pt-2 border-t border-stone-800">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#cba158]">
                <Utensils className="w-4 h-4" />
                <span>Rate Your Ordered Dishes</span>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {order.items.map((it) => {
                  const currentDishReview = dishReviews[it.menuItemId] || { rating: 5, comment: '' };
                  return (
                    <div
                      key={it.menuItemId}
                      className="p-3 rounded-xl bg-[#22171b] border border-stone-800 space-y-2 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-serif font-bold text-white text-sm">
                          {it.name}
                        </span>
                        {renderStars(
                          currentDishReview.rating,
                          (val) => handleDishRatingChange(it.menuItemId, val),
                          'w-4 h-4'
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Dish comment (e.g. tenderness, spice level, crispiness...)"
                        value={currentDishReview.comment}
                        onChange={(e) => handleDishCommentChange(it.menuItemId, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#cba158]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Feedback Comments */}
            <div className="space-y-1.5 pt-2 border-t border-stone-800">
              <label className="block text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#cba158]" />
                Additional Comments or Suggestions for the Chef
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience at SHANGRILLA..."
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#cba158]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800 p-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#cba158] hover:bg-[#dfb872] disabled:opacity-50 text-[#140e11] font-bold text-xs rounded-xl transition-colors shadow-lg flex items-center gap-1.5"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
