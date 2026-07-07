export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
  category: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  rating: number;
  image: string;
  images?: string[];
  portfolio?: string[];
  expertise?: string[];
  testimonials?: Testimonial[];
}

export interface Salon {
  id: string;
  name: string;
  type: 'Hair Salon' | 'Nail Salon' | 'Massage & Body' | 'Spa' | 'Eyebrows & Lashes' | 'Barbershop';
  description: string;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  address: string;
  services: Service[];
  stylists: Stylist[];
  hours: string;
  coords?: { x: number; y: number; neighborhood?: string };
  distance?: number;
  neighborhood?: string;
  ownerEmail?: string; // Owner email to link salon to business user
}

export interface Booking {
  id: string;
  userEmail?: string; // Links booking to a specific customer email
  salonId: string;
  salonName: string;
  salonImage: string;
  salonAddress: string;
  service: Service;
  stylist: Stylist;
  dateTime: string; // ISO string or format like "Thursday, June 25 • 2:30 PM"
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  clientPhone?: string;
  clientName?: string;
}

export interface Review {
  id: string;
  salonId: string;
  bookingId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  favorites: string[]; // salon IDs
  role?: 'customer' | 'business' | 'admin';
  salonIds?: string[]; // IDs of salons owned by this business user
}
