import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { 
  Building, MapPin, Star, Compass, User, ClipboardList, Plus, Trash2, 
  Check, ChevronRight, ChevronLeft, Sparkles, AlertCircle, Info, Clock, X, Scissors,
  Edit3, Calendar, LayoutGrid, List, Upload, ChevronDown, ChevronUp, SlidersHorizontal, Search, Settings
} from 'lucide-react';
import { Salon, Service, Stylist, UserProfile, Booking } from '../types';
import { lookupNorwayPostalCode, searchNorwayAddresses, NorwayPlace } from '../utils/norwayAddressDb';

// Helper to project real GPS Lat/Lng in Norway to our 0-100 relative grid coordinates
function getGridCoordsForLatLng(lat: number, lng: number) {
  // y = 12 + (69.65 - lat) / 0.1369
  // x = 5 + (lng - 5.32) / 0.2784
  const y = 12 + (69.65 - lat) / 0.1369;
  const x = 5 + (lng - 5.32) / 0.2784;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

function getNextHour(timeStr: string): string {
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return timeStr;
  let hour = parseInt(match[1], 10);
  const minutes = match[2];
  let ampm = match[3].toUpperCase();
  
  hour += 1;
  if (hour === 12) {
    ampm = ampm === 'AM' ? 'PM' : 'AM';
  } else if (hour > 12) {
    hour = 1;
  }
  return `${hour}:${minutes} ${ampm}`;
}

function generateTimeSlots(interval: 15 | 30 | 60): string[] {
  const slots: string[] = [];
  let currentHour = 8;
  let currentMin = 0;
  while (currentHour < 18 || (currentHour === 18 && currentMin === 0)) {
    const isPM = currentHour >= 12;
    const displayHour = currentHour > 12 ? currentHour - 12 : (currentHour === 0 ? 12 : currentHour);
    const ampm = isPM ? 'PM' : 'AM';
    const formattedMin = currentMin.toString().padStart(2, '0');
    slots.push(`${displayHour}:${formattedMin} ${ampm}`);
    
    currentMin += interval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }
  return slots;
}

interface BusinessPortalProps {
  salons: Salon[];
  user: UserProfile | null;
  onRegisterSalon: (newSalon: Salon) => void;
  onUpdateSalon?: (updatedSalon: Salon) => void;
  onDeleteSalon?: (id: string) => void;
  bookings?: Booking[];
  onUpdateBooking?: (updatedBooking: Booking) => void;
  onAddBooking?: (newBooking: Booking) => void;
  onNavigateHome: () => void;
  onOpenAuth: () => void;
}

// Preset design photos for easy beautiful setup
const VENUE_IMAGE_PRESETS = [
  {
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    label: 'Modern Minimalist Studio',
  },
  {
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    label: 'Warm Organic Lounge',
  },
  {
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    label: 'Premium High-Tech Spa',
  },
  {
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    label: 'Vintage Grooming Parlour',
  },
  {
    url: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=600&q=80',
    label: 'Calm Zen Thermal Suite',
  },
];

// Curated default treatment suggestions depending on the category type
const CATEGORY_DEFAULT_SERVICES: Record<string, Omit<Service, 'id'>[]> = {
  'Hair Salon': [
    { name: "Precision Haircut & Style", duration: 45, price: 65, description: "Includes sensory shampoo scalp massage, conditioning, and classic blowout.", category: "Hair" },
    { name: "Full Balayage & Toning", duration: 150, price: 180, description: "Hand-painted custom highlights finished with premium hydration gloss.", category: "Hair" },
  ],
  'Nail Salon': [
    { name: "Signature Gel Manicure", duration: 45, price: 45, description: "Nail shaping, detail cuticle therapy, organic scrub, and long-lasting non-toxic gel coat.", category: "Nails" },
    { name: "Deluxe Spa Pedicure", duration: 60, price: 65, description: "Extended warm milk bath, clay mask wrap, heated massage stones, and premium polish.", category: "Nails" },
  ],
  'Massage & Body': [
    { name: "Deep Tissue Muscle Therapy", duration: 60, price: 110, description: "Therapeutic focused pressure to relieve chronic tension and restore joint mobility.", category: "Massage" },
    { name: "Aromatherapy Stress Relief", duration: 75, price: 125, description: "Smooth light-pressure massage incorporating premium organic essential oil diffusions.", category: "Massage" },
  ],
  'Spa': [
    { name: "Classic Hydro-Facial Glow", duration: 60, price: 95, description: "Exfoliation, high-infusion antioxidant serums, and custom botanical cooling clay mask.", category: "Spa" },
    { name: "Total Wellness Body Polish", duration: 90, price: 140, description: "Gentle marine-salt body scrub followed by a hydrating raw shea-butter body wrap.", category: "Spa" },
  ],
  'Eyebrows & Lashes': [
    { name: "Signature Brow Sculpt", duration: 30, price: 35, description: "Mapping, meticulous organic waxing, tweezing, and optional tint detailing.", category: "Lashes" },
    { name: "Keratin Lash Lift & Tint", duration: 60, price: 85, description: "Naturally lifts and darkens your own lashes. Results last up to 6-8 weeks.", category: "Lashes" },
  ],
  'Barbershop': [
    { name: "The Gentleman Cut & Style", duration: 45, price: 45, description: "Precision shears, hot lather neck shave, and premium oil styling finish.", category: "Hair" },
    { name: "Luxury Hot Towel Shave", duration: 40, price: 40, description: "Meticulous pre-shave oil massage, rich foaming lather, and cold stone compression.", category: "Hair" },
  ]
};

const STYLIST_IMAGE_PRESETS = [
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    label: 'Sophia (Expert Colorist)'
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    label: 'Marcus (Master Barber)'
  },
  {
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    label: 'Elena (Nail Artist)'
  },
  {
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    label: 'David (Therapist)'
  },
  {
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    label: 'Sarah (Aesthetician)'
  }
];

// Helper to generate calendar days for a specific year and month (0-indexed) starting on Monday
function getMonthDaysMon(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  let firstDayOfWeek = firstDay.getDay(); 
  // Convert to Mon-first: 0 = Mon, 1 = Tue, ..., 6 = Sun
  let startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const totalDays = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  // Fill leading empty cells
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  // Fill actual days
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }
  return days;
}

