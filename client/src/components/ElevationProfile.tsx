// TMB Elevation Profile — stitched from real GPX data
// Button-only horizontal scroll (no touch scroll to preserve tooltip)
// Touch: locks page scroll when finger is in chart, tooltip positioned away from finger
// Country-colored segments, accommodation markers at stage endpoints
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, Mountain, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import profileRaw from "@/lib/tmb_elevation_profile.json";

// ── types ──────────────────────────────────────────────────────────
interface ProfilePoint {
  dist: number;
  ele: number;
  country: string;
  day: number;
  stage: number;
}
interface AccommodationMarker {
  name: string;
  dist: number;
  ele: number;
  day: number;
  lat: number;
  lon: number;
}
interface ProfileData {
  points: ProfilePoint[];
  accommodations: AccommodationMarker[];
  totalDistance: number;
  peakElevation: number;
}

const data = profileRaw as unknown as ProfileData;

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

// ── smart tooltip — positions away from finger ────────────────────
function SmartTooltip({ active, payload, coordinate, viewBox }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as ProfilePoint;
  const color = COUNTRY_COLORS[d.country] || "#e8913a";
  const accom = data.accommodations.find(
    (a) => Math.abs(a.dist - d.dist) < 0.5
  );

  // Determine if finger is on left or right half of chart
  const chartWidth = viewBox?.width || 800;
  const cx = coordinate?.x || 0;
  const fingerOnLeft = cx < chartWidth / 2;

  // Position tooltip on the opposite side from the finger
  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    pointerEvents: "none" as const,
    zIndex: 50,
    ...(fingerOnLeft
      ? { right: 8, left: "auto" }
      : { left: 8, right: "auto" }),
  };

  return (
    <div style={tooltipStyle}>
      <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span className="text-zinc-400 uppercase tracking-wider" style={{ fontSize: "0.65rem" }}>
            Day {d.day} · {d.country}
          </span>
        </div>
        <div className="text-white font-mono text-sm">
          {d.ele.toLocaleString()} ft
        </div>
        <div className="text-zinc-500 font-mono" style={{ fontSize: "0.65rem" }}>
          Mile {d.dist.toFixed(1)}
        </div>
        {accom && (
          <div className="mt-1 pt-1 border-t border-zinc-700 text-amber-400" style={{ fontSize: "0.65rem" }}>
            🏠 {accom.name}
          </div>
        )}
      </div>
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
  const [windowStart, setWindowStart] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const totalDist = data.totalDistance;
  const windowSize = totalDist / zoom.scale;
  const clampedStart = Math.max(0, Math.min(windowStart, totalDist - windowSize));

  // ── Lock page scroll when finger is inside the chart area ────────
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const preventScroll = (e: TouchEvent) => {
      // Only prevent vertical scroll — allow the touch to interact with the chart tooltip
      e.preventDefault();
    };

    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      el.removeEventListener("touchmove", preventScroll);
    };
  }, [open]);

  // Filter points to the visible window
  const visiblePoints = useMemo(() => {
    const end = clampedStart + windowSize;
    return data.points.filter((p) => p.dist >= clampedStart - 1 && p.dist <= end + 1);
  }, [clampedStart, windowSize]);

  // Visible accommodations
  const visibleAccoms = useMemo(() => {
    const end = clampedStart + windowSize;
    return data.accommodations.filter((a) => a.dist >= clampedStart - 1 && a.dist <= end + 1);
  }, [clampedStart, windowSize]);

  // Day boundary lines
  const dayBoundaries = useMemo(() => {
    const end = clampedStart + windowSize;
    return data.accommodations
      .filter((a) => a.dist > clampedStart && a.dist < end && a.day < 10);
  }, [clampedStart, windowSize]);

  // Build gradient stops for the area fill based on country
  const gradientStops = useMemo(() => {
    if (!visiblePoints.length) return [];
    const minDist = visiblePoints[0].dist;
    const maxDist = visiblePoints[visiblePoints.length - 1].dist;
    const range = maxDist - minDist || 1;
    const stops: { offset: string; color: string }[] = [];
    let prevCountry = "";
    for (const p of visiblePoints) {
      if (p.country !== prevCountry) {
        const offset = `${(((p.dist - minDist) / range) * 100).toFixed(1)}%`;
        stops.push({ offset, color: COUNTRY_COLORS[p.country] || "#e8913a" });
        prevCountry = p.country;
      }
    }
    return stops;
  }, [visiblePoints]);

  // Stats
  const maxEle = data.peakElevation;
  const minEle = Math.min(...data.points.map((p) => p.ele));

  // Scroll by a percentage of the visible window
  const scrollBy = useCallback((dir: "left" | "right") => {
    const step = windowSize * 0.5;
    setWindowStart((prev) => {
      const next = dir === "right" ? prev + step : prev - step;
      return Math.max(0, Math.min(next, totalDist - windowSize));
    });
  }, [windowSize, totalDist]);

  const handleZoomIn = () => {
    setZoomIndex((prev) => {
      const next = Math.min(prev + 1, ZOOM_LEVELS.length - 1);
      const currentCenter = clampedStart + windowSize / 2;
      const newWindowSize = totalDist / ZOOM_LEVELS[next].scale;
      setWindowStart(Math.max(0, Math.min(currentCenter - newWindowSize / 2, totalDist - newWindowSize)));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      const currentCenter = clampedStart + windowSize / 2;
      const newWindowSize = totalDist / ZOOM_LEVELS[next].scale;
      setWindowStart(Math.max(0, Math.min(currentCenter - newWindowSize / 2, totalDist - newWindowSize)));
      return next;
    });
  };

  // Position indicator for zoomed view
  const positionPct = totalDist > 0 ? (clampedStart / totalDist) * 100 : 0;
  const windowPct = totalDist > 0 ? (windowSize / totalDist) * 100 : 100;

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
              {data.totalDistance} MILES · {maxEle.toLocaleString()} FT PEAK · 10 STAGES
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

            {/* Zoom + Nav Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollBy("left")}
                disabled={clampedStart <= 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

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

              <button
                onClick={() => scrollBy("right")}
                disabled={clampedStart + windowSize >= totalDist}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Position indicator bar (when zoomed) */}
          {zoom.scale > 1 && (
            <div className="mx-2 mb-3">
              <div className="h-1.5 bg-zinc-800 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 h-full bg-amber-500/60 rounded-full transition-all duration-300"
                  style={{
                    left: `${positionPct}%`,
                    width: `${windowPct}%`,
                  }}
                />
                {data.accommodations.map((a, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full w-px bg-zinc-600"
                    style={{ left: `${(a.dist / totalDist) * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[0.55rem] font-mono text-zinc-600">
                  Mile {clampedStart.toFixed(0)}
                </span>
                <span className="text-[0.55rem] font-mono text-zinc-600">
                  Mile {Math.min(clampedStart + windowSize, totalDist).toFixed(0)}
                </span>
              </div>
            </div>
          )}

          {/* Chart — touch-action: none prevents page scroll when finger is inside */}
          <div
            ref={chartContainerRef}
            style={{ width: "100%", height: 320, touchAction: "none", position: "relative" }}
          >
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={visiblePoints}
                margin={{ top: 30, right: 20, bottom: 20, left: 10 }}
              >
                <defs>
                  <linearGradient id="eleGradientV2" x1="0" y1="0" x2="1" y2="0">
                    {gradientStops.map((stop, i) => (
                      <stop
                        key={i}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={0.6}
                      />
                    ))}
                  </linearGradient>
                  <linearGradient id="eleStrokeV2" x1="0" y1="0" x2="1" y2="0">
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
                  dataKey="dist"
                  type="number"
                  domain={[clampedStart, clampedStart + windowSize]}
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
                <Tooltip
                  content={<SmartTooltip />}
                  wrapperStyle={{ pointerEvents: "none", position: "absolute", top: 0, left: 0, right: 0 }}
                  position={{ x: 0, y: 0 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  isAnimationActive={false}
                />

                {/* Day boundary lines */}
                {dayBoundaries.map((b, i) => (
                  <ReferenceLine
                    key={i}
                    x={b.dist}
                    stroke="#3f3f46"
                    strokeDasharray="3 3"
                    strokeWidth={0.5}
                  />
                ))}

                {/* Area fill */}
                <Area
                  type="monotone"
                  dataKey="ele"
                  stroke="url(#eleStrokeV2)"
                  strokeWidth={2}
                  fill="url(#eleGradientV2)"
                  fillOpacity={0.3}
                  dot={false}
                  activeDot={{ r: 4, fill: "#f59e0b", stroke: "#1c1917", strokeWidth: 2 }}
                  isAnimationActive={false}
                />

                {/* Hotel markers */}
                {visibleAccoms.map((a, i) => (
                  <ReferenceDot
                    key={`hotel-${i}`}
                    x={a.dist}
                    y={a.ele}
                    shape={<HotelDot />}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Touch hint */}
          <p className="text-center text-[0.55rem] text-zinc-600 mt-1 tracking-wider">
            TAP CHART TO SEE ELEVATION · USE BUTTONS TO SCROLL & ZOOM
          </p>

          {/* Accommodation strip below chart */}
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-2 px-2 min-w-max">
              {data.accommodations.map((a, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const newStart = Math.max(0, a.dist - windowSize / 2);
                    setWindowStart(Math.min(newStart, totalDist - windowSize));
                  }}
                  className="flex flex-col items-center text-center group cursor-pointer hover:bg-zinc-800/40 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-bold mb-1 border transition-colors group-hover:border-amber-500 group-hover:text-amber-400"
                    style={{
                      borderColor: i === 0 || i === data.accommodations.length - 1 ? "#f59e0b" : "#52525b",
                      color: i === 0 || i === data.accommodations.length - 1 ? "#f59e0b" : "#a1a1aa",
                      background: "#1c1917",
                    }}
                  >
                    {i === 0 ? "▶" : i === data.accommodations.length - 1 ? "⏹" : `D${i}`}
                  </div>
                  <span
                    className="text-zinc-500 group-hover:text-zinc-300 transition-colors leading-tight whitespace-nowrap"
                    style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {a.ele.toLocaleString()}'
                  </span>
                  <span
                    className="text-zinc-600 leading-tight mt-0.5 whitespace-nowrap"
                    style={{ fontSize: "0.45rem" }}
                  >
                    {a.name.length > 18 ? a.name.slice(0, 16) + "…" : a.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
