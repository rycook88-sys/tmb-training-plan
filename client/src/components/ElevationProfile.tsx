// TMB Elevation Profile — stitched from real GPX data
// Two modes: Country (colored by country) and Steepness (gradient by ft/mile)
// Button-only horizontal scroll (no touch scroll to preserve tooltip)
// Touch: locks page scroll when finger is in chart, tooltip positioned away from finger
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
import { ChevronDown, Mountain, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MapPin, TrendingUp } from "lucide-react";
import profileRaw from "@/lib/tmb_elevation_profile.json";

// ── types ──────────────────────────────────────────────────────────
interface ProfilePoint {
  dist: number;
  ele: number;
  country: string;
  day: number;
}
interface AccommodationMarker {
  name: string;
  dist: number;
  ele: number;
  day: number;
}
interface ProfileData {
  points: ProfilePoint[];
  accommodations: AccommodationMarker[];
  totalDistance: number;
  peakElevation: number;
}

const data = profileRaw as unknown as ProfileData;

type ViewMode = "country" | "steepness";

const COUNTRY_COLORS: Record<string, string> = {
  france: "#e8913a",
  italy: "#4ade80",
  switzerland: "#ef4444",
};

// ── Steepness color scale ─────────────────────────────────────────
// Absolute ft/mile scale — direction (climb/descent) is visible from the line itself
const STEEPNESS_SCALE = [
  { min: 0,    max: 200,  color: "#a1a1aa" },  // gray — flat
  { min: 200,  max: 400,  color: "#86efac" },  // light green — gentle
  { min: 400,  max: 600,  color: "#4ade80" },  // green — easy grade
  { min: 600,  max: 750,  color: "#facc15" },  // yellow — moderate
  { min: 750,  max: 900,  color: "#fb923c" },  // orange — steep
  { min: 900,  max: 1000, color: "#ef4444" },  // red — hard
  { min: 1000, max: 1100, color: "#ec4899" },  // magenta — very hard
  { min: 1100, max: 1200, color: "#8b5cf6" },  // purple — brutal
  { min: 1200, max: 1300, color: "#d946ef" },  // bright fuchsia — extreme
  { min: 1300, max: 1400, color: "#f472b6" },  // neon pink — savage
  { min: 1400, max: Infinity, color: "#f0f0f0" },  // white-hot — max effort
];
const STEEPNESS_THRESHOLDS = [0, 200, 400, 600, 750, 900, 1000, 1100, 1200, 1300, 1400];

function getSteepnessColor(ftPerMile: number): string {
  const abs = Math.abs(ftPerMile);
  for (const s of STEEPNESS_SCALE) {
    if (abs >= s.min && abs < s.max) return s.color;
  }
  return STEEPNESS_SCALE[STEEPNESS_SCALE.length - 1].color;
}

// ── Pre-compute steepness at each point (smoothed over ~0.3 mile window) ──
const steepnessData = (() => {
  const pts = data.points;
  const result: number[] = new Array(pts.length).fill(0);
  const WINDOW = 0.3; // miles for smoothing

  for (let i = 0; i < pts.length; i++) {
    // Find points within window
    let lo = i, hi = i;
    while (lo > 0 && pts[i].dist - pts[lo].dist < WINDOW / 2) lo--;
    while (hi < pts.length - 1 && pts[hi].dist - pts[i].dist < WINDOW / 2) hi++;
    const distDiff = pts[hi].dist - pts[lo].dist;
    if (distDiff > 0.01) {
      result[i] = (pts[hi].ele - pts[lo].ele) / distDiff;
    }
  }
  return result;
})();

// ── zoom levels ────────────────────────────────────────────────────
const ZOOM_LEVELS = [
  { label: "1x", scale: 1 },
  { label: "2x", scale: 2 },
  { label: "3x", scale: 3 },
  { label: "5x", scale: 5 },
  { label: "8x", scale: 8 },
  { label: "12x", scale: 12 },
  { label: "18x", scale: 18 },
];

