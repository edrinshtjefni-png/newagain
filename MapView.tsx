import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Compass, Star, Heart, X, Info, HelpCircle, Layers, Search, SlidersHorizontal, Map } from 'lucide-react';
import { Salon } from '../types';
import L from 'leaflet';
import SalonCard from './SalonCard';

const DAYS: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  søn: 0, man: 1, tir: 2, ons: 3, tor: 4, fre: 5, lør: 6
};

function dayInDocRange(dayNum: number, rangeStr: string): boolean {
  const clean = rangeStr.trim().toLowerCase();
  if (clean === 'daily' || clean === 'all days' || clean === 'alle dager' || clean === 'åpent alle dager') return true;
  
  const shortDay = clean.substring(0, 3);
  if (DAYS[shortDay] === dayNum) return true;

  if (clean.includes('-') || clean.includes('–') || clean.includes('til')) {
    const separator = clean.includes('-') ? '-' : clean.includes('–') ? '–' : 'til';
    const parts = clean.split(separator);
    if (parts.length === 2) {
      const startDayStr = parts[0].trim().substring(0, 3);
      const endDayStr = parts[1].trim().substring(0, 3);
      const startDay = DAYS[startDayStr];
      const endDay = DAYS[endDayStr];
      
      if (startDay !== undefined && endDay !== undefined) {
        if (startDay <= endDay) {
          return dayNum >= startDay && dayNum <= endDay;
        } else {
          return dayNum >= startDay || dayNum <= endDay;
        }
      }
    }
  }
  return false;
}

function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d+):(\d+)\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];
  
  if (ampm) {
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
  }
  return hours * 60 + minutes;
}

export interface AvailabilityStatus {
  isOpen: boolean;
  statusText: string;
  badgeColor: string;
}

export function getSalonAvailability(hoursStr: string, currentDate: Date = new Date()): AvailabilityStatus {
  try {
    const currentDay = currentDate.getDay();
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    
    const parts = hoursStr.split(/[•;,]/);
    let activeTodaySpec: { range: string; timeRange: string } | null = null;
    
    for (const part of parts) {
      const subParts = part.split(':');
      if (subParts.length >= 2) {
        const range = subParts[0].trim();
        const timeRange = subParts.slice(1).join(':').trim();
        
        if (dayInDocRange(currentDay, range)) {
          if (range.toLowerCase() !== 'daily' && range.toLowerCase() !== 'alle dager') {
            activeTodaySpec = { range, timeRange };
            break;
          } else if (!activeTodaySpec) {
            activeTodaySpec = { range, timeRange };
          }
        }
      }
    }
    
    if (!activeTodaySpec) {
      return {
        isOpen: false,
        statusText: 'Closed Today',
        badgeColor: 'text-rose-600 bg-rose-50 border border-rose-200/60'
      };
    }
    
    const timeRange = activeTodaySpec.timeRange;
    if (timeRange.toLowerCase() === 'closed' || timeRange.toLowerCase() === 'stengt') {
      return {
        isOpen: false,
        statusText: 'Closed Today',
        badgeColor: 'text-rose-600 bg-rose-50 border border-rose-200/60'
      };
    }
    
    const times = timeRange.split('-');
    if (times.length !== 2) {
      return {
        isOpen: false,
        statusText: 'Closed',
        badgeColor: 'text-rose-600 bg-rose-50 border border-rose-200/60'
      };
    }
    
    const openTimeStr = times[0].trim();
    const closeTimeStr = times[1].trim();
    
    const openMinutes = parseTimeToMinutes(openTimeStr);
    const closeMinutes = parseTimeToMinutes(closeTimeStr);
    
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return {
        isOpen: true,
        statusText: `Open Now • Closes at ${closeTimeStr}`,
        badgeColor: 'text-emerald-700 bg-emerald-50 border border-emerald-200'
      };
    } else if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        statusText: `Closed • Opens at ${openTimeStr}`,
        badgeColor: 'text-amber-700 bg-amber-50/70 border border-amber-200/60'
      };
    } else {
      return {
        isOpen: false,
        statusText: `Closed • Closes at ${closeTimeStr}`,
        badgeColor: 'text-rose-600 bg-rose-50 border border-rose-200/60'
      };
    }
  } catch (error) {
    console.error('Error parsing salon availability:', error);
    return {
      isOpen: true,
      statusText: 'Open Now',
      badgeColor: 'text-emerald-700 bg-emerald-50 border border-emerald-200'
    };
  }
}

