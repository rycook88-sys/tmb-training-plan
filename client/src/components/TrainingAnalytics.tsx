// ============================================================
// Training Analytics — 7 Collapsible Metric Panels
// Design: Alpine Command Center / Topographic Brutalism
// Dark theme, mono fonts, orange primary, sharp edges
// ============================================================
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
  ComposedChart, Area,
} from "recharts";
import {
  Activity, ChevronDown, TrendingUp, Heart, Timer,
  Flame, Mountain as MountainIcon, BarChart3,
} from "lucide-react";
import {
  GARMIN_SESSIONS, WEEKLY_VOLUME,
  getCardioSessions, getHikeSessions, getYogaSessions,
} from "@/lib/garmin-data";
import { useUnits } from "@/contexts/UnitContext";

// ── Colors ───────────────────────────────────────────────────
const C = {
  orange: "oklch(0.7 0.19 45)",
  orangeDim: "oklch(0.5 0.14 45)",
  green: "oklch(0.65 0.15 145)",
  greenDim: "oklch(0.45 0.10 145)",
  blue: "oklch(0.6 0.15 250)",
  blueDim: "oklch(0.4 0.10 250)",
  red: "oklch(0.65 0.2 27)",
  redDim: "oklch(0.45 0.14 27)",
  yellow: "oklch(0.75 0.15 85)",
  yellowDim: "oklch(0.55 0.10 85)",
  purple: "oklch(0.6 0.15 300)",
  stone: "oklch(0.55 0.02 65)",
  stoneDim: "oklch(0.35 0.01 65)",
  grid: "oklch(0.22 0.01 250)",
  bg: "oklch(0.16 0.01 250)",
  text: "oklch(0.92 0.01 65)",
  muted: "oklch(0.55 0.02 65)",
};

// ── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[oklch(0.18_0.01_250)] border border-border px-3 py-2 text-xs font-mono">
      <div className="text-[var(--muted-foreground)] mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2" style={{ background: p.color }} />
          <span className="text-[var(--muted-foreground)]">{p.name}:</span>
          <span className="text-foreground font-medium">
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Collapsible Panel ────────────────────────────────────────
function MetricPanel({ title, icon: Icon, children, defaultOpen = false, badge }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--secondary)] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-mono">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-mono bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5">
              {badge}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 1. Cardio Avg HR Trend ───────────────────────────────────
function CardioHRTrend() {
  const data = useMemo(() => {
    return getCardioSessions().map(s => ({
      date: s.date.slice(5),
      avgHR: Math.round(s.avg_hr),
      type: s.type === "STAIR STEPPER" ? "Stair" : "Cardio",
    }));
  }, []);

  const avgAll = Math.round(data.reduce((s, d) => s + d.avgHR, 0) / data.length);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          {data.length} sessions · Avg: <span className="text-foreground">{avgAll} bpm</span>
        </span>
        <span className="text-[10px] font-mono text-green-400">Zone 2 ceiling: 154 bpm</span>
      </div>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted, fontFamily: "'JetBrains Mono'" }} interval="preserveStartEnd" />
            <YAxis domain={[110, 160]} tick={{ fontSize: 10, fill: C.muted, fontFamily: "'JetBrains Mono'" }} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => `${v} bpm`} />} />
            <ReferenceLine y={154} stroke={C.green} strokeDasharray="5 5" label={{ value: "Z2 Ceiling", position: "right", fill: C.green, fontSize: 9, fontFamily: "'JetBrains Mono'" }} />
            <ReferenceLine y={140} stroke={C.blueDim} strokeDasharray="3 3" label={{ value: "Z2 Floor", position: "right", fill: C.blueDim, fontSize: 9, fontFamily: "'JetBrains Mono'" }} />
            <Line type="monotone" dataKey="avgHR" name="Avg HR" stroke={C.orange} strokeWidth={2} dot={{ r: 3, fill: C.orange }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2 italic">
        Trend: Most sessions land between Z1 and Z2. Sessions above 154 bpm indicate higher-intensity days or poor recovery.
      </div>
    </div>
  );
}

