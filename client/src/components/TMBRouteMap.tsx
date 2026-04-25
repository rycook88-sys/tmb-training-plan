// TMB Route Map — Leaflet + OpenTopoMap with real GPX trail data
// Design: Alpine dark theme, topo map showing actual hiking trails
// Trail segments colored by country (France/Italy/Switzerland)
// Food stop markers appear when a specific day is selected
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Map, Bus, Layers, Mountain, UtensilsCrossed, LocateFixed, Navigation, Play, Square, MoreHorizontal, X, BarChart3, Phone, Mail, Globe, MapPin, Clock, CreditCard, Utensils, Bed, ChevronRight, Building, Droplets } from "lucide-react";
import ElevationProfile from "@/components/ElevationProfile";
import { TMB_ITINERARY } from "@/lib/data";
import { FOOD_STOPS, DAY_MILES, getStopsForDay, type FoodStopGeo } from "@/lib/tmb-food-stops";
import { WATER_SOURCES, PRIMARY_SOURCES, type WaterSource } from "@/lib/tmb-water-sources";
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
  elevation: number;
  type: "start" | "hut" | "hotel" | "gite" | "rifugio" | "auberge" | "end";
  image: string;
  country: string;
  note?: string;
  // Hostel detail fields
  date: string;        // e.g. "Fri, Jul 24"
  nightLabel: string;  // e.g. "Night before Day 1"
  phone?: string;
  email?: string;
  website?: string;
  confirmationCode?: string;
  summary: string;     // Quick 1-2 sentence summary
  hikerTips: string[]; // Detailed tips from research
  amenities: string[]; // Key amenities list
  meals?: string;      // Meal info
  payment?: string;    // Payment methods
  checkIn?: string;    // Check-in time/info
}

