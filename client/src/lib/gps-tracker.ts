// GPS Tracker — provides location tracking and distance-to-next calculations
// Works offline using the phone's GPS chip (satellite-based, no internet needed)

export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number; // meters
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface NearestTrailPoint {
  lat: number;
  lng: number;
  distanceFromTrail: number; // meters from user to nearest trail point
  cumulativeDistance: number; // km along trail from start
}

// Haversine distance between two points in meters
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert meters to miles
export function metersToMiles(m: number): number {
  return m * 0.000621371;
}

// Find the nearest point on the trail to the user's GPS position
export function findNearestTrailPoint(
  userLat: number,
  userLng: number,
  trailPoints: [number, number][] // [lat, lng][]
): NearestTrailPoint | null {
  if (trailPoints.length === 0) return null;

  let minDist = Infinity;
  let nearestIdx = 0;

  for (let i = 0; i < trailPoints.length; i++) {
    const d = haversineMeters(userLat, userLng, trailPoints[i][0], trailPoints[i][1]);
    if (d < minDist) {
      minDist = d;
      nearestIdx = i;
    }
  }

  // Calculate cumulative distance along trail to this point
  let cumDist = 0;
  for (let i = 1; i <= nearestIdx; i++) {
    cumDist += haversineMeters(
      trailPoints[i - 1][0], trailPoints[i - 1][1],
      trailPoints[i][0], trailPoints[i][1]
    );
  }

  return {
    lat: trailPoints[nearestIdx][0],
    lng: trailPoints[nearestIdx][1],
    distanceFromTrail: minDist,
    cumulativeDistance: cumDist / 1000, // km
  };
}

// Calculate distance from current position to a target along the trail
export function distanceToTarget(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  trailPoints: [number, number][]
): number {
  // Simple straight-line distance in meters
  return haversineMeters(userLat, userLng, targetLat, targetLng);
}

// Start watching GPS position
export function watchPosition(
  onPosition: (pos: GpsPosition) => void,
  onError: (err: GeolocationPositionError) => void
): number | null {
  if (!navigator.geolocation) return null;

  return navigator.geolocation.watchPosition(
    (pos) => {
      onPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp,
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    }
  );
}

// Stop watching GPS position
export function clearWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}
