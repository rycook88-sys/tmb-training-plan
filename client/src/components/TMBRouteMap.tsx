// TMB Route Map — Leaflet + OpenTopoMap with real GPX trail data
// Design: Alpine dark theme, topo map showing actual hiking trails
// Trail segments colored by country (France/Italy/Switzerland)
// Food stop markers appear when a specific day is selected
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Map, Bus, Layers, Mountain, UtensilsCrossed, LocateFixed, Navigation, Play, Square, MoreHorizontal, X, BarChart3 } from "lucide-react";
import ElevationProfile from "@/components/ElevationProfile";
import { TMB_ITINERARY } from "@/lib/data";
import { FOOD_STOPS, DAY_MILES, getStopsForDay } from "@/lib/tmb-food-stops";
import { OfflineMapManager } from "@/components/OfflineMapManager";
import AvatarCropper, { getAvatarUrl, onAvatarChange } from "@/components/AvatarCropper";
import { watchPosition, clearWatch, haversineMeters, metersToMiles, type GpsPosition } from "@/lib/gps-tracker";
import { useUnits } from "@/contexts/UnitContext";
import trailDataRaw from "@/lib/tmb-trail-data.json";
import countrySegmentsRaw from "@/lib/tmb-country-segments.json";
import "leaflet/dist/leaflet.css";

const trailData = trailDataRaw as unknown as Record<string, [number, number][]>;

interface CountrySegment {
  country: string;
  day: number;
  points: [number, number][];
}
const countrySegments = countrySegmentsRaw as unknown as CountrySegment[];

interface Accommodation {
  day: number;
  name: string;
  lat: number;
  lng: number;
  elevation: string;
  type: "start" | "hut" | "hotel" | "gite" | "rifugio" | "auberge" | "end";
  image: string;
  country: string;
  note?: string;
}

// D# = where you WAKE UP and START that day's hike
const ACCOMMODATIONS: Accommodation[] = [
  {
    day: 0,
    name: "RockyPop Hotel",
    lat: 45.8972406,
    lng: 6.8152178,
    elevation: "1,008m",
    type: "start",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rockypop_e77608f8.jpg",
    country: "France",
    note: "Arrive & rest — walk to Les Houches trailhead tomorrow",
  },
  {
    day: 1,
    name: "Les Houches Trailhead",
    lat: 45.8910,
    lng: 6.7980,
    elevation: "1,008m",
    type: "start",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rockypop_e77608f8.jpg",
    country: "France",
    note: "Day 1 start — hike to Gîte Le Pontet",
  },
  {
    day: 2,
    name: "Gîte Le Pontet",
    lat: 45.802991,
    lng: 6.722181,
    elevation: "1,183m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/gite-le-pontet_3f84378c.jpg",
    country: "France",
    note: "Day 2 start — hike to Les Chapieux, bus to BSM",
  },
  {
    day: 3,
    name: "Hotel Base Camp Lodge",
    lat: 45.696411,
    lng: 6.733627,
    elevation: "1,593m",
    type: "hotel",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/base-camp-lodge_73fd4672.jpg",
    country: "France",
    note: "Day 3 start — bus back, hike to Rifugio Elisabetta",
  },
  {
    day: 4,
    name: "Rifugio Elisabetta",
    lat: 45.767213,
    lng: 6.837629,
    elevation: "2,146m",
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rifugio-elisabetta_66a22f61.jpg",
    country: "Italy",
    note: "Day 4 start — hike to Rifugio Maison Vieille",
  },
  {
    day: 5,
    name: "Rifugio Maison Vieille",
    lat: 45.79085,
    lng: 6.93129,
    elevation: "1,981m",
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/maison-vieille_fa54cb04.jpg",
    country: "Italy",
    note: "Day 5 start — hike to Rifugio Chapy",
  },
  {
    day: 6,
    name: "Rifugio Chapy Mont Blanc",
    lat: 45.82309,
    lng: 6.96586,
    elevation: "1,429m",
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rifugio-chapy_59cb8b94.jpg",
    country: "Italy",
    note: "Day 6 start — hike to Gîte La Peule",
  },
  {
    day: 7,
    name: "Gîte Alpage de La Peule",
    lat: 45.89864,
    lng: 7.11268,
    elevation: "2,106m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/alpage-la-peule_f059aaa4.jpg",
    country: "Switzerland",
    note: "Day 7 start — hike to Relais D'Arpette",
  },
  {
    day: 8,
    name: "Relais D'Arpette",
    lat: 46.02985,
    lng: 7.09294,
    elevation: "1,633m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/relais-arpette_f7e434cb.jpg",
    country: "Switzerland",
    note: "Day 8 start — hike to Auberge Mont Blanc",
  },
  {
    day: 9,
    name: "Auberge Mont Blanc",
    lat: 46.05623,
    lng: 6.99534,
    elevation: "1,314m",
    type: "auberge",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/auberge-mont-blanc_4ef2c0b7.jpg",
    country: "Switzerland",
    note: "Day 9 start — hike to Grassonnet",
  },
  {
    day: 10,
    name: "Gîte Le Nouveau Grassonnet",
    lat: 45.96998,
    lng: 6.91680,
    elevation: "1,193m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/nouveau-grassonnet_51afd809.jpg",
    country: "France",
    note: "Day 10 start — final push to Planpraz, cable car to Chamonix!",
  },
];