// D# = where you WAKE UP and START that day's hike
const ACCOMMODATIONS: Accommodation[] = [
  {
    day: 0,
    name: "RockyPop Hotel",
    lat: 45.8972406,
    lng: 6.8152178,
    elevation: 1008,
    type: "start",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rockypop_e77608f8.jpg",
    country: "France",
    note: "Arrive & rest — walk to Les Houches trailhead tomorrow",
    date: "Thu, Jul 24",
    nightLabel: "Night before Day 1",
    phone: "+33 4 50 53 65 20",
    website: "rockypop.com",
    summary: "Modern hotel near Chamonix. Arrive, rest, and prep gear for the trailhead walk tomorrow.",
    hikerTips: [
      "Check in early if possible — use the afternoon to organize gear and do a final pack shakedown",
      "Restaurant on-site serves dinner and breakfast — carb-load tonight",
      "The trailhead at Les Houches is a short walk or taxi ride from here",
      "Stock up on any last-minute supplies at nearby shops in Chamonix",
    ],
    amenities: ["Private rooms", "Restaurant & bar", "WiFi", "Luggage storage", "Parking"],
    meals: "Dinner and breakfast available on-site",
    payment: "Card accepted",
    checkIn: "From 3:00 PM",
  },
  {
    day: 1,
    name: "Les Houches Trailhead",
    lat: 45.8910,
    lng: 6.7980,
    elevation: 1008,
    type: "start",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rockypop_e77608f8.jpg",
    country: "France",
    note: "Day 1 start — hike to Gîte Le Pontet",
    date: "Fri, Jul 25",
    nightLabel: "Depart — hiking to Gîte Le Pontet",
    summary: "Day 1 trailhead. Start the TMB from Les Houches and hike to Les Contamines.",
    hikerTips: [
      "Start early (7-8 AM) to beat afternoon heat",
      "Fill water bottles at the trailhead — next reliable source is a few hours in",
      "The first climb is steep but rewards with great views of the Chamonix valley",
    ],
    amenities: ["Trailhead parking", "Public restrooms", "Trail markers"],
    meals: "Eat breakfast at RockyPop before departing",
    payment: "N/A",
  },
  {
    day: 2,
    name: "Gîte Le Pontet",
    lat: 45.802991,
    lng: 6.722181,
    elevation: 1183,
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/gite-le-pontet_3f84378c.jpg",
    country: "France",
    note: "Day 2 start — hike to Les Chapieux, bus to BSM",
    date: "Fri, Jul 25",
    nightLabel: "Night of Day 1",
    summary: "Friendly gîte in Les Contamines. Clean, good food, popular with TMB through-hikers.",
    hikerTips: [
      "Can be noisy at night due to campsite — bring earplugs",
      "Food is consistently rated good by TMB hikers",
      "Shared dorms with bunk beds — claim your spot early",
      "Good spot to meet fellow TMB hikers on their first night",
    ],
    amenities: ["Shared dorms", "Meals included", "Hot showers", "Camping area"],
    meals: "Dinner and breakfast included with stay",
    payment: "Card accepted",
    checkIn: "From 4:00 PM",
  },
  {
    day: 3,
    name: "Hotel Base Camp Lodge",
    lat: 45.696411,
    lng: 6.733627,
    elevation: 1593,
    type: "hotel",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/base-camp-lodge_73fd4672.jpg",
    country: "France",
    note: "Day 3 start — bus back, hike to Rifugio Elisabetta",
    date: "Sat, Jul 26",
    nightLabel: "Night of Day 2",
    phone: "+33 4 79 07 01 26",
    website: "hotel-basecamplodge.com",
    summary: "Modern hotel in Bourg-Saint-Maurice. Clean rooms, adventure-spirit decor, early breakfast at 6 AM.",
    hikerTips: [
      "Breakfast starts at 6:00 AM — perfect for catching the early bus back to Les Chapieux",
      "Modern hotel with comfortable beds — enjoy the upgrade from dorm life",
      "106 rooms and 5 dormitories — various room types available",
      "Restaurant serves dinner with friendly service",
      "Good place to recharge devices and do laundry",
    ],
    amenities: ["Private rooms", "Restaurant & bar", "WiFi", "Laundry", "Early breakfast (6 AM)"],
    meals: "Dinner and breakfast available (breakfast from 6:00 AM)",
    payment: "Card accepted",
    checkIn: "From 3:00 PM",
  },
  {
    day: 4,
    name: "Rifugio Elisabetta",
    lat: 45.767213,
    lng: 6.837629,
    elevation: 2146,
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rifugio-elisabetta_66a22f61.jpg",
    country: "Italy",
    note: "Day 4 start — hike to Rifugio Maison Vieille",
    date: "Sun, Jul 27",
    nightLabel: "Night of Day 3",
    summary: "Large rifugio at 2,146m below Col de la Seigne. Can be crowded but views are spectacular.",
    hikerTips: [
      "Arrive early for best bed selection — this place gets crowded",
      "Can be chaotic during peak season — patience is key",
      "Hard to reach by email for bookings — try calling or use booking platforms",
      "Spectacular views of the glacier from the terrace",
      "You're crossing into Italy tomorrow — the landscape changes dramatically",
    ],
    amenities: ["Shared dorms", "Meals included", "Terrace with views", "Basic facilities"],
    meals: "Dinner and breakfast included — Italian mountain cuisine",
    payment: "Cash preferred, card may work",
    checkIn: "From 2:00 PM",
  },
  {
    day: 5,
    name: "Rifugio Maison Vieille",
    lat: 45.79085,
    lng: 6.93129,
    elevation: 1981,
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/maison-vieille_fa54cb04.jpg",
    country: "Italy",
    note: "Day 5 start — hike to Rifugio Chapy",
    date: "Mon, Jul 28",
    nightLabel: "Night of Day 4",
    summary: "Friendly rifugio above Courmayeur with excellent food and great house wine. Staff are wonderful.",
    hikerTips: [
      "Try the house wine — it's highly rated by hikers and surprisingly good quality",
      "Staff are very friendly and helpful — one of the best-reviewed rifugios on the TMB",
      "Lovely food — the Italian mountain cuisine here is a highlight",
      "Great views of the Mont Blanc massif from the terrace",
      "Cozy atmosphere — a real treat after the high-altitude Elisabetta",
    ],
    amenities: ["Shared dorms", "Meals included", "Bar with house wine", "Terrace", "Hot showers"],
    meals: "Dinner and breakfast included — excellent Italian cooking",
    payment: "Cash and card accepted",
    checkIn: "From 2:00 PM",
  },
  {
    day: 6,
    name: "Rifugio Chapy Mont Blanc",
    lat: 45.82309,
    lng: 6.96586,
    elevation: 1429,
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rifugio-chapy_59cb8b94.jpg",
    country: "Italy",
    note: "Day 6 start — hike to Gîte La Peule",
    date: "Tue, Jul 29",
    nightLabel: "Night of Day 5",
    summary: "Lower-elevation rifugio in Val Ferret. Good base before the big climb to Grand Col Ferret.",
    hikerTips: [
      "Lower elevation (1,429m) means a warmer, more comfortable night",
      "Good base camp before tomorrow's big climb to Grand Col Ferret (2,537m)",
      "Rest well tonight — Day 6 is one of the most demanding days",
      "Val Ferret is beautiful — take a short evening walk if energy permits",
    ],
    amenities: ["Shared dorms", "Meals included", "Hot showers", "Garden area"],
    meals: "Dinner and breakfast included",
    payment: "Cash and card accepted",
    checkIn: "From 3:00 PM",
  },
  {
    day: 7,
    name: "Gîte Alpage de La Peule",
    lat: 45.89864,
    lng: 7.11268,
    elevation: 2106,
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/alpage-la-peule_f059aaa4.jpg",
    country: "Switzerland",
    note: "Day 7 start — hike to Relais D'Arpette",
    date: "Wed, Jul 30",
    nightLabel: "Night of Day 6",
    phone: "+41 (0)27 783 10 41",
    email: "nicolas.lapeule@gmail.com",
    summary: "Working dairy farm at the base of Grand Col Ferret. The fondue is legendary. Cash only.",
    hikerTips: [
      "CASH ONLY — Euro widely accepted alongside Swiss Franc",
      "The fondue is legendary — hikers call it the best meal on the TMB",
      "Order your packed lunch on arrival (11 EUR: ham & cheese sandwich, fruit, snacks)",
      "Only 2 showers and 2 toilets (accessed via outside door) — time your visits before the breakfast rush",
      "4 AM cow milking may disturb light sleepers — bring earplugs",
      "USB charging area in the dining hall — limited electrical outlets elsewhere",
      "Woodstove in dining room is a welcome sight on cold evenings",
      "33 beds, all dormitories — bunk beds with some partitioning walls for privacy",
      "Dinner is simple and delicious: fresh salad, ham & cheese croquet on homemade bread, amazing fruit salad",
      "Breakfast is buffet: homemade yogurt, cereal, bread, butter, jams",
    ],
    amenities: ["33 beds (dorms only)", "Meals included", "Hot showers (2)", "USB charging", "Woodstove", "Working farm"],
    meals: "Dinner & breakfast included. Packed lunch available (11 EUR)",
    payment: "CASH ONLY (Euro accepted)",
    checkIn: "From 3:00 PM",
  },
  {
    day: 8,
    name: "Relais D'Arpette",
    lat: 46.02985,
    lng: 7.09294,
    elevation: 1633,
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/relais-arpette_f7e434cb.jpg",
    country: "Switzerland",
    note: "Day 8 start — hike to Auberge Mont Blanc",
    date: "Thu, Jul 31",
    nightLabel: "Night of Day 7",
    summary: "Well-maintained gîte near Champex with renovated bathrooms, fireplace, and community tables.",
    hikerTips: [
      "Bathrooms were recently renovated — super clean with ample soap",
      "Large community tables upstairs in the main hall — great for meeting other hikers",
      "Fireplace area is cozy — grab a drink and warm up after the day's hike",
      "Some private rooms available (double, triple, quad) — book early",
      "Can be chaotic with campers outside — the indoor areas are calmer",
      "Bar serves drinks — treat yourself after the Fenêtre d'Arpette if you took that variant",
    ],
    amenities: ["Dorms & private rooms", "Meals included", "Renovated showers", "Fireplace", "Bar", "Camping"],
    meals: "Dinner and breakfast included",
    payment: "Card and cash accepted",
    checkIn: "From 3:00 PM",
  },
  {
    day: 9,
    name: "Auberge Mont Blanc",
    lat: 46.05623,
    lng: 6.99534,
    elevation: 1314,
    type: "auberge",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/auberge-mont-blanc_4ef2c0b7.jpg",
    country: "Switzerland",
    note: "Day 9 start — hike to Grassonnet",
    date: "Fri, Aug 1",
    nightLabel: "Night of Day 8",
    phone: "+41 27 722 46 23",
    website: "auberge-montblanc.ch",
    summary: "Charming auberge in Trient with garden sauna and hot tub — perfect for sore legs.",
    hikerTips: [
      "Has a GARDEN SAUNA and HOT TUB — absolute game-changer for sore legs after 8 days of hiking",
      "Clean dorms with spacious layout and nice bathrooms",
      "Staff are very friendly and helpful",
      "Dinner is decent, breakfast is basic but filling",
      "Incredible views of Mont Blanc from the property",
      "This is Switzerland — slightly pricier but worth it for the sauna/tub recovery",
    ],
    amenities: ["Dorms & private rooms", "Meals included", "Garden sauna", "Hot tub", "WiFi", "Clean bathrooms"],
    meals: "Dinner and breakfast included",
    payment: "Card and cash accepted",
    checkIn: "From 3:00 PM",
  },
  {
    day: 10,
    name: "Gîte Le Nouveau Grassonnet",
    lat: 45.96998,
    lng: 6.91680,
    elevation: 1193,
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/nouveau-grassonnet_51afd809.jpg",
    country: "France",
    note: "Day 10 start — final push to Planpraz, cable car to Chamonix!",
    date: "Sat, Aug 2",
    nightLabel: "Night of Day 9",
    summary: "Friendly gîte near Argentière. Last night before the final push to Chamonix.",
    hikerTips: [
      "Nice, friendly hostel — great for solo travelers or groups",
      "Good dinner and breakfast included",
      "700m from ski lifts — close to Chamonix area amenities",
      "Free WiFi — catch up on messages before the final day",
      "Last night on the trail — celebrate with fellow hikers!",
      "Tomorrow is the final push to Planpraz and the cable car down to Chamonix",
    ],
    amenities: ["Shared dorms", "Meals included", "Free WiFi", "Near Chamonix"],
    meals: "Dinner and breakfast included",
    payment: "Card accepted",
    checkIn: "From 4:00 PM",
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
  const [showFoodStops, setShowFoodStops] = useState(false);
  const [waterMode, setWaterMode] = useState<"off" | "potable" | "all">("off");
  const [showSecondaryWater, setShowSecondaryWater] = useState(false);
  const [mapLayer, setMapLayer] = useState<"topo" | "satellite">("topo");
  const [viewMode, setViewMode] = useState<"map" | "elevation">("map");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const foodStopMarkersRef = useRef<L.Marker[]>([]);
  const waterMarkersRef = useRef<L.Marker[]>([]);
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
  const [accomSectionOpen, setAccomSectionOpen] = useState(false);
  const [hostelDetailDay, setHostelDetailDay] = useState<number | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(getAvatarUrl);
  const [tilesLoading, setTilesLoading] = useState(false);
  const tileRetryCount = useRef(0);

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

      setTilesLoading(true);
      const topoLayer = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 17,
          attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
          errorTileUrl: '',
        }
      );
      topoLayer.on('load', () => { setTilesLoading(false); tileRetryCount.current = 0; });
      topoLayer.on('tileerror', () => {
        // Auto-retry: reload failed tiles after a short delay
        if (tileRetryCount.current < 3) {
          tileRetryCount.current++;
          setTimeout(() => {
            if (tileLayerRef.current && mapInstanceRef.current) {
              (tileLayerRef.current as any).redraw();
            }
          }, 1500 * tileRetryCount.current);
        }
      });
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
        const markerBg = isStart ? "#06B6D4" : "#0F172A";
        const markerBorder = isStart ? "#A5F3FC" : "#06B6D4";
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
              <p style="margin:2px 0;font-size:11px;color:#64748B;">Elevation: ${u.elev(acc.elevation)} ${u.elevUnit}</p>
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
    setTilesLoading(true);
    tileRetryCount.current = 0;

    const newLayer = mapLayer === "topo"
      ? L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          maxZoom: 17,
          attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
          errorTileUrl: '',
        })
      : L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 18,
          attribution: "&copy; Esri",
          errorTileUrl: '',
        });
    newLayer.on('load', () => { setTilesLoading(false); tileRetryCount.current = 0; });
    newLayer.on('tileerror', () => {
      if (tileRetryCount.current < 3) {
        tileRetryCount.current++;
        setTimeout(() => {
          if (tileLayerRef.current && mapInstanceRef.current) {
            (tileLayerRef.current as any).redraw();
          }
        }, 1500 * tileRetryCount.current);
      }
    });
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapLayer]);

  // ── Add/remove food stop markers when selectedDay or showFoodStops changes ──
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    // Remove existing food stop markers
    foodStopMarkersRef.current.forEach(m => m.remove());
    foodStopMarkersRef.current = [];

    // Show food stops based on toggle — if no day selected, show all visible in map bounds
    if (!showFoodStops) return;

    const dayStops = selectedDay !== null ? getStopsForDay(selectedDay) : FOOD_STOPS;
    const dayMiles = selectedDay !== null ? (DAY_MILES[selectedDay] || 0) : 0;

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

      const paymentLabel = stop.payment === 'card' ? '💳 Card' : stop.payment === 'cash' ? '💵 Cash only' : '💳💵 Card/Cash';
      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;width:260px;padding:10px 12px;margin:-14px -20px -14px -20px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:18px;">${emoji}</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:#1E293B;line-height:1.2;">${stop.name}</div>
              <div style="font-size:9px;color:#94A3B8;margin-top:1px;">Day ${stop.day} · ${stop.dayOfWeek}, ${stop.date}</div>
            </div>
          </div>
          <p style="font-size:11px;color:#475569;margin:0 0 6px;line-height:1.4;">${stop.description}</p>
          ${stop.mustTry ? `<div style="font-size:11px;color:#D97706;margin-bottom:6px;line-height:1.3;"><b>⭐ Must try:</b> ${stop.mustTry}</div>` : ''}
          <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10px;margin-bottom:4px;">
            ${stop.hours ? `<span style="background:#EFF6FF;color:#2563EB;padding:2px 6px;border-radius:3px;">🕐 ${stop.hours}</span>` : ''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10px;">
            <span style="background:#F0FDF4;color:#16A34A;padding:2px 6px;border-radius:3px;font-weight:600;">${u.distUnit} ${u.isMetric ? (stop.mileIn * 1.60934).toFixed(1) : stop.mileIn.toFixed(1)}${dayMiles ? ` of ${u.dist(dayMiles)}` : ''}</span>
            <span style="background:#FFF7ED;color:#C2410C;padding:2px 6px;border-radius:3px;">${paymentLabel}</span>
            ${stop.priceRange ? `<span style="background:#F5F3FF;color:#7C3AED;padding:2px 6px;border-radius:3px;">${stop.priceRange}</span>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: "tmb-popup",
      });

      foodStopMarkersRef.current.push(marker);
    });
  }, [selectedDay, showFoodStops]);

  // ── Add/remove water source markers when waterMode or selectedDay changes ──
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    // Remove existing water markers
    waterMarkersRef.current.forEach(m => m.remove());
    waterMarkersRef.current = [];

    if (waterMode === "off") return;

    // Filter sources based on mode and density
    let sources = waterMode === "potable"
      ? WATER_SOURCES.filter(s => s.potability === "potable")
      : WATER_SOURCES; // "all" shows potable + filter-needed

    // If a day is selected, only show that day's sources
    if (selectedDay !== null && selectedDay >= 1) {
      sources = sources.filter(s => s.day === selectedDay);
    }

    // If not showing secondary, only show primary (unless day is selected = show all for that day)
    if (!showSecondaryWater && selectedDay === null) {
      sources = sources.filter(s => s.priority === "primary");
    }

    sources.forEach((src) => {
      const isPotable = src.potability === "potable";
      const isDryWarning = src.lastBeforeDry;
      const size = isDryWarning ? 28 : 22;
      const bgColor = isPotable ? "#06B6D4" : "#67E8F9";
      const borderColor = isDryWarning ? "#EF4444" : (isPotable ? "#A5F3FC" : "#A5F3FC");
      const borderWidth = isDryWarning ? 3 : 2;

      // Water drop shape via SVG
      const icon = L.divIcon({
        className: "tmb-water-marker",
        html: `<div style="position:relative;width:${size}px;height:${size}px;cursor:pointer;">
          <svg viewBox="0 0 24 24" width="${size}" height="${size}">
            <path d="M12 2C12 2 5 10 5 15.5C5 19.64 8.13 23 12 23C15.87 23 19 19.64 19 15.5C19 10 12 2 12 2Z"
              fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}" />
            ${!isPotable ? '<text x="12" y="17" text-anchor="middle" fill="#1E293B" font-size="10" font-weight="bold" font-family="sans-serif">F</text>' : ''}
          </svg>
          ${isDryWarning ? '<div style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;background:#EF4444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;font-weight:bold;border:1px solid #FCA5A5;">!</div>' : ''}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
      });

      const marker = L.marker([src.lat, src.lng], { icon, zIndexOffset: 800 }).addTo(map);

      const typeLabel = src.type.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase());
      const potableLabel = isPotable
        ? '<span style="background:#ECFDF5;color:#059669;padding:1px 6px;border-radius:3px;font-size:10px;">✓ Potable</span>'
        : '<span style="background:#FEF3C7;color:#D97706;padding:1px 6px;border-radius:3px;font-size:10px;">⚠ Filter Needed</span>';
      const dryWarningHtml = src.lastBeforeDry && src.dryStretchAhead
        ? `<div style="margin-top:6px;padding:6px 8px;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;">
            <div style="font-size:10px;font-weight:700;color:#DC2626;margin-bottom:2px;">⚠ LAST WATER BEFORE DRY STRETCH</div>
            <div style="font-size:10px;color:#991B1B;">${src.dryStretchAhead}</div>
          </div>`
        : '';

      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;width:260px;padding:10px 12px;margin:-14px -20px -14px -20px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:18px;">💧</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:#1E293B;line-height:1.2;">${src.name}</div>
              <div style="font-size:9px;color:#94A3B8;margin-top:1px;">Day ${src.day} · ${typeLabel}</div>
            </div>
          </div>
          <p style="font-size:11px;color:#475569;margin:0 0 6px;line-height:1.4;">${src.description}</p>
          <div style="font-size:10px;color:#0E7490;margin-bottom:6px;line-height:1.3;"><b>Late July:</b> ${src.julyCondition}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10px;margin-bottom:4px;">
            ${potableLabel}
            <span style="background:#EFF6FF;color:#2563EB;padding:1px 6px;border-radius:3px;">${u.elev(src.ele)} ${u.elevUnit}</span>
            ${src.distToNext > 0 ? `<span style="background:#F0FDF4;color:#16A34A;padding:1px 6px;border-radius:3px;">Next: ${src.distToNext} mi</span>` : ''}
          </div>
          ${dryWarningHtml}
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: "tmb-popup",
      });

      waterMarkersRef.current.push(marker);
    });
  }, [waterMode, selectedDay, showSecondaryWater]);

  const flyToDay = (day: number) => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const map = mapInstanceRef.current;
    const L = LRef.current;

    // Double-tap same day = zoom out to full trail
    if (selectedDay === day) {
      showAll();
      return;
    }

    setSelectedDay(day);

    // Day 0 (ARR) has no trail data — center on the RockyPop Hotel
    if (day === 0) {
      const arr = ACCOMMODATIONS.find(a => a.day === 0);
      if (arr) {
        map.setView([arr.lat, arr.lng], 14, { animate: true });
      }
      map.closePopup();
      return;
    }

    const typedTrailData = trailData as Record<string, [number, number][]>;
    const stagePoints = typedTrailData[day.toString()];
    if (stagePoints && stagePoints.length > 0) {
      const bounds = L.latLngBounds(
        stagePoints.map(([lat, lon]: [number, number]) => L.latLng(lat, lon))
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Don't open popup from strip buttons — only from tapping map bubbles
    map.closePopup();
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


          {/* Legend + Layer toggle + Food stops toggle */}
          <div className="flex flex-col gap-3 px-1">
            <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-orange-500 rounded-full inline-block" />
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
              {showFoodStops && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded bg-amber-900/80 border border-amber-500 text-center leading-4 text-[8px]">🍽️</span>
                  FOOD STOPS
                </span>
              )}
              {waterMode !== "off" && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-cyan-500/80 border border-cyan-300" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 80% 100%, 20% 100%, 0% 38%)' }} />
                  {waterMode === "potable" ? "POTABLE WATER" : "ALL WATER"}
                  {selectedDay === null && (
                    <button
                      onClick={() => setShowSecondaryWater(!showSecondaryWater)}
                      className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-mono border transition-colors ${
                        showSecondaryWater
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "border-slate-600 text-slate-500 hover:text-cyan-400 hover:border-cyan-600"
                      }`}
                    >
                      {showSecondaryWater ? "FEWER" : "MORE"}
                    </button>
                  )}
                </span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1.5 w-full">
              {/* 1. Layer toggle — teal accent */}
              <button
                onClick={() => setMapLayer(mapLayer === "topo" ? "satellite" : "topo")}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-md bg-slate-800 border border-teal-700/40 text-[9px] font-mono text-teal-400/70 hover:text-teal-300 hover:border-teal-600/60 transition-colors"
              >
                {mapLayer === "topo" ? <Layers className="w-3.5 h-3.5" /> : <Mountain className="w-3.5 h-3.5" />}
                <span>{mapLayer === "topo" ? "SAT" : "TOPO"}</span>
              </button>
              {/* 2. Water sources toggle — cyan accent, cycles: off → potable → all */}
              <button
                onClick={() => {
                  if (waterMode === "off") { setWaterMode("potable"); setShowSecondaryWater(false); }
                  else if (waterMode === "potable") { setWaterMode("all"); setShowSecondaryWater(false); }
                  else { setWaterMode("off"); setShowSecondaryWater(false); }
                }}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md border text-[9px] font-mono transition-colors ${
                  waterMode !== "off"
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25"
                    : "bg-slate-800 border-cyan-700/30 text-cyan-400/50 hover:text-cyan-300 hover:border-cyan-600/50"
                }`}
                title={waterMode === "off" ? "Show potable water" : waterMode === "potable" ? "Show all water (+ filtered)" : "Hide water sources"}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>{waterMode === "off" ? "WATER" : waterMode === "potable" ? "H₂O" : "ALL H₂O"}</span>
              </button>
              {/* 3. Food stops toggle — amber accent */}
              <button
                onClick={() => setShowFoodStops(!showFoodStops)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md border text-[9px] font-mono transition-colors ${
                  showFoodStops
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
                    : "bg-slate-800 border-amber-700/30 text-amber-400/50 hover:text-amber-300 hover:border-amber-600/50"
                }`}
                title={showFoodStops ? "Hide food stops" : "Show food stops"}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>FOOD</span>
              </button>
              {/* 4. GPS locate me — blue accent */}
              <button
                onClick={gpsActive && gpsPosition ? centerOnGps : toggleGps}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md border text-[9px] font-mono transition-colors ${
                  gpsActive
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-400 hover:bg-blue-500/25"
                    : "bg-slate-800 border-blue-700/30 text-blue-400/50 hover:text-blue-300 hover:border-blue-600/50"
                }`}
                title={gpsActive ? "Center on my location" : "Show my location"}
                onDoubleClick={gpsActive ? toggleGps : undefined}
              >
                {gpsActive ? <Navigation className="w-3.5 h-3.5" /> : <LocateFixed className="w-3.5 h-3.5" />}
                <span>{gpsActive ? "GPS" : "LOCATE"}</span>
              </button>
              {/* 5. View toggle — Map / Elevation — rose accent */}
              <button
                onClick={() => setViewMode(viewMode === "map" ? "elevation" : "map")}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md border text-[9px] font-mono transition-colors ${
                  viewMode === "elevation"
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25"
                    : "bg-slate-800 border-rose-700/30 text-rose-400/50 hover:text-rose-300 hover:border-rose-600/50"
                }`}
              >
                {viewMode === "map" ? <BarChart3 className="w-3.5 h-3.5" /> : <Map className="w-3.5 h-3.5" />}
                <span>{viewMode === "map" ? "ELEV" : "MAP"}</span>
              </button>
              {/* 6. More menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md border text-[9px] font-mono transition-colors w-full h-full ${
                    moreMenuOpen
                      ? "bg-slate-700 border-slate-500 text-slate-200"
                      : "bg-slate-800 border-violet-700/30 text-violet-400/50 hover:text-violet-300 hover:border-violet-600/50"
                  }`}
                  title="More options"
                >
                  {moreMenuOpen ? <X className="w-3.5 h-3.5" /> : <MoreHorizontal className="w-3.5 h-3.5" />}
                  <span>MORE</span>
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
              {waterMode !== "off" && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-cyan-400">💧 {WATER_SOURCES.filter(s => s.day === selectedDay && (waterMode === "all" || s.potability === "potable")).length} water</span>
                </>
              )}
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
            <div className="rounded-xl overflow-hidden border border-slate-700/50 relative">
              <div
                ref={mapContainerRef}
                className="h-[450px] sm:h-[550px] w-full"
                style={{ background: "#1a1a2e" }}
              />
              {tilesLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]/60 z-[1000] pointer-events-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Loading map tiles…</span>
                  </div>
                </div>
              )}
            </div>
            {/* Day circle selector strip below map */}
            <div className="mt-3 overflow-x-auto">
              <div className="flex gap-2 px-2 min-w-max justify-center">
                {/* ALL button */}
                <button
                  onClick={showAll}
                  className={`flex flex-col items-center text-center group cursor-pointer hover:bg-slate-800/60 rounded-lg px-2 py-1.5 transition-colors ${
                    selectedDay === null ? "bg-slate-800/60 ring-1 ring-violet-500/40" : ""
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 border-2 transition-colors group-hover:border-violet-400 group-hover:text-violet-300"
                    style={{
                      borderColor: selectedDay === null ? "#C4B5FD" : "#8B5CF6",
                      color: selectedDay === null ? "#C4B5FD" : "#8B5CF6",
                      background: selectedDay === null ? "#8B5CF6" : "#1c1917",
                      fontSize: "0.55rem",
                    }}
                  >
                    <span style={{ color: selectedDay === null ? "#fff" : undefined }}>ALL</span>
                  </div>
                  <span
                    className="text-slate-500 group-hover:text-slate-300 transition-colors leading-tight whitespace-nowrap"
                    style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Full Trail
                  </span>
                </button>
                {ACCOMMODATIONS.map((acc) => (
                  <button
                    key={acc.day}
                    onClick={() => flyToDay(acc.day)}
                    onMouseEnter={() => onDayHover?.(acc.day)}
                    onMouseLeave={() => onDayHover?.(null)}
                    className={`flex flex-col items-center text-center group cursor-pointer hover:bg-slate-800/60 rounded-lg px-2 py-1.5 transition-colors ${
                      selectedDay === acc.day || highlightDay === acc.day ? "bg-slate-800/60 ring-1 ring-violet-500/40" : ""
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 border-2 transition-colors group-hover:border-violet-400 group-hover:text-violet-300"
                      style={{
                        borderColor: selectedDay === acc.day || highlightDay === acc.day ? "#C4B5FD" : "#8B5CF6",
                        color: selectedDay === acc.day || highlightDay === acc.day ? "#C4B5FD" : "#8B5CF6",
                        background: selectedDay === acc.day || highlightDay === acc.day ? "#8B5CF6" : "#1c1917",
                        fontSize: "0.55rem",
                      }}
                    >
                      <span style={{ color: selectedDay === acc.day || highlightDay === acc.day ? "#fff" : undefined }}>
                        {acc.day === 0 ? "ARR" : `D${acc.day}`}
                      </span>
                    </div>
                    <span
                      className="text-slate-500 group-hover:text-slate-300 transition-colors leading-tight whitespace-nowrap"
                      style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {acc.name.length > 14 ? acc.name.slice(0, 12) + "\u2026" : acc.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Elevation Profile — only visible in elevation mode */}
          {viewMode === "elevation" && (
            <div className="border border-slate-700/50 rounded-xl overflow-hidden">
              <ElevationProfile highlightDay={highlightDay} onDayHover={onDayHover} gpsPosition={gpsPosition ? { lat: gpsPosition.lat, lng: gpsPosition.lng } : null} embedded selectedDay={selectedDay} parentShowFoodStops={showFoodStops} onFoodToggle={() => setShowFoodStops(!showFoodStops)} parentWaterMode={waterMode} onWaterToggle={() => {
                  if (waterMode === "off") setWaterMode("potable");
                  else if (waterMode === "potable") setWaterMode("all");
                  else setWaterMode("off");
                }} />
            </div>
          )}

          {/* Accommodation Section — Collapsible */}
          <div className="mt-3 border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setAccomSectionOpen(!accomSectionOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300">Accommodations</span>
                <span className="text-[10px] font-mono text-slate-500">{ACCOMMODATIONS.length} stops</span>
              </div>
              {accomSectionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {accomSectionOpen && (
              <div className="p-3 space-y-2">
                {ACCOMMODATIONS.map((acc) => (
                  <button
                    key={acc.day}
                    onClick={() => setHostelDetailDay(hostelDetailDay === acc.day ? null : acc.day)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                      hostelDetailDay === acc.day
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-slate-700/50 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50"
                    }`}
                  >
                    <img
                      src={acc.image}
                      alt={acc.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-violet-400">
                          {acc.day === 0 ? "ARRIVE" : acc.day === 1 ? "START" : `DAY ${acc.day}`}
                        </span>
                        <span className="text-[10px] text-slate-500">{acc.date}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          acc.country === "France" ? "bg-orange-500/20 text-orange-400" :
                          acc.country === "Italy" ? "bg-green-500/20 text-green-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>{acc.country}</span>
                      </div>
                      <p className="text-sm text-white font-medium truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{acc.summary}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${
                      hostelDetailDay === acc.day ? "rotate-90" : ""
                    }`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hostel Detail Popup */}
          {hostelDetailDay !== null && (() => {
            const acc = ACCOMMODATIONS.find(a => a.day === hostelDetailDay);
            if (!acc) return null;
            return (
              <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setHostelDetailDay(null)}>
                <div
                  className="w-full max-w-lg max-h-[85vh] bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with image */}
                  <div className="relative h-36 flex-shrink-0">
                    <img src={acc.image} alt={acc.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <button onClick={() => setHostelDetailDay(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition cursor-pointer">
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-violet-400 bg-black/60 px-2 py-0.5 rounded">
                          {acc.day === 0 ? "ARRIVE" : acc.day === 1 ? "START" : `DAY ${acc.day}`}
                        </span>
                        <span className="text-xs text-slate-300 bg-black/60 px-2 py-0.5 rounded">{acc.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono bg-black/60 ${
                          acc.country === "France" ? "text-orange-400" :
                          acc.country === "Italy" ? "text-green-400" : "text-red-400"
                        }`}>{acc.country}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{acc.name}</h3>
                      <p className="text-xs text-slate-400">{getTypeLabel(acc.type)} &middot; {u.elev(acc.elevation)} {u.elevUnit} &middot; {acc.nightLabel}</p>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Summary */}
                    <p className="text-sm text-slate-300 leading-relaxed">{acc.summary}</p>

                    {/* Quick info grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {acc.checkIn && (
                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2.5">
                          <Clock className="w-4 h-4 text-violet-400 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Check-in</p>
                            <p className="text-xs text-white">{acc.checkIn}</p>
                          </div>
                        </div>
                      )}
                      {acc.payment && (
                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2.5">
                          <CreditCard className="w-4 h-4 text-violet-400 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Payment</p>
                            <p className="text-xs text-white">{acc.payment}</p>
                          </div>
                        </div>
                      )}
                      {acc.meals && (
                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2.5 col-span-2">
                          <Utensils className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Meals</p>
                            <p className="text-xs text-white">{acc.meals}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirmation Code */}
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
                      <p className="text-[10px] text-violet-400 uppercase font-mono mb-1">Confirmation Code</p>
                      <p className="text-sm font-mono text-white">
                        {acc.confirmationCode || "Not yet added — coming soon"}
                      </p>
                    </div>

                    {/* Contact info */}
                    {(acc.phone || acc.email || acc.website) && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Contact</p>
                        {acc.phone && (
                          <a href={`tel:${acc.phone}`} className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300">
                            <Phone className="w-3.5 h-3.5" /> {acc.phone}
                          </a>
                        )}
                        {acc.email && (
                          <a href={`mailto:${acc.email}`} className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300">
                            <Mail className="w-3.5 h-3.5" /> {acc.email}
                          </a>
                        )}
                        {acc.website && (
                          <a href={`https://${acc.website}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300">
                            <Globe className="w-3.5 h-3.5" /> {acc.website}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Amenities */}
                    {acc.amenities.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {acc.amenities.map((a, i) => (
                            <span key={i} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded-full border border-slate-700/50">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hiker Tips */}
                    {acc.hikerTips.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono mb-2">Hiker Intel</p>
                        <div className="space-y-1.5">
                          {acc.hikerTips.map((tip, i) => (
                            <div key={i} className="flex gap-2 text-xs text-slate-300">
                              <span className="text-violet-400 flex-shrink-0 mt-0.5">&bull;</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Map button */}
                    <button
                      onClick={() => {
                        setHostelDetailDay(null);
                        flyToDay(acc.day);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" /> Show on Map
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
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
        .tmb-water-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: #1E293B !important;
          color: #06B6D4 !important;
          border-color: #334155 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #334155 !important;
        }
      `}</style>
    </section>
  );
}