interface MapViewProps {
  salons: Salon[];
  userFavorites: string[];
  onToggleFavorite: (id: string, e?: any) => void;
  onSelectSalon: (id: string) => void;
  onClose: () => void;
  initialUserLoc?: { lat: number; lng: number };
  userLocName?: string;
}

// Static coordinate definitions on our 0-100 relative SVG grid (Norway Map Fallback)
export const SALON_COORDINATES: Record<string, { x: number; y: number; neighborhood: string }> = {
  '1': { x: 22, y: 86, neighborhood: 'Rykkinn, Bærum' },         // Aura Hair Studio
  '2': { x: 21, y: 88, neighborhood: 'Sandvika, Bærum' },        // Luxe Nail Lounge
  '3': { x: 24.5, y: 84, neighborhood: 'Majorstuen, Oslo' },     // Soma Wellness & Massage
  '4': { x: 26, y: 84, neighborhood: 'Grünerløkka, Oslo' },      // The Golden Razor
  '5': { x: 25, y: 86, neighborhood: 'Sentrum, Oslo' },          // Prism Brow & Lash Bar
  '6': { x: 23.5, y: 85, neighborhood: 'Frogner, Oslo' },        // Nirvana Thermal Spa
  '7': { x: 5, y: 81, neighborhood: 'Bryggen, Bergen' },         // Fjord Spa & Wellness
  '8': { x: 23, y: 58, neighborhood: 'Midtbyen, Trondheim' },    // Nidaros Barber & Salon
  '9': { x: 6, y: 92, neighborhood: 'Fargegaten, Stavanger' },   // Viking Hair & Beard
  '10': { x: 54, y: 12, neighborhood: 'Sentrum, Tromsø' },       // Arctic Glow Aesthetics
  '11': { x: 14, y: 96, neighborhood: 'Markens gate, Kristiansand' }, // Sørlandets Velvet
};

// Exact real-world latitudes and longitudes for our static salons
export const REAL_SALON_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '1': { lat: 59.9312, lng: 10.4837 },         // Aura Hair Studio (Rykkinn, Bærum)
  '2': { lat: 59.8907, lng: 10.5262 },         // Luxe Nail Lounge (Sandvika, Bærum)
  '3': { lat: 59.9298, lng: 10.7136 },         // Soma Wellness & Massage (Majorstuen, Oslo)
  '4': { lat: 59.9231, lng: 10.7573 },         // The Golden Razor (Grünerløkka, Oslo)
  '5': { lat: 59.9115, lng: 10.7579 },         // Prism Brow & Lash Bar (Sentrum, Oslo)
  '6': { lat: 59.9185, lng: 10.7042 },         // Nirvana Thermal Spa (Frogner, Oslo)
  '7': { lat: 60.3975, lng: 5.3246 },          // Fjord Spa & Wellness (Bryggen, Bergen)
  '8': { lat: 63.4305, lng: 10.3951 },         // Nidaros Barber & Salon (Midtbyen, Trondheim)
  '9': { lat: 58.9723, lng: 5.7345 },          // Viking Hair & Beard (Fargegaten, Stavanger)
  '10': { lat: 69.6492, lng: 18.9553 },        // Arctic Glow Aesthetics (Sentrum, Tromsø)
  '11': { lat: 58.1467, lng: 7.9949 },         // Sørlandets Velvet (Markens gate, Kristiansand)
};

// Helper to project relative 0-100 grid coords to real Norway latitudes & longitudes (for custom newly registered salons)
function gridToLatLng(x: number, y: number) {
  const lat = 69.65 - (y - 12) * 0.1369;
  const lng = 5.32 + (x - 5) * 0.2784;
  return { lat, lng };
}

