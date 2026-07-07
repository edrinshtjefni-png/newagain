import React, { useState } from 'react';
import { X, Calendar, Clock, User, Check, ChevronLeft, ChevronRight, QrCode, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Salon, Service, Stylist, Booking } from '../types';
import { getAllCloudBookings } from '../firebase';

interface BookingFlowProps {
  salon: Salon;
  service: Service;
  userEmail?: string;
  onClose: () => void;
  onConfirmBooking: (booking: Booking) => void;
}

type Step = 'stylist' | 'datetime' | 'confirm' | 'success';

export default function BookingFlow({ salon, service, userEmail, onClose, onConfirmBooking }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('stylist');
  const [selectedStylist, setSelectedStylist] = useState<Stylist | { id: 'any'; name: string; role: string; rating: number; image: string }>({
    id: 'any',
    name: 'Any Available Professional',
    role: 'We will select our first available team member',
    rating: salon.rating,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=100&q=80' // default
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateRaw, setSelectedDateRaw] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  React.useEffect(() => {
    async function fetchBookings() {
      setLoadingBookings(true);
      try {
        const bookings = await getAllCloudBookings();
        setAllBookings(bookings.filter(b => b.salonId === salon.id && b.status !== 'cancelled'));
      } catch (err) {
        console.error('Failed to load bookings', err);
      } finally {
        setLoadingBookings(false);
      }
    }
    fetchBookings();
  }, [salon.id]);

  const isSlotBooked = (time: string) => {
    const formattedDateTime = `${selectedDate} • ${time}`;
    if (selectedStylist.id === 'any') {
      const bookingsAtSlot = allBookings.filter(b => b.dateTime === formattedDateTime);
      return bookingsAtSlot.length >= salon.stylists.length;
    } else {
      return allBookings.some(b => b.dateTime === formattedDateTime && b.stylist.id === selectedStylist.id);
    }
  };
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Generate next 7 days for the date selector
  const getNext7Days = () => {
    const days = [];
    const locale = 'en-US';
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
      const dayNum = date.getDate();
      const monthName = date.toLocaleDateString(locale, { month: 'short' });
      const fullDateString = date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      days.push({
        dayName,
        dayNum,
        monthName,
        fullDateString,
        raw: date.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const days = getNext7Days();

  // Time slots categories
  const timeSlots = {
    morning: ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM'],
    afternoon: ['12:00 PM', '01:00 PM', '02:15 PM', '03:30 PM', '04:45 PM'],
    evening: ['05:30 PM', '06:15 PM', '07:00 PM', '07:45 PM']
  };

  const handleNextStep = () => {
    if (currentStep === 'stylist') {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime') {
      if (!selectedDate || !selectedTime) return;
      setCurrentStep('confirm');
    } else if (currentStep === 'confirm') {
      // Create booking object
      const formattedDateTime = `${selectedDate} • ${selectedTime}`;
      const newBooking: Booking = {
        id: 'bk_' + Math.random().toString(36).substr(2, 9),
        userEmail: userEmail,
        salonId: salon.id,
        salonName: salon.name,
        salonImage: salon.image,
        salonAddress: salon.address,
        service: service,
        stylist: selectedStylist as Stylist,
        dateTime: formattedDateTime,
        price: service.price,
        status: 'upcoming',
        notes: notes || undefined
      };

      setCreatedBooking(newBooking);
      onConfirmBooking(newBooking);
      setCurrentStep('success');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'datetime') {
      setCurrentStep('stylist');
    } else if (currentStep === 'confirm') {
      setCurrentStep('datetime');
    }
  };

  const handleDownloadICS = () => {
    if (!createdBooking || !selectedDateRaw || !selectedTime) return;

    const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return;

    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const ampm = timeParts[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const startDate = new Date(selectedDateRaw);
    startDate.setHours(hours, minutes, 0, 0);

    // Assume 1 hour duration
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StraksTime//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${createdBooking.id}@strakstime.no`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:Appointment: ${service.name} at ${salon.name}`,
      `DESCRIPTION:Your booking for ${service.name} with ${selectedStylist.name}.\\nBooking ID: ${createdBooking.id.toUpperCase()}`,
      `LOCATION:${salon.address}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${createdBooking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="booking-modal-container"
        className="bg-brand-bg border border-brand-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* Header summary of selected service (fixed on top of modal) */}
        {currentStep !== 'success' && (
          <div className="bg-brand-primary text-white p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-brand-warm-accent uppercase tracking-widest">{salon.name}</p>
              <h3 className="font-serif font-extrabold text-sm md:text-base leading-tight mt-0.5">{service.name}</h3>
              <p className="text-xs text-brand-secondary font-medium mt-1">
                {service.duration} min • <span className="text-white font-bold">${service.price}</span>
              </p>
            </div>
            <button
              id="close-booking-flow-btn"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6">
          {/* Step 1: Select Professional */}
          {currentStep === 'stylist' && (
            <div>
              <h4 className="font-serif font-extrabold text-lg text-brand-text mb-1">Select Professional</h4>
              <p className="text-xs text-brand-muted font-semibold mb-5">Choose a stylist or select any available staff.</p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {/* Any Available Option */}
                <button
                  id="stylist-option-any"
                  onClick={() => setSelectedStylist({
                    id: 'any',
                    name: 'Any Available Professional',
                    role: 'First available team member',
                    rating: salon.rating,
                    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=100&q=80'
                  })}
                  className={`w-full flex items-center justify-between p-4 border rounded-2xl text-left cursor-pointer transition-all ${
                    selectedStylist.id === 'any'
                      ? 'bg-white border-brand-primary shadow-sm'
                      : 'bg-white border-brand-border hover:border-brand-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-secondary text-brand-primary flex items-center justify-center font-bold text-sm border border-brand-border">
                      ANY
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text">Any Available Professional</p>
                      <p className="text-[10px] text-brand-muted font-semibold">Instantly secure the earliest opening</p>
                    </div>
                  </div>
                  {selectedStylist.id === 'any' && (
                    <div className="p-1 bg-brand-primary text-white rounded-full">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                {/* Individual Stylists */}
                {salon.stylists.map((st) => (
                  <button
                    id={`stylist-option-${st.id}`}
                    key={st.id}
                    onClick={() => setSelectedStylist(st)}
                    className={`w-full flex items-center justify-between p-4 border rounded-2xl text-left cursor-pointer transition-all ${
                      selectedStylist.id === st.id
                        ? 'bg-white border-brand-primary shadow-sm'
                        : 'bg-white border-brand-border hover:border-brand-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={st.image} alt={st.name} className="w-10 h-10 rounded-full object-cover border border-brand-border" />
                      <div>
                        <p className="text-xs font-bold text-brand-text">{st.name}</p>
                        <p className="text-[10px] text-brand-muted font-semibold">{st.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">★ {st.rating}</span>
                      {selectedStylist.id === st.id && (
                        <div className="p-1 bg-brand-primary text-white rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-brand-secondary flex justify-end">
                <button
                  id="btn-next-step-stylist"
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition-colors tracking-wide uppercase cursor-pointer"
                >
                  Choose Style Professional
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selector */}
          {currentStep === 'datetime' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button onClick={handlePrevStep} className="p-1 text-brand-muted hover:text-brand-text">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="font-serif font-extrabold text-lg text-brand-text">Choose Date & Time</h4>
              </div>
              <p className="text-xs text-brand-muted font-semibold mb-4 ml-8">Select your preferred appointment slot.</p>

              {/* Next 7 Days Carousel */}
              <div className="mb-6">
                <p className="text-[10px] font-extrabold text-brand-muted tracking-wider uppercase mb-2">Available Dates</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {days.map((day) => (
                    <button
                      id={`date-button-${day.raw}`}
                      key={day.raw}
                      onClick={() => {
                        setSelectedDate(day.fullDateString);
                        setSelectedDateRaw(day.raw);
                        setSelectedTime(''); // reset time when date changes
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 min-w-[70px] border rounded-xl cursor-pointer transition-all ${
                        selectedDate === day.fullDateString
                          ? 'bg-brand-primary border-brand-primary text-white shadow-md scale-102'
                          : 'bg-white border-brand-border text-brand-text hover:border-brand-muted'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider font-bold opacity-70">{day.dayName}</span>
                      <span className="text-lg font-black my-0.5">{day.dayNum}</span>
                      <span className="text-[9px] font-bold opacity-75">{day.monthName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots Categories */}
              {selectedDate ? (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {/* Morning */}
                  <div>
                    <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Morning</p>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.morning.map((t) => {
                        const booked = isSlotBooked(t);
                        return (
                        <button
                          id={`time-slot-${t.replace(/:|\s/g, '-')}`}
                          key={t}
                          onClick={() => !booked && setSelectedTime(t)}
                          disabled={booked}
                          className={`py-2 text-[11px] font-bold rounded-xl text-center transition-all border ${
                            booked 
                              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through decoration-gray-300'
                              : selectedTime === t
                                ? 'bg-brand-primary border-brand-primary text-white cursor-pointer shadow-sm'
                                : 'bg-white border-brand-border hover:border-brand-muted text-brand-text cursor-pointer hover:shadow-xs'
                          }`}
                        >
                          {t}
                        </button>
                      )
                      })}
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div>
                    <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Afternoon</p>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.afternoon.map((t) => {
                        const booked = isSlotBooked(t);
                        return (
                        <button
                          id={`time-slot-${t.replace(/:|\s/g, '-')}`}
                          key={t}
                          onClick={() => !booked && setSelectedTime(t)}
                          disabled={booked}
                          className={`py-2 text-[11px] font-bold rounded-xl text-center transition-all border ${
                            booked 
                              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through decoration-gray-300'
                              : selectedTime === t
                                ? 'bg-brand-primary border-brand-primary text-white cursor-pointer shadow-sm'
                                : 'bg-white border-brand-border hover:border-brand-muted text-brand-text cursor-pointer hover:shadow-xs'
                          }`}
                        >
                          {t}
                        </button>
                      )
                      })}
                    </div>
                  </div>

                  {/* Evening */}
                  <div>
                    <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Evening</p>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.evening.map((t) => {
                        const booked = isSlotBooked(t);
                        return (
                        <button
                          id={`time-slot-${t.replace(/:|\s/g, '-')}`}
                          key={t}
                          onClick={() => !booked && setSelectedTime(t)}
                          disabled={booked}
                          className={`py-2 text-[11px] font-bold rounded-xl text-center transition-all border ${
                            booked 
                              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through decoration-gray-300'
                              : selectedTime === t
                                ? 'bg-brand-primary border-brand-primary text-white cursor-pointer shadow-sm'
                                : 'bg-white border-brand-border hover:border-brand-muted text-brand-text cursor-pointer hover:shadow-xs'
                          }`}
                        >
                          {t}
                        </button>
                      )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-white border border-brand-border border-dashed rounded-2xl">
                  <Calendar className="w-8 h-8 text-brand-muted mx-auto mb-2 opacity-55" />
                  <p className="text-xs text-brand-muted font-bold">Please select an appointment date first</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-brand-secondary flex justify-between items-center">
                <button
                  onClick={handlePrevStep}
                  className="text-xs font-bold text-brand-muted hover:text-brand-text cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-next-step-datetime"
                  onClick={handleNextStep}
                  disabled={!selectedDate || !selectedTime}
                  className={`px-6 py-3 text-xs font-bold rounded-xl transition-colors tracking-wide uppercase cursor-pointer ${
                    selectedDate && selectedTime
                      ? 'bg-brand-primary hover:bg-brand-dark text-white'
                      : 'bg-brand-secondary text-brand-muted cursor-not-allowed border border-brand-border'
                  }`}
                >
                  Confirm Date & Time
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation Summary */}
          {currentStep === 'confirm' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button onClick={handlePrevStep} className="p-1 text-brand-muted hover:text-brand-text">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="font-serif font-extrabold text-lg text-brand-text">Confirm Your Booking</h4>
              </div>
              <p className="text-xs text-brand-muted font-semibold mb-5 ml-8">Review details before finalizing.</p>

              {/* Summary card */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4 mb-4 shadow-2xs">
                {/* Salon */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-secondary border border-brand-border rounded-xl">
                    <MapPin className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-muted font-extrabold uppercase tracking-wider">Venue</p>
                    <p className="text-xs font-bold text-brand-text">{salon.name}</p>
                    <p className="text-[10px] text-brand-muted font-semibold">{salon.address}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-secondary border border-brand-border rounded-xl">
                    <Calendar className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-muted font-extrabold uppercase tracking-wider">Date & Time</p>
                    <p className="text-xs font-bold text-brand-text">{selectedDate}</p>
                    <p className="text-[10px] text-brand-muted font-semibold">{selectedTime}</p>
                  </div>
                </div>

                {/* Stylist */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-secondary border border-brand-border rounded-xl">
                    <User className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-muted font-extrabold uppercase tracking-wider">Professional</p>
                    <p className="text-xs font-bold text-brand-text">{selectedStylist.name}</p>
                    <p className="text-[10px] text-brand-muted font-semibold">{selectedStylist.role}</p>
                  </div>
                </div>
              </div>

              {/* Special instructions */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase mb-1.5 block">Special instructions (optional)</label>
                <textarea
                  id="booking-notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. skin sensitivities, specific styling requests, etc..."
                  rows={2}
                  className="w-full text-xs font-semibold border border-brand-border rounded-xl p-3 bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-b border-brand-secondary py-3.5 mb-6 text-xs font-bold text-brand-muted space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-extrabold text-brand-text">${service.price}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Booking fee</span>
                  <span className="font-extrabold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-dashed border-brand-border">
                  <span className="font-extrabold text-brand-text">Total to Pay</span>
                  <span className="font-black text-brand-text">${service.price}.00</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevStep}
                  className="text-xs font-bold text-brand-muted hover:text-brand-text cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-confirm-final-booking"
                  onClick={handleNextStep}
                  className="px-8 py-3.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-extrabold rounded-xl transition-colors tracking-wide uppercase shadow-md cursor-pointer"
                >
                  Book Appointment Now
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success Ticket Screen */}
          {currentStep === 'success' && createdBooking && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <Check className="w-6 h-6 stroke-[3px]" />
              </div>

              <h4 className="font-serif font-black text-xl text-brand-text">Appointment Confirmed!</h4>
              <p className="text-xs text-emerald-600 font-bold mt-1">We sent a confirmation voucher to your email.</p>

              {/* Aesthetic Ticket Ticket */}
              <div className="bg-white border border-brand-border rounded-2xl overflow-hidden mt-6 shadow-md border-dashed-t relative">
                {/* Salon Image background band */}
                <div className="h-16 relative bg-brand-secondary">
                  <img src={salon.image} className="w-full h-full object-cover opacity-85 brightness-90" />
                  <div className="absolute inset-0 bg-[#121212]/30 flex items-center justify-center">
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">{salon.name}</span>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="p-5 space-y-3 text-left">
                  <div className="text-center pb-3 border-b border-brand-secondary">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">Your Appointment Pass</p>
                    <p className="text-xs font-black text-brand-text mt-1">ID: {createdBooking.id.toUpperCase()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">Treatment</p>
                      <p className="font-bold text-brand-text mt-0.5 line-clamp-1">{service.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">Professional</p>
                      <p className="font-bold text-brand-text mt-0.5">{selectedStylist.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">Date & Time</p>
                      <p className="font-bold text-brand-text mt-0.5 leading-snug">{createdBooking.dateTime}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">Address</p>
                      <p className="font-bold text-brand-muted mt-0.5 line-clamp-1">{salon.address}</p>
                    </div>
                  </div>

                  {/* QR Code section */}
                  <div className="flex flex-col items-center justify-center pt-4 border-t border-dashed border-brand-border">
                    <div className="p-3 bg-brand-secondary border border-brand-border rounded-xl flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-brand-text" />
                    </div>
                    <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase mt-2">Scan at venue check-in</p>
                  </div>
                </div>
              </div>

              {/* Add to Calendar Button */}
              <button
                onClick={handleDownloadICS}
                className="mt-6 w-full py-3.5 bg-white border-2 border-brand-primary text-brand-primary hover:bg-emerald-50 text-xs font-bold rounded-xl transition-colors tracking-wide uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Add to Calendar
              </button>

              {/* Close Button */}
              <button
                id="btn-finish-booking-flow"
                onClick={onClose}
                className="mt-3 w-full py-3.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition-colors tracking-wide uppercase cursor-pointer"
              >
                Go to My Bookings
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
