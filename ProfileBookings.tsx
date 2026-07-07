import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, Heart, Mail, Phone, Edit, User, MapPin, Sparkles, Check, ChevronRight, Star } from 'lucide-react';
import { Booking, Salon, UserProfile } from '../types';
import SalonCard from './SalonCard';
import ReviewModal from './ReviewModal';

function parseBookingDateTime(dateTimeStr: string): Date | null {
  try {
    const parts = dateTimeStr.split(' • ');
    if (parts.length < 2) return null;
    
    let datePart = parts[0].trim();
    const timePart = parts[1].trim();
    
    datePart = datePart.replace(/^[A-Za-z]+,\s*/, '');
    
    if (!/\d{4}/.test(datePart)) {
      datePart = `${datePart}, ${new Date().getFullYear()}`;
    }
    
    const parsedDate = new Date(`${datePart} ${timePart}`);
    if (isNaN(parsedDate.getTime())) {
      return null;
    }
    return parsedDate;
  } catch (e) {
    console.error("Failed to parse booking date-time:", e);
    return null;
  }
}

interface BookingCountdownProps {
  dateTimeStr: string;
}

function BookingCountdown({ dateTimeStr }: BookingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const targetDate = parseBookingDateTime(dateTimeStr);
    if (!targetDate) return;

    const updateTimer = () => {
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (diffMs > 0 && diffMs < oneDayMs) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [dateTimeStr]);

  if (!timeLeft) return null;

  return (
    <div className="mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-[11px] font-bold animate-pulse">
      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>
        Starts in{' '}
        <span className="font-black font-mono">
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
}

interface ProfileBookingsProps {
  user: UserProfile;
  bookings: Booking[];
  salons: Salon[];
  currentSection: 'bookings' | 'favorites' | 'profile';
  onCancelBooking: (id: string) => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onToggleFavorite: (id: string, e?: any) => void;
  onSelectSalon: (id: string) => void;
}

export default function ProfileBookings({
  user,
  bookings,
  salons,
  currentSection,
  onCancelBooking,
  onUpdateProfile,
  onToggleFavorite,
  onSelectSalon
}: ProfileBookingsProps) {
  // Booking status tabs: 'upcoming' vs 'past'
  const [activeBookingTab, setActiveBookingTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone
  });

  // Keep form in sync when user changes
  React.useEffect(() => {
    setProfileForm({
      name: user.name,
      email: user.email,
      phone: user.phone
    });
  }, [user]);

  const userBookings = bookings.filter(b => !b.userEmail || b.userEmail.toLowerCase() === user.email.toLowerCase());
  const upcomingBookings = userBookings.filter(b => b.status === 'upcoming');
  const pastBookings = userBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...user,
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone
    });
    setIsEditingProfile(false);
  };

  // Find favorite salons details
  const favoriteSalons = salons.filter(s => user.favorites.includes(s.id));

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 md:px-8">
      
      {/* 1. BOOKINGS SECTION */}
      {currentSection === 'bookings' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-brand-secondary text-brand-primary rounded-2xl border border-brand-border">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-black text-brand-text">My Bookings</h2>
              <p className="text-xs text-brand-muted font-semibold">Manage your appointments, past visits, and schedules.</p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-brand-border mb-6">
            <button
              id="bookings-tab-upcoming"
              onClick={() => setActiveBookingTab('upcoming')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeBookingTab === 'upcoming'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              id="bookings-tab-past"
              onClick={() => setActiveBookingTab('past')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeBookingTab === 'past'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              Past & Cancelled ({pastBookings.length})
            </button>
          </div>

          {/* Booking list */}
          {activeBookingTab === 'upcoming' ? (
            upcomingBookings.length === 0 ? (
              <div className="text-center py-16 bg-white border border-brand-border rounded-3xl">
                <Calendar className="w-12 h-12 text-brand-muted mx-auto mb-3 opacity-60" />
                <h4 className="font-serif font-bold text-base text-brand-text">No upcoming appointments</h4>
                <p className="text-xs text-brand-muted mt-1 mb-5">Your next beauty appointment will show up right here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBookings.map((b) => (
                  <div
                    id={`booking-card-${b.id}`}
                    key={b.id}
                    className="bg-white border border-brand-border rounded-2xl overflow-hidden p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow relative"
                  >
                    <span className="absolute top-4 right-4 bg-brand-secondary text-brand-primary border border-brand-border text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      CONFIRMED
                    </span>

                    <div className="flex items-start gap-4">
                      <img src={b.salonImage} alt={b.salonName} className="w-12 h-12 rounded-xl object-cover border border-brand-border" />
                      <div className="min-w-0 pr-16">
                        <h4 className="font-bold text-sm text-brand-text truncate">{b.salonName}</h4>
                        <p className="text-[11px] font-bold text-brand-primary mt-0.5">{b.service.name}</p>
                        <p className="text-[10px] text-brand-muted font-semibold mt-1">With {b.stylist.name}</p>
                      </div>
                    </div>

                    <div className="border-t border-b border-brand-secondary py-3 my-4 space-y-1.5 text-xs text-brand-text font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-muted" />
                        <span>{b.dateTime.split(' • ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-brand-muted" />
                        <span>{b.dateTime.split(' • ')[1]} ({b.service.duration} mins)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-muted" />
                        <span className="truncate">{b.salonAddress}</span>
                      </div>
                      <BookingCountdown dateTimeStr={b.dateTime} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-brand-text">${b.price}</span>
                      
                      <button
                        id={`cancel-booking-btn-${b.id}`}
                        onClick={() => onCancelBooking(b.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-border hover:border-red-300 hover:text-red-600 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer text-brand-muted"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            pastBookings.length === 0 ? (
              <div className="text-center py-16 bg-white border border-brand-border rounded-3xl">
                <Calendar className="w-12 h-12 text-brand-muted mx-auto mb-3 opacity-60" />
                <h4 className="font-serif font-bold text-base text-brand-text">No history yet</h4>
                <p className="text-xs text-brand-muted mt-1">Completed and cancelled appointments will be logged here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastBookings.map((b) => (
                  <div
                    id={`past-booking-row-${b.id}`}
                    key={b.id}
                    className="bg-white border border-brand-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs"
                  >
                    <div className="flex items-center gap-3">
                      <img src={b.salonImage} alt={b.salonName} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-brand-border" />
                      <div>
                        <h4 className="font-bold text-xs text-brand-text">{b.salonName}</h4>
                        <p className="text-xs font-semibold text-brand-primary">{b.service.name}</p>
                        <p className="text-[10px] text-brand-muted font-medium mt-0.5">{b.dateTime} • Stylist: {b.stylist.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-brand-secondary">
                      <span className="font-black text-sm text-brand-text">${b.price}</span>
                      
                      {b.status === 'cancelled' ? (
                        <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                          Cancelled
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                          Completed
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {b.status === 'completed' && (
                          <button
                            onClick={() => setReviewBooking(b)}
                            className="px-3 py-1.5 flex items-center gap-1 bg-white border border-brand-border hover:border-amber-400 hover:text-amber-600 text-xs font-bold text-brand-muted rounded-lg transition-colors cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        )}
                        <button
                          id={`rebook-btn-${b.salonId}`}
                          onClick={() => onSelectSalon(b.salonId)}
                          className="px-4 py-1.5 bg-brand-secondary border border-brand-border hover:border-brand-primary text-xs font-bold text-brand-text rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Book Again
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          user={user}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            alert("Thank you for your review!");
          }}
        />
      )}

      {/* 2. FAVORITES SECTION */}
      {currentSection === 'favorites' && (
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-black text-brand-text">Favorite Venues</h2>
              <p className="text-xs text-brand-muted font-semibold">Your handpicked salons, spas, and wellness outlets.</p>
            </div>
          </div>

          {favoriteSalons.length === 0 ? (
            <div className="text-center py-16 bg-white border border-brand-border rounded-3xl">
              <Heart className="w-12 h-12 text-brand-muted mx-auto mb-3 opacity-60" />
              <h4 className="font-serif font-bold text-base text-brand-text">No favorite venues saved</h4>
              <p className="text-xs text-brand-muted mt-1 mb-5">Click the heart icon on salons to save them for easy bookings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteSalons.map((salon) => (
                <SalonCard
                  key={salon.id}
                  salon={salon}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={onSelectSalon}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PROFILE SETTINGS SECTION */}
      {currentSection === 'profile' && (
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-brand-secondary text-brand-primary rounded-2xl border border-brand-border">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-black text-brand-text">Profile Settings</h2>
              <p className="text-xs text-brand-muted font-semibold">Update your credentials, phone number, and contacts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left side: Avatar Profile Badge */}
            <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-3xs flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover border-2 border-brand-primary" />
                <span className="absolute bottom-0 right-0 p-1.5 bg-brand-primary text-white rounded-full border-2 border-white shadow-sm">
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>
              <h4 className="font-serif font-extrabold text-brand-text text-base">{user.name}</h4>
              <p className="text-xs text-brand-muted font-semibold mt-1">{user.email}</p>
              
              <div className="mt-5 w-full bg-brand-secondary border border-brand-border rounded-2xl p-4 flex items-center gap-3.5 text-left">
                <div className="p-2 bg-brand-primary rounded-xl text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-muted font-black uppercase">Loyalty Status</p>
                  <p className="text-xs font-bold text-brand-text">StraksTime.no Gold Member</p>
                </div>
              </div>
            </div>

            {/* Right side: Form Fields */}
            <div className="md:col-span-2 bg-white border border-brand-border rounded-3xl p-6 md:p-8 shadow-3xs">
              <div className="flex items-center justify-between pb-4 border-b border-brand-secondary mb-6">
                <h3 className="font-extrabold text-brand-text text-sm tracking-wider uppercase">Contact Credentials</h3>
                {!isEditingProfile && (
                  <button
                    id="btn-edit-profile"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-dark hover:underline cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form id="profile-edit-form" onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1 block">Full Name</label>
                    <input
                      id="profile-edit-name"
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full text-xs font-bold border border-brand-border rounded-xl p-3 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1 block">Email Address</label>
                    <input
                      id="profile-edit-email"
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full text-xs font-bold border border-brand-border rounded-xl p-3 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1 block">Mobile Phone</label>
                    <input
                      id="profile-edit-phone"
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full text-xs font-bold border border-brand-border rounded-xl p-3 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-white"
                    />
                  </div>

                  <div className="pt-4 flex gap-3 justify-end">
                    <button
                      id="btn-cancel-edit-profile"
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileForm({ name: user.name, email: user.email, phone: user.phone });
                      }}
                      className="px-4 py-2 border border-brand-border hover:bg-brand-secondary text-xs font-bold text-brand-muted rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-edit-profile"
                      type="submit"
                      className="px-6 py-2 bg-brand-primary hover:bg-brand-dark text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-secondary border border-brand-border rounded-xl">
                      <User className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">Full Name</p>
                      <p className="text-xs font-bold text-brand-text mt-0.5">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-secondary border border-brand-border rounded-xl">
                      <Mail className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">Email Address</p>
                      <p className="text-xs font-bold text-brand-text mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-secondary border border-brand-border rounded-xl">
                      <Phone className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">Mobile Phone</p>
                      <p className="text-xs font-bold text-brand-text mt-0.5">{user.phone}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-brand-secondary flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-bold">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                      <span>Two-Factor Authentication Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