// ── 2. Zone 2 Time % Per Session ─────────────────────────────
function Zone2Bars() {
  const data = useMemo(() => {
    return getCardioSessions().map(s => ({
      date: s.date.slice(5),
      z2: Math.round(s.z2_pct),
      z1: Math.round(s.z1_pct),
      z3plus: Math.round(s.z3_pct + s.z4_pct + s.z5_pct),
      type: s.type === "STAIR STEPPER" ? "S" : "C",
    }));
  }, []);

  const avgZ2 = Math.round(data.reduce((s, d) => s + d.z2, 0) / data.length);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          Avg Zone 2: <span className={avgZ2 >= 40 ? "text-green-400" : "text-[var(--primary)]"}>{avgZ2}%</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">Target: 60%+ per session</span>
      </div>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.muted, fontFamily: "'JetBrains Mono'" }} interval={0} angle={-45} textAnchor="end" height={40} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.muted, fontFamily: "'JetBrains Mono'" }} />
            <Tooltip content={<CustomTooltip formatter={(v: number, n: string) => `${v}%`} />} />
            <ReferenceLine y={60} stroke={C.green} strokeDasharray="5 5" />
            <Bar dataKey="z1" name="Zone 1" stackId="zones" fill={C.blueDim} />
            <Bar dataKey="z2" name="Zone 2" stackId="zones" fill={C.green} />
            <Bar dataKey="z3plus" name="Zone 3+" stackId="zones" fill={C.orangeDim} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.blueDim }} /> Z1</span>
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.green }} /> Z2</span>
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.orangeDim }} /> Z3+</span>
      </div>
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2 italic">
        Stair stepper sessions consistently hit 60%+ Zone 2. Elliptical sessions are more variable — watch for Z3 creep on high-HR days.
      </div>
    </div>
  );
}

// ── 3. HR Drift Per Session ──────────────────────────────────
function HRDrift() {
  const data = useMemo(() => {
    return getCardioSessions().map(s => ({
      date: s.date.slice(5),
      drift: s.drift,
      type: s.type === "STAIR STEPPER" ? "Stair" : "Cardio",
    }));
  }, []);

  const avgDrift = (data.reduce((s, d) => s + d.drift, 0) / data.length).toFixed(1);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          Avg drift: <span className="text-foreground">{avgDrift} bpm</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          Ideal: &lt;5 bpm (good aerobic fitness)
        </span>
      </div>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.muted, fontFamily: "'JetBrains Mono'" }} interval={0} angle={-45} textAnchor="end" height={40} />
            <YAxis domain={[-25, 15]} tick={{ fontSize: 10, fill: C.muted, fontFamily: "'JetBrains Mono'" }} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => `${v > 0 ? "+" : ""}${v} bpm`} />} />
            <ReferenceLine y={0} stroke={C.muted} />
            <ReferenceLine y={5} stroke={C.yellowDim} strokeDasharray="3 3" label={{ value: "+5", position: "right", fill: C.yellowDim, fontSize: 9 }} />
            <ReferenceLine y={-5} stroke={C.yellowDim} strokeDasharray="3 3" label={{ value: "-5", position: "right", fill: C.yellowDim, fontSize: 9 }} />
            <Bar dataKey="drift" name="HR Drift">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={Math.abs(entry.drift) <= 5 ? C.green : Math.abs(entry.drift) <= 10 ? C.yellow : C.red}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.green }} /> ±5 Good</span>
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.yellow }} /> ±10 Watch</span>
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.red }} /> &gt;10 Flag</span>
      </div>
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2 italic">
        HR drift = 2nd half avg HR minus 1st half. Positive drift is normal (cardiac drift). Large negative drift often means warmup was too aggressive.
        The Feb 1 and Feb 3 sessions show -20 to -25 bpm drift — likely high warmup HR settling down.
      </div>
    </div>
  );
}

// ── 4. Weekly Volume Breakdown ───────────────────────────────
function WeeklyVolume() {
  const data = useMemo(() => {
    return Object.entries(WEEKLY_VOLUME).map(([week, v]) => ({
      week: week.replace(" (", "\n("),
      cardio: v.cardio,
      strength: v.strength,
      yoga: v.yoga,
      hike: v.hike,
      total: v.total,
    }));
  }, []);

  const totalMin = data.reduce((s, d) => s + d.total, 0);
  const totalHrs = (totalMin / 60).toFixed(1);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          8 weeks · <span className="text-foreground">{totalHrs} hrs</span> total
        </span>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          Avg: <span className="text-foreground">{Math.round(totalMin / 8)} min/wk</span>
        </span>
      </div>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: C.muted, fontFamily: "'JetBrains Mono'" }} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: "'JetBrains Mono'" }} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => `${v} min`} />} />
            <Bar dataKey="cardio" name="Cardio" stackId="vol" fill={C.orange} />
            <Bar dataKey="strength" name="Strength" stackId="vol" fill={C.blue} />
            <Bar dataKey="yoga" name="Yoga" stackId="vol" fill={C.purple} />
            <Bar dataKey="hike" name="Hike" stackId="vol" fill={C.green} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.orange }} /> Cardio</span>
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.blue }} /> Strength</span>
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.purple }} /> Yoga</span>
        <span className="flex items-center gap-1 text-[10px] font-mono"><span className="w-2 h-2 inline-block" style={{ background: C.green }} /> Hike</span>
      </div>
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2 italic">
        W10 was the peak week (682 min) with two hikes added. W11–W12 show a dip — likely work schedule impact. Aim for 350+ min/week through June.
      </div>
    </div>
  );
}

