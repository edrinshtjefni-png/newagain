import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star } from 'lucide-react';
import { Booking, UserProfile, Review } from '../types';
import { saveCloudReview } from '../firebase';

interface ReviewModalProps {
  booking: Booking;
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ booking, user, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const newReview: Review = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        salonId: booking.salonId,
        bookingId: booking.id,
        userEmail: user.email,
        userName: user.name,
        userAvatar: user.avatar,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };

      await saveCloudReview(newReview);
      onSuccess();
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden"
        >
          <div className="p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-brand-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-brand-muted" />
            </button>

            <h2 className="text-xl font-serif font-black text-brand-text mb-2">
              Review your experience
            </h2>
            <p className="text-sm text-brand-muted mb-6">
              How was your {booking.service.name} at {booking.salonName}?
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                  Add a written review
                </label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked about the service..."
                  className="w-full h-32 p-4 text-sm font-medium border border-brand-border rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl transition-colors disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
