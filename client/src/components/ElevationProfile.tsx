import { useState, useMemo, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { ChevronDown, Mountain, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import profileRaw from "@/lib/tmb_elevation_profile.json";

// ── types ──────────────────────────────────────────────────────────
interface ProfilePoint {
  distance: number;
  elevation: number;
  stage: number;
}
interface Boundary {
  distance: number;
  label: string;
  day: string;
  elevation_ft: number;
}
interface ProfileData {
  profile: ProfilePoint[];
  boundaries: Boundary[];
  total_distance_miles: number;
  point_count: number;
}

const data = profileRaw as ProfileData;

// ── stage colors (match the map country colors) ────────────────────
const STAGE_COUNTRIES: Record<number, string> = {
  1: "france",
  2: "france",
  3: "italy",
  4: "italy",
  5: "italy",
  6: "italy",
  7: "switzerland",
  8: "switzerland",
  9: "france",
  10: "france",
};

const COUNTRY_COLORS: Record<string, string> = {
  france: "#e8913a",
  italy: "#4ade80",
  switzerland: "#ef4444",
};

// ── zoom levels ────────────────────────────────────────────────────
const ZOOM_LEVELS = [
  { label: "1x", scale: 1 },
  { label: "2x", scale: 2 },
  { label: "3x", scale: 3 },
  { label: "5x", scale: 5 },
];

// ── custom tooltip ─────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as ProfilePoint;
  const country = STAGE_COUNTRIES[d.stage] || "france";
  const boundary = data.boundaries.find(
    (b) => Math.abs(b.distance - d.distance) < 0.5
  );
  return (
    <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: COUNTRY_COLORS[country] }}
        />
        <span className="text-zinc-400 uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>
          Day {d.stage} · {country}
        </span>
      </div>
      <div className="text-white font-mono text-sm">
        {d.elevation.toLocaleString()} ft
      </div>
      <div className="text-zinc-500 font-mono" style={{ fontSize: "0.65rem" }}>
        Mile {d.distance.toFixed(1)}
      </div>
      {boundary && (
        <div className="mt-1 pt-1 border-t border-zinc-700 text-amber-400" style={{ fontSize: "0.65rem" }}>
          🏠 {boundary.label}
        </div>
      )}
    </div>
  );
}

// ── hotel marker on chart ──────────────────────────────────────────
function HotelDot(props: any) {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <line x1={cx} y1={cy} x2={cx} y2={cy - 18} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="2,2" />
      <circle cx={cx} cy={cy - 24} r={10} fill="#1c1917" stroke="#f59e0b" strokeWidth={1.5} />
      <text x={cx} y={cy - 20} textAnchor="middle" fill="#f59e0b" fontSize={10}>⌂</text>
    </g>
  );
}

