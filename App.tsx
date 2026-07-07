import React, { useState, useEffect } from 'react';
import { calculateDistance } from './utils/distance';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, X, Star, Calendar, RefreshCw, Scissors, Sparkles, Map, User, Compass, Navigation, Apple, Zap, ChevronDown } from 'lucide-react';
import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';
import SalonCard from './components/SalonCard';
import SalonDetail from './components/SalonDetail';
import BookingFlow from './components/BookingFlow';
import ProfileBookings from './components/ProfileBookings';
import MapView from './components/MapView';
import BusinessPortal from './components/BusinessPortal';
import AdminPortal from './components/AdminPortal';
import AuthModal from './components/AuthModal';
import { INITIAL_SALONS, INITIAL_USER, SERVICE_CATEGORIES } from './data';
import { Salon, Service, Booking, UserProfile } from './types';
import { safeLocalStorage } from './utils/safeStorage';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { useLanguage } from './contexts/LanguageContext';
import { 
  db,
  getCloudUserProfile, 
  saveCloudUserProfile, 
  getAllCloudBookings, 
  saveCloudBooking, 
  getAllCloudSalons, 
  saveCloudSalon, 
  deleteCloudSalon 
} from './firebase';

export default function App() {
  const { t } = useLanguage();
  // --- VERSION DIAGNOSTIC LOG ---
  useEffect(() => {
    console.log(
      "%c🚀 StraksTime.no - Live Version v2.0.0 Active (Firebase Cloud Sync)! If you are seeing login issues in your browser tab, please perform a Hard Reload (Ctrl+F5 or Cmd+Shift+R) to clear old browser cache.",
      "color: #15803d; font-weight: bold; font-size: 14px; padding: 4px;"
    );
  }, []);

  // --- STATE INITIALIZATION ---
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = safeLocalStorage.getItem('strakstime_user_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return null; // Guest state by default to let them log in
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = safeLocalStorage.getItem('strakstime_bookings_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    
    // Seed some initial bookings so the user has some data to play with instantly
    const now = new Date();
    const futureDate = new Date(now.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000); // 14.5 hours in the future
    const locale = 'en-US';
    const dayName = futureDate.toLocaleDateString(locale, { weekday: 'long' });
    const monthName = futureDate.toLocaleDateString(locale, { month: 'long' });
    const dayNum = futureDate.getDate();
    const yearNum = futureDate.getFullYear();
    
    // Format time
    let hours = futureDate.getHours();
    const minutes = futureDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const timeStr = `${hours}:${minutesStr} ${ampm}`;
    const dynamicDateTime = `${dayName}, ${monthName} ${dayNum}, ${yearNum} • ${timeStr}`;

    const seedBookings: Booking[] = [
      {
        id: 'seed_urgent',
        salonId: '3',
        salonName: 'Soma Wellness & Massage',
        salonImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
        salonAddress: '24 Parkveien, Oslo',
        service: {
          id: 's301',
          name: '60 Min Deep Tissue Massage',
          duration: 60,
          price: 110,
          description: 'Therapeutic deep muscle treatment to relieve stress and tension.',
          category: 'Massage'
        },
        stylist: {
          id: 'st301',
          name: 'Marcus Thorne',
          role: 'Registered Massage Therapist',
          rating: 4.8,
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
        },
        dateTime: dynamicDateTime,
        price: 110,
        status: 'upcoming'
      },
      {
        id: 'seed_1',
        salonId: '1',
        salonName: 'Aura Hair Studio',
        salonImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
        salonAddress: '428 Crescent Blvd, Suite 100, Metropolis',
        service: {
          id: 's101',
          name: "Women's Precision Haircut & Blow Dry",
          duration: 60,
          price: 95,
          description: 'Includes luxurious shampoo, deep conditioning, and custom style.',
          category: 'Hair'
        },
        stylist: {
          id: 'st101',
          name: 'Sofia Chen',
          role: 'Master Colorist',
          rating: 4.9,
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        },
        dateTime: 'Thursday, July 2 • 2:30 PM',
        price: 95,
        status: 'upcoming'
      },
      {
        id: 'seed_2',
        salonId: '2',
        salonName: 'Luxe Nail Lounge',
        salonImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80',
        salonAddress: '812 Marble Arch Way, Metropolis',
        service: {
          id: 's201',
          name: 'Signature Gel Manicure',
          duration: 45,
          price: 55,
          description: 'Includes nail shaping, cuticle therapy, and long-lasting gel.',
          category: 'Nails'
        },
        stylist: {
          id: 'st201',
          name: 'Emily Rossi',
          role: 'Nail Artist Specialist',
          rating: 4.9,
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
        },
        dateTime: 'Tuesday, June 16 • 11:15 AM',
        price: 55,
        status: 'completed'
      }
    ];
    return seedBookings;
  });

  const [salons, setSalons] = useState<Salon[]>(() => {
    const saved = safeLocalStorage.getItem('strakstime_salons_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) { /* fallback */ }
    }
    // Set seed owner emails for demo business partners
    return INITIAL_SALONS.map(salon => {
      if (salon.id === '1') {
        return { ...salon, ownerEmail: 'lars@barber.no' };
      }
      if (salon.id === '3') {
        return { ...salon, ownerEmail: 'sonia@spa.no' };
      }
      return salon;
    });
  });

  // GPS Location and simulated welcome email notification state
  const [initialUserLoc, setInitialUserLoc] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [userLocName, setUserLocName] = useState<string>("Din enhet");
  const [welcomeEmailUser, setWelcomeEmailUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortOption, setSortOption] = useState<'highest-rated' | 'price-low-high' | 'nearest'>('highest-rated');

  const [currentView, setCurrentView] = useState<'home' | 'bookings' | 'favorites' | 'profile' | 'salon-detail' | 'business' | 'admin'>('home');
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<'customer' | 'business'>('customer');

  // Active booking flow states
  const [bookingSalon, setBookingSalon] = useState<Salon | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);

  // --- CLOUD SYNCHRONIZATION EVENT LISTENERS ---
  useEffect(() => {
    // 1. Real-time sync for salons
    const salonsCol = collection(db, "salons");
    const unsubSalons = onSnapshot(salonsCol, (snapshot) => {
      try {
        let cloudSalons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Salon);
        if (cloudSalons.length === 0) {
          const defaultSalons = INITIAL_SALONS.map(salon => {
            if (salon.id === '1') {
              return { ...salon, ownerEmail: 'lars@barber.no' };
            }
            if (salon.id === '3') {
              return { ...salon, ownerEmail: 'sonia@spa.no' };
            }
            return salon;
          });
          // Seed cloud in background, don't block
          Promise.all(defaultSalons.map(s => saveCloudSalon(s))).catch(err => {
            console.error("Background seeding salons error:", err);
          });
          cloudSalons = defaultSalons;
        }
        setSalons(cloudSalons);
      } catch (err) {
        console.error("Salons real-time sync processing error:", err);
      }
    }, (error) => {
      console.error("Salons real-time sync subscription error. Trying direct getDocs fallback:", error);
      getAllCloudSalons().then((cloudSalons) => {
        if (cloudSalons && cloudSalons.length > 0) {
          setSalons(cloudSalons);
        } else {
          const saved = safeLocalStorage.getItem('strakstime_salons_v3');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.length > 0) setSalons(parsed);
            } catch (e) { /* fallback */ }
          }
        }
      }).catch(err => {
        console.error("Direct getDocs fallback for salons also failed:", err);
        const saved = safeLocalStorage.getItem('strakstime_salons_v3');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.length > 0) setSalons(parsed);
          } catch (e) { /* fallback */ }
        }
      });
    });

    // 2. Real-time sync for bookings
    const bookingsCol = collection(db, "bookings");
    const unsubBookings = onSnapshot(bookingsCol, (snapshot) => {
      try {
        let cloudBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Booking);
        if (cloudBookings.length === 0) {
          const now = new Date();
          const futureDate = new Date(now.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000);
          const locale = 'en-US';
          const dayName = futureDate.toLocaleDateString(locale, { weekday: 'long' });
          const monthName = futureDate.toLocaleDateString(locale, { month: 'long' });
          const dayNum = futureDate.getDate();
          const yearNum = futureDate.getFullYear();
          let hr = futureDate.getHours();
          const min = futureDate.getMinutes();
          const ampm = hr >= 12 ? 'PM' : 'AM';
          hr = hr % 12 || 12;
          const minStr = min < 10 ? '0' + min : min;
          const dynamicDateTime = `${dayName}, ${monthName} ${dayNum}, ${yearNum} • ${hr}:${minStr} ${ampm}`;

          const initialSeed: Booking[] = [
            {
              id: 'seed_urgent',
              salonId: '3',
              salonName: 'Soma Wellness & Massage',
              salonImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
              salonAddress: '24 Parkveien, Oslo',
              service: {
                id: 's301',
                name: '60 Min Deep Tissue Massage',
                duration: 60,
                price: 110,
                description: 'Therapeutic deep muscle treatment to relieve stress and tension.',
                category: 'Massage'
              },
              stylist: {
                id: 'st301',
                name: 'Marcus Thorne',
                role: 'Registered Massage Therapist',
                rating: 4.8,
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
              },
              dateTime: dynamicDateTime,
              price: 110,
              status: 'upcoming'
            },
            {
              id: 'seed_1',
              salonId: '1',
              salonName: 'Aura Hair Studio',
              salonImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
              salonAddress: '428 Crescent Blvd, Suite 100, Metropolis',
              service: {
                id: 's101',
                name: "Women's Precision Haircut & Blow Dry",
                duration: 60,
                price: 95,
                description: 'Includes luxurious shampoo, deep conditioning, and custom style.',
                category: 'Hair'
              },
              stylist: {
                id: 'st101',
                name: 'Sofia Chen',
                role: 'Master Colorist',
                rating: 4.9,
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              },
              dateTime: 'Thursday, July 2 • 2:30 PM',
              price: 95,
              status: 'upcoming'
            },
            {
              id: 'seed_2',
              salonId: '2',
              salonName: 'Luxe Nail Lounge',
              salonImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80',
              salonAddress: '812 Marble Arch Way, Metropolis',
              service: {
                id: 's201',
                name: 'Signature Gel Manicure',
                duration: 45,
                price: 55,
                description: 'Includes nail shaping, cuticle therapy, and long-lasting gel.',
                category: 'Nails'
              },
              stylist: {
                id: 'st201',
                name: 'Emily Rossi',
                role: 'Nail Artist Specialist',
                rating: 4.9,
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
              },
              dateTime: 'Tuesday, June 16 • 11:15 AM',
              price: 55,
              status: 'completed'
            }
          ];
          // Seed cloud in background, don't block
          Promise.all(initialSeed.map(b => saveCloudBooking(b))).catch(err => {
            console.error("Background seeding bookings error:", err);
          });
          cloudBookings = initialSeed;
        }
        setBookings(cloudBookings);
      } catch (err) {
        console.error("Bookings real-time sync processing error:", err);
      }
    }, (error) => {
      console.error("Bookings real-time sync subscription error. Trying direct getDocs fallback:", error);
      getAllCloudBookings().then((cloudBookings) => {
        if (cloudBookings && cloudBookings.length > 0) {
          setBookings(cloudBookings);
        } else {
          const saved = safeLocalStorage.getItem('strakstime_bookings_v3');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed) setBookings(parsed);
            } catch (e) { /* fallback */ }
          }
        }
      }).catch(err => {
        console.error("Direct getDocs fallback for bookings also failed:", err);
        const saved = safeLocalStorage.getItem('strakstime_bookings_v3');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed) setBookings(parsed);
          } catch (e) { /* fallback */ }
        }
      });
    });

    // 3. Sync cached user initially
    const savedUserJson = safeLocalStorage.getItem('strakstime_user_v3');
    if (savedUserJson) {
      try {
        const cachedUser = JSON.parse(savedUserJson);
        if (cachedUser && cachedUser.email) {
          getCloudUserProfile(cachedUser.email).then((freshProfile) => {
            if (freshProfile) {
              setUser(freshProfile);
            } else {
              saveCloudUserProfile(cachedUser).then(() => {
                setUser(cachedUser);
              });
            }
          }).catch(err => {
            console.error("Background profile sync error:", err);
            setUser(cachedUser);
          });
        }
      } catch (e) {
        console.error("Initial cached user profile load error:", e);
      }
    }

    return () => {
      unsubSalons();
      unsubBookings();
    };
  }, []);

  // --- CURRENT USER PROFILE LIVE SYNC (ONCE LOGGED IN OR RE-AUTHENTICATED) ---
  useEffect(() => {
    if (!user?.email) return;
    const userDocRef = doc(db, "users", user.email.trim().toLowerCase());
    const unsubUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const freshProfile = snapshot.data() as UserProfile;
        if (JSON.stringify(freshProfile) !== JSON.stringify(user)) {
          setUser(freshProfile);
        }
      }
    }, (error) => {
      console.error("Current user real-time sync error:", error);
    });

    return () => {
      unsubUser();
    };
  }, [user?.email]);

  // --- LOCAL CACHE EFFECTS ---
  useEffect(() => {
    if (user) {
      safeLocalStorage.setItem('strakstime_user_v3', JSON.stringify(user));
    } else {
      safeLocalStorage.removeItem('strakstime_user_v3');
    }
  }, [user]);

  useEffect(() => {
    safeLocalStorage.setItem('strakstime_bookings_v3', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    safeLocalStorage.setItem('strakstime_salons_v3', JSON.stringify(salons));
  }, [salons]);

  // --- ACTIONS ---
  const handleRegisterSalon = async (newSalon: Salon) => {
    setSalons((prev) => [newSalon, ...prev]);
    await saveCloudSalon(newSalon);
    
    // Also add this salon to the owner's salonIds list in Firestore to keep everything 100% in sync
    if (user) {
      const updatedSalonIds = Array.from(new Set([...(user.salonIds || []), newSalon.id]));
      const updatedUser = { ...user, salonIds: updatedSalonIds };
      setUser(updatedUser);
      await saveCloudUserProfile(updatedUser);
    }
  };

  const handleUpdateSalon = async (updatedSalon: Salon) => {
    setSalons((prev) => prev.map((s) => s.id === updatedSalon.id ? updatedSalon : s));
    await saveCloudSalon(updatedSalon);
  };

  const handleDeleteSalon = async (id: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne salongen? Dette kan ikke angres.')) {
      setSalons((prev) => prev.filter((s) => s.id !== id));
      await deleteCloudSalon(id);
    }
  };

  const handleSortChange = (option: 'highest-rated' | 'price-low-high' | 'nearest') => {
    setSortOption(option);
    if (option === 'nearest' && !initialUserLoc) {
      handleActivateLocation();
    }
  };

  const handleActivateLocation = () => {
    setIsLocating(true);
    
    const fallbackToIpLocation = async () => {
      try {
        console.log("Falling back to IP-based geolocation...");
        let lat: number | null = null;
        let lon: number | null = null;
        let city = "Din plassering";

        // Try ipinfo.io first
        try {
          const ipinfoRes = await fetch("https://ipinfo.io/json");
          if (ipinfoRes.ok) {
            const data = await ipinfoRes.json();
            if (data.loc) {
              const parts = data.loc.split(',');
              lat = parseFloat(parts[0]);
              lon = parseFloat(parts[1]);
              city = data.city || city;
            }
          }
        } catch (e) {
          console.warn("ipinfo.io failed:", e);
        }

        // Try get.geojs.io second if first failed
        if (lat === null || lon === null) {
          const geoResponse = await fetch("https://get.geojs.io/v1/ip/geo.json");
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            lat = parseFloat(geoData.latitude);
            lon = parseFloat(geoData.longitude);
            city = geoData.city || city;
          }
        }

        if (lat !== null && lon !== null) {
          let detectedName = city;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
              {
                headers: {
                  "Accept-Language": "no,en",
                  "User-Agent": "StraksTime-Applet"
                }
              }
            );
            if (response.ok) {
              const data = await response.json();
              if (data && data.address) {
                detectedName = data.address.suburb || 
                               data.address.neighbourhood || 
                               data.address.village || 
                               data.address.town || 
                               data.address.city || 
                               data.address.municipality || 
                               detectedName;
                
                if (detectedName) {
                  detectedName = detectedName.charAt(0).toUpperCase() + detectedName.slice(1);
                }
              }
            }
          } catch (e) {
            console.error("OSM Geocoding failed for IP location:", e);
          }
          
          setInitialUserLoc({ lat, lng: lon });
          setUserLocName(detectedName);
          setIsLocating(false);
          setIsMapViewOpen(true);
          return;
        }
      } catch (e) {
        console.warn("All IP Geolocation methods failed:", e);
      }
      
      // FINAL FALLBACK TO OSLO CENTER
      setInitialUserLoc({ lat: 59.9139, lng: 10.7522 });
      setUserLocName("Oslo");
      setIsLocating(false);
      setIsMapViewOpen(true);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Bounding box for the WHOLE of Norway:
          // MinLon = 4.0, MaxLon = 31.5
          // MinLat = 57.9, MaxLat = 71.2
          const MinLon = 4.0;
          const MaxLon = 31.5;
          const MinLat = 57.9;
          const MaxLat = 71.2;

          // Convert coordinates to 0-100 relative SVG grid
          let gridX = ((lon - MinLon) / (MaxLon - MinLon)) * 100;
          let gridY = 100 - (((lat - MinLat) / (MaxLat - MinLat)) * 100);

          // Clamp grid coordinates safely inside visual boundaries [5, 95]
          const finalX = Math.round(Math.max(5, Math.min(95, gridX)));
          const finalY = Math.round(Math.max(5, Math.min(95, gridY)));

          // Real Integration: Query OpenStreetMap's Nominatim reverse geocoding API
          let detectedName = "Nær deg";
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
              {
                headers: {
                  "Accept-Language": "no,en",
                  "User-Agent": "StraksTime-Applet"
                }
              }
            );
            if (response.ok) {
              const data = await response.json();
              if (data && data.address) {
                detectedName = data.address.suburb || 
                               data.address.neighbourhood || 
                               data.address.village || 
                               data.address.town || 
                               data.address.city || 
                               data.address.municipality || 
                               "Bærum";
                
                if (detectedName) {
                  detectedName = detectedName.charAt(0).toUpperCase() + detectedName.slice(1);
                }
              }
            }
          } catch (e) {
            console.error("OSM Geocoding failed:", e);
            // Quick lat/lon fallback check
            if (lat >= 59.91 && lat <= 59.94 && lon >= 10.44 && lon <= 10.50) {
              detectedName = "Rykkinn";
            } else {
              detectedName = "Bærum / Oslo";
            }
          }

          setInitialUserLoc({ lat, lng: lon });
          setUserLocName(detectedName);
          setIsLocating(false);
          setIsMapViewOpen(true);
        },
        (error) => {
          console.warn("GPS lookup denied or failed, attempting IP fallback:", error);
          fallbackToIpLocation();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      console.warn("Browser does not support geolocation, attempting IP fallback");
      fallbackToIpLocation();
    }
  };
  const handleSearch = (query: string, category?: string, openMap?: boolean) => {
    setSearchQuery(query);
    setSearchCategory(category || '');
    setIsSearchActive(true);
    setCurrentView('home');
    setSelectedSalonId(null);
    if (openMap) {
      setIsMapViewOpen(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchCategory('');
    setIsSearchActive(false);
    setIsMapViewOpen(false);
  };

  const handleNavigate = (view: 'home' | 'bookings' | 'favorites' | 'profile' | 'business' | 'admin') => {
    setCurrentView(view);
    setSelectedSalonId(null);
    setIsMapViewOpen(false);
    if (view === 'home') {
      // Don't clear search instantly so they can go back to their results,
      // but if they click home again, we can reset.
    }
  };

  const handleToggleFavorite = async (id: string, e?: any) => {
    if (e) e.stopPropagation(); // prevent card click
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const isFav = user.favorites.includes(id);
    const newFavorites = isFav
      ? user.favorites.filter((favId) => favId !== id)
      : [...user.favorites, id];
    const updated = { ...user, favorites: newFavorites };
    setUser(updated);
    await saveCloudUserProfile(updated);
  };

  const handleSelectSalon = (id: string) => {
    setSelectedSalonId(id);
    setCurrentView('salon-detail');
  };

  const handleBookService = (service: Service) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedSalonId) return;
    const salon = salons.find((s) => s.id === selectedSalonId);
    if (!salon) return;
    setBookingSalon(salon);
    setBookingService(service);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    setBookings((prev) => prev.map((b) => b.id === updatedBooking.id ? updatedBooking : b));
    await saveCloudBooking(updatedBooking);
  };

  const handleConfirmBooking = async (newBooking: Booking) => {

    setBookings((prev) => [newBooking, ...prev]);
    await saveCloudBooking(newBooking);

    // Send confirmation email via Resend
    if (newBooking.userEmail) {
      try {
        const [date, time] = newBooking.dateTime.split(' • ');
        await fetch('/api/send-booking-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: newBooking.userEmail,
            salonName: newBooking.salonName,
            bookingDetails: {
              serviceName: newBooking.service.name,
              date: date,
              time: time,
            }
          }),
        });
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      }
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment? There are no cancellation fees.')) {
      const target = bookings.find(b => b.id === id);
      if (target) {
        const updated = { ...target, status: 'cancelled' as const };
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? updated : b))
        );
        await saveCloudBooking(updated);
      }
    }
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    await saveCloudUserProfile(updatedProfile);
  };

  // --- SEARCH FILTER ALGORITHM ---
  const filteredSalons = salons.filter((salon) => {
    // 1. Filter by category pill click if active
    if (searchCategory) {
      const categoryMatch = salon.services.some(
        (s) => s.category.toLowerCase() === searchCategory.toLowerCase()
      ) || salon.type.toLowerCase().includes(searchCategory.toLowerCase());
      if (!categoryMatch) return false;
    }

    // 2. Filter by search query if text entered
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = salon.name.toLowerCase().includes(q);
      const typeMatch = salon.type.toLowerCase().includes(q);
      const addressMatch = salon.address.toLowerCase().includes(q);
      const serviceMatch = salon.services.some(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
      return nameMatch || typeMatch || addressMatch || serviceMatch;
    }

    return true;
  }).sort((a, b) => {
    if (sortOption === 'highest-rated') {
      return b.rating - a.rating;
    } else if (sortOption === 'price-low-high') {
      const getMinPrice = (salon: Salon) => salon.services.length > 0 ? Math.min(...salon.services.map(s => s.price)) : 0;
      return getMinPrice(a) - getMinPrice(b);
    } else if (sortOption === 'nearest') {
      if (initialUserLoc) {
        return calculateDistance(a, initialUserLoc) - calculateDistance(b, initialUserLoc);
      }
      return 0; // If no location, keep original order
    }
    return 0;
  });

  const activeSalon = selectedSalonId 
    ? salons.find((s) => s.id === selectedSalonId) 
    : null;

  return (
    <div className="min-h-screen bg-instagram-gradient text-brand-text font-sans antialiased pb-20 pt-[calc(4rem+5vh)]">
      
      {/* 1. TOP NAVIGATION BAR */}
      <Navbar 
        user={user} 
        onNavigate={handleNavigate} 
        currentView={currentView} 
        onOpenAuth={() => {
          setAuthModalInitialRole('customer');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* 2. MAIN WORKSPACE */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          {/* A. HOME LANDING VIEW */}
          {currentView === 'home' && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* Dynamic Search Container layout */}
              <div className={`transition-all duration-500 flex flex-col justify-center ${
                isSearchActive 
                  ? 'pt-6 pb-2 border-b border-brand-border bg-white shadow-3xs' 
                  : 'min-h-[80vh]'
              }`}>
                {/* When Search is active, render search elements in a compact top bar layout */}
                {isSearchActive ? (
                  <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-brand-primary text-white px-2.5 py-1 rounded-md">
                        {searchCategory ? `${t('app.category')}: ${searchCategory}` : t('app.results')}
                      </span>
                      {searchQuery && (
                        <span className="text-xs font-semibold text-brand-muted italic">
                          "{searchQuery}"
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        id="btn-modify-search"
                        onClick={() => setIsSearchActive(false)}
                        className="text-xs font-bold text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{t('app.modify')}</span>
                      </button>
                      <button
                        id="btn-clear-search-filters"
                        onClick={handleClearSearch}
                        className="text-xs font-bold text-brand-muted hover:text-brand-text border border-brand-border hover:border-brand-muted px-3.5 py-1.5 rounded-full bg-white cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t('app.clear')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard centered search bar layout (With only a search bar in the middle) */
                  <HeroSearch 
                    onSearch={handleSearch} 
                    initialQuery={searchQuery}
                    onActivateLocation={handleActivateLocation}
                  />
                )}
              </div>

              {/* Grid of Results: visible only when search is active */}
              {isSearchActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="w-full max-w-5xl mx-auto py-10 px-4 md:px-8"
                >
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <h2 className="font-serif font-extrabold text-xl md:text-2xl text-brand-text">
                      {isSearchActive ? `${t('app.available')} (${filteredSalons.length})` : t('app.featured')}
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <select
                          value={sortOption}
                          onChange={(e) => handleSortChange(e.target.value as 'highest-rated' | 'price-low-high' | 'nearest')}
                          className="appearance-none bg-white border border-brand-border text-brand-text text-xs font-semibold py-2 pl-4 pr-10 rounded-full cursor-pointer hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-3xs"
                        >
                          <option value="highest-rated">Highest Rated</option>
                          <option value="price-low-high">Price (Low to High)</option>
                          <option value="nearest">Nearest</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-muted">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xs text-brand-muted font-semibold hidden sm:block">Instant Booking Confirmed</p>
                    </div>
                  </div>                  {/* Filter Pills */}
                  <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                    <button
                      onClick={() => setSearchCategory('')}
                      className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        searchCategory === ''
                          ? 'bg-brand-text text-white'
                          : 'bg-white text-brand-text border border-brand-border hover:border-brand-text'
                      }`}
                    >
                      All
                    </button>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setSearchCategory(cat.name)}
                        className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          searchCategory === cat.name
                            ? 'bg-brand-text text-white'
                            : 'bg-white text-brand-text border border-brand-border hover:border-brand-text'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
  
                  {(isSearchActive ? filteredSalons.length : salons.length) === 0 ? (
                    <div className="text-center py-16 bg-white border border-brand-border rounded-3xl">
                      <Search className="w-12 h-12 text-brand-muted mx-auto mb-3 opacity-65" />
                      <h4 className="font-serif font-bold text-base text-brand-text">No matching salons found</h4>
                      <p className="text-xs text-brand-muted mt-1 mb-5">Try search keywords like "hair", "nail", "massage" or click "Clear search".</p>
                      <button
                        id="btn-no-results-clear"
                        onClick={handleClearSearch}
                        className="px-5 py-2 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-dark transition-colors"
                      >
                        Reset search filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(isSearchActive ? filteredSalons : salons).map((salon) => (
                        <SalonCard
                          key={salon.id}
                          salon={salon}
                          isFavorite={user ? user.favorites.includes(salon.id) : false}
                          onToggleFavorite={handleToggleFavorite}
                          onSelect={handleSelectSalon}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Floating Action Button for Map View */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-10 md:right-10 z-[60]"
                  >
                    <button
                      onClick={() => setIsMapViewOpen(true)}
                      className="flex items-center gap-2 bg-brand-text text-white px-6 py-3.5 rounded-full shadow-2xl hover:bg-brand-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 border-brand-text/10"
                    >
                      <Map className="w-5 h-5" />
                      <span className="font-bold text-sm tracking-wide">Map View</span>
                    </button>
                  </motion.div>

                </motion.div>
              )}
            </motion.div>
          )}

          {/* B. IMERSIVE SALON PROFILE VIEW */}
          {currentView === 'salon-detail' && activeSalon && (
            <motion.div
              key="salon-detail-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <SalonDetail
                salon={activeSalon}
                isFavorite={user ? user.favorites.includes(activeSalon.id) : false}
                onToggleFavorite={handleToggleFavorite}
                onBack={() => {
                  // If they came from an active search, keep search active
                  setCurrentView('home');
                }}
                onBookService={handleBookService}
                user={user}
                onAuthPrompt={() => setIsAuthModalOpen(true)}
              />
            </motion.div>
          )}

          {/* C. GENERAL PROFILE PAGES (BOOKINGS / FAVORITES / DETAILS) */}
          {(currentView === 'bookings' || currentView === 'favorites' || currentView === 'profile') && (
            <motion.div
              key="profile-pages-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {user ? (
                <ProfileBookings
                  user={user}
                  bookings={bookings}
                  salons={salons}
                  currentSection={currentView as 'bookings' | 'favorites' | 'profile'}
                  onCancelBooking={handleCancelBooking}
                  onUpdateProfile={handleUpdateProfile}
                  onToggleFavorite={handleToggleFavorite}
                  onSelectSalon={handleSelectSalon}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-brand-secondary/50 rounded-full flex items-center justify-center mb-5 border border-brand-border/40">
                    <User className="w-8 h-8 text-brand-muted" />
                  </div>
                  <h3 className="font-serif font-extrabold text-xl text-brand-text mb-2">Access Restricted</h3>
                  <p className="text-xs font-semibold text-brand-muted mb-6 leading-relaxed">
                    Please sign in to view your upcoming bookings, customize profile details, or save your favorite aesthetic venues.
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-6 py-3 bg-brand-primary hover:bg-brand-dark text-white text-xs font-black rounded-full shadow-md transition-all uppercase tracking-widest cursor-pointer"
                  >
                    Sign In to Continue
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* D. BUSINESS PARTNER PORTAL */}
                    {currentView === 'admin' && user && user.role === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex-1"
            >
              <AdminPortal user={user} />
            </motion.div>
          )}
          {currentView === 'business' && (
            <motion.div
              key="business-portal-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <BusinessPortal
                salons={salons}
                user={user}
                onRegisterSalon={handleRegisterSalon}
                onUpdateSalon={handleUpdateSalon}
                onDeleteSalon={handleDeleteSalon}
                bookings={bookings}
                onUpdateBooking={handleUpdateBooking}
                onAddBooking={handleConfirmBooking}
                onNavigateHome={() => {
                  setIsSearchActive(true);
                  setIsMapViewOpen(true);
                  setCurrentView('home');
                }}
                onOpenAuth={() => {
                  setAuthModalInitialRole('business');
                  setIsAuthModalOpen(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FULL-SCREEN INTERACTIVE MAP VIEW */}
      <AnimatePresence>
        {isMapViewOpen && (
          <MapView
            salons={isSearchActive ? filteredSalons : salons}
            userFavorites={user?.favorites || []}
            onToggleFavorite={handleToggleFavorite}
            onSelectSalon={(id) => {
              handleSelectSalon(id);
              setIsMapViewOpen(false);
            }}
            onClose={() => {
              setIsMapViewOpen(false);
              setInitialUserLoc(undefined);
            }}
            initialUserLoc={initialUserLoc}
            userLocName={userLocName}
          />
        )}
      </AnimatePresence>

      {/* 3. STEPPER BOOKING WIZARD OVERLAY */}
      <AnimatePresence>
        {bookingSalon && bookingService && (
          <BookingFlow
            salon={bookingSalon}
            service={bookingService}
            userEmail={user?.email}
            onClose={() => {
              setBookingSalon(null);
              setBookingService(null);
              // Refresh view to bookings so they can see their voucher!
              setCurrentView('bookings');
            }}
            onConfirmBooking={handleConfirmBooking}
          />
        )}
      </AnimatePresence>

      {/* CUSTOMER AUTHENTICATION LOGIN MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal
            initialRole={authModalInitialRole}
            onClose={() => setIsAuthModalOpen(false)}
            onLoginSuccess={(loggedInUser, isNewSignup) => {
              setUser(loggedInUser);
              setIsAuthModalOpen(false);
              if (isNewSignup) {
                setWelcomeEmailUser({ name: loggedInUser.name, email: loggedInUser.email, role: loggedInUser.role });
              }
              if (loggedInUser.role === 'business') {
                setCurrentView('business');
              } else if (loggedInUser.role === 'admin') {
                setCurrentView('admin');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* AESTHETIC FOOTER DECORATION */}
      <footer className="w-full border-t border-brand-border bg-white py-8 mt-20 text-center">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-brand-muted">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setCurrentView('home')}>
            <Zap className="text-yellow-400 rotate-[15deg]" size={16} fill="currentColor" strokeWidth={1} />
            <span className="font-sans font-black tracking-tighter text-brand-text text-sm flex items-center">
              StraksTime<span className="text-brand-muted font-bold ml-[1px]">.no</span>
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <a href="#terms" className="hover:text-brand-text">Terms of service</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-brand-text">Privacy policy</a>
            <span>•</span>
            <a href="#support" className="hover:text-brand-text">Support center</a>
            <span>•</span>
            <a href="/project.zip" download className="hover:text-brand-primary font-bold flex items-center gap-1">
              Download Code (.zip)
            </a>
          </div>
        </div>
      </footer>

      {/* 4. HIGH-PRECISION GPS RADAR LOCATING OVERLAY */}
      <AnimatePresence>
        {isLocating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-text/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white"
          >
            <div className="relative flex items-center justify-center w-36 h-36 mb-6">
              {/* Radar pulse ripples */}
              <div className="absolute inset-0 border-2 border-brand-primary/40 rounded-full animate-ping opacity-75" />
              <div className="absolute inset-4 border border-brand-primary/60 rounded-full animate-ping opacity-50" />
              <div className="absolute inset-8 bg-brand-primary/10 border border-brand-primary/30 rounded-full" />
              {/* Spinning compass needle */}
              <Compass className="w-12 h-12 text-brand-primary animate-spin" />
            </div>
            <h3 className="text-xl font-serif italic text-white tracking-wide">Aktiverer din posisjon...</h3>
            <p className="text-xs text-brand-muted mt-2 font-mono tracking-wider uppercase">Søker etter de nærmeste salongene i Oslo • GPS v2.4</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SIMULATED EMAIL NOTIFICATION CENTER */}
      <AnimatePresence>
        {welcomeEmailUser && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-6 right-6 w-full max-w-md bg-white border-2 border-brand-primary rounded-3xl shadow-2xl z-[90] overflow-hidden"
          >
            {/* Header simulating OS Email Client */}
            <div className="bg-brand-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs text-white">
                  ✉
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wide uppercase leading-tight">StraksTime.no Mail Server</h4>
                  <p className="text-[10px] text-white/70 leading-none">Simulated Welcome Email Alert</p>
                </div>
              </div>
              <button
                onClick={() => setWelcomeEmailUser(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer text-white/90 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Body */}
            <div className="p-6 text-left">
              <div className="border-b border-brand-secondary pb-4 mb-4 text-xs font-semibold text-brand-muted space-y-1">
                <p>
                  <span className="font-bold text-brand-text">Fra:</span> velkommen@strakstime.no
                </p>
                <p>
                  <span className="font-bold text-brand-text">Til:</span> {welcomeEmailUser.email}
                </p>
                <p>
                  <span className="font-bold text-brand-text">Emne:</span> Velkommen til StraksTime.no! 🌟
                </p>
              </div>

              <div className="text-xs leading-relaxed text-brand-text space-y-4 font-medium font-sans">
                <p className="text-sm font-bold text-brand-primary">Hei {welcomeEmailUser.name},</p>
                <p>
                  Velkommen til <strong>StraksTime.no</strong>! Din konto er nå opprettet og fullt aktivert.
                </p>
                {welcomeEmailUser.role === 'business' ? (
                  <p>
                    Takk for at du registrerte bedriften din hos oss! Nå kan du legge til salongen din på kartet vårt, administrere ansatte, og begynne å motta bestillinger fra nye kunder.
                  </p>
                ) : (
                  <p>
                    Hos oss kan du enkelt utforske og bestille de beste skjønnhets- og velværebehandlingene i ditt nærområde med et enkelt klikk. Vårt interaktive kart og GPS-søk hjelper deg alltid med å finne nærmeste ledige time!
                  </p>
                )}
                <div className="bg-brand-secondary p-3.5 rounded-2xl border border-brand-border text-[11px] space-y-1 font-semibold text-brand-muted">
                  <p className="font-extrabold text-brand-text uppercase tracking-wider text-[10px]">Dine kontodetaljer:</p>
                  <p>• Navn: {welcomeEmailUser.name}</p>
                  <p>• Logg-inn: {welcomeEmailUser.email}</p>
                  <p>• Kontostatus: ✓ Aktiv ({welcomeEmailUser.role === 'business' ? 'Partner-konto' : 'Premium-medlem'})</p>
                </div>
                <p className="pt-2 text-brand-muted text-[11px] italic">
                  Vennlig hilsen,<br />
                  <strong>StraksTime.no-teamet 🇳🇴</strong>
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3.5 border-t border-brand-secondary pt-4">
                <button
                  onClick={() => setWelcomeEmailUser(null)}
                  className="px-4 py-2 bg-brand-secondary hover:bg-brand-border border border-brand-border text-brand-text font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Lukk e-post
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
