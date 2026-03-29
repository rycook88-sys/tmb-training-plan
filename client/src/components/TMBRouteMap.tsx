// TMB Route Map — Leaflet + OpenTopoMap with real GPX trail data
// Design: Alpine dark theme, topo map showing actual hiking trails
// Trail segments colored by country (France/Italy/Switzerland)
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Map, Bus, CableCar, Layers, Mountain } from "lucide-react";
import { TMB_ITINERARY } from "@/lib/data";
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

const ACCOMMODATIONS: Accommodation[] = [
  {
    day: 1,
    name: "RockyPop Hotel",
    lat: 45.8972406,
    lng: 6.8152178,
    elevation: "1,008m",
    type: "start",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rockypop_e77608f8.jpg",
    country: "France",
    note: "Starting point — walk west to Les Houches trailhead",
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
  },
  {
    day: 3,
    name: "Hotel Base Camp Lodge",
    lat: 45.696411,
    lng: 6.733627,
    elevation: "1,593m",
    // Note: marker at Les Chapieux (trail end). Bus takes you to BSM hotel.
    type: "hotel",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/base-camp-lodge_73fd4672.jpg",
    country: "France",
    note: "Bus from Les Chapieux to Bourg-Saint-Maurice",
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
  france: "#F97316",    // Orange for France
  italy: "#22C55E",     // Green for Italy
  switzerland: "#EF4444", // Red for Switzerland
};

const COUNTRY_LABELS: Record<string, string> = {
  france: "FRANCE",
  italy: "ITALY",
  switzerland: "SWITZERLAND",
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

export function TMBRouteMap({ highlightDay, onDayHover }: { highlightDay?: number | null; onDayHover?: (day: number | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mapLayer, setMapLayer] = useState<"topo" | "satellite">("topo");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const trailLayersRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);

  // Initialize map when section opens
  useEffect(() => {
    if (!isOpen || mapInstanceRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      LRef.current = L;

      if (!mapContainerRef.current) return;

      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [45.88, 6.92],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenTopoMap tiles (shows hiking trails!)
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

      // Create a layer group for trail segments
      const trailGroup = L.layerGroup().addTo(map);
      trailLayersRef.current = trailGroup;

      // Draw trail segments colored by country
      countrySegments.forEach((seg) => {
        const latLngs = seg.points.map(([lat, lon]: [number, number]) => L.latLng(lat, lon));
        const color = COUNTRY_COLORS[seg.country] || "#F97316";

        // Trail shadow for depth
        L.polyline(latLngs, {
          color: "#000000",
          weight: 6,
          opacity: 0.3,
        }).addTo(trailGroup);

        // Main trail line
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

      // Create markers
      ACCOMMODATIONS.forEach((acc) => {
        const itDay = TMB_ITINERARY.find((d) => d.day === acc.day);

        // Custom icon using divIcon
        const isStart = acc.day === 1;
        const icon = L.divIcon({
          className: "tmb-marker",
          html: `<div style="
            display:flex;align-items:center;justify-content:center;
            width:${isStart ? 36 : 30}px;height:${isStart ? 36 : 30}px;
            border-radius:50%;
            background:${isStart ? "#F97316" : "#0F172A"};
            border:3px solid ${isStart ? "#FED7AA" : "#F97316"};
            color:white;font-weight:700;font-size:12px;
            font-family:'JetBrains Mono',monospace;
            box-shadow:0 2px 8px rgba(0,0,0,0.5);
            cursor:pointer;
          ">D${acc.day}</div>`,
          iconSize: [isStart ? 36 : 30, isStart ? 36 : 30],
          iconAnchor: [isStart ? 18 : 15, isStart ? 18 : 15],
        });

        const marker = L.marker([acc.lat, acc.lng], { icon }).addTo(map);

        // Popup content
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
                    <span style="color:#64748B;">Distance:</span><span style="color:#1E293B;font-weight:600;">${itDay.distance} / ${itDay.distanceMi} mi</span>
                    <span style="color:#64748B;">Duration:</span><span style="color:#1E293B;font-weight:600;">${itDay.duration}</span>
                    <span style="color:#22C55E;">↑ Ascent:</span><span style="color:#1E293B;font-weight:600;">${itDay.ascent.toLocaleString()} ft</span>
                    <span style="color:#EF4444;">↓ Descent:</span><span style="color:#1E293B;font-weight:600;">${itDay.descent.toLocaleString()} ft</span>
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

      // Force a resize after render
      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      cancelled = true;
    };
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

  const flyToDay = (day: number) => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const map = mapInstanceRef.current;
    const L = LRef.current;

    setSelectedDay(day);

    // If it's a trail day, zoom to that trail segment
    const typedTrailData = trailData as Record<string, [number, number][]>;
    const stagePoints = typedTrailData[day.toString()];
    if (stagePoints && stagePoints.length > 0) {
      const bounds = L.latLngBounds(
        stagePoints.map(([lat, lon]: [number, number]) => L.latLng(lat, lon))
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Open the marker popup
    const acc = ACCOMMODATIONS.find((a) => a.day === day);
    if (acc) {
      const markerIdx = ACCOMMODATIONS.findIndex((a) => a.day === day);
      if (markersRef.current[markerIdx]) {
        markersRef.current[markerIdx].openPopup();
      }
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
    // Close any open popups
    map.closePopup();
  };

  return (
    <section className="relative">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-1 group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Map className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              TMB Route Map
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              10 DAYS · 3 COUNTRIES · 9 STAYS · REAL TRAIL DATA
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Map Content */}
      {isOpen && (
        <div className="space-y-3 pb-6">
          {/* Day selector pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={showAll}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                selectedDay === null
                  ? "bg-orange-500 text-white"
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
                    ? "bg-orange-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {`D${acc.day}`}
                {acc.day === 3 && <Bus className="w-3 h-3" />}
              </button>
            ))}

          </div>

          {/* Legend + Layer toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
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
            </div>
            <button
              onClick={() => setMapLayer(mapLayer === "topo" ? "satellite" : "topo")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              {mapLayer === "topo" ? (
                <>
                  <Layers className="w-3 h-3" /> SATELLITE
                </>
              ) : (
                <>
                  <Mountain className="w-3 h-3" /> TOPO MAP
                </>
              )}
            </button>
          </div>

          {/* Map Container */}
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <div
              ref={mapContainerRef}
              className="h-[450px] sm:h-[550px] w-full"
              style={{ background: "#1a1a2e" }}
            />
          </div>

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
                    ? "border-orange-500 ring-1 ring-orange-500/30"
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
                  <span className="text-[10px] font-mono font-bold text-orange-400">
                    {`DAY ${acc.day}`}
                  </span>
                  <p className="text-[10px] text-white font-medium leading-tight truncate">
                    {acc.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