// Bus route from Les Chapieux to Bourg-Saint-Maurice
const BUS_ROUTE: [number, number][] = [
  [45.69641, 6.73363],
  [45.68500, 6.73800],
  [45.67000, 6.74500],
  [45.65500, 6.75500],
  [45.64000, 6.76000],
  [45.61830, 6.76940],
];

const COUNTRY_COLORS: Record<string, string> = {
  france: "#F97316",
  italy: "#22C55E",
  switzerland: "#EF4444",
};

function getTypeLabel(type: Accommodation["type"]): string {
  switch (type) {
    case "start": return "Starting Hotel";
    case "hotel": return "Hotel";
    case "gite": return "Gîte";
    case "rifugio": return "Rifugio";
    case "auberge": return "Auberge";
    default: return "Accommodation";
  }
}

const COUNTRY_DISPLAY_COLORS: Record<string, string> = {
  France: "#F97316",
  Italy: "#22C55E",
  Switzerland: "#EF4444",
};

const STOP_TYPE_EMOJI: Record<string, string> = {
  refuge: "🍽️",
  restaurant: "🍕",
  cafe: "☕",
  supermarket: "🛒",
  "food-truck": "🍟",
};

export function TMBRouteMap({ highlightDay, onDayHover, onGpsUpdate }: { highlightDay?: number | null; onDayHover?: (day: number | null) => void; onGpsUpdate?: (pos: GpsPosition | null) => void }) {
  const u = useUnits();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showFoodStops, setShowFoodStops] = useState(true);
  const [mapLayer, setMapLayer] = useState<"topo" | "satellite">("topo");
  const [viewMode, setViewMode] = useState<"map" | "elevation">("map");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const foodStopMarkersRef = useRef<L.Marker[]>([]);
  const trailLayersRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsPosition, setGpsPosition] = useState<GpsPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);
  const gpsCircleRef = useRef<L.Circle | null>(null);
  const [distanceToNext, setDistanceToNext] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simIndexRef = useRef(0);
  const [avatarCropperOpen, setAvatarCropperOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(getAvatarUrl);

  // Listen for avatar changes
  useEffect(() => {
    return onAvatarChange(() => {
      setAvatarUrl(getAvatarUrl());
      // Force recreate the marker with new image
      if (gpsMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(gpsMarkerRef.current);
        gpsMarkerRef.current = null;
      }
    });
  }, []);

  // Track whether map has been initialized (once, never destroyed)
  const mapInitializedRef = useRef(false);

  // Initialize map ONCE on first open — never destroy it
  useEffect(() => {
    if (!isOpen || mapInitializedRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      LRef.current = L;

      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [45.88, 6.92],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
      });

      const topoLayer = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 17,
          attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        }
      );
      topoLayer.addTo(map);
      tileLayerRef.current = topoLayer;

      mapInstanceRef.current = map;

      const trailGroup = L.layerGroup().addTo(map);
      trailLayersRef.current = trailGroup;

      // Draw trail segments colored by country
      countrySegments.forEach((seg) => {
        const latLngs = seg.points.map(([lat, lon]: [number, number]) => L.latLng(lat, lon));
        const color = COUNTRY_COLORS[seg.country] || "#F97316";

        L.polyline(latLngs, {
          color: "#000000",
          weight: 6,
          opacity: 0.3,
        }).addTo(trailGroup);

        L.polyline(latLngs, {
          color,
          weight: 4,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(trailGroup);
      });

      // Draw bus route (dashed)
      const busLatLngs = BUS_ROUTE.map(([lat, lon]) => L.latLng(lat, lon));
      L.polyline(busLatLngs, {
        color: "#94A3B8",
        weight: 3,
        opacity: 0.8,
        dashArray: "10, 8",
      }).addTo(map);

      // Create accommodation markers
      ACCOMMODATIONS.forEach((acc) => {
        const itDay = TMB_ITINERARY.find((d) => d.day === acc.day);

        const isStart = acc.day === 0;
        const isSpecial = isStart;
        const markerSize = isSpecial ? 36 : 30;
        const markerLabel = acc.day === 0 ? "ARR" : `D${acc.day}`;
        const markerBg = isStart ? "#F97316" : "#0F172A";
        const markerBorder = isStart ? "#FED7AA" : "#F97316";
        const icon = L.divIcon({
          className: "tmb-marker",
          html: `<div style="
            display:flex;align-items:center;justify-content:center;
            width:${markerSize}px;height:${markerSize}px;
            border-radius:50%;
            background:${markerBg};
            border:3px solid ${markerBorder};
            color:white;font-weight:700;font-size:12px;
            font-family:'JetBrains Mono',monospace;
            box-shadow:0 2px 8px rgba(0,0,0,0.5);
            cursor:pointer;
          ">${markerLabel}</div>`,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        });

        const marker = L.marker([acc.lat, acc.lng], { icon }).addTo(map);

        const popupHtml = `
          <div style="font-family:system-ui,-apple-system,sans-serif;width:260px;padding:0;margin:-14px -20px -14px -20px;">
            <img src="${acc.image}" alt="${acc.name}" 
              style="width:calc(100% + 0px);height:130px;object-fit:cover;display:block;" />
            <div style="padding:10px 14px 12px;">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="background:${COUNTRY_DISPLAY_COLORS[acc.country] || "#6B7280"};color:white;font-size:10px;padding:1px 6px;border-radius:3px;font-weight:600;">${acc.country}</span>
                <span style="color:#94A3B8;font-size:10px;">${getTypeLabel(acc.type)}</span>
              </div>
              <h3 style="margin:3px 0;font-size:15px;font-weight:700;color:#1E293B;">
                Day ${acc.day}: ${acc.name}
              </h3>
              <p style="margin:2px 0;font-size:11px;color:#64748B;">Elevation: ${acc.elevation}</p>
              ${itDay ? `
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid #E2E8F0;">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:10px;">
                    <span style="color:#64748B;">Distance:</span><span style="color:#1E293B;font-weight:600;">${u.dist(itDay.distanceMi)} ${u.distUnit}</span>
                    <span style="color:#64748B;">Duration:</span><span style="color:#1E293B;font-weight:600;">${itDay.duration}</span>
                    <span style="color:#22C55E;">↑ Ascent:</span><span style="color:#1E293B;font-weight:600;">${u.elev(itDay.ascent)} ${u.elevUnit}</span>
                    <span style="color:#EF4444;">↓ Descent:</span><span style="color:#1E293B;font-weight:600;">${u.elev(itDay.descent)} ${u.elevUnit}</span>
                  </div>
                </div>
              ` : ""}
              ${acc.note ? `<p style="margin-top:6px;font-size:10px;color:#F97316;font-style:italic;">${acc.note}</p>` : ""}
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          maxWidth: 280,
          className: "tmb-popup",
        });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all trail data
      const allPoints: L.LatLng[] = [];
      countrySegments.forEach((seg) => {
        seg.points.forEach(([lat, lon]: [number, number]) => {
          allPoints.push(L.latLng(lat, lon));
        });
      });
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [30, 30] });
      }

      setTimeout(() => map.invalidateSize(), 100);
      mapInitializedRef.current = true;
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // When section reopens, tell Leaflet to recalculate its size
  useEffect(() => {
    if (isOpen && mapInstanceRef.current) {
      // Multiple invalidateSize calls to handle CSS transition timing
      const timers = [50, 150, 300, 500].map(ms =>
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), ms)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  // Handle layer switching
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current || !tileLayerRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    tileLayerRef.current.remove();

    if (mapLayer === "topo") {
      tileLayerRef.current = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 17,
          attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 18,
          attribution: "&copy; Esri",
        }
      ).addTo(map);
    }
  }, [mapLayer]);

  // ── Add/remove food stop markers when selectedDay or showFoodStops changes ──
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    // Remove existing food stop markers
    foodStopMarkersRef.current.forEach(m => m.remove());
    foodStopMarkersRef.current = [];

    // Only show food stops if a day is selected and toggle is on
    if (!selectedDay || !showFoodStops) return;

    const dayStops = getStopsForDay(selectedDay);
    const dayMiles = DAY_MILES[selectedDay] || 0;

    dayStops.forEach((stop) => {
      const emoji = STOP_TYPE_EMOJI[stop.type] || "🍽️";
      const isHighlight = stop.highlight;
      const size = isHighlight ? 28 : 24;
      const borderColor = isHighlight ? "#F59E0B" : "#64748B";
      const bgColor = isHighlight ? "#451A03" : "#1E293B";

      const icon = L.divIcon({
        className: "tmb-food-marker",
        html: `<div style="
          display:flex;align-items:center;justify-content:center;
          width:${size}px;height:${size}px;
          border-radius:6px;
          background:${bgColor};
          border:2px solid ${borderColor};
          font-size:${size - 10}px;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          cursor:pointer;
        ">${emoji}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon, zIndexOffset: 1000 }).addTo(map);

      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;width:220px;padding:8px 10px;margin:-14px -20px -14px -20px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="font-size:16px;">${emoji}</span>
            <span style="font-size:13px;font-weight:700;color:#1E293B;">${stop.name}</span>
          </div>
          <div style="display:flex;gap:8px;font-size:10px;color:#64748B;margin-bottom:4px;">
            <span style="background:#F0FDF4;color:#16A34A;padding:1px 5px;border-radius:3px;font-weight:600;">${u.distUnit} ${u.isMetric ? (stop.mileIn * 1.60934).toFixed(1) : stop.mileIn.toFixed(1)} of ${u.dist(dayMiles)}</span>
            <span>${stop.type}</span>
          </div>
          ${isHighlight ? '<div style="font-size:10px;color:#D97706;font-weight:600;margin-bottom:2px;">⭐ Don\'t miss!</div>' : ""}
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 240,
        className: "tmb-popup",
      });

      foodStopMarkersRef.current.push(marker);
    });
  }, [selectedDay, showFoodStops]);

  const flyToDay = (day: number) => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const map = mapInstanceRef.current;
    const L = LRef.current;

    setSelectedDay(day);

    const typedTrailData = trailData as Record<string, [number, number][]>;
    const stagePoints = typedTrailData[day.toString()];
    if (stagePoints && stagePoints.length > 0) {
      const bounds = L.latLngBounds(
        stagePoints.map(([lat, lon]: [number, number]) => L.latLng(lat, lon))
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Don't open popup from strip buttons — only from tapping map bubbles
    if (mapInstanceRef.current) {
      mapInstanceRef.current.closePopup();
    }
  };

  const showAll = () => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;
    setSelectedDay(null);

    const allPoints: L.LatLng[] = [];
    countrySegments.forEach((seg) => {
      seg.points.forEach(([lat, lon]: [number, number]) => {
        allPoints.push(L.latLng(lat, lon));
      });
    });
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] });
    }
    map.closePopup();
  };

  // GPS tracking — update marker and accuracy circle on map
  useEffect(() => {
    if (!gpsActive || !gpsPosition || !mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;
    const { lat, lng, accuracy } = gpsPosition;

    // Create or update the face marker
    if (!gpsMarkerRef.current) {
      const markerSize = 44;
      const icon = L.divIcon({
        className: "gps-marker",
        html: `<div style="width:${markerSize}px;height:${markerSize}px;border-radius:50%;border:3px solid #3b82f6;box-shadow:0 0 12px rgba(59,130,246,0.6);background-image:url('${avatarUrl}');background-size:100% 100%;background-position:center;background-repeat:no-repeat;background-color:#1c1917"></div>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });
      gpsMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
    } else {
      gpsMarkerRef.current.setLatLng([lat, lng]);
    }

    // Pan map to follow during simulation
    if (simulating) {
      map.panTo([lat, lng], { animate: true, duration: 0.1 });
    }

    // Create or update accuracy circle
    if (!gpsCircleRef.current) {
      gpsCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 1,
        opacity: 0.3,
      }).addTo(map);
    } else {
      gpsCircleRef.current.setLatLng([lat, lng]);
      gpsCircleRef.current.setRadius(accuracy);
    }

    // Calculate distance to next accommodation
    if (selectedDay !== null && selectedDay >= 1 && selectedDay <= 10) {
      const nextDay = ACCOMMODATIONS.find(a => a.day === selectedDay + 1) || ACCOMMODATIONS.find(a => a.day === selectedDay);
      if (nextDay) {
        const dist = haversineMeters(lat, lng, nextDay.lat, nextDay.lng);
        const mi = metersToMiles(dist);
        setDistanceToNext(`${u.isMetric ? (mi * 1.60934).toFixed(1) : mi.toFixed(1)} ${u.distUnit} to ${nextDay.name.split("–")[0].trim()}`);
      }
    } else {
      // Find closest accommodation and show distance
      let minDist = Infinity;
      let closestAcc = ACCOMMODATIONS[0];
      for (const acc of ACCOMMODATIONS) {
        if (acc.day === 0) continue;
        const d = haversineMeters(lat, lng, acc.lat, acc.lng);
        if (d < minDist) { minDist = d; closestAcc = acc; }
      }
      const mi = metersToMiles(minDist);
      setDistanceToNext(`${u.isMetric ? (mi * 1.60934).toFixed(1) : mi.toFixed(1)} ${u.distUnit} to ${closestAcc.name.split("–")[0].trim()}`);
    }
  }, [gpsActive, gpsPosition, selectedDay, simulating, avatarUrl]);

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchRef.current !== null) {
        clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  const toggleGps = () => {
    if (gpsActive) {
      // Stop tracking
      if (gpsWatchRef.current !== null) {
        clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
      // Remove marker and circle
      if (gpsMarkerRef.current) {
        gpsMarkerRef.current.remove();
        gpsMarkerRef.current = null;
      }
      if (gpsCircleRef.current) {
        gpsCircleRef.current.remove();
        gpsCircleRef.current = null;
      }
      setGpsActive(false);
      setGpsPosition(null);
      setGpsError(null);
      setDistanceToNext(null);
      onGpsUpdate?.(null);
    } else {
      // Start tracking
      setGpsError(null);
      const id = watchPosition(
        (pos) => {
          setGpsPosition(pos);
          setGpsError(null);
          onGpsUpdate?.(pos);
        },
        (err) => {
          setGpsError(err.code === 1 ? "Location access denied" : err.code === 2 ? "Position unavailable" : "GPS timeout");
        }
      );
      if (id !== null) {
        gpsWatchRef.current = id;
        setGpsActive(true);
      } else {
        setGpsError("GPS not available");
      }
    }
  };

  const centerOnGps = () => {
    if (gpsPosition && mapInstanceRef.current) {
      mapInstanceRef.current.setView([gpsPosition.lat, gpsPosition.lng], 14);
    }
  };

  // ── Trail Simulation ──────────────────────────────────────────────
  // Builds a flat array of all trail points across all days
  const allTrailPoints = useRef<[number, number][]>([]);
  if (allTrailPoints.current.length === 0) {
    for (let d = 1; d <= 10; d++) {
      const pts = trailData[String(d)];
      if (pts) allTrailPoints.current.push(...pts);
    }
  }

  const startSimulation = useCallback(() => {
    // Stop real GPS if active
    if (gpsWatchRef.current !== null) {
      clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }

    const pts = allTrailPoints.current;
    if (pts.length === 0) return;

    // ~110 miles in 5 minutes (~22 mph)
    // Trail has ~2519 points over 5 min (300s)
    // That's ~8.4 points per second, or one point every ~119ms.
    const INTERVAL_MS = 120; // ~8 points/sec — smooth movement
    const TOTAL_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    simIndexRef.current = 0;
    setSimulating(true);
    setGpsActive(true);

    const startTime = Date.now();

    simIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= TOTAL_DURATION_MS || simIndexRef.current >= pts.length) {
        stopSimulation();
        return;
      }

      const pt = pts[simIndexRef.current];
      const fakePos: GpsPosition = {
        lat: pt[0],
        lng: pt[1],
        accuracy: 10,
        altitude: null,
        speed: 9.8, // ~22 mph in m/s (110mi / 5min)
        heading: null,
        timestamp: Date.now(),
      };
      setGpsPosition(fakePos);
      onGpsUpdate?.(fakePos);
      simIndexRef.current++;
    }, INTERVAL_MS);
  }, [onGpsUpdate]);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    // Remove marker and circle
    if (gpsMarkerRef.current) {
      gpsMarkerRef.current.remove();
      gpsMarkerRef.current = null;
    }
    if (gpsCircleRef.current) {
      gpsCircleRef.current.remove();
      gpsCircleRef.current = null;
    }
    setSimulating(false);
    setGpsActive(false);
    setGpsPosition(null);
    setDistanceToNext(null);
    onGpsUpdate?.(null);
  }, [onGpsUpdate]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  return (
    <section className="container py-6">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground font-mono flex items-center gap-3 font-semibold">
          <span className="text-xl">{viewMode === "map" ? "🗺️" : "📈"}</span> {viewMode === "map" ? "TMB Route Map" : "Elevation Profile"}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">{viewMode === "map" ? "10 hiking days · 3 countries · real trail data" : `${u.dist(109.5)} ${u.distUnit} · ${u.elev(8244)} ${u.elevUnit} peak · 10 stages`}</span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-all duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Map Content — always in DOM, hidden via CSS so Leaflet stays alive */}
      <div className="space-y-3 pb-6" style={{ display: isOpen ? 'block' : 'none' }}>
          {/* Day selector pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={showAll}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                selectedDay === null
                  ? "bg-violet-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              ALL
            </button>
            {ACCOMMODATIONS.map((acc) => (
              <button
                key={acc.day}
                onClick={() => flyToDay(acc.day)}
                onMouseEnter={() => onDayHover?.(acc.day)}
                onMouseLeave={() => onDayHover?.(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                  selectedDay === acc.day || highlightDay === acc.day
                    ? "bg-violet-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {acc.day === 0 ? "ARR" : `D${acc.day}`}
                {acc.day === 2 && <Bus className="w-3 h-3" />}
              </button>
            ))}
          </div>

          {/* Legend + Layer toggle + Food stops toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-violet-500 rounded-full inline-block" />
                FRANCE
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-green-500 rounded-full inline-block" />
                ITALY
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-red-500 rounded-full inline-block" />
                SWITZERLAND
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
                BUS
              </span>
              {selectedDay && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded bg-amber-900/80 border border-amber-500 text-center leading-4 text-[8px]">🍽️</span>
                  FOOD STOPS
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 1. Layer toggle — leftmost */}
              <button
                onClick={() => setMapLayer(mapLayer === "topo" ? "satellite" : "topo")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                {mapLayer === "topo" ? (
                  <><Layers className="w-3 h-3" /> SATELLITE</>
                ) : (
                  <><Mountain className="w-3 h-3" /> TOPO MAP</>
                )}
              </button>
              {/* 2. Food stops toggle */}
              <button
                onClick={() => setShowFoodStops(!showFoodStops)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono transition-colors ${
                  showFoodStops
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
                    : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                }`}
                title={showFoodStops ? "Hide food stops" : "Show food stops"}
              >
                <UtensilsCrossed className="w-3 h-3" />
                {showFoodStops ? "FOOD STOPS" : "FOOD STOPS"}
              </button>
              {/* 3. GPS locate me — main row */}
              <button
                onClick={toggleGps}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono transition-colors ${
                  gpsActive
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-400 hover:bg-blue-500/25"
                    : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                }`}
                title={gpsActive ? "Stop GPS tracking" : "Show my location"}
              >
                <LocateFixed className="w-3 h-3" />
                {gpsActive ? "GPS ON" : "LOCATE ME"}
              </button>
              {/* GPS center button (only when GPS active) */}
              {gpsActive && gpsPosition && (
                <button
                  onClick={centerOnGps}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-blue-500/40 bg-blue-500/10 text-[10px] font-mono text-blue-400 hover:bg-blue-500/20"
                  title="Center map on my location"
                >
                  <Navigation className="w-3 h-3" /> CENTER
                </button>
              )}
              {/* 4. View toggle — Map / Elevation */}
              <button
                onClick={() => setViewMode(viewMode === "map" ? "elevation" : "map")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono transition-colors ${
                  viewMode === "elevation"
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                {viewMode === "map" ? (
                  <><BarChart3 className="w-3 h-3" /> ELEVATION</>
                ) : (
                  <><Map className="w-3 h-3" /> ROUTE MAP</>
                )}
              </button>
              {/* 5. More menu — contains Locate Me, Simulate, Download Maps, Avatar */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex items-center justify-center w-8 h-8 rounded-md border text-[10px] font-mono transition-colors ${
                    moreMenuOpen
                      ? "bg-slate-700 border-slate-500 text-slate-200"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                  title="More options"
                >
                  {moreMenuOpen ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
                </button>
                {moreMenuOpen && (
                  <>
                  <div className="fixed inset-0 z-[999]" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-[1000] w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                    {/* Trail simulation */}
                    <button
                      onClick={() => { simulating ? stopSimulation() : startSimulation(); setMoreMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-mono transition-colors border-b border-slate-800 ${
                        simulating
                          ? "text-green-400 bg-green-500/10"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {simulating ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {simulating ? "STOP SIMULATION" : "SIMULATE TRAIL"}
                    </button>
                    {/* Offline map download */}
                    <div className="px-3 py-2.5 border-b border-slate-800">
                      <OfflineMapManager />
                    </div>
                    {/* Avatar photo */}
                    <button
                      onClick={() => { setAvatarCropperOpen(true); setMoreMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full border border-slate-600 overflow-hidden flex-shrink-0">
                        <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                      GPS AVATAR PHOTO
                    </button>
                  </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Avatar cropper modal */}
          <AvatarCropper open={avatarCropperOpen} onClose={() => setAvatarCropperOpen(false)} />

          {/* GPS info bar */}
          {gpsActive && (
            <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {simulating ? "SIMULATING TRAIL" : "GPS ACTIVE"}
              </span>
              {simulating && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-green-400">Point {simIndexRef.current} / {allTrailPoints.current.length}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-emerald-400">{u.dist(110, 0)} {u.distUnit} / 5 min</span>
                </>
              )}
              {gpsPosition && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-300">{gpsPosition.lat.toFixed(5)}, {gpsPosition.lng.toFixed(5)}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">±{Math.round(gpsPosition.accuracy)}m</span>
                  {gpsPosition.altitude && (
                    <>
                      <span className="text-slate-400">·</span>
                      <span className="text-emerald-400">{u.isMetric ? Math.round(gpsPosition.altitude) : Math.round(gpsPosition.altitude * 3.281)}{u.elevUnit}</span>
                    </>
                  )}
                  {distanceToNext && (
                    <>
                      <span className="text-slate-400">·</span>
                      <span className="text-orange-400">{distanceToNext}</span>
                    </>
                  )}
                </>
              )}
              {gpsError && (
                <span className="text-red-400">{gpsError}</span>
              )}
            </div>
          )}

          {/* Selected day info bar */}
          {selectedDay !== null && selectedDay >= 1 && selectedDay <= 10 && (
            <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono">
              <span className="text-violet-400 font-bold">Day {selectedDay}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">{u.dist(DAY_MILES[selectedDay] || 0)} {u.distUnit}</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-400">{getStopsForDay(selectedDay).length} food stops</span>
              {getStopsForDay(selectedDay).filter(s => s.highlight).length > 0 && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-amber-300">⭐ {getStopsForDay(selectedDay).filter(s => s.highlight).length} must-try</span>
                </>
              )}
            </div>
          )}

          {/* Map Container — only visible in map mode */}
          <div style={{ display: viewMode === "map" ? "block" : "none" }}>
            <div className="rounded-xl overflow-hidden border border-slate-700/50">
              <div
                ref={mapContainerRef}
                className="h-[450px] sm:h-[550px] w-full"
                style={{ background: "#1a1a2e" }}
              />
            </div>
          </div>

          {/* Elevation Profile — only visible in elevation mode */}
          {viewMode === "elevation" && (
            <div className="border border-slate-700/50 rounded-xl overflow-hidden">
              <ElevationProfile highlightDay={highlightDay} onDayHover={onDayHover} gpsPosition={gpsPosition ? { lat: gpsPosition.lat, lng: gpsPosition.lng } : null} embedded />
            </div>
          )}

          {/* Accommodation thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
            {ACCOMMODATIONS.map((acc) => (
              <button
                key={acc.day}
                onClick={() => flyToDay(acc.day)}
                onMouseEnter={() => onDayHover?.(acc.day)}
                onMouseLeave={() => onDayHover?.(null)}
                className={`relative rounded-lg overflow-hidden border transition-all group cursor-pointer ${
                  selectedDay === acc.day || highlightDay === acc.day
                    ? "border-violet-500 ring-1 ring-violet-500/30"
                    : "border-slate-700/50 hover:border-slate-600"
                }`}
              >
                <img
                  src={acc.image}
                  alt={acc.name}
                  className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <span className={`text-[10px] font-mono font-bold text-violet-400 bg-black/70 px-1.5 py-0.5 rounded`}>
                    {acc.day === 0 ? "ARRIVE" : `DAY ${acc.day}`}
                  </span>
                  <p className="text-[10px] text-white font-medium leading-tight truncate">
                    {acc.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
      </div>

      {/* Leaflet popup styling */}
      <style>{`
        .tmb-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .tmb-popup .leaflet-popup-content {
          margin: 14px 20px;
          line-height: 1.4;
        }
        .tmb-popup .leaflet-popup-tip {
          background: white;
        }
        .tmb-marker {
          background: transparent !important;
          border: none !important;
        }
        .tmb-food-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: #1E293B !important;
          color: #F97316 !important;
          border-color: #334155 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #334155 !important;
        }
      `}</style>
    </section>
  );
}
