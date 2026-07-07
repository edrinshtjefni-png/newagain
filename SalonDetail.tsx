import React, { useState, useEffect } from 'react';
import { Star, MapPin, Clock, ArrowLeft, Heart, Check, ChevronRight, ChevronLeft, User, ChevronDown, ChevronUp, Share } from 'lucide-react';
import { motion } from 'motion/react';
import { Salon, Service, Review, UserProfile } from '../types';
import { getCloudReviews, saveCloudReview, getAllCloudBookings } from '../firebase';
import { parseBusinessHours, isCurrentlyOpen, DaySchedule } from '../utils/hoursParser';
import StylistProfileModal from './StylistProfileModal';
import { Stylist } from '../types';

interface SalonDetailProps {
  salon: Salon;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onBookService: (service: Service) => void;
  user: UserProfile | null;
  onAuthPrompt: () => void;
}

export default function SalonDetail({ salon, isFavorite, onToggleFavorite, onBack, onBookService, user, onAuthPrompt }: SalonDetailProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<string>('All');
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedStylistProfile, setSelectedStylistProfile] = useState<Stylist | null>(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<'Newest' | 'Oldest' | 'Highest Rating'>('Newest');

  const [parsedHours, setParsedHours] = useState<DaySchedule[]>([]);
  const [openStatus, setOpenStatus] = useState<{isOpen: boolean, text: string}>({ isOpen: false, text: 'Closed' });
  const [showAllHours, setShowAllHours] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const galleryImages = salon.images?.length ? salon.images : [salon.image];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  
  useEffect(() => {
    async function checkCanReview() {
      if (!user) {
        setCanReview(false);
        return;
      }
      try {
        const allBookings = await getAllCloudBookings();
        const hasCompleted = allBookings.some(b => 
          b.salonId === salon.id && 
          b.userEmail === user.email && 
          b.status === 'completed'
        );
        setCanReview(hasCompleted);
      } catch (e) {
        console.error("Failed to check bookings for review eligibility:", e);
        setCanReview(false);
      }
    }
    checkCanReview();
  }, [user, salon.id]);

  useEffect(() => {
    try {
      const schedule = parseBusinessHours(salon.hours);
      setParsedHours(schedule);
      setOpenStatus(isCurrentlyOpen(schedule));
      
      const interval = setInterval(() => {
        setOpenStatus(isCurrentlyOpen(schedule));
      }, 60000); // Check every minute
      return () => clearInterval(interval);
    } catch(e) {
      console.warn("Failed to parse hours:", e);
    }
  }, [salon.hours]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onAuthPrompt();
      return;
    }
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const newReview: Review = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        salonId: salon.id,
        bookingId: 'direct-review',
        userEmail: user.email,
        userName: user.name,
        userAvatar: user.avatar,
        rating: newReviewRating,
        comment: newReviewComment,
        createdAt: new Date().toISOString()
      };
      await saveCloudReview(newReview);
      setReviews([newReview, ...reviews]);
      setNewReviewComment('');
      setNewReviewRating(5);
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setReviewError(err.message || "Failed to post review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    async function loadReviews() {
      setLoadingReviews(true);
      try {
        const fetched = await getCloudReviews(salon.id);
        setReviews(fetched);
      } catch (e) {
        console.error("Failed to load reviews:", e);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, [salon.id]);

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : salon.rating;
  const reviewCount = reviews.length > 0 ? reviews.length : salon.reviewCount;

  // Find unique categories within this salon's services
  const categories = ['All', ...Array.from(new Set(salon.services.map(s => s.category)))];
  
  const PRICE_FILTERS = ['All', '$', '$$', '$$$'];
  const getPriceCategory = (price: number) => {
    if (price <= 50) return '$';
    if (price <= 100) return '$$';
    return '$$$';
  };

  const filteredServices = salon.services.filter(s => {
    const matchCategory = activeCategory === 'All' || s.category === activeCategory;
    const matchPrice = priceFilter === 'All' || getPriceCategory(s.price) === priceFilter;
    return matchCategory && matchPrice;
  });

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'Newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (reviewSort === 'Oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (reviewSort === 'Highest Rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  return (
    <div id={`salon-detail-${salon.id}`} className="relative w-full max-w-5xl mx-auto py-6 px-4 md:px-8">
      {/* Toast Notification */}
      {showShareToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          Link copied!
        </div>
      )}
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="btn-back-to-salons"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-brand-text hover:text-brand-primary transition-colors cursor-pointer bg-white px-4 py-2 rounded-full border border-brand-border shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to results</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border border-brand-border bg-white text-brand-text transition-all cursor-pointer shadow-xs hover:border-brand-primary hover:text-brand-primary"
          >
            <Share className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            id={`favorite-btn-detail-${salon.id}`}
            onClick={() => onToggleFavorite(salon.id)}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border transition-all cursor-pointer shadow-xs ${
              isFavorite
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-brand-text border-brand-border hover:border-brand-primary hover:text-brand-primary'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-600' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}</span>
            <span className="sm:hidden">{isFavorite ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Banner & Contact info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Banner Image */}
        <div className="lg:col-span-2 relative aspect-[16/9] lg:aspect-auto lg:h-[350px] rounded-3xl overflow-hidden shadow-md group">
          <img
            src={galleryImages[currentImageIndex]}
            alt={`${salon.name} - ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          
          {galleryImages.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white text-brand-text shadow-sm z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white text-brand-text shadow-sm z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
                {currentImageIndex + 1} / {galleryImages.length}
              </div>
            </>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 pointer-events-none">
            <div className="pointer-events-auto">
              <span className="bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                {salon.type}
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-white mt-2 leading-tight">
                {salon.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Contact, Hours & Highlights Card */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-brand-text mb-4 pb-2 border-b border-brand-secondary">
              Venue Details
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-4">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="text-xs font-bold text-amber-700">{(avgRating || 0).toFixed(1)}</span>
              </div>
              <span className="text-xs text-brand-muted font-semibold">({reviewCount} verified reviews)</span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 text-xs text-brand-text mb-4">
              <MapPin className="w-4.5 h-4.5 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-text">Address</p>
                <p className="font-semibold text-brand-muted mt-0.5 leading-relaxed">{salon.address}</p>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-3 text-xs text-brand-text mb-4">
              <Clock className="w-4.5 h-4.5 text-brand-primary shrink-0 mt-0.5" />
              <div className="w-full">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowAllHours(!showAllHours)}>
                  <div>
                    <p className="font-bold text-brand-text flex items-center gap-2">
                      Opening Hours
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${openStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {openStatus.text}
                      </span>
                    </p>
                    {!showAllHours && <p className="font-semibold text-brand-muted mt-0.5 leading-relaxed truncate max-w-[200px]">{salon.hours}</p>}
                  </div>
                  {showAllHours ? <ChevronUp className="w-4 h-4 text-brand-muted" /> : <ChevronDown className="w-4 h-4 text-brand-muted" />}
                </div>
                
                {showAllHours && parsedHours.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-brand-border pt-3">
                    {parsedHours.map((day, idx) => {
                      const isToday = new Date().getDay() === idx;
                      return (
                        <div key={day.dayName} className={`flex justify-between items-center ${isToday ? 'font-bold text-brand-text' : 'font-medium text-brand-muted'}`}>
                          <span>{day.dayName} {isToday && '(Today)'}</span>
                          <span>{day.isClosed ? 'Closed' : `${day.openTime} - ${day.closeTime}`}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-brand-secondary border border-brand-border rounded-2xl p-4 mt-4">
            <p className="text-[10px] font-extrabold text-brand-primary tracking-wider uppercase mb-1">Instant Booking</p>
            <p className="text-xs text-brand-muted font-semibold leading-relaxed">
              Every appointment is confirmed instantly in real-time. No phone calls required.
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-brand-secondary border border-brand-border rounded-3xl p-6 md:p-8 mb-10">
        <h3 className="font-serif font-extrabold text-lg text-brand-text mb-3">About the Salon</h3>
        <p className="text-sm text-brand-muted leading-relaxed font-semibold">
          {salon.description}
        </p>

        {/* Featured Specialists */}
        <div className="mt-8">
          <p className="text-xs font-bold text-brand-muted tracking-wider uppercase mb-4">Our Professionals & Stylists</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {salon.stylists.map(stylist => (
              <div 
                key={stylist.id} 
                onClick={() => setSelectedStylistProfile(stylist)}
                className="flex items-center gap-3 bg-white p-3 border border-brand-border rounded-2xl cursor-pointer hover:border-brand-primary transition-all hover:shadow-md group"
              >
                <img
                  src={stylist.image}
                  alt={stylist.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-brand-text truncate">{stylist.name}</p>
                  <p className="text-[10px] text-brand-muted truncate font-semibold">{stylist.role}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    <span className="text-[9px] font-bold text-brand-text">{stylist.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Services Menu */}
      <div className="mb-12">
        <h3 className="font-serif font-extrabold text-xl text-brand-text mb-6">Services Menu</h3>

        {/* Filtering Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-3 mb-6">
          {/* Category filtering tab bar */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                id={`tab-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-muted hover:bg-brand-secondary hover:text-brand-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Price Range Filter */}
          <div className="flex gap-1 bg-brand-secondary p-1 rounded-full shrink-0 self-start md:self-auto">
            {PRICE_FILTERS.map(price => (
              <button
                key={price}
                onClick={() => setPriceFilter(price)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  priceFilter === price
                    ? 'bg-white text-brand-text shadow-sm'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.map(service => (
            <div
              id={`service-row-${service.id}`}
              key={service.id}
              className="bg-white border border-brand-border hover:border-brand-primary rounded-2xl p-5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:shadow-md"
            >
              <div className="max-w-2xl">
                <span className="text-[9px] font-bold text-brand-primary uppercase tracking-widest bg-brand-secondary border border-brand-border px-2.5 py-1 rounded-md">
                  {service.category}
                </span>
                <h4 className="font-bold text-base text-brand-text mt-2.5">
                  {service.name}
                </h4>
                <p className="text-xs text-brand-muted leading-relaxed mt-1 font-semibold">
                  {service.description}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-brand-muted font-bold">
                  <span>{service.duration} minutes</span>
                  <span>•</span>
                  <span>Instant Confirmation</span>
                </div>
              </div>

              <div className="flex items-center justify-between md:flex-col md:items-end gap-3 md:shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-brand-secondary">
                <div className="text-left md:text-right">
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Price</p>
                  <p className="text-lg md:text-xl font-extrabold text-brand-text">${service.price}</p>
                </div>

                <button
                  id={`btn-book-service-${service.id}`}
                  onClick={() => onBookService(service)}
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors tracking-wide uppercase cursor-pointer"
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-12">
        <h3 className="font-serif font-extrabold text-xl text-brand-text mb-6">Customer Reviews</h3>

        {/* Overall Rating Summary */}
        <div className="flex items-center gap-4 mb-8 bg-white border border-brand-border rounded-3xl p-6 shadow-xs">
          <div className="text-center">
            <div className="text-4xl font-black text-brand-text mb-1">{(avgRating || 0).toFixed(1)}</div>
            <div className="flex items-center gap-1 justify-center mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(avgRating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-brand-muted font-bold">{reviewCount} reviews</div>
          </div>
        </div>

        {/* Write a Review Form */}
        {canReview && (
        <div className="bg-white border border-brand-border rounded-3xl p-6 mb-8 shadow-xs">
          <h4 className="font-bold text-lg text-brand-text mb-4">Write a Review</h4>
          {reviewError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
              {reviewError}
            </div>
          )}
          <form onSubmit={handleSubmitReview}>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReviewRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= newReviewRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-transparent text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              required
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e.target.value)}
              placeholder={user ? "Share your experience at this salon..." : "Please sign in to write a review"}
              disabled={!user || isSubmittingReview}
              className="w-full h-24 p-4 text-sm font-medium border border-brand-border rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-white resize-none mb-4 disabled:bg-gray-50 disabled:text-gray-500"
            />
            {user ? (
              <button
                type="submit"
                disabled={isSubmittingReview || !newReviewComment.trim()}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors tracking-wide uppercase cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? 'Posting...' : 'Post Review'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onAuthPrompt}
                className="px-6 py-3 bg-brand-secondary hover:bg-brand-primary hover:text-white text-brand-text font-bold text-xs rounded-xl shadow-xs transition-colors tracking-wide uppercase cursor-pointer"
              >
                Sign in to Review
              </button>
            )}
          </form>
        </div>
        )}
        
        {loadingReviews ? (
          <div className="text-center py-10 bg-white border border-brand-border rounded-3xl">
            <p className="text-brand-muted text-sm font-semibold">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-white border border-brand-border rounded-3xl">
            <Star className="w-8 h-8 text-brand-border mx-auto mb-3" />
            <p className="text-brand-muted text-sm font-semibold">No reviews yet.</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <div className="relative">
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as any)}
                  className="appearance-none bg-white border border-brand-border text-brand-text text-xs font-bold py-2 pl-4 pr-8 rounded-xl shadow-xs outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary cursor-pointer"
                >
                  <option value="Newest">Newest</option>
                  <option value="Oldest">Oldest</option>
                  <option value="Highest Rating">Highest Rating</option>
                </select>
                <ChevronDown className="w-4 h-4 text-brand-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedReviews.map(review => (
              <div key={review.id} className="bg-white border border-brand-border rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {review.userAvatar ? (
                      <img src={review.userAvatar} alt={review.userName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center text-brand-primary">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-brand-text">{review.userName}</p>
                      <p className="text-[10px] text-brand-muted font-semibold">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-brand-text leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
      {selectedStylistProfile && (
        <StylistProfileModal
          stylist={selectedStylistProfile}
          onClose={() => setSelectedStylistProfile(null)}
        />
      )}
    </div>
  );
}