// Haversine formula to compute actual physical distance in kilometers
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export default function MapView({
  salons,
  userFavorites,
  onToggleFavorite,
  onSelectSalon,
  onClose,
  initialUserLoc,
  userLocName,
}: MapViewProps) {
  // User location using real latitude and longitude coordinates. Default is Rykkinn.
  const [userLoc, setUserLoc] = useState(() => initialUserLoc || { lat: 59.9272, lng: 10.4784 });

  // Map state and custom GPS/styling simulations
  const [mapStyle, setMapStyle] = useState<'default' | 'satellite' | 'terrain'>('default');
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPegmanToast, setShowPegmanToast] = useState(false);

  // Nominatim Address Geocoding States
  const [searchMode, setSearchMode] = useState<'salons' | 'address'>('salons');
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Debounced search for Autocomplete via OpenStreetMap Nominatim Geocoding API
  useEffect(() => {
    if (searchMode !== 'address' || !addressQuery || addressQuery.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsGeocoding(true);

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressQuery
        )}&limit=5&countrycodes=no`;
        
        const response = await fetch(url, {
          headers: {
            'Accept-Language': 'no,nb,nn,en',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map((item: any) => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            isGoogle: false
          }));
          setAddressSuggestions(formatted);
        } else {
          console.error("Nominatim API error:", response.statusText);
        }
      } catch (err) {
        console.error("Failed to fetch address from Nominatim:", err);
      } finally {
        setIsGeocoding(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [addressQuery, searchMode]);

  // Handler for selecting an address suggestion (using static lat/lng from Nominatim)
  const handleSelectSuggestion = (item: any) => {
    const lat = item.lat;
    const lng = item.lon;
    if (!isNaN(lat) && !isNaN(lng)) {
      setUserLoc({ lat, lng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
      }
      setAddressQuery(item.display_name);
      setAddressSuggestions([]);
    }
  };

  // Sync state with parent's initial geolocation
  useEffect(() => {
    if (initialUserLoc) {
      setUserLoc(initialUserLoc);
    }
  }, [initialUserLoc]);

  // CRITICAL: Truly Live GPS Tracker using browser watchPosition.
  // Updates user's map coordinates automatically when they move physically.
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Live GPS watch update received:", latitude, longitude);
        setUserLoc({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.warn("Live GPS watch tracking failed/denied:", error);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const [hoveredSalonId, setHoveredSalonId] = useState<string | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);

  // Quick instructions tooltip toggle
  const [showTooltip, setShowTooltip] = useState(true);

  // References for leaflet map container and elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersMapRef = useRef<Record<string, L.Marker>>({});

  // Helper to dynamically resolve coordinates to real Lat/Lng
  const getSalonLatLng = (salon: Salon) => {
    if (REAL_SALON_COORDINATES[salon.id]) {
      return REAL_SALON_COORDINATES[salon.id];
    }
    if (salon.coords) {
      return gridToLatLng(salon.coords.x, salon.coords.y);
    }
    // Fallback to static mapping
    const staticCoords = SALON_COORDINATES[salon.id];
    if (staticCoords) {
      return gridToLatLng(staticCoords.x, staticCoords.y);
    }
    return { lat: 59.9272, lng: 10.4784 }; // Rykkinn fallback
  };

  const getSalonNeighborhood = (salon: Salon) => {
    if (SALON_COORDINATES[salon.id]) {
      return SALON_COORDINATES[salon.id].neighborhood;
    }
    if (salon.coords && salon.coords.neighborhood) {
      return salon.coords.neighborhood;
    }
    return 'Norge';
  };

  // Calculate distance in kilometers between user's live position and the salon
  const calculateDistance = (salon: Salon) => {
    const salonLatLng = getSalonLatLng(salon);
    const dist = getHaversineDistance(userLoc.lat, userLoc.lng, salonLatLng.lat, salonLatLng.lng);
    return Number(dist.toFixed(1));
  };

  // Compile salons with live proximity distance sorted from closest to furthest
  const salonsWithProximity = useMemo(() => {
    return salons
      .map((salon) => {
        return {
          ...salon,
          distance: calculateDistance(salon),
          neighborhood: getSalonNeighborhood(salon),
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [salons, userLoc]);

  // Filter salons based on Google Search bar input
  const filteredSalons = useMemo(() => {
    let list = salonsWithProximity;
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    
    if (q.includes('topp') || q.includes('★') || q.includes('top') || q.includes('rang')) {
      return list.filter(s => s.rating >= 4.8);
    }
    
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.neighborhood.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [salonsWithProximity, searchQuery]);

  // Selected salon details helper
  const activeSelectedSalon = useMemo(() => {
    return filteredSalons.find((s) => s.id === selectedSalonId) || salonsWithProximity.find((s) => s.id === selectedSalonId);
  }, [filteredSalons, salonsWithProximity, selectedSalonId]);

  const selectedAvailability = useMemo(() => {
    if (!activeSelectedSalon) return null;
    return getSalonAvailability(activeSelectedSalon.hours);
  }, [activeSelectedSalon]);

  // Initialize Leaflet Map with perfect resize invalidation
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center map initially around user's GPS location
    const initialCenter = userLoc;

    const map = L.map(mapContainerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: 14.3,
      zoomSnap: 0.1,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Handle map clicks to simulate relocation of user's live GPS
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      console.log("Simulating custom GPS position via map click:", lat, lng);
      setUserLoc({ lat, lng });
    });

    // ResizeObserver monitors the map container div to prevent any grey-map issues
    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch (e) {
        // ignore
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    // Multiple staggered invalidation timers to handle transitions and page load timing perfectly
    const timers = [100, 300, 600, 1200].map(delay =>
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {
          // ignore
        }
      }, delay)
    );

    return () => {
      resizeObserver.disconnect();
      timers.forEach(clearTimeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer dynamically when map style changes (using 100% reliable public servers)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Default: Minimalist Clean Light
    let tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (mapStyle === 'satellite') {
      // Voyager Elegant (Highly detailed modern design, optimized for labels and navigation)
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    } else if (mapStyle === 'terrain') {
      // Topographic view matching picture 1
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution: attribution
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  // Update User GPS Pin Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const latLng = userLoc;

    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-7 h-7 rounded-full bg-purple-500 opacity-25 animate-ping"></div>
          <div class="absolute w-4 h-4 rounded-full bg-purple-500 opacity-45"></div>
          <div class="relative w-3.5 h-3.5 bg-purple-600 rounded-full border-2 border-white shadow-lg"></div>
        </div>
      `,
      className: 'custom-user-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    userMarkerRef.current = L.marker([latLng.lat, latLng.lng], {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(mapInstanceRef.current);
  }, [userLoc]);

  // Helper to determine salon category emojis
  const getSalonEmoji = (type: string) => {
    if (type === 'Hair Salon' || type === 'Barbershop') return '✂️';
    if (type === 'Nail Salon') return '💅';
    if (type === 'Eyebrows & Lashes') return '✨';
    if (type === 'Spa' || type === 'Massage & Body') return '💆';
    return '📍';
  };

  // Sync and Redraw Salon Map Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers safely
    Object.keys(markersMapRef.current).forEach(key => {
      const marker = markersMapRef.current[key];
      if (marker) {
        marker.remove();
      }
    });
    markersMapRef.current = {};

    filteredSalons.forEach(salon => {
      const salonLatLng = getSalonLatLng(salon);
      const isSelected = selectedSalonId === salon.id;
      const isHovered = hoveredSalonId === salon.id;
      const availability = getSalonAvailability(salon.hours);

      const pinBgColor = isSelected || isHovered ? '#000000' : '#1A1A1A';
      const scaleClass = isSelected || isHovered ? 'scale-110 z-50' : 'scale-100 z-10';

      const salonIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-200 ${scaleClass}">
            <div class="bg-black text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-black/20">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" class="text-white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span class="text-[10px] font-bold leading-none">${salon.rating ? salon.rating.toFixed(1) : '5.0'}</span>
            </div>
            <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-black -mt-[1px]"></div>
          </div>
        `,
        className: 'custom-salon-icon',
        iconSize: [40, 24],
        iconAnchor: [20, 24]
      });

      const marker = L.marker([salonLatLng.lat, salonLatLng.lng], {
        icon: salonIcon,
        zIndexOffset: isSelected ? 500 : isHovered ? 400 : 0
      }).addTo(mapInstanceRef.current!);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedSalonId(salon.id);
      });

      markersMapRef.current[salon.id] = marker;
    });
  }, [filteredSalons, selectedSalonId, hoveredSalonId]);

  // Center/Pan Map when selected salon changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedSalonId) {
      // Find salon
      const salon = salons.find(s => s.id === selectedSalonId);
      if (salon) {
        const salonLatLng = getSalonLatLng(salon);
        mapInstanceRef.current.setView([salonLatLng.lat, salonLatLng.lng], 14, { animate: true });
      }
    }
  }, [selectedSalonId, salons]);

  // Handlers for Zoom actions
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Center map on user's live position
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLoc.lat, userLoc.lng], 14.3, { animate: true });
    }
  };

  return (
    <div className="fixed inset-0 bg-instagram-gradient z-50 flex flex-col md:flex-row overflow-hidden">
      {/* 1. LEFT SIDEBAR: Salon Directory matching the main app grid */}
      <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full z-10">
        
        {/* Header bar matching the picture */}
        <div className="flex items-center justify-between py-4 px-6 border-b border-black/10">
          <div className="flex items-center gap-2 bg-white/40 rounded-full px-1 py-1 backdrop-blur-sm">
            <button className="px-4 py-1.5 bg-white rounded-full text-xs font-bold shadow-sm text-brand-text">Venues</button>
            <button className="px-4 py-1.5 text-xs font-bold text-brand-text/60">Professionals</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-transparent rounded-full text-xs font-bold border border-black/10 flex items-center gap-2 hover:bg-black/5 transition-colors">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <button onClick={onClose} className="p-2 bg-white/40 hover:bg-white/60 backdrop-blur-sm rounded-full text-brand-text shadow-sm transition-colors cursor-pointer border border-black/5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Directory List sorted by proximity, rendered as a grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
          {filteredSalons.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-8 h-8 text-black/30 mx-auto mb-2 opacity-55" />
              <p className="text-sm text-black/50 font-bold">No matching salons to show on map</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {filteredSalons.map((salon) => (
                <div 
                  key={salon.id}
                  onMouseEnter={() => setHoveredSalonId(salon.id)}
                  onMouseLeave={() => setHoveredSalonId(null)}
                >
                  <SalonCard
                    salon={salon}
                    isFavorite={userFavorites.includes(salon.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={() => onSelectSalon(salon.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT PANEL: Full-height Leaflet Canvas */}
      <div className="flex-1 md:flex-none md:w-1/2 relative bg-[#F5F5F5] h-[50vh] md:h-full overflow-hidden select-none">
        
        {/* Floating Controls (Top Right) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
          <button
            onClick={() => {/* no-op for visual match */}}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-black/70 hover:bg-white hover:text-black hover:shadow-md transition-all cursor-pointer"
            title="Expand Map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>

        {/* Bottom Right Map Controls */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-3 items-center">
          {/* Recenter Navigation */}
          <button
            onClick={handleRecenter}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-black/70 hover:bg-white hover:text-black hover:shadow-md transition-all cursor-pointer"
            title="Locate me"
          >
            <Navigation className="w-5 h-5 fill-transparent" />
          </button>

          {/* Zoom In/Out Stack */}
          <div className="bg-white/90 backdrop-blur-md rounded-full shadow-sm flex flex-col overflow-hidden">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 flex items-center justify-center text-black/70 hover:bg-white hover:text-black transition-all cursor-pointer border-b border-black/10"
              title="Zoom in"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 flex items-center justify-center text-black/70 hover:bg-white hover:text-black transition-all cursor-pointer"
              title="Zoom out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
            </button>
          </div>
        </div>

        {/* Pegman Simulation Toast */}
        <AnimatePresence>
          {showPegmanToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-28 left-4 right-4 md:left-auto md:right-4 bg-gray-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl z-30 flex items-center gap-2 border border-white/10"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping" />
              <span>Street View simulert for {userLocName || 'Rykkinn'}! 📸 360° visning aktiv.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Layout Canvas Container */}
        <div className="absolute inset-0 z-10">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
        </div>
      </div>
    </div>
  );
}