// ── smart tooltip — positions away from finger ────────────────────
function SmartTooltip({ active, payload, coordinate, viewBox, mode }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as ProfilePoint;
  const idx = data.points.findIndex(p => Math.abs(p.dist - d.dist) < 0.01 && p.day === d.day);
  const ftPerMile = idx >= 0 ? steepnessData[idx] : 0;

  const countryColor = COUNTRY_COLORS[d.country] || "#e8913a";
  const steepColor = getSteepnessColor(ftPerMile);
  const color = mode === "country" ? countryColor : steepColor;

  const accom = data.accommodations.find(
    (a) => Math.abs(a.dist - d.dist) < 0.5
  );

  // Determine if finger is on left or right half of chart
  const chartWidth = viewBox?.width || 800;
  const cx = coordinate?.x || 0;
  const fingerOnLeft = cx < chartWidth / 2;

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
        {mode === "steepness" && (
          <div className="mt-1 pt-1 border-t border-zinc-700 font-mono" style={{ fontSize: "0.65rem", color: steepColor }}>
            {Math.round(Math.abs(ftPerMile))} ft/mi
            <span className="text-zinc-500 ml-1">
              ({ftPerMile > 100 ? "climb" : ftPerMile < -100 ? "descent" : "flat"})
            </span>
          </div>
        )}
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
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  // Find the accommodation for this point
  const accom = data.accommodations.find(
    (a) => Math.abs(a.dist - (payload?.dist ?? -999)) < 0.3 && Math.abs(a.ele - (payload?.ele ?? -999)) < 50
  );
  if (!accom) return null;
  const idx = data.accommodations.indexOf(accom);
  const label = idx === 0 ? "▶" : idx === data.accommodations.length - 1 ? "⏹" : `D${idx}`;
  const name = accom.name;
  return (
    <g>
      <line x1={cx} y1={cy} x2={cx} y2={cy - 22} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="2,2" />
      {/* Name above */}
      <text x={cx} y={cy - 38} textAnchor="middle" fill="#a1a1aa" fontSize={7} fontFamily="'JetBrains Mono', monospace">
        {name.length > 20 ? name.slice(0, 18) + "…" : name}
      </text>
      {/* Bubble with identifier */}
      <circle cx={cx} cy={cy - 26} r={11} fill="#1c1917" stroke="#f59e0b" strokeWidth={1.5} />
      <text x={cx} y={cy - 22.5} textAnchor="middle" fill="#f59e0b" fontSize={idx === 0 || idx === data.accommodations.length - 1 ? 9 : 8} fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
        {label}
      </text>
    </g>
  );
}

// ── Country Legend ──────────────────────────────────────────────────
function CountryLegend() {
  return (
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
  );
}