// ── 5. Hiking-Specific Data ──────────────────────────────────
function HikingData() {
  const u = useUnits();
  const hikes = useMemo(() => getHikeSessions(), []);

  if (hikes.length === 0) {
    return (
      <div className="mt-4 text-xs font-mono text-[var(--muted-foreground)]">
        No hike data yet. Upload hike FIT files to see pace and HR analysis.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mb-3">
        {hikes.length} hikes recorded
      </div>
      <div className="space-y-3">
        {hikes.map(h => {
          const pacePerK = h.elevation_gain > 0 ? (h.duration_min / (h.elevation_gain / 1000)).toFixed(1) : "—";
          const ascentHR = h.avg_hr; // approximation since we don't have split data
          return (
            <div key={h.id} className="border border-border p-3 bg-[var(--secondary)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-foreground">{h.date}</span>
                <span className="text-[10px] font-mono text-[var(--primary)]">{u.dist(h.distance_mi)} {u.distUnit}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Duration</div>
                  <div className="font-mono text-sm text-foreground">{h.duration_min} min</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Gain / Loss</div>
                  <div className="font-mono text-sm">
                    <span className="text-green-400">↑{u.elev(h.elevation_gain)} {u.elevUnit}</span>
                    {" / "}
                    <span className="text-red-400">↓{u.elev(h.elevation_loss)} {u.elevUnit}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Pace / {u.isMetric ? "300m" : "1000'"} Gain</div>
                  <div className="font-mono text-sm text-foreground">{pacePerK} min</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Avg HR</div>
                  <div className="font-mono text-sm text-foreground">{Math.round(h.avg_hr)} bpm</div>
                </div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="text-[10px] font-mono bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5">
                  Z2: {h.z2_pct}%
                </span>
                <span className="text-[10px] font-mono bg-green-400/10 text-green-400 px-1.5 py-0.5">
                  Drift: {h.drift > 0 ? "+" : ""}{h.drift} bpm
                </span>
                <span className="text-[10px] font-mono bg-blue-400/10 text-blue-400 px-1.5 py-0.5">
                  Max HR: {h.max_hr} bpm
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-3 italic">
        The Mar 10 hike ({u.dist(12.5)} {u.distUnit}, {u.elev(1133)} {u.elevUnit} gain, {u.elev(1427)} {u.elevUnit} loss) is the closest analog to a TMB day. HR stayed well below Z2 — good sign for aerobic base.
        More hike data will unlock ascent vs descent HR comparison.
      </div>
    </div>
  );
}

// ── 6. Resting HR Trend ──────────────────────────────────────
function RestingHRTrend() {
  // Use yoga sessions as resting HR proxy + all session min HRs
  const yogaData = useMemo(() => getYogaSessions(), []);

  // Also extract min HR from all sessions as another proxy
  const allMinHR = useMemo(() => {
    return GARMIN_SESSIONS
      .filter(s => s.type !== "YOGA")
      .map(s => ({
        date: s.date.slice(5),
        type: s.type,
        avgHR: Math.round(s.avg_hr),
      }));
  }, []);

  return (
    <div className="mt-4">
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mb-3">
        Yoga session avg HR used as resting HR proxy (most reliable non-exercise HR from wrist sensor)
      </div>
      {yogaData.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {yogaData.map(y => (
              <div key={y.id} className="border border-border p-3 bg-[var(--secondary)] text-center">
                <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">{y.date.slice(5)}</div>
                <div className="font-mono text-xl font-bold text-foreground mt-1">{Math.round(y.avg_hr)}</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">bpm</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 border border-green-400/20 bg-green-400/5">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] font-mono text-green-400">
              Trend: {yogaData[0].avg_hr} → {yogaData[yogaData.length - 1].avg_hr} bpm
              ({(yogaData[yogaData.length - 1].avg_hr - yogaData[0].avg_hr).toFixed(1)} bpm change)
            </span>
          </div>
          <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2 italic">
            Yoga HR dropped from 91 to 84 bpm over 8 days — a strong signal of improving aerobic base.
            Continue tracking with more yoga sessions for a clearer trend.
          </div>
        </>
      ) : (
        <div className="text-xs font-mono text-[var(--muted-foreground)]">
          No yoga sessions recorded yet. Yoga avg HR is the best proxy for resting HR from wrist data.
        </div>
      )}
    </div>
  );
}

// ── 7. Calories Per Session ──────────────────────────────────
function CaloriesBurned() {
  const data = useMemo(() => {
    return GARMIN_SESSIONS.map(s => ({
      date: s.date.slice(5),
      calories: s.calories,
      type: s.type === "STAIR STEPPER" ? "Stair" : s.type.charAt(0) + s.type.slice(1).toLowerCase(),
      duration: s.duration_min,
      calPerMin: Math.round(s.calories / s.duration_min * 10) / 10,
    }));
  }, []);

  const typeColors: Record<string, string> = {
    Cardio: C.orange,
    Stair: C.yellow,
    Strength: C.blue,
    Yoga: C.purple,
    Hike: C.green,
  };

  const totalCal = data.reduce((s, d) => s + d.calories, 0);
  const avgCal = Math.round(totalCal / data.length);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          Total: <span className="text-foreground">{totalCal.toLocaleString()} kcal</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          Avg: <span className="text-foreground">{avgCal} kcal/session</span>
        </span>
      </div>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.muted, fontFamily: "'JetBrains Mono'" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: "'JetBrains Mono'" }} />
            <Tooltip content={<CustomTooltip formatter={(v: number, n: string) => `${v} kcal`} />} />
            <Bar dataKey="calories" name="Calories">
              {data.map((entry, i) => (
                <Cell key={i} fill={typeColors[entry.type] || C.stone} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        {Object.entries(typeColors).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1 text-[10px] font-mono">
            <span className="w-2 h-2 inline-block" style={{ background: color }} /> {type}
          </span>
        ))}
      </div>
      <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2 italic">
        The Feb 16 cardio session (2,068 kcal, 148 min) was the highest burn. Strength sessions average ~1,000 kcal.
        Calorie burn correlates strongly with duration and HR zone.
      </div>
    </div>
  );
}

// ── Summary Stats Bar ────────────────────────────────────────
function SummaryStats() {
  const cardio = getCardioSessions();
  const totalSessions = GARMIN_SESSIONS.length;
  const totalMin = GARMIN_SESSIONS.reduce((s, d) => s + d.duration_min, 0);
  const totalCal = GARMIN_SESSIONS.reduce((s, d) => s + d.calories, 0);
  const avgZ2 = Math.round(cardio.reduce((s, d) => s + d.z2_pct, 0) / cardio.length);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div className="border border-border bg-[var(--secondary)] p-3 text-center">
        <div className="font-mono text-xl font-bold text-foreground">{totalSessions}</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Sessions</div>
      </div>
      <div className="border border-border bg-[var(--secondary)] p-3 text-center">
        <div className="font-mono text-xl font-bold text-foreground">{(totalMin / 60).toFixed(0)}</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Total Hours</div>
      </div>
      <div className="border border-border bg-[var(--secondary)] p-3 text-center">
        <div className="font-mono text-xl font-bold text-[var(--primary)]">{avgZ2}%</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Avg Z2 (Cardio)</div>
      </div>
      <div className="border border-border bg-[var(--secondary)] p-3 text-center">
        <div className="font-mono text-xl font-bold text-foreground">{(totalCal / 1000).toFixed(1)}k</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Total kcal</div>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────
export default function TrainingAnalytics({ embedded = false }: { embedded?: boolean } = {}) {
  const [open, setOpen] = useState(embedded);

  return (
    <section className="container py-8">
      {!embedded && (
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground font-mono flex items-center gap-3 font-semibold">
          <span className="text-xl">📊</span> Training Analytics — Garmin Data
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
            36 activities · Feb 1 – Mar 24
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          </motion.div>
        </div>
      </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              <SummaryStats />

              <MetricPanel title="Cardio Avg HR Trend" icon={Heart} badge="18 sessions" defaultOpen>
                <CardioHRTrend />
              </MetricPanel>

              <MetricPanel title="Zone 2 Time Per Session" icon={Timer} badge="80/20 target">
                <Zone2Bars />
              </MetricPanel>

              <MetricPanel title="HR Drift Analysis" icon={TrendingUp} badge="aerobic efficiency">
                <HRDrift />
              </MetricPanel>

              <MetricPanel title="Weekly Training Volume" icon={BarChart3} badge="8 weeks">
                <WeeklyVolume />
              </MetricPanel>

              <MetricPanel title="Hiking-Specific Data" icon={MountainIcon} badge="2 hikes">
                <HikingData />
              </MetricPanel>

              <MetricPanel title="Resting HR Trend" icon={Heart} badge="yoga proxy">
                <RestingHRTrend />
              </MetricPanel>

              <MetricPanel title="Calories Burned Per Session" icon={Flame} badge="36 sessions">
                <CaloriesBurned />
              </MetricPanel>

              <div className="text-[10px] font-mono text-[var(--muted-foreground)] text-center mt-4 italic">
                Data source: Garmin Enduro 3 FIT exports · Zones: %HRR method (Max 196, Rest 56)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