export default function BusinessPortal({ 
  salons: allSalons, 
  user, 
  onRegisterSalon, 
  onUpdateSalon,
  onDeleteSalon,
  bookings = [],
  onUpdateBooking,
  onAddBooking,
  onNavigateHome, 
  onOpenAuth 
}: BusinessPortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'calendar'>('calendar');
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [selectedCalendarSalonId, setSelectedCalendarSalonId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date('2026-06-25T12:00:00Z'));
  const [isCalendarPopupOpen, setIsCalendarPopupOpen] = useState(false);
  const [popupYear, setPopupYear] = useState(2026);
  const [popupMonth, setPopupMonth] = useState(5); // June is month 5
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Custom manual booking states
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [newBookingSalonId, setNewBookingSalonId] = useState('');
  const [newBookingServiceId, setNewBookingServiceId] = useState('');
  const [newBookingStylistId, setNewBookingStylistId] = useState('');
  const [newBookingClientName, setNewBookingClientName] = useState('');
  const [newBookingClientEmail, setNewBookingClientEmail] = useState('');
  const [newBookingClientPhone, setNewBookingClientPhone] = useState('');
  const [newBookingTime, setNewBookingTime] = useState('10:00 AM');
  const [newBookingNotes, setNewBookingNotes] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Add Employee states
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeSalonId, setNewEmployeeSalonId] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  const [newEmployeeImage, setNewEmployeeImage] = useState(STYLIST_IMAGE_PRESETS[0].url);

  // Block out time states
  const [isAddingBlockTime, setIsAddingBlockTime] = useState(false);
  const [newBlockSalonId, setNewBlockSalonId] = useState('');
  const [newBlockStylistId, setNewBlockStylistId] = useState('');
  const [newBlockTitle, setNewBlockTitle] = useState('Lunch Break');
  const [newBlockTime, setNewBlockTime] = useState('12:00 PM - 1:00 PM');

  // Calendar filtering states
  const [selectedStylistFilter, setSelectedStylistFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'list'>('grid');
  const [gridTimeInterval, setGridTimeInterval] = useState<15 | 30 | 60>(60);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.getElementById('navbar-settings-portal-target'));
  }, []);

  // Registration form values state
  const [name, setName] = useState('');
  const [type, setType] = useState<Salon['type']>('Hair Salon');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('Mon - Sat: 9:00 AM - 7:00 PM');
  const [address, setAddress] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVerifiedLocation, setIsVerifiedLocation] = useState(false);
  const [neighborhood, setNeighborhood] = useState('Oslo');
  const [imageUrl, setImageUrl] = useState(VENUE_IMAGE_PRESETS[0].url);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  // Map Coordinates choice: simulated grid percentage coordinates
  const [coords, setCoords] = useState({ x: 50, y: 50 });

  // Refs/State for registration interactive Leaflet map
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  const regMapInstanceRef = React.useRef<L.Map | null>(null);
  const regMarkerRef = React.useRef<L.Marker | null>(null);

  // Helper to project relative 0-100 grid coords to real Norway latitudes & longitudes
  const gridToLatLng = (xVal: number, yVal: number) => {
    const lat = 69.65 - (yVal - 12) * 0.1369;
    const lng = 5.32 + (xVal - 5) * 0.2784;
    return { lat, lng };
  };

  // Synchronize Leaflet Map in Step 1 when mounted or step changes
  React.useEffect(() => {
    // If not in step 1 or mapElement is missing, clear map
    if (currentStep !== 1 || !mapElement) {
      if (regMapInstanceRef.current) {
        regMapInstanceRef.current.remove();
        regMapInstanceRef.current = null;
        regMarkerRef.current = null;
      }
      return;
    }

    // Convert current coords to lat/lng
    const initialLatLng = gridToLatLng(coords.x, coords.y);

    // Bulletproof container checks to prevent "Map container is already initialized"
    if (mapElement) {
      const container = mapElement as any;
      if (container._leaflet_id && regMapInstanceRef.current) {
        // Map is already initialized, just set center and return
        regMapInstanceRef.current.setView([initialLatLng.lat, initialLatLng.lng]);
        if (regMarkerRef.current) {
          regMarkerRef.current.setLatLng([initialLatLng.lat, initialLatLng.lng]);
        }
        return;
      } else if (container._leaflet_id) {
        // Leaflet thinks a map is attached but the ref was lost, clear the ID
        try {
          delete container._leaflet_id;
        } catch (e) {
          container._leaflet_id = null;
        }
      }
    }

    // Initialize Leaflet Map
    const map = L.map(mapElement, {
      center: [initialLatLng.lat, initialLatLng.lng],
      zoom: coords.x === 50 && coords.y === 50 ? 5 : 13, // Zoomed in if customized, else national overview
      zoomControl: true,
      attributionControl: false,
    });

    regMapInstanceRef.current = map;

    // Use standard OpenStreetMap tile layer styling (highly detailed and 100% reliable)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Watch size changes using ResizeObserver for perfect visibility during transition/animations
    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch (e) {
        // ignore
      }
    });
    resizeObserver.observe(mapElement);

    // Call invalidateSize multiple times to handle transition animation delays (Framer Motion)
    const invalidateTimers = [100, 300, 600, 1200].map(delay => 
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {
          // ignore if map was already removed
        }
      }, delay)
    );

    // Create custom green salon pin icon
    const salonIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500 opacity-20 animate-ping"></div>
          <svg class="w-8 h-10 drop-shadow-md transition-all duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" fill="#10B981" stroke="#047857" stroke-width="0.5"/>
            <circle cx="12" cy="8" r="2.5" fill="#FFFFFF"/>
          </svg>
        </div>
      `,
      className: 'custom-salon-icon',
      iconSize: [32, 40],
      iconAnchor: [16, 40]
    });

    // Add draggable marker to the map
    const marker = L.marker([initialLatLng.lat, initialLatLng.lng], {
      icon: salonIcon,
      draggable: true,
    }).addTo(map);

    regMarkerRef.current = marker;

    // Function to handle coordinate updates
    const updateCoordinates = async (lat: number, lng: number) => {
      const newGrid = getGridCoordsForLatLng(lat, lng);
      setCoords(newGrid);

      // Immediate estimation of closest municipality for instant UX response
      const ALL_NORWAY_MUNICIPALITIES = [
        { name: "Oslo", county: "Oslo", postalPrefix: "01" },
        { name: "Bergen", county: "Vestland", postalPrefix: "50" },
        { name: "Trondheim", county: "Trøndelag", postalPrefix: "70" },
        { name: "Stavanger", county: "Rogaland", postalPrefix: "40" },
        { name: "Bærum", county: "Akershus", postalPrefix: "13" },
        { name: "Kongsvinger", county: "Innlandet", postalPrefix: "22" },
        { name: "Lillestrøm", county: "Akershus", postalPrefix: "20" },
        { name: "Drammen", county: "Buskerud", postalPrefix: "30" },
        { name: "Kristiansand", county: "Agder", postalPrefix: "46" },
        { name: "Tromsø", county: "Troms", postalPrefix: "90" }
      ];

      let closestMun = "Oslo";
      let minDist = Infinity;
      ALL_NORWAY_MUNICIPALITIES.forEach(mun => {
        const route = {
          "01": { lat: 59.9139, lng: 10.7522 },
          "50": { lat: 60.3929, lng: 5.3241 },
          "70": { lat: 63.4305, lng: 10.3951 },
          "40": { lat: 58.9699, lng: 5.7331 },
          "13": { lat: 59.9272, lng: 10.4784 },
          "22": { lat: 60.1905, lng: 11.9995 },
          "20": { lat: 59.9560, lng: 11.0490 },
          "30": { lat: 59.7440, lng: 10.2044 },
          "46": { lat: 58.1467, lng: 7.9949 },
          "90": { lat: 69.6492, lng: 18.9553 }
        }[mun.postalPrefix] || { lat: 59.9139, lng: 10.7522 };

        const d = Math.pow(lat - route.lat, 2) + Math.pow(lng - route.lng, 2);
        if (d < minDist) {
          minDist = d;
          closestMun = mun.name;
        }
      });

      setNeighborhood(closestMun);
      setIsVerifiedLocation(false);

      // Perform background Nominatim reverse geocode for nøyaktig sanntidsadresse
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'no,nb,nn,en' }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
            setIsVerifiedLocation(true);

            const addr = data.address || {};
            const city = addr.city || addr.town || addr.municipality || addr.village;
            const suburb = addr.suburb || addr.neighbourhood || addr.quarter;
            if (suburb && city) {
              setNeighborhood(`${suburb}, ${city}`);
            } else if (city) {
              setNeighborhood(city);
            }
          }
        }
      } catch (err) {
        console.error("Nominatim reverse geocoding failed, utilizing local estimation:", err);
      }
    };

    // Marker drag event
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      updateCoordinates(position.lat, position.lng);
    });

    // Map click event to place marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateCoordinates(lat, lng);
    });

    return () => {
      resizeObserver.disconnect();
      invalidateTimers.forEach(clearTimeout);
      if (regMapInstanceRef.current) {
        regMapInstanceRef.current.remove();
        regMapInstanceRef.current = null;
        regMarkerRef.current = null;
      }
    };
  }, [currentStep, mapElement]);

  // Synchronize Leaflet Map and Marker when coords state changes (e.g. from typing/selecting an autocomplete suggestion)
  React.useEffect(() => {
    if (regMapInstanceRef.current && regMarkerRef.current) {
      const latLng = gridToLatLng(coords.x, coords.y);
      
      const currentMarkerLatLng = regMarkerRef.current.getLatLng();
      if (Math.abs(currentMarkerLatLng.lat - latLng.lat) > 0.0001 || Math.abs(currentMarkerLatLng.lng - latLng.lng) > 0.0001) {
        regMarkerRef.current.setLatLng([latLng.lat, latLng.lng]);
      }
      
      const currentMapCenter = regMapInstanceRef.current.getCenter();
      if (Math.abs(currentMapCenter.lat - latLng.lat) > 0.001 || Math.abs(currentMapCenter.lng - latLng.lng) > 0.001) {
        regMapInstanceRef.current.setView([latLng.lat, latLng.lng], 13);
      }
    }
  }, [coords]);

  // Unified Address Geocoding and Autocomplete Integration (Google Maps + Nominatim + Offline Fallback)
  const googleMapsKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{
    address: string;
    neighborhood: string;
    lat: number;
    lng: number;
    placeId?: string;
    source: 'google' | 'nominatim' | 'local';
  }>>([]);

  React.useEffect(() => {
    if (!googleMapsKey) return;
    if ((window as any).google && (window as any).google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }
    const existingScript = document.getElementById('google-maps-api-script');
    if (existingScript) {
      const handleLoad = () => setGoogleMapsLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    const script = document.createElement('script');
    script.id = 'google-maps-api-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    document.head.appendChild(script);
  }, [googleMapsKey]);

  React.useEffect(() => {
    if (!address || address.length < 3 || isVerifiedLocation) {
      setAutocompleteSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsGeocoding(true);

      const query = address.toLowerCase().trim();

      // 1. Try Google Maps Autocomplete if available
      if (googleMapsLoaded && (window as any).google && (window as any).google.maps) {
        try {
          const autocompleteService = new (window as any).google.maps.places.AutocompleteService();
          autocompleteService.getPlacePredictions({
            input: address,
            componentRestrictions: { country: 'no' }
          }, (predictions: any, status: any) => {
            if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formatted = predictions.map((p: any) => ({
                address: p.description,
                neighborhood: 'Google Places',
                lat: 0,
                lng: 0,
                placeId: p.place_id,
                source: 'google' as const
              }));
              setAutocompleteSuggestions(formatted);
              setIsGeocoding(false);
            } else {
              fetchNominatimSuggestions();
            }
          });
          return;
        } catch (err) {
          console.error("Google Autocomplete prediction failed, falling back to Nominatim:", err);
        }
      }

      // 2. Try Live OpenStreetMap / Nominatim API
      async function fetchNominatimSuggestions() {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=no&limit=5&addressdetails=1`;
          const response = await fetch(url, {
            headers: { 'Accept-Language': 'no,nb,nn,en' }
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const formatted = data.map((item: any) => {
                const addr = item.address || {};
                const city = addr.city || addr.town || addr.municipality || addr.village || "";
                const county = addr.county || "";
                const suburb = addr.suburb || addr.neighbourhood || "";
                const dist = suburb && city ? `${suburb}, ${city}` : (city || county || "Norge");
                return {
                  address: item.display_name,
                  neighborhood: dist,
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon),
                  source: 'nominatim' as const
                };
              });
              setAutocompleteSuggestions(formatted);
              setIsGeocoding(false);
              return;
            }
          }
        } catch (err) {
          console.error("Nominatim geocoding failed, falling back to local fallback:", err);
        }

        // 3. High-fidelity Offline Autocomplete Fallback
        const localResults = searchNorwayAddresses(query);
        const localFormatted = localResults.map(p => ({
          address: p.address,
          neighborhood: `${p.municipality}, ${p.county}`,
          lat: p.lat,
          lng: p.lng,
          source: 'local' as const
        }));
        setAutocompleteSuggestions(localFormatted);
        setIsGeocoding(false);
      }

      fetchNominatimSuggestions();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [address, googleMapsLoaded, isVerifiedLocation]);

  const handleSelectSuggestion = (suggestion: {
    address: string;
    neighborhood: string;
    lat: number;
    lng: number;
    placeId?: string;
    source: 'google' | 'nominatim' | 'local';
  }) => {
    if (suggestion.source === 'google' && suggestion.placeId) {
      setIsGeocoding(true);
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ placeId: suggestion.placeId }, (results: any, status: any) => {
        setIsGeocoding(false);
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const formattedAddress = result.formatted_address;
          const lat = result.geometry.location.lat();
          const lng = result.geometry.location.lng();
          
          let locality = '';
          let sublocality = '';
          result.address_components.forEach((c: any) => {
            if (c.types.includes('locality')) locality = c.long_name;
            if (c.types.includes('sublocality') || c.types.includes('neighborhood')) sublocality = c.long_name;
          });

          const dist = sublocality ? `${sublocality}, ${locality}` : locality;
          const grid = getGridCoordsForLatLng(lat, lng);

          setAddress(formattedAddress);
          setNeighborhood(dist || 'Norway');
          setCoords({ x: grid.x, y: grid.y });
          setIsVerifiedLocation(true);
          setShowSuggestions(false);

          // Update Leaflet map view and marker if initialized
          if (regMapInstanceRef.current) {
            regMapInstanceRef.current.setView([lat, lng], 16, { animate: true });
          }
          if (regMarkerRef.current) {
            regMarkerRef.current.setLatLng([lat, lng]);
          }
        }
      });
    } else {
      const { lat, lng } = suggestion;
      const grid = getGridCoordsForLatLng(lat, lng);

      setAddress(suggestion.address);
      setNeighborhood(suggestion.neighborhood);
      setCoords({ x: grid.x, y: grid.y });
      setIsVerifiedLocation(true);
      setShowSuggestions(false);

      // Update Leaflet map view and marker if initialized
      if (regMapInstanceRef.current) {
        regMapInstanceRef.current.setView([lat, lng], 16, { animate: true });
      }
      if (regMarkerRef.current) {
        regMarkerRef.current.setLatLng([lat, lng]);
      }
    }
  };

  // Custom added Services List state
  const [services, setServices] = useState<Service[]>([
    {
      id: 'srv_1',
      name: 'Precision Styling & Care',
      duration: 45,
      price: 60,
      description: 'Our signature foundational styling treatment customized to your unique aesthetic goals.',
      category: 'Hair'
    }
  ]);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvDuration, setNewSrvDuration] = useState(45);
  const [newSrvPrice, setNewSrvPrice] = useState(50);
  const [newSrvDesc, setNewSrvDesc] = useState('');

  // Custom added Stylists List state
  const [stylists, setStylists] = useState<Stylist[]>([
    {
      id: 'sty_1',
      name: 'Alexander Grey',
      role: 'Creative Senior Director',
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    }
  ]);
  const [newStyName, setNewStyName] = useState('');
  const [newStyRole, setNewStyRole] = useState('Senior Specialist');
  const [newStyImage, setNewStyImage] = useState('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80');

  // Success screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [newlyRegisteredId, setNewlyRegisteredId] = useState('');

  // Filter salons to only show this business owner's locations
  const salons = allSalons.filter(s => 
    s.ownerEmail === user?.email || 
    (user?.salonIds || []).includes(s.id) ||
    (user?.email?.toLowerCase() === 'edrinshtjefni@gmail.com' && (s.id === '1' || s.id === '3'))
  );

  // Bookings filtered for user's salons
  const businessBookings = React.useMemo(() => {
    return (bookings || []).filter(b => salons.some(s => s.id === b.salonId));
  }, [bookings, salons]);

  // Compile unique existing customers from bookings & high-quality mock seeds
  const existingCustomers = React.useMemo(() => {
    const customerMap = new Map<string, { name: string; email: string; phone: string }>();
    
    (bookings || []).forEach(b => {
      const email = b.userEmail || '';
      const name = b.clientName || (email && email.includes('@') ? email.split('@')[0] : '');
      const phone = b.clientPhone || '';
      
      if (name && name !== 'Walk-in Guest') {
        const key = `${name.toLowerCase()}_${email.toLowerCase()}_${phone}`;
        if (!customerMap.has(key)) {
          customerMap.set(key, { name, email, phone });
        }
      }
    });

    const mockCustomers = [
      { name: 'John Doe', email: 'john@example.com', phone: '+1 (555) 123-4567' },
      { name: 'Sarah Connor', email: 'sarah.connor@gmail.com', phone: '+1 (555) 987-6543' },
      { name: 'David Smith', email: 'david.smith@gmail.com', phone: '+1 (555) 234-5678' },
      { name: 'Emma Watson', email: 'emma.watson@icloud.com', phone: '+1 (555) 345-6789' },
      { name: 'Michael Jordan', email: 'mj23@bulls.com', phone: '+1 (555) 456-7890' },
      { name: 'Alice Cooper', email: 'alice.c@gmail.com', phone: '+1 (555) 789-0123' },
      { name: 'Bob Dylan', email: 'bob.dylan@yahoo.com', phone: '+1 (555) 890-1234' },
    ];

    mockCustomers.forEach(c => {
      const key = `${c.name.toLowerCase()}_${c.email.toLowerCase()}_${c.phone}`;
      if (!customerMap.has(key)) {
        customerMap.set(key, c);
      }
    });

    return Array.from(customerMap.values());
  }, [bookings]);

  // Dynamic filtered customers based on query
  const filteredExistingCustomers = React.useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    const query = customerSearchQuery.toLowerCase();
    return existingCustomers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
  }, [existingCustomers, customerSearchQuery]);

  // All unique services across user's salons
  const allSalonsServices = React.useMemo(() => {
    const srvs: Service[] = [];
    salons.forEach(s => {
      (s.services || []).forEach(srv => {
        if (!srvs.some(item => item.id === srv.id)) {
          srvs.push(srv);
        }
      });
    });
    return srvs;
  }, [salons]);

  // All unique stylists across user's salons
  const allSalonsStylists = React.useMemo(() => {
    const styls: Stylist[] = [];
    salons.forEach(s => {
      (s.stylists || []).forEach(sty => {
        if (!styls.some(item => item.id === sty.id)) {
          styls.push(sty);
        }
      });
    });
    return styls;
  }, [salons]);

  // Stylists filtered by chosen branch for the calendar view columns
  const stylistsToDisplay = React.useMemo(() => {
    if (selectedCalendarSalonId) {
      const salon = salons.find(s => s.id === selectedCalendarSalonId);
      return salon ? (salon.stylists || []) : [];
    }
    return allSalonsStylists;
  }, [selectedCalendarSalonId, salons, allSalonsStylists]);

  // Stylists visible in the grid (handles branch filter + active stylist filter)
  const visibleStylistsForGrid = React.useMemo(() => {
    if (selectedStylistFilter) {
      return stylistsToDisplay.filter(sty => sty.id === selectedStylistFilter);
    }
    return stylistsToDisplay;
  }, [selectedStylistFilter, stylistsToDisplay]);

  // Generate 14-day calendar days centered around selectedDate
  const calendarDays = React.useMemo(() => {
    const days = [];
    // Start 3 days before selectedDate so the selected date is in a nice viewable middle position of the ribbon
    const base = new Date(selectedDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      days.push({
        dateObj: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        monthName: d.toLocaleDateString('en-US', { month: 'long' }),
        dayNum: d.getDate(),
        matchStr: `${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getDate()}`,
        matchStrAlt: `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`,
      });
    }
    return days;
  }, [selectedDate]);

  const selectedDay = React.useMemo(() => {
    const d = selectedDate;
    return {
      dateObj: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      monthName: d.toLocaleDateString('en-US', { month: 'long' }),
      dayNum: d.getDate(),
      matchStr: `${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getDate()}`,
      matchStrAlt: `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`,
    };
  }, [selectedDate]);

  // Bookings for the selected day, optionally filtered by selected salon/outlet, stylist, and status
  const filteredBookings = React.useMemo(() => {
    return businessBookings.filter(b => {
      // Filter by salon if chosen
      if (selectedCalendarSalonId && b.salonId !== selectedCalendarSalonId) return false;
      
      // Filter by stylist if chosen
      if (selectedStylistFilter && b.stylist?.id !== selectedStylistFilter) return false;

      // Filter by status if chosen and not 'all'
      if (selectedStatusFilter !== 'all' && b.status !== selectedStatusFilter) return false;

      // Match the date string (e.g. b.dateTime contains "June 24" or "Jun 24")
      const dt = b.dateTime || '';
      return dt.toLowerCase().includes(selectedDay.matchStr.toLowerCase()) || 
             dt.toLowerCase().includes(selectedDay.matchStrAlt.toLowerCase());
    });
  }, [businessBookings, selectedCalendarSalonId, selectedStylistFilter, selectedStatusFilter, selectedDay]);

  // Compute daily statistics for selected day
  const dailyStats = React.useMemo(() => {
    const active = filteredBookings.filter(b => b.status !== 'cancelled' && !b.service?.name.startsWith('🔒 Blocked'));
    const revenue = active.reduce((sum, b) => sum + (b.price || b.service?.price || 0), 0);
    return {
      count: active.length,
      revenue,
      cancelled: filteredBookings.filter(b => b.status === 'cancelled').length
    };
  }, [filteredBookings]);

  // Autofill defaults when modals open
  React.useEffect(() => {
    if (isAddingBooking && salons.length > 0) {
      const currentSalonId = newBookingSalonId || selectedCalendarSalonId || salons[0].id;
      setNewBookingSalonId(currentSalonId);
      
      const activeSalon = salons.find(s => s.id === currentSalonId);
      if (activeSalon) {
        if (!newBookingServiceId && activeSalon.services && activeSalon.services.length > 0) {
          setNewBookingServiceId(activeSalon.services[0].id);
        }
        if (!newBookingStylistId && activeSalon.stylists && activeSalon.stylists.length > 0) {
          setNewBookingStylistId(activeSalon.stylists[0].id);
        }
      }
    }
  }, [isAddingBooking, salons, selectedCalendarSalonId]);

  React.useEffect(() => {
    if (isAddingBlockTime && salons.length > 0) {
      const currentSalonId = newBlockSalonId || selectedCalendarSalonId || salons[0].id;
      setNewBlockSalonId(currentSalonId);
      
      const activeSalon = salons.find(s => s.id === currentSalonId);
      if (activeSalon) {
        if (!newBlockStylistId && activeSalon.stylists && activeSalon.stylists.length > 0) {
          setNewBlockStylistId(activeSalon.stylists[0].id);
        }
      }
    }
  }, [isAddingBlockTime, salons, selectedCalendarSalonId]);

  React.useEffect(() => {
    if (isAddingEmployee && salons.length > 0) {
      const currentSalonId = selectedCalendarSalonId || salons[0].id;
      setNewEmployeeSalonId(currentSalonId);
    }
  }, [isAddingEmployee, salons, selectedCalendarSalonId]);

  // Handle dynamic dropdown triggers in manual booking modal
  React.useEffect(() => {
    if (newBookingSalonId) {
      const selectedSalon = salons.find(s => s.id === newBookingSalonId);
      if (selectedSalon) {
        const isCurrentServiceValid = (selectedSalon.services || []).some(srv => srv.id === newBookingServiceId);
        if (!isCurrentServiceValid) {
          if (selectedSalon.services && selectedSalon.services.length > 0) {
            setNewBookingServiceId(selectedSalon.services[0].id);
          } else {
            setNewBookingServiceId('');
          }
        }
        const isCurrentStylistValid = (selectedSalon.stylists || []).some(sty => sty.id === newBookingStylistId);
        if (!isCurrentStylistValid) {
          if (selectedSalon.stylists && selectedSalon.stylists.length > 0) {
            setNewBookingStylistId(selectedSalon.stylists[0].id);
          } else {
            setNewBookingStylistId('');
          }
        }
      }
    }
  }, [newBookingSalonId, salons]);

  // Handle dynamic dropdown triggers in block time modal
  React.useEffect(() => {
    if (newBlockSalonId) {
      const selectedSalon = salons.find(s => s.id === newBlockSalonId);
      if (selectedSalon) {
        const isCurrentStylistValid = (selectedSalon.stylists || []).some(sty => sty.id === newBlockStylistId);
        if (!isCurrentStylistValid) {
          if (selectedSalon.stylists && selectedSalon.stylists.length > 0) {
            setNewBlockStylistId(selectedSalon.stylists[0].id);
          } else {
            setNewBlockStylistId('');
          }
        }
      }
    }
  }, [newBlockSalonId, salons]);

  if (!user || user.role !== 'business') {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 px-4 md:px-8 text-center mt-6">
        <div className="bg-white border border-brand-border/65 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.02]">
            <Building className="w-64 h-64 text-brand-primary" />
          </div>
          
          <div className="w-16 h-16 bg-brand-secondary text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-border">
            <Building className="w-8 h-8" />
          </div>
 
          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest bg-brand-secondary border border-brand-border px-3.5 py-1.5 rounded-full">
            Partner Hub
          </span>
 
          <h2 className="font-serif font-extrabold text-3xl text-brand-text mt-6 leading-tight">
            Grow Your Business with StraksTime.no
          </h2>
          <p className="text-xs text-brand-muted font-medium max-w-xl mx-auto mt-3 leading-relaxed">
            Connect with local clients searching for instant haircuts, beard trims, treatments, and wellness services. List your shop, showcase your custom pricing menu, and pin your physical location to our real-time interactive map.
          </p>
 
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-10 text-left">
            <div className="p-5 bg-brand-bg border border-brand-border/60 rounded-2xl">
              <Compass className="w-5 h-5 text-brand-primary mb-3" />
              <h4 className="text-[10px] font-black text-brand-text uppercase tracking-wider">Live Map Pin</h4>
              <p className="text-[11px] text-brand-muted font-semibold mt-1 leading-relaxed">
                We synchronize your address and pin location directly onto our live Leaflet interactive maps so clients can find you instantly.
              </p>
            </div>
            <div className="p-5 bg-brand-bg border border-brand-border/60 rounded-2xl">
              <Clock className="w-5 h-5 text-brand-primary mb-3" />
              <h4 className="text-[10px] font-black text-brand-text uppercase tracking-wider">Availability Status</h4>
              <p className="text-[11px] text-brand-muted font-semibold mt-1 leading-relaxed">
                Showcase accurate opening hours. Clients can see your real-time "Open Now" or "Closes at..." badge in searches.
              </p>
            </div>
            <div className="p-5 bg-brand-bg border border-brand-border/60 rounded-2xl">
              <Scissors className="w-5 h-5 text-brand-primary mb-3" />
              <h4 className="text-[10px] font-black text-brand-text uppercase tracking-wider">Custom Services</h4>
              <p className="text-[11px] text-brand-muted font-semibold mt-1 leading-relaxed">
                Add and customize every service, duration, and price—from classic haircuts and beard trims to luxurious shaves.
              </p>
            </div>
          </div>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-10">
            <button
              id="btn-partner-login-trigger"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs rounded-full shadow-md transition-all uppercase tracking-wider cursor-pointer"
            >
              Sign In or Register as Partner
            </button>
            <button
              id="btn-partner-go-back-home"
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-8 py-3.5 border border-brand-border hover:bg-brand-secondary text-brand-text font-bold text-xs rounded-full transition-all uppercase tracking-wider cursor-pointer"
            >
              Go Back to Main Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trigger when Salon Type category is selected to suggest high-quality pre-populated treatments!
  const handleCategoryChange = (selectedType: Salon['type']) => {
    setType(selectedType);
    
    // Auto populate default premium treatments to save business owners time!
    const defaults = CATEGORY_DEFAULT_SERVICES[selectedType] || [];
    const populated: Service[] = defaults.map((srv, idx) => ({
      id: `srv_default_${idx}`,
      ...srv,
    }));
    setServices(populated);
  };

  // Add Treatment to List
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) return;

    const newService: Service = {
      id: `srv_custom_${Date.now()}`,
      name: newSrvName.trim(),
      duration: Number(newSrvDuration),
      price: Number(newSrvPrice),
      description: newSrvDesc.trim() || 'Premium service tailored to client parameters.',
      category: type.replace(' Salon', '').replace(' & Body', '')
    };

    setServices((prev) => [...prev, newService]);
    setNewSrvName('');
    setNewSrvDesc('');
  };

  // Remove Service
  const handleRemoveService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Add Stylist
  const handleAddStylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyName.trim()) return;

    const newStylist: Stylist = {
      id: `sty_custom_${Date.now()}`,
      name: newStyName.trim(),
      role: newStyRole.trim(),
      rating: 5.0,
      image: newStyImage
    };

    setStylists((prev) => [...prev, newStylist]);
    setNewStyName('');
  };

  // Remove Stylist
  const handleRemoveStylist = (id: string) => {
    setStylists((prev) => prev.filter((st) => st.id !== id));
  };

  // Final Form Submit Handler
  const handleRegisterSubmit = () => {
    if (!name.trim()) return;
    if (!address.trim()) return;

    if (editingSalon) {
      if (onUpdateSalon) {
        const updatedSalon: Salon = {
          ...editingSalon,
          name: name.trim(),
          type,
          description: description.trim() || `Welcome to ${name.trim()}! We provide world-class ${type.toLowerCase()} therapies and beauty care curated by registered professionals.`,
          image: imageUrl,
      images: imageUrls,
          address: address.trim(),
          hours,
          services,
          stylists,
          coords: {
            x: coords.x,
            y: coords.y,
            neighborhood
          }
        };
        onUpdateSalon(updatedSalon);
      }
      setEditingSalon(null);
      handleResetForm();
      setActiveTab('calendar');
      return;
    }

    const newSalon: Salon = {
      id: `salon_custom_${Date.now()}`,
      name: name.trim(),
      type,
      description: description.trim() || `Welcome to ${name.trim()}! We provide world-class ${type.toLowerCase()} therapies and beauty care curated by registered professionals.`,
      rating: 5.0,
      reviewCount: 1,
      image: imageUrl,
      address: address.trim(),
      hours,
      services,
      stylists,
      coords: {
        x: coords.x,
        y: coords.y,
        neighborhood
      },
      ownerEmail: user?.email || ''
    };

    onRegisterSalon(newSalon);
    setNewlyRegisteredId(newSalon.id);
    setShowSuccess(true);
  };

  const handleStartEdit = (salon: Salon) => {
    setEditingSalon(salon);
    setName(salon.name);
    setType(salon.type);
    setDescription(salon.description);
    setHours(salon.hours);
    setAddress(salon.address);
    setNeighborhood(salon.coords?.neighborhood || 'Oslo');
    setImageUrl(salon.image);
    setCoords(salon.coords || { x: 50, y: 50 });
    setServices(salon.services);
    setStylists(salon.stylists);
    // Find preset image index if matches
    const presetIdx = VENUE_IMAGE_PRESETS.findIndex(p => p.url === salon.image);
    setSelectedPresetIndex(presetIdx >= 0 ? presetIdx : 0);
    
    // Set step to 1 and change tab/view
    setCurrentStep(1);
    setActiveTab('register');
    setShowSuccess(false);
  };

  // Reset form states to register another salon
  const handleResetForm = () => {
    setEditingSalon(null);
    setName('');
    setType('Hair Salon');
    setDescription('');
    setHours('Mon - Sat: 9:00 AM - 7:00 PM');
    setAddress('');
    setNeighborhood('Oslo');
    setImageUrl(VENUE_IMAGE_PRESETS[0].url);
    setImageUrls([]);
    setSelectedPresetIndex(0);
    setCoords({ x: 50, y: 50 });
    setServices([
      {
        id: 'srv_1',
        name: 'Precision Styling & Care',
        duration: 45,
        price: 60,
        description: 'Our signature foundational styling treatment customized to your unique aesthetic goals.',
        category: 'Hair'
      }
    ]);
    setStylists([
      {
        id: 'sty_1',
        name: 'Alexander Grey',
        role: 'Creative Senior Director',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
      }
    ]);
    setCurrentStep(1);
    setShowSuccess(false);
    setActiveTab('dashboard');
  };

  return (
    <div className="w-full max-w-[1536px] min-h-[calc(100vh-80px)] flex flex-col md:flex-row mx-auto py-10 px-4 md:px-8 gap-8 items-start">
      {/* Sidebar Navigation */}
      {editingSalon && (
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button
            id="btn-cancel-edit-sidebar"
            onClick={() => {
              if (window.confirm("Avbryt redigering? Endringer blir ikke lagret.")) {
                handleResetForm();
              }
            }}
            className="w-full mt-4 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <X className="w-4 h-4" />
            <span>Cancel Edit</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* TAB A: THE PARTNER DASHBOARD (VIEW EXISTING REGISTERED LOCATIONS) */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="tab-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-4"
          >
            {/* Existing Locations Directory List */}
            <div className="space-y-4">
              {salons.length === 0 ? (
                <div className="text-center py-20 bg-white border border-brand-border rounded-3xl">
                  <Building className="w-12 h-12 text-brand-muted mx-auto mb-3 opacity-60" />
                  <h4 className="font-serif font-bold text-base text-brand-text">No registered locations found</h4>
                  <p className="text-xs text-brand-muted mt-1 mb-6">Create your brand's outlet profile to begin receiving appointments!</p>
                  <button
                    id="btn-register-first"
                    onClick={() => setActiveTab('register')}
                    className="px-5 py-2.5 bg-brand-primary text-white text-xs font-black rounded-xl hover:bg-brand-dark transition-all"
                  >
                    Register Your First Outlet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {salons.map((salon) => (
                    <div
                      id={`partner-dashboard-salon-${salon.id}`}
                      key={salon.id}
                      className="bg-white border border-brand-border rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative h-32 w-full">
                        <img
                          src={salon.image}
                          alt={salon.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-brand-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {salon.type}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-serif font-bold text-sm text-brand-text leading-tight truncate">
                              {salon.name}
                            </h4>
                            <div className="flex items-center gap-0.5 shrink-0 bg-brand-secondary border border-brand-border px-1.5 py-0.5 rounded text-[9px] font-black">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>{(salon.rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-brand-muted font-bold mt-1.5 truncate">
                            <MapPin className="w-2.5 h-2.5 inline mr-0.5 text-brand-primary" />
                            {salon.address}
                          </p>
                          <p className="text-[10px] text-brand-muted mt-1 font-semibold leading-relaxed line-clamp-2">
                            {salon.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-brand-secondary flex items-center justify-between gap-1">
                          <div className="flex gap-3 text-[10px] font-bold text-brand-muted">
                            <div>
                              <span className="block text-xs font-black text-brand-text">
                                {salon.services.length}
                              </span>
                              Treatments
                            </div>
                            <div>
                              <span className="block text-xs font-black text-brand-text">
                                {salon.stylists.length}
                              </span>
                              Stylists
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              id={`btn-edit-salon-${salon.id}`}
                              onClick={() => handleStartEdit(salon)}
                              className="px-2.5 py-1.5 border border-brand-border hover:border-brand-muted hover:bg-brand-secondary/80 text-[10px] font-bold text-brand-text rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-brand-primary" />
                              <span>Edit</span>
                            </button>
                            {onDeleteSalon && (
                              <button
                                id={`btn-delete-salon-${salon.id}`}
                                onClick={() => onDeleteSalon(salon.id)}
                                className="px-2.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-[10px] font-bold text-red-600 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB B: REGISTER NEW LOCATION WIZARD */}
        {activeTab === 'register' && !showSuccess && (
          <motion.div
            key="tab-register-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 w-full shadow-sm"
          >
            {/* Step navigation flow progress */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-secondary">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-brand-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {currentStep}
                </span>
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-wider leading-none">Step {currentStep} of 3</p>
                  <h3 className="font-serif font-black text-sm text-brand-text mt-1">
                    {currentStep === 1 && 'General Info & Map Location'}
                    {currentStep === 2 && 'Treatments & Pricing Menu'}
                    {currentStep === 3 && 'Staff Specialists Directory'}
                  </h3>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="hidden sm:flex gap-1">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentStep === step ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-secondary'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: GENERAL INFO & MAP LOCATION */}
            {currentStep === 1 && (
              <div className="space-y-6 text-left">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Form Fields */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">Salon or Venue Name</label>
                        <input
                          id="input-register-name"
                          type="text"
                          placeholder="E.g., Velvet Cut Hair Lounge"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border border-brand-border p-3 rounded-xl text-xs font-bold text-brand-text outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">Business Specialty Category</label>
                        <select
                          id="select-register-type"
                          value={type}
                          onChange={(e) => handleCategoryChange(e.target.value as Salon['type'])}
                          className="w-full border border-brand-border p-3 rounded-xl text-xs font-bold text-brand-text bg-white outline-none focus:border-brand-primary"
                        >
                          <option value="Hair Salon">Hair Salon</option>
                          <option value="Nail Salon">Nail Salon</option>
                          <option value="Massage & Body">Massage & Body</option>
                          <option value="Spa">Spa</option>
                          <option value="Eyebrows & Lashes">Eyebrows & Lashes</option>
                          <option value="Barbershop">Barbershop</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">Operating Hours description</label>
                        <input
                          id="input-register-hours"
                          type="text"
                          placeholder="E.g., Mon - Sat: 9:00 AM - 7:00 PM"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          className="w-full border border-brand-border p-3 rounded-xl text-xs font-bold text-brand-text outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">Business Bio & Description</label>
                      <textarea
                        id="input-register-description"
                        rows={3}
                        placeholder="Provide details about your ambiance, high-end organic supplies, or specialties..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-brand-border p-3 rounded-xl text-xs font-bold text-brand-text outline-none focus:border-brand-primary resize-none"
                      />
                    </div>

                    {/* Highly Curated Presets Selection */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">Venue Design Style Photo Profile</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {VENUE_IMAGE_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedPresetIndex(idx);
                              setImageUrl(preset.url);
                            }}
                            className={`border rounded-xl p-1 overflow-hidden relative cursor-pointer group transition-all text-left ${
                              selectedPresetIndex === idx ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-brand-border hover:border-brand-muted'
                            }`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" />
                            <span className="block text-[8px] font-bold text-brand-text truncate mt-1">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center pt-1.5">
                        <span className="text-[10px] text-brand-muted font-bold">Custom URL:</span>
                        <input
                          id="input-register-image"
                          type="text"
                          placeholder="Or paste an https:// image URL..."
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value);
                            setSelectedPresetIndex(-1);
                          }}
                          className="flex-1 border border-brand-border px-3 py-1.5 rounded-lg text-[10px] font-bold text-brand-text outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">Additional Gallery Images</label>
                        <div className="flex gap-2 items-center">
                          <input
                            id="input-gallery-image"
                            type="text"
                            placeholder="Add another image URL..."
                            className="flex-1 border border-brand-border px-3 py-1.5 rounded-lg text-[10px] font-bold text-brand-text outline-none focus:border-brand-primary"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  setImageUrls(prev => [...prev, val]);
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('input-gallery-image') as HTMLInputElement;
                              const val = input.value.trim();
                              if (val) {
                                setImageUrls(prev => [...prev, val]);
                                input.value = '';
                              }
                            }}
                            className="bg-brand-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-bold"
                          >
                            Add
                          </button>
                        </div>
                        {imageUrls.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {imageUrls.map((url, i) => (
                              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                                <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Real-time map & location pinning */}
                  <div className="space-y-4">
                    <div className="bg-brand-secondary p-4 border border-brand-border rounded-2xl flex items-start gap-3">
                      <Compass className="w-5 h-5 text-brand-primary shrink-0 mt-0.5 animate-spin-slow" />
                      <div>
                        <h4 className="text-xs font-bold text-brand-text">Pin & Verify Your Location</h4>
                        <p className="text-[11px] text-brand-muted font-semibold mt-0.5 leading-relaxed">
                          Search for your Norway address directly on the map below. Select a match to auto-center the map, and drag the marker to fine-tune.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider flex items-center justify-between">
                        <span>Interactive Norway Map (Click or Drag Pin)</span>
                        <span className="text-[9px] text-brand-primary lowercase font-medium">real-time GPS synchronization</span>
                      </label>
                      <div className="h-[360px] w-full bg-[#EBE7E2]/50 border border-brand-border rounded-2xl relative shadow-inner overflow-hidden select-none">
                        <div
                          id="registration-map"
                          ref={setMapElement}
                          className="w-full h-full cursor-crosshair z-0"
                        />

                        {/* Floating Map Address Search Box */}
                        <div className="absolute top-3 left-3 right-3 z-[1000] max-w-sm sm:max-w-none">
                          <div className="relative shadow-lg rounded-xl">
                            <input
                              id="input-register-map-search"
                              type="text"
                              placeholder="Search address or street in Norway..."
                              value={address}
                              onChange={(e) => {
                                setAddress(e.target.value);
                                setShowSuggestions(true);
                                setIsVerifiedLocation(false);
                              }}
                              onFocus={() => setShowSuggestions(true)}
                              className="w-full border border-brand-border/80 p-2.5 rounded-xl text-xs font-bold text-brand-text bg-white/95 backdrop-blur-sm outline-none focus:border-brand-primary pl-8 shadow-sm"
                            />
                            <MapPin className="w-3.5 h-3.5 text-brand-primary absolute left-3 top-3.5" />
                            {address && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddress('');
                                  setShowSuggestions(false);
                                  setIsVerifiedLocation(false);
                                }}
                                className="absolute right-3 top-3.5 text-brand-muted hover:text-brand-text cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Autocomplete suggestions dropdown overlay */}
                          {showSuggestions && address.trim().length >= 2 && (() => {
                            if (autocompleteSuggestions.length === 0) return null;

                            return (
                              <div className="absolute left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-xl z-[1010] overflow-hidden max-h-48 overflow-y-auto">
                                <div className="bg-brand-secondary/95 px-3 py-1.5 border-b border-brand-border flex items-center justify-between text-[9px] font-extrabold text-brand-primary uppercase tracking-wider">
                                  <span>Adresse-forslag {isGeocoding && <span className="text-brand-primary animate-pulse ml-1">(Søker...)</span>}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setShowSuggestions(false)}
                                    className="text-brand-muted hover:text-brand-text font-bold cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                {autocompleteSuggestions.map((suggestion, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className="w-full text-left px-3 py-2 hover:bg-brand-secondary/50 border-b border-brand-border last:border-0 flex items-start gap-2 transition-colors cursor-pointer"
                                  >
                                    <div className="p-0.5 bg-emerald-50 text-emerald-600 rounded-md shrink-0 mt-0.5">
                                      <MapPin className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-bold text-brand-text leading-tight truncate">{suggestion.address}</p>
                                      <p className="text-[8px] text-brand-muted font-bold mt-0.5 uppercase tracking-wide">
                                        {suggestion.source === 'google' ? '⭐ Google Verified • Klikk for å feste' : `Distrikt: ${suggestion.neighborhood}`}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Verified Location Banner */}
                        {isVerifiedLocation && (
                          <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-emerald-500/95 text-white text-[10px] font-extrabold flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-md animate-fade-in backdrop-blur-sm">
                            <Check className="w-3.5 h-3.5 text-white animate-bounce shrink-0" />
                            <span className="truncate">GPS location verified & pinned: {address}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-brand-muted font-bold pt-1">
                        <span>Assigned District: <strong className="text-brand-text uppercase">{neighborhood}</strong></span>
                        <span>Coordinates: <strong className="text-brand-primary">{coords.x.toFixed(2)}%, {coords.y.toFixed(2)}%</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TREATMENTS & PRICING MENU */}
            {currentStep === 2 && (
              <div className="space-y-6 text-left">
                {/* Auto Populate Badge */}
                <div className="bg-brand-secondary p-3 border border-brand-border rounded-xl flex items-center justify-between text-[11px] font-semibold text-brand-muted">
                  <span className="flex items-center gap-1 text-brand-text font-black">
                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    Auto-Population active
                  </span>
                  <span>Populated with default {type} treatments. Feel free to edit!</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Service Addition Form */}
                  <div className="bg-brand-bg border border-brand-border p-5 rounded-2xl space-y-4 h-fit">
                    <h4 className="font-serif font-black text-xs text-brand-text border-b border-brand-border pb-2 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-brand-primary" />
                      Add a Custom Treatment
                    </h4>

                    <form onSubmit={handleAddService} className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-text uppercase tracking-wider block">Treatment Name</label>
                        <input
                          id="input-treatment-name"
                          type="text"
                          placeholder="E.g., Scalp Therapy Refresh"
                          value={newSrvName}
                          onChange={(e) => setNewSrvName(e.target.value)}
                          className="w-full border border-brand-border px-3 py-2 rounded-lg text-xs font-bold text-brand-text bg-white outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-brand-text uppercase tracking-wider block">Duration (min)</label>
                          <input
                            id="input-treatment-duration"
                            type="number"
                            value={newSrvDuration}
                            onChange={(e) => setNewSrvDuration(Number(e.target.value))}
                            className="w-full border border-brand-border px-3 py-2 rounded-lg text-xs font-bold text-brand-text bg-white outline-none focus:border-brand-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-brand-text uppercase tracking-wider block">Price ($)</label>
                          <input
                            id="input-treatment-price"
                            type="number"
                            value={newSrvPrice}
                            onChange={(e) => setNewSrvPrice(Number(e.target.value))}
                            className="w-full border border-brand-border px-3 py-2 rounded-lg text-xs font-bold text-brand-text bg-white outline-none focus:border-brand-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-text uppercase tracking-wider block">Treatment Description</label>
                        <textarea
                          id="input-treatment-description"
                          rows={2}
                          placeholder="Detail benefits, oils or methods..."
                          value={newSrvDesc}
                          onChange={(e) => setNewSrvDesc(e.target.value)}
                          className="w-full border border-brand-border px-3 py-2 rounded-lg text-xs font-bold text-brand-text bg-white outline-none focus:border-brand-primary resize-none"
                        />
                      </div>

                      <button
                        id="btn-add-treatment"
                        type="submit"
                        className="w-full py-2.5 bg-brand-primary text-white text-xs font-black rounded-lg hover:bg-brand-dark transition-colors tracking-wider uppercase"
                      >
                        Add to Menu
                      </button>
                    </form>
                  </div>

                  {/* Rendered Menu List */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block px-1">Your Menu ({services.length} items)</label>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {services.length === 0 ? (
                        <div className="text-center py-10 bg-brand-secondary border border-dashed border-brand-border rounded-xl">
                          <ClipboardList className="w-6 h-6 text-brand-muted mx-auto mb-1 opacity-50" />
                          <p className="text-[10px] text-brand-muted font-bold">No treatments defined. Add at least one.</p>
                        </div>
                      ) : (
                        services.map((srv) => (
                          <div
                            key={srv.id}
                            className="p-3 bg-brand-secondary border border-brand-border rounded-xl flex items-start justify-between gap-3 text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-1">
                                <h5 className="text-xs font-black text-brand-text truncate">{srv.name}</h5>
                                <span className="text-xs font-black text-brand-primary shrink-0">${srv.price}</span>
                              </div>
                              <p className="text-[10px] text-brand-muted font-bold mt-0.5">
                                {srv.duration} mins • {srv.category}
                              </p>
                              <p className="text-[10px] text-brand-muted leading-relaxed line-clamp-1 font-semibold mt-0.5">
                                {srv.description}
                              </p>
                            </div>

                            <button
                              id={`btn-remove-srv-${srv.id}`}
                              type="button"
                              onClick={() => handleRemoveService(srv.id)}
                              className="p-1 text-brand-muted hover:text-red-500 rounded-lg hover:bg-white transition-all cursor-pointer"
                              title="Delete service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: STAFF SPECIALISTS DIRECTORY */}
            {currentStep === 3 && (
              <div className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Stylist Addition form */}
                  <div className="bg-brand-bg border border-brand-border p-5 rounded-2xl space-y-4 h-fit">
                    <h4 className="font-serif font-black text-xs text-brand-text border-b border-brand-border pb-2 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-brand-primary" />
                      Add a Stylist / Professional
                    </h4>

                    <form onSubmit={handleAddStylist} className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-text uppercase tracking-wider block">Specialist Full Name</label>
                        <input
                          id="input-stylist-name"
                          type="text"
                          placeholder="E.g., Marcus Vance"
                          value={newStyName}
                          onChange={(e) => setNewStyName(e.target.value)}
                          className="w-full border border-brand-border px-3 py-2 rounded-lg text-xs font-bold text-brand-text bg-white outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-brand-text uppercase tracking-wider block">Professional Role / Title</label>
                        <input
                          id="input-stylist-role"
                          type="text"
                          placeholder="E.g., Master Color Stylist"
                          value={newStyRole}
                          onChange={(e) => setNewStyRole(e.target.value)}
                          className="w-full border border-brand-border px-3 py-2 rounded-lg text-xs font-bold text-brand-text bg-white outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Curated Avatars selection */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-brand-text uppercase tracking-wider block">Profile Photo Avatar</label>
                        <div className="flex gap-2.5 items-center">
                          {[
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                          ].map((avatar, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewStyImage(avatar)}
                              className={`w-10 h-10 rounded-full overflow-hidden border cursor-pointer transition-all shrink-0 ${
                                newStyImage === avatar ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-105' : 'border-brand-border'
                              }`}
                            >
                              <img src={avatar} className="w-full h-full object-cover" alt="Stylist avatar preview" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        id="btn-add-stylist"
                        type="submit"
                        className="w-full py-2.5 bg-brand-primary text-white text-xs font-black rounded-lg hover:bg-brand-dark transition-colors tracking-wider uppercase"
                      >
                        Add Professional
                      </button>
                    </form>
                  </div>

                  {/* Stylists List */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block px-1">Registered Professionals ({stylists.length})</label>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {stylists.length === 0 ? (
                        <div className="text-center py-10 bg-brand-secondary border border-dashed border-brand-border rounded-xl">
                          <User className="w-6 h-6 text-brand-muted mx-auto mb-1 opacity-50" />
                          <p className="text-[10px] text-brand-muted font-bold">No stylists registered. Add at least one.</p>
                        </div>
                      ) : (
                        stylists.map((st) => (
                          <div
                            key={st.id}
                            className="p-3 bg-brand-secondary border border-brand-border rounded-xl flex items-center justify-between gap-3 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <img src={st.image} alt={st.name} className="w-10 h-10 rounded-full object-cover border border-brand-border shrink-0" />
                              <div>
                                <h5 className="text-xs font-black text-brand-text">{st.name}</h5>
                                <p className="text-[10px] text-brand-muted font-semibold mt-0.5">{st.role}</p>
                              </div>
                            </div>

                            <button
                              id={`btn-remove-sty-${st.id}`}
                              type="button"
                              onClick={() => handleRemoveStylist(st.id)}
                              className="p-1 text-brand-muted hover:text-red-500 rounded-lg hover:bg-white transition-all cursor-pointer"
                              title="Remove professional"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Buttons Panel */}
            <div className="flex justify-between items-center mt-8 pt-5 border-t border-brand-secondary">
              <button
                id="btn-register-prev"
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 border border-brand-border hover:border-brand-muted text-xs font-bold text-brand-text hover:bg-brand-secondary rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {currentStep < 3 ? (
                <button
                  id="btn-register-next"
                  type="button"
                  disabled={currentStep === 1 && !name.trim()}
                  onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1))}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-register-submit"
                  type="button"
                  disabled={services.length === 0 || stylists.length === 0}
                  onClick={handleRegisterSubmit}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSalon ? 'Save Changes' : 'Register Outlet'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB C: CONGRATULATORY REGISTRATION SUCCESS SCREEN */}
        {showSuccess && (
          <motion.div
            key="tab-register-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-brand-border rounded-3xl p-8 max-w-2xl mx-auto shadow-xl text-center space-y-6"
          >
            <div className="w-16 h-16 bg-[#F3F5F1] text-brand-primary border border-brand-border rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest bg-brand-secondary border border-brand-border px-3 py-1 rounded-full">
                Registration Confirmed
              </span>
              <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-brand-text mt-3">
                {name} is Live!
              </h2>
              <p className="text-xs text-brand-muted max-w-md mx-auto leading-relaxed">
                Your luxury beauty outlet has been cataloged onto our live proximity database. Your sector pin coordinates are set, services are initialized, and clients can now book appointments immediately!
              </p>
            </div>

            <div className="bg-brand-secondary border border-brand-border rounded-2xl p-4 max-w-md mx-auto grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="block font-black text-brand-text text-sm">Sector Pin</span>
                <span className="text-[10px] text-brand-muted font-bold mt-0.5 block">{coords.x.toFixed(2)}, {coords.y.toFixed(2)}</span>
              </div>
              <div>
                <span className="block font-black text-brand-text text-sm">{services.length} Services</span>
                <span className="text-[10px] text-brand-muted font-bold mt-0.5 block">Custom Menu</span>
              </div>
              <div>
                <span className="block font-black text-brand-text text-sm">{stylists.length} Stylists</span>
                <span className="text-[10px] text-brand-muted font-bold mt-0.5 block">Active Team</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                id="btn-register-success-view-map"
                onClick={onNavigateHome}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-dark text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
              >
                Find on Proximity Map
              </button>
              <button
                id="btn-register-another"
                onClick={handleResetForm}
                className="px-6 py-3 border border-brand-border hover:border-brand-muted text-xs font-bold text-brand-text bg-white hover:bg-brand-secondary rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
              >
                Add Another Outlet
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB D: BUSINESS RESERVATION CALENDAR */}
        {activeTab === 'calendar' && (
          <motion.div
            key="tab-calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 flex-1 flex flex-col"
          >
            {/* Screenshot-Matched Top Bar Controls */}
            <div className="relative shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f1ebd9]/40 border border-brand-border/60 p-4 rounded-3xl shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Today Button */}
                  <button
                    id="btn-calendar-today"
                    type="button"
                    onClick={() => {
                      const today = new Date('2026-06-25T12:00:00Z');
                      setSelectedDate(today);
                      setPopupYear(today.getFullYear());
                      setPopupMonth(today.getMonth());
                    }}
                    className="px-4 py-1.5 bg-[#dfbe95]/30 hover:bg-[#dfbe95]/50 border border-brand-border text-brand-text text-xs font-bold rounded-full transition-all cursor-pointer"
                  >
                    Today
                  </button>

                  {/* Date Navigation & Pop-up Trigger */}
                  <div className="flex items-center bg-white/60 border border-brand-border rounded-full p-0.5 shadow-2xs">
                    <button
                      id="btn-calendar-prev-day"
                      type="button"
                      onClick={() => {
                        const prev = new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000);
                        setSelectedDate(prev);
                        setPopupYear(prev.getFullYear());
                        setPopupMonth(prev.getMonth());
                      }}
                      className="px-2.5 py-1 text-brand-text hover:bg-[#dfbe95]/20 rounded-full transition-all cursor-pointer font-bold text-xs"
                    >
                      &lt;
                    </button>
                    <button
                      id="btn-calendar-datepicker-toggle"
                      type="button"
                      onClick={() => setIsCalendarPopupOpen(!isCalendarPopupOpen)}
                      className="px-4 py-1 text-xs font-black text-brand-text hover:bg-[#dfbe95]/20 rounded-full transition-all cursor-pointer whitespace-nowrap min-w-[120px] text-center"
                    >
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </button>
                    <button
                      id="btn-calendar-next-day"
                      type="button"
                      onClick={() => {
                        const next = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
                        setSelectedDate(next);
                        setPopupYear(next.getFullYear());
                        setPopupMonth(next.getMonth());
                      }}
                      className="px-2.5 py-1 text-brand-text hover:bg-[#dfbe95]/20 rounded-full transition-all cursor-pointer font-bold text-xs"
                    >
                      &gt;
                    </button>
                  </div>

                  {/* Scheduled Team Dropdown */}
                  <div className="relative">
                    <button
                      id="btn-calendar-scheduled-team"
                      type="button"
                      onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-white/60 hover:bg-[#dfbe95]/20 border border-brand-border text-brand-text text-xs font-black rounded-full transition-all cursor-pointer shadow-2xs"
                    >
                      <span>
                        {selectedStylistFilter
                          ? allSalonsStylists.find(s => s.id === selectedStylistFilter)?.name || 'Scheduled team'
                          : 'Scheduled team'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
                    </button>

                    {/* Team Dropdown Dropdown Overlay */}
                    {isTeamDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsTeamDropdownOpen(false)} />
                        <div className="absolute left-0 mt-1.5 w-56 bg-white border border-brand-border rounded-2xl shadow-xl z-50 p-2 py-3 text-left">
                          <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted px-3 mb-2">Filter Specialist</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStylistFilter('');
                              setIsTeamDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-brand-secondary rounded-lg transition-colors cursor-pointer"
                          >
                            All Specialists ({allSalonsStylists.length})
                          </button>
                          {allSalonsStylists.map(sty => (
                            <button
                              key={sty.id}
                              type="button"
                              onClick={() => {
                                setSelectedStylistFilter(sty.id);
                                setIsTeamDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                                selectedStylistFilter === sty.id ? 'bg-brand-primary/10 text-brand-primary font-black' : 'text-brand-text hover:bg-brand-secondary font-bold'
                              }`}
                            >
                              <span>{sty.name}</span>
                              <span className="text-[9px] text-brand-muted font-semibold">{sty.role}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter Settings Button */}
                  <button
                    id="btn-calendar-filter-toggle"
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`p-2 border rounded-full transition-all cursor-pointer shadow-2xs ${
                      showAdvancedFilters 
                        ? 'bg-brand-primary border-brand-primary text-white' 
                        : 'bg-white/60 hover:bg-[#dfbe95]/20 border-brand-border text-brand-text'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Management Action Buttons */}
                <div className="flex flex-wrap gap-1.5 shrink-0 ml-auto w-full sm:w-auto justify-end">
                  <button
                    id="btn-calendar-add-booking-top"
                    type="button"
                    onClick={() => setIsAddingBooking(true)}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-brand-primary hover:bg-brand-dark text-white text-[11px] font-black rounded-full transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Booking</span>
                  </button>
                  <button
                    id="btn-calendar-block-time-top"
                    type="button"
                    onClick={() => setIsAddingBlockTime(true)}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-white border border-brand-border hover:border-brand-muted text-brand-text text-[11px] font-bold rounded-full transition-all cursor-pointer shadow-2xs"
                  >
                    <Clock className="w-3 h-3 text-brand-muted" />
                    <span>Block Time</span>
                  </button>
                </div>
              </div>

              {/* TWO-MONTH POP-UP CALENDAR (MATCHES SCREENSHOT) */}
              <AnimatePresence>
                {isCalendarPopupOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsCalendarPopupOpen(false)} 
                    />
                       <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute left-0 mt-2 bg-white border border-brand-border shadow-2xl rounded-[32px] p-7 z-50 text-brand-text max-w-2xl w-full sm:w-[580px] md:w-[620px]"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Month 1 */}
                        <div className="text-left">
                          <div className="flex items-center justify-between mb-5">
                            <button
                              id="btn-popup-prev-month"
                              type="button"
                              onClick={() => {
                                if (popupMonth === 0) {
                                  setPopupMonth(11);
                                  setPopupYear(popupYear - 1);
                                } else {
                                  setPopupMonth(popupMonth - 1);
                                }
                              }}
                              className="p-1.5 hover:bg-brand-secondary text-brand-text rounded-full transition-all cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <h4 className="font-serif font-black text-sm text-brand-text select-none">
                              {new Date(popupYear, popupMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h4>
                            <div className="w-7"></div>
                          </div>

                          {/* Days of Week */}
                          <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-wider text-brand-muted mb-3">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                            <span>Sun</span>
                          </div>

                          {/* Grid */}
                          <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold">
                            {getMonthDaysMon(popupYear, popupMonth).map((day, idx) => {
                              if (day === null) return <div key={`empty-1-${idx}`} className="h-8 w-8" />;
                              
                              const isSelected = selectedDate.getDate() === day && 
                                                 selectedDate.getMonth() === popupMonth && 
                                                 selectedDate.getFullYear() === popupYear;
                              
                              return (
                                <button
                                  key={`day-1-${day}`}
                                  type="button"
                                  onClick={() => {
                                    const newD = new Date(popupYear, popupMonth, day, 12, 0, 0);
                                    setSelectedDate(newD);
                                  }}
                                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full transition-all cursor-pointer text-xs font-bold relative ${
                                    isSelected 
                                      ? 'bg-brand-primary text-white font-black shadow-md ring-4 ring-brand-primary/20 scale-105' 
                                      : 'hover:bg-brand-secondary text-brand-text'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Month 2 */}
                        {(() => {
                          const m2Month = popupMonth === 11 ? 0 : popupMonth + 1;
                          const m2Year = popupMonth === 11 ? popupYear + 1 : popupYear;
                          return (
                            <div className="text-left">
                              <div className="flex items-center justify-between mb-5">
                                <div className="w-7"></div>
                                <h4 className="font-serif font-black text-sm text-brand-text select-none">
                                  {new Date(m2Year, m2Month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h4>
                                <button
                                  id="btn-popup-next-month"
                                  type="button"
                                  onClick={() => {
                                    if (popupMonth === 11) {
                                      setPopupMonth(0);
                                      setPopupYear(popupYear + 1);
                                    } else {
                                      setPopupMonth(popupMonth + 1);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-brand-secondary text-brand-text rounded-full transition-all cursor-pointer"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Days of Week */}
                              <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-wider text-brand-muted mb-3">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                              </div>

                              {/* Grid */}
                              <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold">
                                {getMonthDaysMon(m2Year, m2Month).map((day, idx) => {
                                  if (day === null) return <div key={`empty-2-${idx}`} className="h-8 w-8" />;
                                  
                                  const isSelected = selectedDate.getDate() === day && 
                                                     selectedDate.getMonth() === m2Month && 
                                                     selectedDate.getFullYear() === m2Year;
                                  
                                  return (
                                    <button
                                      key={`day-2-${day}`}
                                      type="button"
                                      onClick={() => {
                                        const newD = new Date(m2Year, m2Month, day, 12, 0, 0);
                                        setSelectedDate(newD);
                                      }}
                                      className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full transition-all cursor-pointer text-xs font-bold relative ${
                                        isSelected 
                                          ? 'bg-brand-primary text-white font-black shadow-md ring-4 ring-brand-primary/20 scale-105' 
                                          : 'hover:bg-brand-secondary text-brand-text'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                      </div>

                      {/* Quick selects at bottom */}
                      <div className="border-t border-brand-border mt-6 pt-5 flex flex-wrap gap-2 justify-start items-center">
                        {[1, 2, 3, 4, 5].map((w) => {
                          const daysOut = w * 7;
                          return (
                            <button
                              key={`preset-week-${w}`}
                              type="button"
                              onClick={() => {
                                const base = new Date('2026-06-25T12:00:00Z');
                                const target = new Date(base.getTime() + daysOut * 24 * 60 * 60 * 1000);
                                setSelectedDate(target);
                                setPopupYear(target.getFullYear());
                                setPopupMonth(target.getMonth());
                                setIsCalendarPopupOpen(false);
                              }}
                              className="px-4 py-1.5 border border-brand-border hover:border-brand-muted hover:bg-brand-secondary rounded-full text-[11px] font-black uppercase tracking-wider text-brand-text cursor-pointer transition-all"
                            >
                              In {w} week{w > 1 ? 's' : ''}
                            </button>
                          );
                        })}
                        
                        <div className="ml-auto">
                          <button
                            type="button"
                            onClick={() => {
                              const base = new Date('2026-06-25T12:00:00Z');
                              const target = new Date(base.getTime() + 42 * 24 * 60 * 60 * 1000); // 6 weeks
                              setSelectedDate(target);
                              setPopupYear(target.getFullYear());
                              setPopupMonth(target.getMonth());
                              setIsCalendarPopupOpen(false);
                            }}
                            className="px-4 py-1.5 border border-brand-border hover:border-brand-muted hover:bg-brand-secondary rounded-full text-[11px] font-black uppercase tracking-wider text-brand-text cursor-pointer transition-all flex items-center gap-1"
                          >
                            <span>More</span>
                            <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Filters Ribbon (Collapsible via showAdvancedFilters state) */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-brand-bg border border-brand-border p-4 rounded-3xl flex flex-wrap gap-4 items-center">
                    <div className="text-xs font-bold text-brand-text flex items-center gap-1 shrink-0">
                      <Compass className="w-3.5 h-3.5 text-brand-primary animate-spin-slow" />
                      <span>Quick Filters:</span>
                    </div>

                    {/* Outlet Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Branch:</span>
                      <select
                        id="filter-branch-select"
                        value={selectedCalendarSalonId}
                        onChange={(e) => setSelectedCalendarSalonId(e.target.value)}
                        className="px-2.5 py-1.5 border border-brand-border text-[11px] rounded-lg bg-white font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer max-w-48"
                      >
                        <option value="">All Branches ({salons.length})</option>
                        {salons.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Specialist Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Specialist:</span>
                      <select
                        id="filter-stylist-select"
                        value={selectedStylistFilter}
                        onChange={(e) => setSelectedStylistFilter(e.target.value)}
                        className="px-2.5 py-1.5 border border-brand-border text-[11px] rounded-lg bg-white font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer max-w-48"
                      >
                        <option value="">All Specialists ({allSalonsStylists.length})</option>
                        {allSalonsStylists.map(sty => (
                          <option key={sty.id} value={sty.id}>{sty.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Status:</span>
                      <select
                        id="filter-status-select"
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 border border-brand-border text-[11px] rounded-lg bg-white font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* View Toggle */}
                    <div className="ml-auto flex items-center bg-white border border-brand-border p-1 rounded-xl">
                      <button
                        id="btn-view-mode-grid"
                        type="button"
                        onClick={() => setCalendarViewMode('grid')}
                        className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          calendarViewMode === 'grid'
                            ? 'bg-brand-primary text-white shadow-xs'
                            : 'text-brand-muted hover:text-brand-text'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Calendar Grid</span>
                      </button>
                      <button
                        id="btn-view-mode-list"
                        type="button"
                        onClick={() => setCalendarViewMode('list')}
                        className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          calendarViewMode === 'list'
                            ? 'bg-brand-primary text-white shadow-xs'
                            : 'text-brand-muted hover:text-brand-text'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Timeline List</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Main view layout: List View or Full-Width Grid View */}
            {calendarViewMode === 'list' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Block */}
                <div className="lg:col-span-1 space-y-4 text-left">
                  <div className="bg-brand-secondary border border-brand-border p-5 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black text-brand-text uppercase tracking-widest border-b border-brand-border/40 pb-2">
                      Daily Agenda Summary ({selectedDay.dayName}, {selectedDay.monthName} {selectedDay.dayNum})
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white border border-brand-border p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-brand-muted font-bold uppercase tracking-wider leading-none">Total Bookings</span>
                          <span className="text-xl font-black text-brand-text block mt-1 leading-none">{dailyStats.count}</span>
                        </div>
                        <ClipboardList className="w-5 h-5 text-brand-primary opacity-60" />
                      </div>

                      <div className="bg-white border border-brand-border p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-brand-muted font-bold uppercase tracking-wider leading-none">Estimated Earnings</span>
                          <span className="text-xl font-black text-brand-primary block mt-1 leading-none">${dailyStats.revenue}</span>
                        </div>
                        <Sparkles className="w-5 h-5 text-brand-warm-accent opacity-80" />
                      </div>

                      <div className="bg-white border border-brand-border p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-brand-muted font-bold uppercase tracking-wider leading-none">Cancellations</span>
                          <span className="text-xl font-black text-red-600 block mt-1 leading-none">{dailyStats.cancelled}</span>
                        </div>
                        <AlertCircle className="w-5 h-5 text-red-400 opacity-60" />
                      </div>
                    </div>
                  </div>

                  {/* Helpful tips card */}
                  <div className="bg-white border border-brand-border p-5 rounded-3xl">
                    <div className="flex gap-2.5">
                      <Info className="w-4.5 h-4.5 text-brand-primary mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <h4 className="font-bold text-brand-text">Aesthetic Platform Guide</h4>
                        <p className="text-brand-muted mt-1 leading-relaxed">
                          To add new bookings or block lunch breaks on the calendar, click the buttons above. You can update appointment status inline using the dropdowns below, which instantly calculates your estimated daily earnings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reservations timeline block */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-serif font-extrabold text-sm text-brand-text">
                      Reservations Timeline ({filteredBookings.length})
                    </h3>
                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest bg-brand-secondary border border-brand-border px-2 py-0.5 rounded-md">
                      Agenda List
                    </span>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-brand-border rounded-3xl">
                      <Calendar className="w-12 h-12 text-brand-muted mx-auto mb-3 opacity-65" />
                      <h4 className="font-serif font-bold text-base text-brand-text">Clear Schedule</h4>
                      <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
                        There are no active appointments or blocks registered for this date matching your filters. Click "New Booking" to manually log an appointment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBookings.map((booking) => {
                        const timeStr = booking.dateTime?.split('•')[1]?.trim() || booking.dateTime;
                        const isBlockedSlot = booking.service?.name.startsWith('🔒 Blocked');

                        return (
                          <div
                            id={`booking-partner-card-${booking.id}`}
                            key={booking.id}
                            className={`border rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-sm ${
                              isBlockedSlot
                                ? 'bg-slate-50 border-dashed border-slate-300 relative overflow-hidden'
                                : booking.status === 'cancelled'
                                ? 'border-brand-border/40 opacity-70 bg-brand-bg'
                                : 'bg-white border-brand-border hover:border-brand-muted'
                            }`}
                          >
                            {/* Stripe pattern for blocked slot */}
                            {isBlockedSlot && (
                              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(45deg,#000,#000_10px,#fff_10px,#fff_20px)]" />
                            )}

                            {/* Left: Time & Core Details */}
                            <div className="flex items-start gap-3.5 text-left relative z-10">
                              <div className={`p-3 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-xs shrink-0 ${
                                isBlockedSlot
                                  ? 'bg-slate-200 text-slate-700'
                                  : booking.status === 'cancelled'
                                  ? 'bg-red-50 text-red-400 line-through'
                                  : 'bg-brand-secondary text-brand-primary'
                              }`}>
                                <Clock className="w-4 h-4 mb-1 text-brand-primary" />
                                <span className="font-black">{timeStr}</span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className={`text-xs font-black text-brand-text ${booking.status === 'cancelled' ? 'line-through opacity-55' : ''}`}>
                                    {booking.service?.name}
                                  </h4>
                                  {!isBlockedSlot && (
                                    <span className="text-[10px] text-brand-muted font-bold">
                                      • {booking.service?.duration} mins
                                    </span>
                                  )}
                                </div>
                                
                                {isBlockedSlot ? (
                                  <p className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1">
                                    <span>🔒 Schedule Hold (Specialist unavailable for client bookings)</span>
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-brand-muted font-semibold flex flex-wrap items-center gap-x-1.5">
                                    <span>Client:</span>
                                    <span className="text-brand-text font-black">{booking.clientName || booking.userEmail || 'Anonymous Guest'}</span>
                                    {booking.clientPhone && (
                                      <>
                                        <span className="text-brand-muted">•</span>
                                        <span>Phone:</span>
                                        <span className="text-brand-text font-black">{booking.clientPhone}</span>
                                      </>
                                    )}
                                  </p>
                                )}

                                {selectedCalendarSalonId === "" && (
                                  <p className="text-[10px] text-brand-primary font-bold">
                                    Branch: <span className="font-extrabold">{booking.salonName}</span>
                                  </p>
                                )}
                                
                                {booking.notes && !isBlockedSlot && (
                                  <p className="text-[10px] italic text-brand-muted bg-brand-bg border border-brand-border/40 rounded-md px-2 py-1 mt-1 font-semibold leading-relaxed">
                                    Note: "{booking.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Price, Specialist, Status */}
                            <div className="flex md:flex-col items-end justify-between md:justify-center w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-brand-secondary relative z-10">
                              {/* Specialist info */}
                              <div className="flex items-center gap-2 text-right">
                                <div className="text-[10px] font-semibold text-brand-muted">
                                  <span className="block text-brand-text font-black">{booking.stylist?.name}</span>
                                  {booking.stylist?.role}
                                </div>
                                <img
                                  src={booking.stylist?.image}
                                  alt={booking.stylist?.name}
                                  className="w-8 h-8 rounded-full object-cover border border-brand-border"
                                />
                              </div>

                              {/* Price and Status Badge/Dropdown */}
                              <div className="flex items-center gap-3">
                                {!isBlockedSlot && (
                                  <span className={`text-sm font-black ${booking.status === 'cancelled' ? 'text-brand-muted line-through' : 'text-brand-text'}`}>
                                    ${booking.price || booking.service?.price}
                                  </span>
                                )}
                                
                                {isBlockedSlot ? (
                                  <button
                                    onClick={() => {
                                      if (onUpdateBooking) {
                                        onUpdateBooking({
                                          ...booking,
                                          status: 'cancelled'
                                        });
                                      }
                                    }}
                                    className="text-[9px] font-black px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-red-100"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove Block</span>
                                  </button>
                                ) : (
                                  <select
                                    value={booking.status}
                                    onChange={(e) => {
                                      if (onUpdateBooking) {
                                        onUpdateBooking({
                                          ...booking,
                                          status: e.target.value as any
                                        });
                                      }
                                    }}
                                    className={`text-[9px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider cursor-pointer border focus:outline-none bg-white ${
                                      booking.status === 'upcoming'
                                        ? 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                        : booking.status === 'completed'
                                        ? 'text-blue-700 border-blue-200 hover:bg-blue-50'
                                        : 'text-red-700 border-red-200 hover:bg-red-50'
                                    }`}
                                  >
                                    <option value="upcoming">✓ Upcoming</option>
                                    <option value="completed">★ Completed</option>
                                    <option value="cancelled">✕ Cancelled</option>
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* FLAWLESS FRESHA-STYLE INTERACTIVE SCHEDULER GRID */
              <div className="space-y-4">
                {visibleStylistsForGrid.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-brand-border rounded-3xl">
                    <Scissors className="w-12 h-12 text-brand-muted mx-auto mb-3 opacity-65" />
                    <h4 className="font-serif font-bold text-base text-brand-text">No Specialists Found</h4>
                    <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
                      Please register a salon outlet with stylists first, or verify your branch filter selection.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-brand-border rounded-3xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    <div className="overflow-auto flex-1">
                      <div className="min-w-[800px] select-none h-full flex flex-col">
                        {/* Grid Header Row: Stylist columns */}
                        <div className="grid border-b border-brand-border sticky top-0 z-20 bg-brand-bg shadow-sm" style={{ gridTemplateColumns: `100px repeat(${visibleStylistsForGrid.length}, minmax(200px, 1fr))` }}>
                          {/* Time cell header placeholder */}
                          <div className="bg-brand-bg flex items-center justify-center p-4 border-r border-brand-border font-mono text-[10px] font-black uppercase text-brand-muted tracking-widest">
                            Time Slot
                          </div>
                          {/* Stylists header cells */}
                          {visibleStylistsForGrid.map(sty => (
                            <div key={sty.id} className="p-4 border-r border-brand-border flex items-center gap-3 bg-brand-bg">
                              <img
                                src={sty.image}
                                alt={sty.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                              />
                              <div className="text-left">
                                <h5 className="text-xs font-black text-brand-text leading-tight">{sty.name}</h5>
                                <p className="text-[10px] font-semibold text-brand-muted">{sty.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Grid Body Rows */}
                        <div className="divide-y divide-brand-border/40">
                          {generateTimeSlots(gridTimeInterval).map((hour) => (
                            <div
                              key={hour}
                              className="grid min-h-[160px]"
                              style={{ gridTemplateColumns: `100px repeat(${visibleStylistsForGrid.length}, minmax(200px, 1fr))` }}
                            >
                              {/* Left Time label */}
                              <div className="bg-brand-bg/10 border-r border-brand-border p-3 flex flex-col justify-start items-center pt-4 shrink-0 font-mono text-xs font-black text-brand-text">
                                <Clock className="w-3.5 h-3.5 text-brand-muted mb-1" />
                                <span>{hour}</span>
                              </div>

                              {/* Columns for each stylist */}
                              {visibleStylistsForGrid.map((sty) => {
                                // Match booking for this stylist and hour
                                const cellBooking = filteredBookings.find(b => {
                                  if (b.stylist?.id !== sty.id) return false;
                                  const dt = (b.dateTime || '').toLowerCase();
                                  const hr = hour.toLowerCase();
                                  if (dt.includes(hr)) return true;
                                  
                                  // Interval match
                                  const cleanDt = dt.replace(/\s/g, '');
                                  const cleanHr = hr.replace(/\s/g, '');
                                  if (cleanDt.includes(cleanHr)) return true;

                                  // PM/AM boundary matching
                                  const isPM_booking = dt.includes('pm');
                                  const isPM_hour = hr.includes('pm');
                                  if (isPM_booking === isPM_hour) {
                                    const hourNumber = hour.split(':')[0];
                                    if (dt.includes(` ${hourNumber}:`) || dt.includes(`• ${hourNumber}:`) || dt.includes(`•${hourNumber}:`)) {
                                      return true;
                                    }
                                  }
                                  return false;
                                });

                                if (cellBooking) {
                                  const isBlockedSlot = cellBooking.service?.name.startsWith('🔒 Blocked');
                                  
                                  return (
                                    <div key={sty.id} className="p-2.5 border-r border-brand-border/40 bg-brand-bg/5 flex flex-col justify-center h-full">
                                      <div className={`p-3 rounded-2xl h-full border text-left flex flex-col justify-between transition-all hover:shadow-xs relative overflow-hidden ${
                                        isBlockedSlot
                                          ? 'bg-slate-100/90 border-dashed border-slate-300'
                                          : cellBooking.status === 'cancelled'
                                          ? 'bg-red-50/50 border-red-100 opacity-70'
                                          : 'bg-white border-brand-border hover:border-brand-muted border-l-4 ' + (
                                              cellBooking.status === 'upcoming' ? 'border-l-emerald-500' : 'border-l-blue-500'
                                            )
                                      }`}>
                                        {isBlockedSlot && (
                                          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(45deg,#000,#000_10px,#fff_10px,#fff_20px)]" />
                                        )}

                                        <div className="relative z-10 space-y-1">
                                          <div className="flex items-start justify-between gap-1">
                                            <h6 className={`text-[11px] font-black text-brand-text leading-tight ${cellBooking.status === 'cancelled' ? 'line-through opacity-50' : ''}`}>
                                              {cellBooking.service?.name}
                                            </h6>
                                            {!isBlockedSlot && (
                                              <span className="text-[10px] font-black text-brand-primary bg-brand-secondary px-1.5 py-0.5 rounded-md shrink-0">
                                                ${cellBooking.price || cellBooking.service?.price}
                                              </span>
                                            )}
                                          </div>

                                          {isBlockedSlot ? (
                                            <span className="text-[9px] text-slate-500 font-extrabold block">
                                              🔒 Personal Schedule Block
                                            </span>
                                          ) : (
                                            <div className="space-y-0.5">
                                              <span className="text-[9px] text-brand-muted font-bold block leading-none">
                                                Guest: <span className="text-brand-text font-black">{cellBooking.clientName || cellBooking.userEmail?.split('@')[0]}</span>
                                              </span>
                                              {cellBooking.clientPhone && (
                                                <span className="text-[8px] text-brand-muted font-semibold block leading-none">
                                                  Phone: <span className="text-brand-text font-bold">{cellBooking.clientPhone}</span>
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {cellBooking.notes && !isBlockedSlot && (
                                            <p className="text-[9px] italic text-brand-muted line-clamp-1 leading-tight">
                                              "{cellBooking.notes}"
                                            </p>
                                          )}
                                        </div>

                                        {/* Action section at the bottom of the block */}
                                        <div className="mt-2.5 pt-2.5 border-t border-brand-border/40 flex items-center justify-between gap-1 relative z-10">
                                          {isBlockedSlot ? (
                                            <button
                                              id={`btn-remove-block-grid-${cellBooking.id}`}
                                              onClick={() => {
                                                if (onUpdateBooking) {
                                                  onUpdateBooking({
                                                    ...cellBooking,
                                                    status: 'cancelled'
                                                  });
                                                }
                                              }}
                                              className="text-[9px] font-black text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-red-100"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>Remove Hold</span>
                                            </button>
                                          ) : (
                                            <select
                                              id={`select-status-grid-${cellBooking.id}`}
                                              value={cellBooking.status}
                                              onChange={(e) => {
                                                if (onUpdateBooking) {
                                                  onUpdateBooking({
                                                    ...cellBooking,
                                                    status: e.target.value as any
                                                  });
                                                }
                                              }}
                                              className={`text-[9px] font-black px-1.5 py-1 rounded-lg cursor-pointer border focus:outline-none bg-white ${
                                                cellBooking.status === 'upcoming'
                                                  ? 'text-emerald-700 border-emerald-200'
                                                  : cellBooking.status === 'completed'
                                                  ? 'text-blue-700 border-blue-200'
                                                  : 'text-red-700 border-red-200'
                                              }`}
                                            >
                                              <option value="upcoming">Upcoming</option>
                                              <option value="completed">Completed</option>
                                              <option value="cancelled">Cancelled</option>
                                            </select>
                                          )}

                                          <span className="text-[8px] font-bold text-brand-muted font-mono leading-none">
                                            {isBlockedSlot ? '1h' : (cellBooking.service?.duration + 'm')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                // Render empty clickable slot
                                return (
                                  <div
                                    key={sty.id}
                                    className="p-2 border-r border-brand-border/40 group relative hover:bg-brand-secondary/20 transition-all flex flex-col justify-center h-full min-h-[90px]"
                                  >
                                    <div className="absolute inset-2 border-2 border-dashed border-transparent group-hover:border-brand-border/80 group-hover:bg-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer p-2">
                                      <Plus className="w-4 h-4 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 group-hover:text-brand-primary" />
                                      <span className="text-[10px] font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                                        Book at {hour.split(' ')[0]}
                                      </span>
                                      
                                      <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                                        <span className="text-[16px] text-brand-border font-light">+</span>
                                      </div>

                                      {/* Mini Block option */}
                                      <button
                                        id={`btn-quick-block-${sty.id}-${hour.replace(/[: ]/g, '')}`}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const stylistSalon = salons.find(s => (s.stylists || []).some(item => item.id === sty.id));
                                          if (stylistSalon) {
                                            setNewBlockSalonId(stylistSalon.id);
                                            setNewBlockStylistId(sty.id);
                                            setNewBlockTime(`${hour} - ${getNextHour(hour)}`);
                                            setIsAddingBlockTime(true);
                                          }
                                        }}
                                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-brand-secondary hover:bg-brand-bg text-[8px] font-black text-brand-muted rounded-md border border-brand-border transition-all cursor-pointer"
                                      >
                                        Hold Time
                                      </button>

                                      {/* Trigger Booking click */}
                                      <div
                                        className="absolute inset-0 rounded-2xl"
                                        onClick={() => {
                                          const stylistSalon = salons.find(s => (s.stylists || []).some(item => item.id === sty.id));
                                          if (stylistSalon) {
                                            setNewBookingSalonId(stylistSalon.id);
                                            setNewBookingStylistId(sty.id);
                                            setNewBookingTime(hour);
                                            setIsAddingBooking(true);
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MANUAL BOOKING CREATION DIALOG (MODAL OVERLAY) */}
            <AnimatePresence>
              {isAddingBooking && (
                <div className="fixed inset-0 z-50 bg-brand-text/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-white border border-brand-border w-full max-w-lg rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-left"
                  >
                    <button
                      onClick={() => setIsAddingBooking(false)}
                      className="absolute right-4 top-4 p-1 rounded-full hover:bg-brand-secondary transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-brand-muted" />
                    </button>

                    <div className="flex items-center gap-2 border-b border-brand-secondary pb-4 mb-4">
                      <Scissors className="w-5 h-5 text-brand-primary" />
                      <div>
                        <h4 className="font-serif font-extrabold text-brand-text text-base">Schedule Appointment</h4>
                        <p className="text-[10px] text-brand-muted font-bold">Manual Client Walk-In Entry</p>
                      </div>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!onAddBooking) return;
                      const salon = salons.find(s => s.id === newBookingSalonId);
                      if (!salon) return;
                      const service = salon.services.find(s => s.id === newBookingServiceId);
                      if (!service) return;
                      const stylist = salon.stylists.find(s => s.id === newBookingStylistId);
                      if (!stylist) return;

                      const weekdayName = selectedDay.dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      const monthName = selectedDay.dateObj.toLocaleDateString('en-US', { month: 'long' });
                      const dayNum = selectedDay.dateObj.getDate();
                      const yearNum = selectedDay.dateObj.getFullYear();
                      const dateTimeStr = `${weekdayName}, ${monthName} ${dayNum}, ${yearNum} • ${newBookingTime}`;

                      const customBooking: Booking = {
                        id: `manual_${Date.now()}`,
                        salonId: salon.id,
                        salonName: salon.name,
                        salonImage: salon.image,
                        salonAddress: salon.address,
                        service: service,
                        stylist: stylist,
                        dateTime: dateTimeStr,
                        price: service.price,
                        status: 'upcoming',
                        userEmail: newBookingClientEmail || 'Walk-in Guest',
                        clientPhone: newBookingClientPhone || undefined,
                        clientName: newBookingClientName || 'Walk-in Guest',
                        notes: newBookingNotes || `Walk-in appointment booked for ${newBookingClientName}`
                      };

                      onAddBooking(customBooking);
                      setIsAddingBooking(false);
                      setNewBookingClientName('');
                      setNewBookingClientEmail('');
                      setNewBookingClientPhone('');
                      setNewBookingNotes('');
                    }} className="space-y-4">
                      
                      {/* Select Salon */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Select Outlet / Salon</label>
                        <select
                          value={newBookingSalonId}
                          onChange={(e) => setNewBookingSalonId(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                          required
                        >
                          <option value="" disabled>Choose active salon...</option>
                          {salons.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Select Service */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Service</label>
                          <select
                            value={newBookingServiceId}
                            onChange={(e) => setNewBookingServiceId(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                            required
                          >
                            <option value="" disabled>Choose service...</option>
                            {(salons.find(s => s.id === newBookingSalonId)?.services || []).map(srv => (
                              <option key={srv.id} value={srv.id}>{srv.name} (${srv.price})</option>
                            ))}
                          </select>
                        </div>

                        {/* Select Stylist */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Stylist / Specialist</label>
                          <select
                            value={newBookingStylistId}
                            onChange={(e) => setNewBookingStylistId(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                            required
                          >
                            <option value="" disabled>Choose stylist...</option>
                            {(salons.find(s => s.id === newBookingSalonId)?.stylists || []).map(sty => (
                              <option key={sty.id} value={sty.id}>{sty.name} ({sty.role})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Selected Date Indicator */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Date</label>
                          <input
                            type="date"
                            value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [y, m, d] = e.target.value.split('-').map(Number);
                                setSelectedDate(new Date(y, m - 1, d, 12, 0, 0));
                              }
                            }}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                          />
                        </div>

                        {/* Select Time Slot */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Time Slot</label>
                          <select
                            value={newBookingTime}
                            onChange={(e) => setNewBookingTime(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                            required
                          >
                            {generateTimeSlots(gridTimeInterval).map((slot) => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Search Existing Customers */}
                      <div className="bg-brand-secondary/40 border border-brand-border/60 p-3.5 rounded-2xl relative">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1.5 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-brand-primary" />
                          <span>Search Existing Customers</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by client name, email, or phone..."
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 border border-brand-border rounded-xl text-xs bg-white font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                          />
                          <Search className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                          {customerSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setCustomerSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Search Dropdown Pop-up Results */}
                        {filteredExistingCustomers.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-brand-border shadow-xl rounded-2xl max-h-56 overflow-y-auto z-50 divide-y divide-brand-border/40">
                            {filteredExistingCustomers.map((cust) => (
                              <button
                                key={`${cust.name}-${cust.email}`}
                                type="button"
                                onClick={() => {
                                  setNewBookingClientName(cust.name);
                                  setNewBookingClientEmail(cust.email);
                                  setNewBookingClientPhone(cust.phone);
                                  setCustomerSearchQuery('');
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-brand-secondary/50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-brand-text">{cust.name}</span>
                                  <span className="text-[10px] font-semibold text-brand-muted">{cust.email}</span>
                                </div>
                                {cust.phone && (
                                  <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-secondary/80 px-2 py-0.5 rounded-full">
                                    {cust.phone}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {customerSearchQuery.trim() !== '' && filteredExistingCustomers.length === 0 && (
                          <p className="text-[10px] text-brand-muted italic mt-1.5 font-semibold">
                            No matching customers found. Please enter details manually below to create a new profile.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Client Name */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Client Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={newBookingClientName}
                            onChange={(e) => setNewBookingClientName(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                            required
                          />
                        </div>

                        {/* Client Email */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Client Email</label>
                          <input
                            type="email"
                            placeholder="john@example.com"
                            value={newBookingClientEmail}
                            onChange={(e) => setNewBookingClientEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                            required
                          />
                        </div>

                        {/* Client Phone */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Client Phone (Optional)</label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={newBookingClientPhone}
                            onChange={(e) => setNewBookingClientPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Appointment Notes (Optional)</label>
                        <textarea
                          rows={2}
                          placeholder="Allergies, preferences, requested styling details..."
                          value={newBookingNotes}
                          onChange={(e) => setNewBookingNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div className="flex gap-2.5 pt-4">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer text-center"
                        >
                          Confirm & Save Appointment
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingBooking(false)}
                          className="px-4 py-2.5 border border-brand-border hover:border-brand-muted bg-white text-brand-text text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* BLOCK OUT TIME DIALOG (MODAL OVERLAY) */}
            <AnimatePresence>
              {isAddingBlockTime && (
                <div className="fixed inset-0 z-50 bg-brand-text/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-white border border-brand-border w-full max-w-md rounded-3xl shadow-2xl p-6 relative text-left"
                  >
                    <button
                      onClick={() => setIsAddingBlockTime(false)}
                      className="absolute right-4 top-4 p-1 rounded-full hover:bg-brand-secondary transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-brand-muted" />
                    </button>

                    <div className="flex items-center gap-2 border-b border-brand-secondary pb-4 mb-4">
                      <Clock className="w-5 h-5 text-slate-700" />
                      <div>
                        <h4 className="font-serif font-extrabold text-brand-text text-base">Block Time / Personal Breaks</h4>
                        <p className="text-[10px] text-brand-muted font-bold">Declare Specialist Schedule Blockout</p>
                      </div>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!onAddBooking) return;
                      const salon = salons.find(s => s.id === newBlockSalonId);
                      if (!salon) return;
                      const stylist = salon.stylists.find(s => s.id === newBlockStylistId);
                      if (!stylist) return;

                      const weekdayName = selectedDay.dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      const monthName = selectedDay.dateObj.toLocaleDateString('en-US', { month: 'long' });
                      const dayNum = selectedDay.dateObj.getDate();
                      const yearNum = selectedDay.dateObj.getFullYear();
                      const dateTimeStr = `${weekdayName}, ${monthName} ${dayNum}, ${yearNum} • ${newBlockTime}`;

                      const blockBooking: Booking = {
                        id: `block_${Date.now()}`,
                        salonId: salon.id,
                        salonName: salon.name,
                        salonImage: salon.image,
                        salonAddress: salon.address,
                        service: {
                          id: `block_srv_${Date.now()}`,
                          name: `🔒 Blocked: ${newBlockTitle}`,
                          duration: 60,
                          price: 0,
                          description: 'Blocked out time for breaks, personal tasks or meetings.',
                          category: 'Block'
                        },
                        stylist: stylist,
                        dateTime: dateTimeStr,
                        price: 0,
                        status: 'upcoming',
                        notes: 'Time blocked out on schedule'
                      };

                      onAddBooking(blockBooking);
                      setIsAddingBlockTime(false);
                    }} className="space-y-4">
                      
                      {/* Select Salon */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Select Outlet / Salon</label>
                        <select
                          value={newBlockSalonId}
                          onChange={(e) => setNewBlockSalonId(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                          required
                        >
                          <option value="" disabled>Choose salon...</option>
                          {salons.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Stylist */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Assign Specialist / Stylist</label>
                        <select
                          value={newBlockStylistId}
                          onChange={(e) => setNewBlockStylistId(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                          required
                        >
                          <option value="" disabled>Choose stylist...</option>
                          {(salons.find(s => s.id === newBlockSalonId)?.stylists || []).map(sty => (
                            <option key={sty.id} value={sty.id}>{sty.name} ({sty.role})</option>
                          ))}
                        </select>
                      </div>

                      {/* Block Reason Title */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Block Reason</label>
                        <select
                          value={newBlockTitle}
                          onChange={(e) => setNewBlockTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                          required
                        >
                          <option value="Lunch Break">Lunch Break</option>
                          <option value="Staff Meeting">Staff Meeting</option>
                          <option value="Dentist/Medical Appt">Dentist/Medical Appt</option>
                          <option value="Personal Break">Personal Break</option>
                          <option value="Training & Dev">Training & Dev</option>
                          <option value="Maintenance Block">Maintenance Block</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Selected Date Indicator */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Date</label>
                          <input
                            type="date"
                            value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [y, m, d] = e.target.value.split('-').map(Number);
                                setSelectedDate(new Date(y, m - 1, d, 12, 0, 0));
                              }
                            }}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                          />
                        </div>

                        {/* Block Time Duration Text */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Time Block</label>
                          <select
                            value={newBlockTime}
                            onChange={(e) => setNewBlockTime(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                            required
                          >
                            <option value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</option>
                            <option value="1:00 PM - 2:00 PM">1:00 PM - 2:00 PM</option>
                            <option value="2:00 PM - 2:30 PM">2:00 PM - 2:30 PM</option>
                            <option value="3:00 PM - 4:00 PM">3:00 PM - 4:00 PM</option>
                            <option value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</option>
                            <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                            <option value="5:00 PM - 6:00 PM">5:00 PM - 6:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-4">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer text-center"
                        >
                          Apply Time Block
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingBlockTime(false)}
                          className="px-4 py-2.5 border border-brand-border hover:border-brand-muted bg-white text-brand-text text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* ADD EMPLOYEE DIALOG (MODAL OVERLAY) */}
            <AnimatePresence>
              {isAddingEmployee && (
                <div className="fixed inset-0 z-50 bg-brand-text/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-white border border-brand-border w-full max-w-md rounded-3xl shadow-2xl p-6 relative text-left"
                  >
                    <button
                      onClick={() => setIsAddingEmployee(false)}
                      className="absolute right-4 top-4 p-1 rounded-full hover:bg-brand-secondary transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-brand-muted" />
                    </button>

                    <div className="flex items-center gap-2 border-b border-brand-secondary pb-4 mb-4">
                      <User className="w-5 h-5 text-brand-primary" />
                      <div>
                        <h4 className="font-serif font-extrabold text-brand-text text-base">Add New Employee</h4>
                        <p className="text-[10px] text-brand-muted font-bold">Register Specialist/Stylist on Calendar</p>
                      </div>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!onUpdateSalon) return;
                      const salon = salons.find(s => s.id === newEmployeeSalonId);
                      if (!salon) return;

                      const newStylist: Stylist = {
                        id: `sty_${Date.now()}`,
                        name: newEmployeeName,
                        role: newEmployeeRole,
                        rating: 5.0,
                        image: newEmployeeImage
                      };

                      const updatedSalon: Salon = {
                        ...salon,
                        stylists: [...(salon.stylists || []), newStylist]
                      };

                      onUpdateSalon(updatedSalon);
                      setIsAddingEmployee(false);
                      setNewEmployeeName('');
                      setNewEmployeeRole('');
                      setNewEmployeeImage(STYLIST_IMAGE_PRESETS[0].url);
                    }} className="space-y-4">
                      
                      {/* Select Salon */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Assign to Salon / Outlet</label>
                        <select
                          value={newEmployeeSalonId}
                          onChange={(e) => setNewEmployeeSalonId(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary cursor-pointer"
                          required
                        >
                          <option value="" disabled>Choose salon...</option>
                          {salons.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Employee Name */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Employee Name</label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                          required
                        />
                      </div>

                      {/* Employee Role */}
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Professional Role / Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Master Colorist, Barber Expert"
                          value={newEmployeeRole}
                          onChange={(e) => setNewEmployeeRole(e.target.value)}
                          className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-brand-bg font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                          required
                        />
                      </div>

                      {/* Employee Picture Selection & Upload */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-brand-text mb-1">Employee Picture</label>
                          
                          {/* Drag & Drop Upload Zone */}
                          <div 
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const files = e.dataTransfer.files;
                              if (files && files[0]) {
                                const file = files[0];
                                if (file.type.startsWith('image/')) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setNewEmployeeImage(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                            className="border-2 border-dashed border-brand-border hover:border-brand-primary rounded-2xl p-4 text-center transition-all bg-brand-bg relative cursor-pointer group flex flex-col items-center justify-center gap-2"
                          >
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files[0]) {
                                  const file = files[0];
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setNewEmployeeImage(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            
                            <div className="flex items-center gap-3 w-full">
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border shrink-0 bg-white shadow-inner">
                                <img src={newEmployeeImage || STYLIST_IMAGE_PRESETS[0].url} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] font-black text-brand-text">Drag & drop picture here</p>
                                <p className="text-[9px] text-brand-muted font-bold">or click to upload from your device</p>
                              </div>
                              <Upload className="w-4 h-4 text-brand-muted group-hover:text-brand-primary ml-auto" />
                            </div>
                          </div>
                        </div>

                        {/* Presets Grid */}
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-wider text-brand-muted mb-1">Or choose a preset profile avatar</label>
                          <div className="grid grid-cols-5 gap-2">
                            {STYLIST_IMAGE_PRESETS.map((preset) => {
                              const isSelected = newEmployeeImage === preset.url;
                              return (
                                <button
                                  type="button"
                                  key={preset.url}
                                  onClick={() => setNewEmployeeImage(preset.url)}
                                  className={`relative rounded-full overflow-hidden w-9 h-9 border-2 transition-all shrink-0 cursor-pointer ${
                                    isSelected ? 'border-brand-primary scale-110 shadow-md' : 'border-transparent hover:scale-105'
                                  }`}
                                  title={preset.label}
                                >
                                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom URL Option */}
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-wider text-brand-muted mb-1">Or paste custom image URL</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={newEmployeeImage.startsWith('data:') ? '' : newEmployeeImage}
                            onChange={(e) => {
                              if (e.target.value) {
                                setNewEmployeeImage(e.target.value);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 border border-brand-border rounded-lg text-[11px] bg-brand-bg text-brand-text focus:outline-none focus:border-brand-primary font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-4">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer text-center"
                        >
                          Add & Save Employee
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingEmployee(false)}
                          className="px-4 py-2.5 border border-brand-border hover:border-brand-muted bg-white text-brand-text text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Render Settings in Navbar Portal */}
      {portalTarget && createPortal(
        <div className="relative z-50">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-1.5 hover:bg-brand-secondary rounded-lg transition-colors cursor-pointer flex items-center justify-center text-brand-muted hover:text-brand-text"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-56 bg-transparent border border-brand-border/60 rounded-xl shadow-xl overflow-hidden backdrop-blur-md"
              >
                <div className="flex flex-col py-1">
                  <button
                    onClick={() => {
                      if (editingSalon && window.confirm("Avbryt redigering? Endringer blir ikke lagret.")) {
                        handleResetForm();
                      }
                      setActiveTab('register');
                      setShowSuccess(false);
                      setIsSettingsOpen(false);
                    }}
                    className={`px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors cursor-pointer ${
                      activeTab === 'register' ? 'font-black text-brand-primary' : 'font-semibold text-brand-text/90 hover:text-brand-text'
                    }`}
                  >
                    Add new location profile
                  </button>
                  <button
                    onClick={() => { setActiveTab('calendar'); setIsAddingEmployee(true); setIsSettingsOpen(false); }}
                    className="px-4 py-2 text-left text-sm font-semibold text-brand-text/90 hover:bg-black/5 hover:text-brand-text transition-colors cursor-pointer"
                  >
                    Add specialist
                  </button>
                  <div className="px-4 py-2 flex items-center justify-between hover:bg-black/5">
                    <span className="text-sm font-semibold text-brand-text/90">Interval</span>
                    <select
                      value={gridTimeInterval}
                      onChange={(e) => setGridTimeInterval(Number(e.target.value) as 15 | 30 | 60)}
                      className="bg-transparent border border-brand-border/40 rounded-md text-xs font-black px-2 py-1 focus:outline-none cursor-pointer text-brand-text"
                    >
                      <option value={15}>15m</option>
                      <option value={30}>30m</option>
                      <option value={60}>60m</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        portalTarget
      )}
    </div>
  );
}
