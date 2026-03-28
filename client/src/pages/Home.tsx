/*
 * Alpine Command Center — TMB Training Dashboard
 * Design: Topographic Brutalism
 * Colors: Slate #0F1419 base, Safety Orange #FF6B35 accent, Stone gray secondary
 * Typography: Space Grotesk display, JetBrains Mono data
 * Layout: Asymmetric dashboard, hard edges, no border-radius
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ATHLETE,
  TMB_ITINERARY,
  WORKOUT_PLAN,
  FOOT_VIDEOS,
  WEEKLY_BLOCKS,
  getDaysUntilTrip,
  getWeightProgress,
} from "@/lib/data";
import type { ItineraryDay, WorkoutDay } from "@/lib/data";
import {
  Mountain,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Footprints,
  Target,
  ArrowDown,
  ArrowUp,
  Play,
} from "lucide-react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/hero-tmb-ridge-TA9BE2JzZxaxi68um9vvG9.webp";
const TOPO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/topo-texture-3ai3ccpyxv32r72SNbY3MU.webp";
const DESCENT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/alpine-descent-fVYu9fsGi368uNUQov45Qu.webp";
const MASSIF_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/mont-blanc-massif-9zhRqKCwtJsZQ3ZMrMW65f.webp";

// ─── Weight Tracker with localStorage ──────────────────────
function useWeightTracker() {
  const [entries, setEntries] = useState<{ date: string; weight: number }[]>(() => {
    try {
      const saved = localStorage.getItem("tmb-weight-log");
      return saved ? JSON.parse(saved) : [{ date: "2026-03-14", weight: 232 }, { date: "2026-03-28", weight: 226 }];
    } catch {
      return [{ date: "2026-03-14", weight: 232 }, { date: "2026-03-28", weight: 226 }];
    }
  });

  useEffect(() => {
    localStorage.setItem("tmb-weight-log", JSON.stringify(entries));
  }, [entries]);

  const addEntry = (weight: number) => {
    const today = new Date().toISOString().split("T")[0];
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== today);
      return [...filtered, { date: today, weight }].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weight : ATHLETE.currentWeight;
  const progress = getWeightProgress(currentWeight);

  return { entries, addEntry, currentWeight, progress };
}

// ─── Workout Completion Tracker ────────────────────────────
function useWorkoutTracker() {
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("tmb-workout-completed");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("tmb-workout-completed", JSON.stringify(completed));
  }, [completed]);

  const toggle = (dayId: string, exerciseName: string) => {
    const key = `${dayId}::${exerciseName}`;
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isCompleted = (dayId: string, exerciseName: string) => {
    return !!completed[`${dayId}::${exerciseName}`];
  };

  const resetWeek = () => setCompleted({});

  return { toggle, isCompleted, resetWeek };
}

// ─── Countdown Component ───────────────────────────────────
function Countdown() {
  const [days, setDays] = useState(getDaysUntilTrip());
  useEffect(() => {
    const timer = setInterval(() => setDays(getDaysUntilTrip()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-5xl sm:text-7xl font-bold text-[var(--primary)] tracking-tighter leading-none">{days}</span>
      <span className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">days to go</span>
    </div>
  );
}

// ─── Weight Gauge (Vertical Altitude Style) ────────────────
function WeightGauge({ currentWeight, progress, entries, onAddWeight }: {
  currentWeight: number;
  progress: number;
  entries: { date: string; weight: number }[];
  onAddWeight: (w: number) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(inputVal);
    if (w > 150 && w < 300) {
      onAddWeight(w);
      setInputVal("");
      setShowInput(false);
    }
  };

  const gaugeHeight = 280;
  const markerY = gaugeHeight - (progress / 100) * gaugeHeight;
  const goalReached = currentWeight <= ATHLETE.goalWeight;

  return (
    <div className="border border-border p-5 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)]">Altitude Gauge</h3>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          {ATHLETE.startWeight} → {ATHLETE.goalWeight} lb
        </span>
      </div>

      <div className="flex gap-6 items-center">
        {/* Vertical gauge */}
        <div className="relative" style={{ width: 48, height: gaugeHeight }}>
          {/* Track */}
          <div className="absolute inset-0 border border-border bg-[var(--secondary)]" />
          {/* Fill from bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-[var(--primary)]"
            initial={{ height: 0 }}
            animate={{ height: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ opacity: 0.3 }}
          />
          {/* Current marker */}
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-[var(--primary)]"
            initial={{ bottom: 0 }}
            animate={{ bottom: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Goal line */}
          <div className="absolute left-0 right-0 top-0 h-px bg-[var(--primary)] opacity-50" />
          {/* Start line */}
          <div className="absolute left-0 right-0 bottom-0 h-px bg-border" />
          {/* Labels */}
          <span className="absolute -right-8 top-0 text-[10px] font-mono text-[var(--primary)] translate-y-[-50%]">{ATHLETE.goalWeight}</span>
          <span className="absolute -right-8 bottom-0 text-[10px] font-mono text-[var(--muted-foreground)] translate-y-[50%]">{ATHLETE.startWeight}</span>
        </div>

        {/* Current weight display */}
        <div className="flex-1">
          <div className="font-mono text-4xl font-bold text-foreground leading-none">
            {currentWeight}
            <span className="text-lg text-[var(--muted-foreground)] ml-1">lb</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {goalReached ? (
              <span className="text-xs font-mono text-green-400 flex items-center gap-1">
                <Target className="w-3 h-3" /> GOAL REACHED
              </span>
            ) : (
              <span className="text-xs font-mono text-[var(--muted-foreground)]">
                {currentWeight - ATHLETE.goalWeight} lb to go
              </span>
            )}
          </div>
          <div className="mt-1 text-xs font-mono text-[var(--primary)]">
            {Math.round(progress)}% complete
          </div>

          {/* Recent entries */}
          <div className="mt-4 space-y-1">
            {entries.slice(-4).map((e) => (
              <div key={e.date} className="flex justify-between text-xs font-mono text-[var(--muted-foreground)]">
                <span>{e.date}</span>
                <span>{e.weight} lb</span>
              </div>
            ))}
          </div>

          {/* Add weight button */}
          <div className="mt-4">
            {showInput ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="226.0"
                  className="w-24 bg-[var(--secondary)] border border-border px-2 py-1 text-xs font-mono text-foreground focus:border-[var(--primary)] focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  Log
                </button>
                <button type="button" onClick={() => setShowInput(false)} className="text-xs text-[var(--muted-foreground)] hover:text-foreground">
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
              >
                + Log Weight
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workout Card ──────────────────────────────────────────
function WorkoutCard({ day, tracker }: { day: WorkoutDay; tracker: ReturnType<typeof useWorkoutTracker> }) {
  const [expanded, setExpanded] = useState(false);
  const completedCount = day.exercises.filter((ex) => tracker.isCompleted(day.id, ex.name)).length;
  const allDone = completedCount === day.exercises.length;

  return (
    <div className={`border transition-colors ${allDone ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-border bg-card"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{day.icon}</span>
          <div>
            <div className="font-mono text-sm font-bold text-foreground tracking-wider">{day.title}</div>
            <div className="text-xs text-[var(--muted-foreground)] tracking-wide">{day.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--muted-foreground)]">
            {completedCount}/{day.exercises.length}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {day.exercises.map((ex) => {
                const done = tracker.isCompleted(day.id, ex.name);
                return (
                  <div
                    key={ex.name}
                    className={`flex items-start gap-3 p-4 border-b border-border last:border-b-0 transition-colors ${done ? "opacity-50" : ""}`}
                  >
                    <button
                      onClick={() => tracker.toggle(day.id, ex.name)}
                      className={`mt-0.5 w-5 h-5 border flex-shrink-0 flex items-center justify-center transition-colors ${
                        done ? "bg-[var(--primary)] border-[var(--primary)]" : "border-border hover:border-[var(--primary)]"
                      }`}
                    >
                      {done && <span className="text-[var(--primary-foreground)] text-xs font-bold">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-mono text-sm font-medium ${done ? "line-through" : "text-foreground"}`}>
                        {ex.name}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="text-xs font-mono text-[var(--muted-foreground)]">{ex.sets}×{ex.reps}</span>
                        <span className="text-xs font-mono text-[var(--muted-foreground)]">
                          Now: <span className="text-foreground">{ex.current}</span>
                        </span>
                        <span className="text-xs font-mono text-[var(--primary)]">
                          Goal: {ex.goal}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1 italic">{ex.notes}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Itinerary Row ─────────────────────────────────────────
function ItineraryRow({ day }: { day: ItineraryDay }) {
  const diffColor = {
    easy: "text-green-400",
    moderate: "text-yellow-400",
    hard: "text-[var(--primary)]",
    brutal: "text-red-400",
  }[day.difficulty];

  const diffBg = {
    easy: "bg-green-400/10",
    moderate: "bg-yellow-400/10",
    hard: "bg-[var(--primary)]/10",
    brutal: "bg-red-400/10",
  }[day.difficulty];

  return (
    <div className="border-b border-border hover:bg-[var(--secondary)] transition-colors">
      <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_5rem_5rem_5rem_5rem_6rem] gap-2 p-3 items-center">
        <span className="font-mono text-xs text-[var(--muted-foreground)]">D{day.day}</span>
        <div className="min-w-0">
          <div className="font-mono text-xs text-foreground truncate">{day.from} → {day.to}</div>
          <div className="text-[10px] text-[var(--muted-foreground)] sm:hidden mt-0.5">
            {day.distanceMi} mi · ↑{day.ascent}' · ↓{day.descent}' · {day.duration}
          </div>
        </div>
        <span className="hidden sm:block font-mono text-xs text-[var(--muted-foreground)] text-right">{day.distanceMi} mi</span>
        <span className="hidden sm:flex font-mono text-xs text-green-400 items-center justify-end gap-0.5">
          <ArrowUp className="w-3 h-3" />{day.ascent}'
        </span>
        <span className="hidden sm:flex font-mono text-xs text-red-400 items-center justify-end gap-0.5">
          <ArrowDown className="w-3 h-3" />{day.descent}'
        </span>
        <span className="hidden sm:block font-mono text-xs text-[var(--muted-foreground)] text-right">{day.duration}</span>
        <span className={`font-mono text-[10px] uppercase tracking-wider text-right px-2 py-0.5 ${diffColor} ${diffBg} justify-self-end`}>
          {day.difficulty}
        </span>
      </div>
      <div className="px-3 pb-2 text-[11px] text-[var(--muted-foreground)] italic">{day.note}</div>
    </div>
  );
}

// ─── Elevation Mini-Chart (SVG) ────────────────────────────
function ElevationChart() {
  const maxAscent = Math.max(...TMB_ITINERARY.map((d) => d.ascent));
  const maxDescent = Math.max(...TMB_ITINERARY.map((d) => d.descent));
  const barWidth = 100 / TMB_ITINERARY.length;

  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] mb-3">Elevation Profile — 10 Days</h3>
      <svg viewBox="0 0 100 40" className="w-full h-24" preserveAspectRatio="none">
        {TMB_ITINERARY.map((day, i) => {
          const ascentH = (day.ascent / maxAscent) * 18;
          const descentH = (day.descent / maxDescent) * 18;
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.35;
          return (
            <g key={day.day}>
              {/* Ascent bar (green, going up from center) */}
              <rect x={x} y={20 - ascentH} width={w} height={ascentH} fill="oklch(0.65 0.15 145)" opacity="0.7" />
              {/* Descent bar (orange/red, going down from center) */}
              <rect x={x + w} y={20} width={w} height={descentH} fill="oklch(0.7 0.19 45)" opacity="0.7" />
              {/* Day label */}
              <text x={x + w} y={39} textAnchor="middle" fill="oklch(0.55 0.02 65)" fontSize="2.5" fontFamily="'JetBrains Mono', monospace">
                {day.day}
              </text>
            </g>
          );
        })}
        {/* Center line */}
        <line x1="0" y1="20" x2="100" y2="20" stroke="oklch(0.25 0.01 250)" strokeWidth="0.3" />
      </svg>
      <div className="flex justify-between mt-2">
        <span className="flex items-center gap-1 text-[10px] font-mono text-green-400">
          <ArrowUp className="w-3 h-3" /> Ascent
        </span>
        <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--primary)]">
          <ArrowDown className="w-3 h-3" /> Descent
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function Home() {
  const weightTracker = useWeightTracker();
  const workoutTracker = useWorkoutTracker();
  const totalAscent = TMB_ITINERARY.reduce((s, d) => s + d.ascent, 0);
  const totalDescent = TMB_ITINERARY.reduce((s, d) => s + d.descent, 0);
  const totalMiles = TMB_ITINERARY.reduce((s, d) => s + d.distanceMi, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HERO ─────────────────────────────────────── */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <img src={HERO_IMG} alt="TMB Ridge at dawn" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--primary)] font-mono mb-2">
              Alpine Command Center
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-none">
              Tour du Mont Blanc
            </h1>
            <p className="text-sm text-white/60 font-mono mt-2 tracking-wide">
              {ATHLETE.tripDays}-Day {ATHLETE.tripStyle} · {totalMiles.toFixed(1)} miles · {totalAscent.toLocaleString()}' gain · {totalDescent.toLocaleString()}' loss
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── COUNTDOWN + WEIGHT STRIP ─────────────────── */}
      <section
        className="relative border-b border-border"
        style={{
          backgroundImage: `url(${TOPO_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-background/85" />
        <div className="relative container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Left: Countdown + Key Stats */}
            <div>
              <Countdown />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <StatCard label="Total Distance" value={`${totalMiles.toFixed(1)}`} unit="mi" />
                <StatCard label="Total Ascent" value={totalAscent.toLocaleString()} unit="ft" color="text-green-400" />
                <StatCard label="Total Descent" value={totalDescent.toLocaleString()} unit="ft" color="text-[var(--primary)]" />
                <StatCard label="Pack Weight" value={ATHLETE.packWeight} unit="" />
              </div>
            </div>
            {/* Right: Weight Gauge */}
            <WeightGauge
              currentWeight={weightTracker.currentWeight}
              progress={weightTracker.progress}
              entries={weightTracker.entries}
              onAddWeight={weightTracker.addEntry}
            />
          </div>
        </div>
      </section>


      {/* ─── WORKOUT PLAN ─────────────────────────────── */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
            Training Protocol
          </h2>
          <button
            onClick={workoutTracker.resetWeek}
            className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
          >
            Reset Week
          </button>
        </div>

        {/* Weekly Block Pattern */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {WEEKLY_BLOCKS.map((block) => (
            <div key={block.label} className="border border-border bg-card p-4">
              <div className="font-mono text-xs font-bold text-foreground tracking-wider mb-2">{block.label}</div>
              <div className="flex gap-2 flex-wrap">
                {block.pattern.map((p, i) => (
                  <span key={i} className="text-[10px] font-mono bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-1">
                    {p}
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-2 italic">{block.notes}</div>
            </div>
          ))}
        </div>

        {/* Workout Cards */}
        <div className="space-y-2">
          {WORKOUT_PLAN.map((day) => (
            <WorkoutCard key={day.id} day={day} tracker={workoutTracker} />
          ))}
        </div>
      </section>

      {/* ─── TMB ITINERARY ────────────────────────────── */}
      <section className="relative">
        <div className="h-48 overflow-hidden relative">
          <img src={MASSIF_IMG} alt="Mont Blanc Massif" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-xs uppercase tracking-[0.4em] text-white font-mono flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              10-Day Itinerary — July 26 to August 4, 2026
            </h2>
          </div>
        </div>
        <div className="container py-4">
          <ElevationChart />
          <div className="mt-4 border border-border bg-card">
            <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_5rem_6rem] gap-2 p-3 border-b border-border text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)]">
              <span>Day</span>
              <span>Route</span>
              <span className="text-right">Dist</span>
              <span className="text-right">Ascent</span>
              <span className="text-right">Descent</span>
              <span className="text-right">Time</span>
              <span className="text-right">Rating</span>
            </div>
            {TMB_ITINERARY.map((day) => (
              <ItineraryRow key={day.day} day={day} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOT MOBILITY ────────────────────────────── */}
      <section className="container py-8">
        <h2 className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono mb-4 flex items-center gap-2">
          <Footprints className="w-3.5 h-3.5 text-[var(--primary)]" />
          Foot Mobility — High Transverse Arch Protocol
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="border border-border bg-card p-4 mb-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] font-mono font-bold mb-2">
                Your Diagnosis
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                You have an <span className="text-foreground font-medium">excessively high/rigid transverse arch</span> (pes cavus pattern). 
                The middle metatarsal heads (toes 2–4) are elevated — only the big toe pad and pinky toe pad contact the ground, 
                creating a "bipod" instead of full forefoot contact. This concentrates force on two points, 
                causes the foot to roll off the outside of the big toe, and sends shear force up into your knees on descents. 
                The fix is daily mobilization to allow those middle metatarsals to drop and share the load.
              </p>
            </div>

            {/* PT Video Links */}
            <div className="space-y-2">
              {FOOT_VIDEOS.map((video) => (
                <a
                  key={video.url}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 border border-border bg-card p-3 hover:border-[var(--primary)]/40 transition-colors group"
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-red-600/20 flex items-center justify-center">
                    <Play className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-medium text-foreground group-hover:text-[var(--primary)] transition-colors truncate">
                      {video.title}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{video.channel}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mt-1 italic">{video.why}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--muted-foreground)] flex-shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Descent image */}
          <div className="hidden lg:block">
            <div className="border border-border overflow-hidden h-full">
              <img src={DESCENT_IMG} alt="Alpine descent" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────── */}
      <footer className="border-t border-border py-6">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
              Alpine Command Center · TMB 2026
            </span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
              "The summit is what drives us, but the climb itself is what matters."
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-mono">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`font-mono text-xl font-bold ${color || "text-foreground"}`}>{value}</span>
        {unit && <span className="text-xs font-mono text-[var(--muted-foreground)]">{unit}</span>}
      </div>
    </div>
  );
}