// ── Steepness Legend ────────────────────────────────────────────────
function SteepnessLegend() {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[0.55rem] text-zinc-500 tracking-wider uppercase mr-0.5"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>ft/mi</span>
      {/* Color blocks with threshold numbers between them */}
      <div className="flex items-end gap-0">
        {STEEPNESS_SCALE.map((s, i) => (
          <div key={i} className="flex items-end">
            {/* Threshold number before this block (except first which is 0) */}
            {i === 0 && (
              <span className="text-zinc-600 px-0.5 leading-none" style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}>
                {STEEPNESS_THRESHOLDS[i]}
              </span>
            )}
            {/* Color block */}
            <div
              className="h-2.5"
              style={{
                width: 22,
                background: s.color,
                borderRadius: i === 0 ? "2px 0 0 2px" : i === STEEPNESS_SCALE.length - 1 ? "0 2px 2px 0" : 0,
              }}
            />
            {/* Threshold number after this block */}
            {i < STEEPNESS_SCALE.length - 1 ? (
              <span className="text-zinc-600 px-0.5 leading-none" style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}>
                {STEEPNESS_THRESHOLDS[i + 1]}
              </span>
            ) : (
              <span className="text-zinc-600 px-0.5 leading-none" style={{ fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace" }}>
                +
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────
export default function ElevationProfile({ highlightDay, onDayHover }: { highlightDay?: number | null; onDayHover?: (day: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [customScale, setCustomScale] = useState(1); // continuous zoom scale
  const [windowStart, setWindowStart] = useState(0);
  const [mode, setMode] = useState<ViewMode>("country");
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const totalDist = data.totalDistance;
  const windowSize = totalDist / customScale;
  const clampedStart = Math.max(0, Math.min(windowStart, totalDist - windowSize));

  // Derive display label: show preset label if close to one, otherwise show scale
  const zoomLabel = useMemo(() => {
    for (const z of ZOOM_LEVELS) {
      if (Math.abs(customScale - z.scale) < 0.05) return z.label;
    }
    return `${customScale.toFixed(1)}x`;
  }, [customScale]);

  // ── Lock page scroll when finger is inside the chart area ────────
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const preventScroll = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => { el.removeEventListener("touchmove", preventScroll); };
  }, [open]);

  // ── Navigate to highlighted day ──────────────────────────────────
  useEffect(() => {
    if (highlightDay && highlightDay >= 1 && highlightDay <= 10 && open) {
      const dayPts = data.points.filter(p => p.day === highlightDay);
      if (dayPts.length > 0) {
        const dayStart = dayPts[0].dist;
        const dayEnd = dayPts[dayPts.length - 1].dist;
        const dayCenter = (dayStart + dayEnd) / 2;
        const newStart = Math.max(0, Math.min(dayCenter - windowSize / 2, totalDist - windowSize));
        setWindowStart(newStart);
      }
    }
  }, [highlightDay, open]);

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

  // ── Build gradient stops for COUNTRY mode (hard transitions) ─────
  const countryGradientStops = useMemo(() => {
    if (!visiblePoints.length) return [];
    const minDist = visiblePoints[0].dist;
    const maxDist = visiblePoints[visiblePoints.length - 1].dist;
    const range = maxDist - minDist || 1;
    const stops: { offset: string; color: string }[] = [];
    let prevCountry = visiblePoints[0].country;
    stops.push({ offset: "0%", color: COUNTRY_COLORS[prevCountry] || "#e8913a" });
    for (let i = 1; i < visiblePoints.length; i++) {
      const p = visiblePoints[i];
      if (p.country !== prevCountry) {
        const offset = `${(((p.dist - minDist) / range) * 100).toFixed(2)}%`;
        stops.push({ offset, color: COUNTRY_COLORS[prevCountry] || "#e8913a" });
        stops.push({ offset, color: COUNTRY_COLORS[p.country] || "#e8913a" });
        prevCountry = p.country;
      }
    }
    stops.push({ offset: "100%", color: COUNTRY_COLORS[prevCountry] || "#e8913a" });
    return stops;
  }, [visiblePoints]);

  // ── Build gradient stops for STEEPNESS mode ──────────────────────
  const steepnessGradientStops = useMemo(() => {
    if (!visiblePoints.length) return [];
    const minDist = visiblePoints[0].dist;
    const maxDist = visiblePoints[visiblePoints.length - 1].dist;
    const range = maxDist - minDist || 1;
    const stops: { offset: string; color: string }[] = [];

    // Sample at each visible point
    let prevColor = "";
    for (let i = 0; i < visiblePoints.length; i++) {
      const p = visiblePoints[i];
      const globalIdx = data.points.findIndex(gp => Math.abs(gp.dist - p.dist) < 0.005 && gp.day === p.day);
      const ftpm = globalIdx >= 0 ? steepnessData[globalIdx] : 0;
      const color = getSteepnessColor(ftpm);
      const offset = `${(((p.dist - minDist) / range) * 100).toFixed(2)}%`;

      if (color !== prevColor) {
        // Hard transition: close previous color, open new color at same offset
        if (prevColor) {
          stops.push({ offset, color: prevColor });
        }
        stops.push({ offset, color });
        prevColor = color;
      }
    }
    // Final stop
    if (prevColor) {
      stops.push({ offset: "100%", color: prevColor });
    }
    return stops;
  }, [visiblePoints]);

  const activeGradientStops = mode === "country" ? countryGradientStops : steepnessGradientStops;

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

  // Snap to the nearest preset zoom level in a given direction
  const handleZoomIn = () => {
    const nextPreset = ZOOM_LEVELS.find(z => z.scale > customScale + 0.05);
    if (!nextPreset) return;
    const currentCenter = clampedStart + windowSize / 2;
    const newWindowSize = totalDist / nextPreset.scale;
    setCustomScale(nextPreset.scale);
    setWindowStart(Math.max(0, Math.min(currentCenter - newWindowSize / 2, totalDist - newWindowSize)));
  };

  const handleZoomOut = () => {
    const presets = [...ZOOM_LEVELS].reverse();
    const nextPreset = presets.find(z => z.scale < customScale - 0.05);
    if (!nextPreset) return;
    const currentCenter = clampedStart + windowSize / 2;
    const newWindowSize = totalDist / nextPreset.scale;
    setCustomScale(nextPreset.scale);
    setWindowStart(Math.max(0, Math.min(currentCenter - newWindowSize / 2, totalDist - newWindowSize)));
  };

  // Position indicator for zoomed view
  const positionPct = totalDist > 0 ? (clampedStart / totalDist) * 100 : 0;
  const windowPct = totalDist > 0 ? (windowSize / totalDist) * 100 : 100;

  // Day highlight reference lines
  const highlightDayLines = useMemo(() => {
    if (!highlightDay) return null;
    const dayPts = data.points.filter(p => p.day === highlightDay);
    if (!dayPts.length) return null;
    return {
      start: dayPts[0].dist,
      end: dayPts[dayPts.length - 1].dist,
    };
  }, [highlightDay]);

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
          {/* Mode Toggle + Legend + Zoom Controls */}
          <div className="flex flex-col gap-3 mb-4 px-2">
            {/* Top row: Mode toggle + Zoom controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Mode toggle buttons */}
              <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-0.5 border border-zinc-700/30">
                <button
                  onClick={() => setMode("country")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.65rem] font-mono uppercase tracking-wider transition-all ${
                    mode === "country"
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  Country
                </button>
                <button
                  onClick={() => setMode("steepness")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.65rem] font-mono uppercase tracking-wider transition-all ${
                    mode === "steepness"
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Steepness
                </button>
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
                  disabled={customScale <= ZOOM_LEVELS[0].scale + 0.05}
                  className="w-8 h-8 flex items-center justify-center rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 text-[0.65rem] font-mono text-amber-400 bg-zinc-800/60 rounded border border-zinc-700/30 min-w-[2.5rem] text-center">
                  {zoomLabel}
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={customScale >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1].scale - 0.05}
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

            {/* Legend row — changes based on mode */}
            {mode === "country" ? <CountryLegend /> : <SteepnessLegend />}
          </div>

          {/* Position indicator bar (when zoomed) */}
          {customScale > 1.05 && (
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
                  <linearGradient id="eleGradientActive" x1="0" y1="0" x2="1" y2="0">
                    {activeGradientStops.map((stop, i) => (
                      <stop
                        key={`${mode}-fill-${i}`}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={0.5}
                      />
                    ))}
                  </linearGradient>
                  <linearGradient id="eleStrokeActive" x1="0" y1="0" x2="1" y2="0">
                    {activeGradientStops.map((stop, i) => (
                      <stop
                        key={`${mode}-stroke-${i}`}
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
                  content={<SmartTooltip mode={mode} />}
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

                {/* Highlight day range */}
                {highlightDayLines && (
                  <>
                    <ReferenceLine x={highlightDayLines.start} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" />
                    <ReferenceLine x={highlightDayLines.end} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" />
                  </>
                )}

                {/* Area fill */}
                <Area
                  type="monotone"
                  dataKey="ele"
                  stroke="url(#eleStrokeActive)"
                  strokeWidth={2}
                  fill="url(#eleGradientActive)"
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
                    // Find the day's distance range and zoom so it fills 96% of x-axis
                    const dayNum = a.day;
                    const dayPts = data.points.filter(p => p.day === dayNum);
                    if (dayPts.length > 0) {
                      const dayStart = dayPts[0].dist;
                      const dayEnd = dayPts[dayPts.length - 1].dist;
                      const daySpan = dayEnd - dayStart;
                      const padding = daySpan * (2 / 96); // 2% on each side
                      const newWindowSize = daySpan + padding * 2;
                      const exactScale = totalDist / newWindowSize;
                      setCustomScale(exactScale);
                      const actualWindowSize = totalDist / exactScale;
                      const dayCenter = (dayStart + dayEnd) / 2;
                      const newStart = Math.max(0, Math.min(dayCenter - actualWindowSize / 2, totalDist - actualWindowSize));
                      setWindowStart(newStart);
                    }
                  }}
                  onMouseEnter={() => onDayHover?.(a.day)}
                  onMouseLeave={() => onDayHover?.(null)}
                  className={`flex flex-col items-center text-center group cursor-pointer hover:bg-zinc-800/40 rounded-lg px-2 py-1.5 transition-colors ${
                    highlightDay === a.day ? "bg-zinc-800/60 ring-1 ring-amber-500/40" : ""
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-bold mb-1 border transition-colors group-hover:border-amber-500 group-hover:text-amber-400"
                    style={{
                      borderColor: highlightDay === a.day ? "#f59e0b" : i === 0 || i === data.accommodations.length - 1 ? "#f59e0b" : "#52525b",
                      color: highlightDay === a.day ? "#f59e0b" : i === 0 || i === data.accommodations.length - 1 ? "#f59e0b" : "#a1a1aa",
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
