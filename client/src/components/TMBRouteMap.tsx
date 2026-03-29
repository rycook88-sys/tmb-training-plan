// TMB Route Map — Interactive Google Maps with accommodation markers
// Design: Alpine dark theme, custom markers with day numbers, photo info windows
import { useState, useRef, useCallback } from "react";
import { MapView } from "@/components/Map";
import { ChevronDown, Map, Bus, CableCar } from "lucide-react";
import { TMB_ITINERARY } from "@/lib/data";

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
    day: 0,
    name: "RockyPop Hotel",
    lat: 45.8920,
    lng: 6.7980,
    elevation: "1,008m",
    type: "start",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rockypop_e77608f8.jpg",
    country: "France",
    note: "Starting point — walk west to Les Houches trailhead",
  },
  {
    day: 1,
    name: "Gîte Le Pontet",
    lat: 45.8028,
    lng: 6.7216,
    elevation: "1,179m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/gite-le-pontet_3f84378c.jpg",
    country: "France",
  },
  {
    day: 2,
    name: "Hotel Base Camp Lodge",
    lat: 45.6188,
    lng: 6.7700,
    elevation: "840m",
    type: "hotel",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/base-camp-lodge_73fd4672.jpg",
    country: "France",
    note: "Bus from Les Chapieux to Bourg-Saint-Maurice",
  },
  {
    day: 3,
    name: "Rifugio Elisabetta",
    lat: 45.7670,
    lng: 6.8375,
    elevation: "2,195m",
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rifugio-elisabetta_66a22f61.jpg",
    country: "Italy",
  },
  {
    day: 4,
    name: "Rifugio Maison Vieille",
    lat: 45.7870,
    lng: 6.9500,
    elevation: "1,956m",
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/maison-vieille_fa54cb04.jpg",
    country: "Italy",
  },
  {
    day: 5,
    name: "Rifugio Chapy Mont Blanc",
    lat: 45.8010,
    lng: 6.9840,
    elevation: "1,467m",
    type: "rifugio",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/rifugio-chapy_59cb8b94.jpg",
    country: "Italy",
  },
  {
    day: 6,
    name: "Gîte Alpage de La Peule",
    lat: 45.8983,
    lng: 7.1124,
    elevation: "2,071m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/alpage-la-peule_f059aaa4.jpg",
    country: "Italy/Switzerland",
  },
  {
    day: 7,
    name: "Relais D'Arpette",
    lat: 46.0301,
    lng: 7.0931,
    elevation: "1,627m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/relais-arpette_f7e434cb.jpg",
    country: "Switzerland",
  },
  {
    day: 8,
    name: "Auberge Mont Blanc",
    lat: 46.0550,
    lng: 7.0230,
    elevation: "1,297m",
    type: "auberge",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/auberge-mont-blanc_4ef2c0b7.jpg",
    country: "Switzerland",
  },
  {
    day: 9,
    name: "Gîte Le Nouveau Grassonnet",
    lat: 45.9770,
    lng: 6.9280,
    elevation: "1,199m",
    type: "gite",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/nouveau-grassonnet_51afd809.jpg",
    country: "France",
  },
];

// TMB route waypoints for polyline (counter-clockwise from Les Houches)
const TRAIL_WAYPOINTS: google.maps.LatLngLiteral[] = [
  { lat: 45.8907, lng: 6.7968 }, // Les Houches trailhead
  { lat: 45.8650, lng: 6.7750 }, // Col de Voza
  { lat: 45.8350, lng: 6.7450 }, // Bionnassay
  { lat: 45.8028, lng: 6.7216 }, // Les Contamines (Day 1)
  { lat: 45.7800, lng: 6.7100 }, // Notre Dame de la Gorge
  { lat: 45.7600, lng: 6.7050 }, // Nant Borrant
  { lat: 45.7440, lng: 6.7130 }, // Col du Bonhomme
  { lat: 45.7300, lng: 6.7200 }, // Col de la Croix du Bonhomme
  { lat: 45.7180, lng: 6.7310 }, // Les Chapieux
];

const BUS_WAYPOINTS: google.maps.LatLngLiteral[] = [
  { lat: 45.7180, lng: 6.7310 }, // Les Chapieux
  { lat: 45.7000, lng: 6.7400 },
  { lat: 45.6700, lng: 6.7500 },
  { lat: 45.6400, lng: 6.7600 },
  { lat: 45.6188, lng: 6.7700 }, // Bourg-Saint-Maurice
];

