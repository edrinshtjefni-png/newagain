export const REAL_SALON_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '1': { lat: 59.9312, lng: 10.4837 },         // Aura Hair Studio (Rykkinn, Bærum)
  '2': { lat: 59.8907, lng: 10.5262 },         // Luxe Nail Lounge (Sandvika, Bærum)
  '3': { lat: 59.9298, lng: 10.7136 },         // Soma Wellness & Massage (Majorstuen, Oslo)
  '4': { lat: 59.9231, lng: 10.7573 },         // The Golden Razor (Grünerløkka, Oslo)
  '5': { lat: 59.9115, lng: 10.7579 },         // Prism Brow & Lash Bar (Sentrum, Oslo)
  '6': { lat: 60.3928, lng: 5.3221 },          // Fjord Spa Retreat (Bryggen, Bergen)
  '7': { lat: 63.4305, lng: 10.3951 },         // Nidaros Barber Co (Bakklandet, Trondheim)
  '8': { lat: 58.9699, lng: 5.7331 },          // Stavanger Style & Co (Sentrum, Stavanger)
  '9': { lat: 59.7441, lng: 10.2045 },         // Drammen Beauty Hub (Strømsø, Drammen)
  '10': { lat: 69.6492, lng: 18.9553 },        // Arctic Glow Aesthetics (Sentrum, Tromsø)
  '11': { lat: 58.1467, lng: 7.9956 },         // Sørlandets Velvet (Markens gate, Kristiansand)
};

export function gridToLatLng(x: number, y: number) {
  const MinLon = 4.0;
  const MaxLon = 31.5;
  const MinLat = 57.9;
  const MaxLat = 71.2;
  const lon = MinLon + ((x - 5) / 90) * (MaxLon - MinLon);
  const lat = MinLat + ((95 - y) / 90) * (MaxLat - MinLat);
  return { lat, lng: lon };
}

export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

export function getSalonLatLng(salon: any) {
  if (REAL_SALON_COORDINATES[salon.id]) {
    return REAL_SALON_COORDINATES[salon.id];
  }
  if (salon.coords) {
    return gridToLatLng(salon.coords.x, salon.coords.y);
  }
  return { lat: 59.9139, lng: 10.7522 }; // Fallback Oslo
}

export function calculateDistance(salon: any, userLoc: { lat: number; lng: number }) {
  const salonLatLng = getSalonLatLng(salon);
  const dist = getHaversineDistance(userLoc.lat, userLoc.lng, salonLatLng.lat, salonLatLng.lng);
  return Number(dist.toFixed(1));
}