// ── main component ─────────────────────────────────────────────────
export default function ElevationProfile() {
  const [open, setOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const chartWidth = zoom.scale === 1 ? "100%" : `${zoom.scale * 100}%`;

  // Build gradient stops for the area fill based on stage/country
  const gradientStops = useMemo(() => {
    if (!data.profile.length) return [];
    const totalDist = data.total_distance_miles;
    const stops: { offset: string; color: string }[] = [];
    let prevCountry = "";
    for (const p of data.profile) {
      const country = STAGE_COUNTRIES[p.stage] || "france";
      if (country !== prevCountry) {
        const offset = `${((p.distance / totalDist) * 100).toFixed(1)}%`;
        stops.push({ offset, color: COUNTRY_COLORS[country] });
        prevCountry = country;
      }
    }
    return stops;
  }, []);

  // Stats
  const maxEle = Math.max(...data.profile.map((p) => p.elevation));
  const minEle = Math.min(...data.profile.map((p) => p.elevation));

  // Scroll by a chunk when using arrow buttons
  const scrollBy = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const step = container.clientWidth * 0.6;
    container.scrollBy({
      left: dir === "right" ? step : -step,
      behavior: "smooth",
    });
  };

  // Reset scroll when zoom changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [zoomIndex]);

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section className="relative">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <Mountain className="w-5 h-5 text-amber-500" />
          <div className="text-left">
            <h2
              className="text-sm font-bold tracking-[0.2em] uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Elevation Profile
            </h2>
            <p className="text-[0.65rem] text-zinc-500 tracking-wider uppercase mt-0.5">
              {data.total_distance_miles} MILES · {maxEle.toLocaleString()} FT PEAK · 10 STAGES
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Content */}
      {open && (
        <div className="border border-t-0 border-zinc-800/50 bg-zinc-950/80 px-4 py-6">
          {/* Legend + Zoom Controls */}
          <div className="flex items-center justify-between mb-4 px-2 flex-wrap gap-3">
            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full bg-[#e8913a]" />
                <span className="text-[0.6rem] text-zinc-500 tracking-wider uppercase">France</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full bg-[#4ade80]" />
                <span className="text-[0.6rem] text-zinc-500 tracking-wider uppercase">Italy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full bg-[#ef4444]" />
                <span className="text-[0.6rem] text-zinc-500 tracking-wider uppercase">Switzerland</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-xs">⌂</span>
                <span className="text-[0.6rem] text-zinc-500 tracking-wider uppercase">Accommodation</span>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              {/* Left arrow (only when zoomed) */}
              {zoom.scale > 1 && (
                <button
                  onClick={() => scrollBy("left")}
                  className="w-8 h-8 flex items-center justify-center rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors active:scale-95"
                  title="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleZoomOut}
                disabled={zoomIndex === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span
                className="px-2 py-1 text-[0.65rem] font-mono text-amber-400 bg-zinc-800/60 rounded border border-zinc-700/30 min-w-[2.5rem] text-center"
              >
                {zoom.label}
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Right arrow (only when zoomed) */}
              {zoom.scale > 1 && (
                <button
                  onClick={() => scrollBy("right")}
                  className="w-8 h-8 flex items-center justify-center rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors active:scale-95"
                  title="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable chart container */}
          <div
            ref={scrollRef}
            className="w-full overflow-x-auto scrollbar-thin"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              scrollbarColor: "#52525b #1c1917",
            }}
          >
            <div style={{ width: chartWidth, minWidth: "100%", height: 320 }}>
              <AreaChart
                data={data.profile}
                width={
                  zoom.scale === 1
                    ? 800 // will be overridden by container
                    : Math.max(800 * zoom.scale, 1600)
                }
                height={320}
                margin={{ top: 30, right: 20, bottom: 20, left: 10 }}
              >
                <defs>
                  <linearGradient id="eleGradient" x1="0" y1="0" x2="1" y2="0">
                    {gradientStops.map((stop, i) => (
                      <stop
                        key={i}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={0.6}
                      />
                    ))}
                  </linearGradient>
                  <linearGradient id="eleStroke" x1="0" y1="0" x2="1" y2="0">
                    {gradientStops.map((stop, i) => (
                      <stop
                        key={i}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={1}
                      />
                    ))}
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="distance"
                  type="number"
                  domain={[0, "dataMax"]}
                  tickFormatter={(v: number) => `${v.toFixed(0)}`}
                  tick={{ fill: "#71717a", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={{ stroke: "#3f3f46" }}
                  label={{
                    value: "DISTANCE (MILES)",
                    position: "insideBottom",
                    offset: -10,
                    style: { fill: "#52525b", fontSize: 9, letterSpacing: "0.15em", fontFamily: "'JetBrains Mono', monospace" },
                  }}
                />
                <YAxis
                  domain={[
                    Math.floor(minEle / 500) * 500,
                    Math.ceil(maxEle / 500) * 500 + 500,
                  ]}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                  tick={{ fill: "#71717a", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={{ stroke: "#3f3f46" }}
                  width={45}
                  label={{
                    value: "ELEVATION (FT)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 5,
                    style: { fill: "#52525b", fontSize: 9, letterSpacing: "0.15em", fontFamily: "'JetBrains Mono', monospace" },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Stage boundary lines */}
                {data.boundaries.slice(1, -1).map((b, i) => (
                  <ReferenceLine
                    key={i}
                    x={b.distance}
                    stroke="#3f3f46"
                    strokeDasharray="3 3"
                    strokeWidth={0.5}
                  />
                ))}

                {/* Area fill */}
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke="url(#eleStroke)"
                  strokeWidth={2}
                  fill="url(#eleGradient)"
                  fillOpacity={0.3}
                  dot={false}
                  activeDot={{ r: 4, fill: "#f59e0b", stroke: "#1c1917", strokeWidth: 2 }}
                />

                {/* Hotel markers as reference dots */}
                {data.boundaries.map((b, i) => (
                  <ReferenceDot
                    key={`hotel-${i}`}
                    x={b.distance}
                    y={b.elevation_ft}
                    shape={<HotelDot />}
                  />
                ))}
              </AreaChart>
            </div>
          </div>

          {/* Scroll hint when zoomed */}
          {zoom.scale > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[0.6rem] text-zinc-600 tracking-wider uppercase font-mono">
                ← Swipe or use arrows to scroll · {zoom.label} zoom →
              </span>
            </div>
          )}

          {/* Accommodation strip below chart */}
          <div className="mt-4 grid grid-cols-11 gap-1 px-2">
            {data.boundaries.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center group cursor-default"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-bold mb-1 border transition-colors"
                  style={{
                    borderColor: i === 0 || i === data.boundaries.length - 1 ? "#f59e0b" : "#52525b",
                    color: i === 0 || i === data.boundaries.length - 1 ? "#f59e0b" : "#a1a1aa",
                    background: "#1c1917",
                  }}
                >
                  {i === 0 ? "▶" : i === data.boundaries.length - 1 ? "⏹" : i}
                </div>
                <span
                  className="text-zinc-500 group-hover:text-zinc-300 transition-colors leading-tight"
                  style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {b.elevation_ft.toLocaleString()}'
                </span>
                <span
                  className="text-zinc-600 leading-tight mt-0.5 hidden sm:block"
                  style={{ fontSize: "0.45rem" }}
                >
                  {b.label.length > 14 ? b.label.slice(0, 12) + "…" : b.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