const TRAIL_WAYPOINTS_2: google.maps.LatLngLiteral[] = [
  { lat: 45.7180, lng: 6.7310 }, // Les Chapieux (resume after bus)
  { lat: 45.7300, lng: 6.7500 },
  { lat: 45.7400, lng: 6.7800 },
  { lat: 45.7520, lng: 6.8080 }, // Col de la Seigne
  { lat: 45.7600, lng: 6.8200 },
  { lat: 45.7670, lng: 6.8375 }, // Rifugio Elisabetta (Day 3)
  { lat: 45.7700, lng: 6.8600 },
  { lat: 45.7750, lng: 6.8900 },
  { lat: 45.7800, lng: 6.9200 },
  { lat: 45.7870, lng: 6.9500 }, // Rifugio Maison Vieille (Day 4)
  { lat: 45.7900, lng: 6.9600 },
  { lat: 45.7927, lng: 6.9717 }, // Courmayeur
  { lat: 45.8010, lng: 6.9840 }, // Rifugio Chapy (Day 5)
  { lat: 45.8100, lng: 6.9900 },
  { lat: 45.8200, lng: 7.0000 },
  { lat: 45.8350, lng: 7.0200 },
  { lat: 45.8500, lng: 7.0400 },
  { lat: 45.8600, lng: 7.0500 }, // Rifugio Bonatti area
  { lat: 45.8750, lng: 7.0700 },
  { lat: 45.8900, lng: 7.0800 }, // Grand Col Ferret
  { lat: 45.8983, lng: 7.1124 }, // La Peule (Day 6)
  { lat: 45.9100, lng: 7.1200 },
  { lat: 45.9300, lng: 7.1200 },
  { lat: 45.9500, lng: 7.1150 },
  { lat: 45.9700, lng: 7.1100 },
  { lat: 45.9900, lng: 7.1080 },
  { lat: 46.0100, lng: 7.1050 },
  { lat: 46.0290, lng: 7.1000 },
  { lat: 46.0301, lng: 7.0931 }, // Relais D'Arpette (Day 7)
  { lat: 46.0400, lng: 7.0700 },
  { lat: 46.0500, lng: 7.0500 },
  { lat: 46.0560, lng: 7.0100 }, // Col de la Forclaz
  { lat: 46.0550, lng: 7.0230 }, // Trient (Day 8)
  { lat: 46.0500, lng: 7.0000 },
  { lat: 46.0400, lng: 6.9850 },
  { lat: 46.0230, lng: 6.9700 }, // Col de Balme
  { lat: 46.0100, lng: 6.9600 },
  { lat: 45.9900, lng: 6.9400 },
  { lat: 45.9770, lng: 6.9280 }, // Argentière (Day 9)
  { lat: 45.9800, lng: 6.9100 }, // Lac Blanc area
  { lat: 45.9700, lng: 6.8900 },
  { lat: 45.9600, lng: 6.8800 },
  { lat: 45.9500, lng: 6.8700 },
  { lat: 45.9370, lng: 6.8600 }, // Planpraz cable car
  { lat: 45.9237, lng: 6.8694 }, // Chamonix (End)
];

const COUNTRY_COLORS: Record<string, string> = {
  France: "#3B82F6",
  Italy: "#22C55E",
  Switzerland: "#EF4444",
  "Italy/Switzerland": "#F59E0B",
};

function getTypeLabel(type: Accommodation["type"]): string {
  switch (type) {
    case "start": return "Starting Hotel";
    case "hut": return "Mountain Hut";
    case "hotel": return "Hotel";
    case "gite": return "Gîte";
    case "rifugio": return "Rifugio";
    case "auberge": return "Auberge";
    case "end": return "Finish";
    default: return "Accommodation";
  }
}

export function TMBRouteMap() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Draw trail polyline (Les Houches to Les Chapieux)
    new google.maps.Polyline({
      path: TRAIL_WAYPOINTS,
      geodesic: true,
      strokeColor: "#F97316",
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });

    // Draw bus route (dashed)
    new google.maps.Polyline({
      path: BUS_WAYPOINTS,
      geodesic: true,
      strokeColor: "#94A3B8",
      strokeOpacity: 0.8,
      strokeWeight: 3,
      icons: [{
        icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
        offset: "0",
        repeat: "15px",
      }],
      map,
    });

    // Draw trail polyline (Les Chapieux to Chamonix)
    new google.maps.Polyline({
      path: TRAIL_WAYPOINTS_2,
      geodesic: true,
      strokeColor: "#F97316",
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });

    // Create info window
    infoWindowRef.current = new google.maps.InfoWindow();

    // Create markers for each accommodation
    ACCOMMODATIONS.forEach((acc) => {
      const itDay = TMB_ITINERARY.find(d => d.day === acc.day);
      
      // Create custom marker element
      const markerDiv = document.createElement("div");
      markerDiv.style.cssText = `
        display: flex; align-items: center; justify-content: center;
        width: ${acc.day === 0 ? "36px" : "32px"}; 
        height: ${acc.day === 0 ? "36px" : "32px"};
        border-radius: 50%; 
        background: ${acc.day === 0 ? "#F97316" : "#1E293B"};
        border: 3px solid ${acc.day === 0 ? "#FED7AA" : "#F97316"};
        color: white; font-weight: 700; font-size: 13px;
        font-family: 'JetBrains Mono', monospace;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer; transition: transform 0.2s;
      `;
      markerDiv.textContent = acc.day === 0 ? "▶" : `${acc.day}`;
      markerDiv.addEventListener("mouseenter", () => {
        markerDiv.style.transform = "scale(1.3)";
      });
      markerDiv.addEventListener("mouseleave", () => {
        markerDiv.style.transform = "scale(1)";
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: acc.lat, lng: acc.lng },
        title: acc.name,
        content: markerDiv,
      });

      marker.addListener("click", () => {
        const infoContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 280px; padding: 0;">
            <img src="${acc.image}" alt="${acc.name}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px 8px 0 0;" />
            <div style="padding: 12px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="background: ${COUNTRY_COLORS[acc.country] || "#6B7280"}; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${acc.country}</span>
                <span style="color: #94A3B8; font-size: 11px;">${getTypeLabel(acc.type)}</span>
              </div>
              <h3 style="margin: 4px 0; font-size: 16px; font-weight: 700; color: #1E293B;">
                ${acc.day === 0 ? "Start" : `Day ${acc.day}`}: ${acc.name}
              </h3>
              <p style="margin: 2px 0; font-size: 12px; color: #64748B;">Elevation: ${acc.elevation}</p>
              ${itDay ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
                    <span style="color: #64748B;">Distance:</span><span style="color: #1E293B; font-weight: 600;">${itDay.distance} / ${itDay.distanceMi} mi</span>
                    <span style="color: #64748B;">Duration:</span><span style="color: #1E293B; font-weight: 600;">${itDay.duration}</span>
                    <span style="color: #22C55E;">↑ Ascent:</span><span style="color: #1E293B; font-weight: 600;">${itDay.ascent.toLocaleString()} ft</span>
                    <span style="color: #EF4444;">↓ Descent:</span><span style="color: #1E293B; font-weight: 600;">${itDay.descent.toLocaleString()} ft</span>
                  </div>
                </div>
              ` : ""}
              ${acc.note ? `<p style="margin-top: 8px; font-size: 11px; color: #F97316; font-style: italic;">${acc.note}</p>` : ""}
            </div>
          </div>
        `;
        infoWindowRef.current?.setContent(infoContent);
        infoWindowRef.current?.open(map, marker);
        setSelectedDay(acc.day);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show entire route
    const bounds = new google.maps.LatLngBounds();
    ACCOMMODATIONS.forEach(a => bounds.extend({ lat: a.lat, lng: a.lng }));
    TRAIL_WAYPOINTS.forEach(p => bounds.extend(p));
    TRAIL_WAYPOINTS_2.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, []);

  const flyToDay = (day: number) => {
    const acc = ACCOMMODATIONS.find(a => a.day === day);
    if (acc && mapRef.current) {
      mapRef.current.panTo({ lat: acc.lat, lng: acc.lng });
      mapRef.current.setZoom(13);
      setSelectedDay(day);
      // Trigger marker click
      const marker = markersRef.current[ACCOMMODATIONS.findIndex(a => a.day === day)];
      if (marker) {
        google.maps.event.trigger(marker, "click");
      }
    }
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
              10 DAYS · 3 COUNTRIES · 9 STAYS · INTERACTIVE
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
              onClick={() => {
                if (mapRef.current) {
                  const bounds = new google.maps.LatLngBounds();
                  ACCOMMODATIONS.forEach(a => bounds.extend({ lat: a.lat, lng: a.lng }));
                  mapRef.current.fitBounds(bounds, 40);
                }
                setSelectedDay(null);
              }}
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
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                  selectedDay === acc.day
                    ? "bg-orange-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {acc.day === 0 ? "START" : `D${acc.day}`}
                {acc.day === 2 && <Bus className="w-3 h-3" />}
                {acc.day === 0 && <span className="text-[10px]">▶</span>}
              </button>
            ))}
            <button
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.panTo({ lat: 45.9237, lng: 6.8694 });
                  mapRef.current.setZoom(13);
                }
                setSelectedDay(10);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                selectedDay === 10
                  ? "bg-orange-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              END <CableCar className="w-3 h-3" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 bg-orange-500 rounded-full inline-block" />
              TRAIL
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
              BUS TRANSFER
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              FRANCE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              ITALY
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              SWITZERLAND
            </span>
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <MapView
              className="h-[450px] sm:h-[550px]"
              initialCenter={{ lat: 45.88, lng: 6.92 }}
              initialZoom={10}
              onMapReady={handleMapReady}
            />
          </div>

          {/* Accommodation list below map */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
            {ACCOMMODATIONS.map((acc) => (
              <button
                key={acc.day}
                onClick={() => flyToDay(acc.day)}
                className={`relative rounded-lg overflow-hidden border transition-all group cursor-pointer ${
                  selectedDay === acc.day
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
                    {acc.day === 0 ? "START" : `DAY ${acc.day}`}
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
    </section>
  );
}
