import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ATHLETE, TMB_ITINERARY, WORKOUT_PLAN, FOOT_VIDEOS,
  getDaysUntilTrip,
} from "@/lib/data";
import type { ItineraryDay, WorkoutDay } from "@/lib/data";
import { useWeightTracker, useWorkoutLog, generateSummary } from "@/lib/hooks";
import type { ExerciseLog, WorkoutSession } from "@/lib/hooks";
import {
  Mountain, ChevronDown, ChevronUp, ExternalLink, Footprints, Plane,
  Target, ArrowDown, ArrowUp, Play, Calendar, Trophy, Save, X, Trash2, Dumbbell, Pencil, Check, Sparkles,
} from "lucide-react";
import TrainingAnalytics from "@/components/TrainingAnalytics";
import SwipeToDelete from "@/components/SwipeToDelete";
import SwipeToComplete from "@/components/SwipeToComplete";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { useUnits } from "@/contexts/UnitContext";
import { TMBRouteMap } from "@/components/TMBRouteMap";
import type { GpsPosition } from "@/lib/gps-tracker";
import GearChecklist from "@/components/GearChecklist";
import ThemeSwitcher, { initTheme } from "@/components/ThemeSwitcher";
import DailyBudget from "@/components/DailyBudget";
import WeatherForecast from "@/components/WeatherForecast";
import TechniqueVideos from "@/components/TechniqueVideos";
import TravelToolkit from "@/components/TravelToolkit";
import BodyFatEstimator from "@/components/BodyFatEstimator";
import NutritionTracker from "@/components/NutritionTracker";
import ArrivalDeparture from "@/components/ArrivalDeparture";
import elevationData from "@/lib/tmb_elevation_profile.json";
import { GARMIN_SESSIONS, WEEKLY_VOLUME } from "@/lib/garmin-data";
import { ALL_MICRONUTRIENTS, getMicroDVPercent } from "@/lib/vitamin-data";
import { loadMacroTargets } from "@/lib/vitamin-data";
import { PRE_TRIP_CHECKLIST } from "@/lib/travel-data";
import { haptic } from "@/lib/haptics";
import MilestoneCelebration, { useMilestoneDetector } from "@/components/MilestoneCelebration";
import ExerciseSparkline from "@/components/ExerciseSparkline";
import ChamonixWeather from "@/components/ChamonixWeather";
import { HeroSkeleton, StatCardSkeleton, WeightGaugeSkeleton, TrainingGridSkeleton } from "@/components/Skeleton";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { getStrengthPercentile, STRENGTH_STANDARDS } from "@/lib/strength-standards";

const HERO_IMAGES = [
  "/images/hero-tmb-ridge.webp",
  "/images/alpine-descent.webp",
  "/images/mont-blanc-massif.webp",
];
const TOPO = "/images/topo-texture.webp";

const MOTIVATIONAL_QUOTES = [
  { text: "The mountains are calling and I must go.", author: "John Muir" },
  { text: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary" },
  { text: "The best view comes after the hardest climb.", author: "Unknown" },
  { text: "Every mountain top is within reach if you just keep climbing.", author: "Barry Finlay" },
  { text: "You don't have to be fast. You just have to go.", author: "Ultra Proverb" },
  { text: "Somewhere between the bottom of the climb and the summit is the answer.", author: "Greg Child" },
  { text: "Pain is temporary. Quitting lasts forever.", author: "Lance Armstrong" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Mountains know secrets we need to learn.", author: "Aldous Huxley" },
  { text: "Great things are done when men and mountains meet.", author: "William Blake" },
  { text: "Getting to the top is optional. Getting down is mandatory.", author: "Ed Viesturs" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function useHeroRotation(intervalMs = 8000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % HERO_IMAGES.length), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return index;
}

// ── Countdown ─────────────────────────────────────────────
function Countdown({ syncStatus }: { syncStatus?: string }) {
  const [days, setDays] = useState(getDaysUntilTrip());
  const [dotVisible, setDotVisible] = useState(false);
  const [dotColor, setDotColor] = useState("bg-muted-foreground/30");
  useEffect(() => {
    const t = setInterval(() => setDays(getDaysUntilTrip()), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (syncStatus === "syncing") {
      setDotVisible(true);
      setDotColor("bg-muted-foreground/40 animate-pulse");
    } else if (syncStatus === "synced" || syncStatus === "restored") {
      setDotVisible(true);
      setDotColor("bg-emerald-500/70");
      const t = setTimeout(() => setDotVisible(false), 2500);
      return () => clearTimeout(t);
    } else if (syncStatus === "error") {
      setDotVisible(true);
      setDotColor("bg-red-500/50");
      const t = setTimeout(() => setDotVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [syncStatus]);
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-5xl sm:text-7xl font-bold text-[var(--primary)] tracking-tighter leading-none">{days}</span>
      <div className="flex flex-col">
        <span className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
          days to go
          <span
            className={`inline-block w-[5px] h-[5px] rounded-full ml-1.5 align-middle transition-all duration-700 ${dotVisible ? dotColor + " opacity-100" : "opacity-0"}`}
          />
        </span>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────
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

// ── Weight Gauge ──────────────────────────────────────────
function WeightTrendLine({ entries, goalWeight }: { entries: { date: string; weight: number }[]; goalWeight: number }) {
  if (entries.length < 2) return null;
  const recent = entries.slice(-12);
  const weights = recent.map(e => e.weight);
  const maxW = Math.max(...weights, ATHLETE.startWeight);
  const minW = Math.min(...weights, goalWeight);
  const range = maxW - minW || 1;
  const h = 60;
  const w = 100;
  const step = w / (recent.length - 1);
  const points = recent.map((e, i) => {
    const x = i * step;
    const y = h - ((e.weight - minW) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const goalY = h - ((goalWeight - minW) / range) * h;
  return (
    <div className="mt-3 mb-1">
      <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} className="w-full" style={{ height: 64 }} preserveAspectRatio="none">
        <line x1="0" y1={goalY} x2={w} y2={goalY} stroke="var(--primary)" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
        <polyline fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {recent.map((e, i) => {
          const x = i * step;
          const y = h - ((e.weight - minW) / range) * h;
          return <circle key={e.date} cx={x} cy={y} r="2" fill="var(--primary)" />;
        })}
      </svg>
    </div>
  );
}

function WeightGauge({ currentWeight, progress, entries, onAddWeight, onEditWeight, onDeleteWeight, goalWeight, workoutSessions }: {
  currentWeight: number; progress: number;
  entries: { date: string; weight: number }[];
  onAddWeight: (w: number) => void;
  onEditWeight: (date: string, weight: number) => void;
  onDeleteWeight: (date: string) => void;
  goalWeight: number;
  workoutSessions: WorkoutSession[];
}) {
  const u = useUnits();
  const [inputVal, setInputVal] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(inputVal);
    if (w > 150 && w < 300) { onAddWeight(w); setInputVal(""); setShowInput(false); haptic("medium"); }
  };
  const handleEditSubmit = (date: string) => {
    const w = parseFloat(editVal);
    if (w > 150 && w < 300) { onEditWeight(date, w); haptic("light"); }
    setEditingEntry(null);
  };
  const gaugeH = 280;
  const goalReached = currentWeight <= goalWeight;
  const lostLbs = Math.max(0, ATHLETE.startWeight - currentWeight);
  const calsBurned = Math.round(lostLbs * 3500);
  const kneeRelief = Math.round(lostLbs * 4);
  const percentLighter = ((lostLbs / ATHLETE.startWeight) * 100).toFixed(1);

  // ── Rotating Strength Percentile ──
  // Compute best logged weight per exercise from all saved workout sessions
  const strengthStats = useMemo(() => {
    const bestWeights = new Map<string, number>();
    for (const session of workoutSessions) {
      for (const ex of session.exercises) {
        if (!ex.done || !ex.weight) continue;
        const w = parseFloat(ex.weight);
        if (isNaN(w) || w <= 0) continue;
        // Find if this exercise has a strength standard
        const std = STRENGTH_STANDARDS.find((s) => s.exercise === ex.name);
        if (!std) continue;
        const current = bestWeights.get(ex.name);
        if (std.invertBetter) {
          // For assist exercises, lower is better
          if (current === undefined || w < current) bestWeights.set(ex.name, w);
        } else {
          if (current === undefined || w > current) bestWeights.set(ex.name, w);
        }
      }
    }
    const results: { shortName: string; percentile: number; exerciseName: string }[] = [];
    for (const [name, weight] of Array.from(bestWeights.entries())) {
      const result = getStrengthPercentile(name, weight);
      if (result) results.push({ ...result, exerciseName: name });
    }
    // Sort by percentile descending so the strongest lifts show first
    results.sort((a, b) => b.percentile - a.percentile);
    return results;
  }, [workoutSessions]);

  const [strengthIdx, setStrengthIdx] = useState(0);
  useEffect(() => {
    if (strengthStats.length <= 1) return;
    const interval = setInterval(() => {
      setStrengthIdx((prev) => (prev + 1) % strengthStats.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [strengthStats.length]);

  return (
    <div className="border border-border p-5 bg-card">
      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        title="Delete Weight Entry?"
        description={`Remove the entry for ${deleteConfirm}? This cannot be undone.`}
        onConfirm={() => { if (deleteConfirm) onDeleteWeight(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
      {/* Header: title + stats grid */}
      <div className="mb-4">
        <h3 className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-semibold mb-3">Weight Descent</h3>
        {(lostLbs > 0 || strengthStats.length > 0) && (
          <div className="grid grid-cols-3 gap-3">
            {lostLbs > 0 ? (
              <div className="bg-[var(--secondary)]/50 rounded px-2.5 py-2">
                <div className="font-mono text-lg font-bold text-[var(--primary)] leading-none">{calsBurned.toLocaleString()}</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] mt-1">cal deficit</div>
              </div>
            ) : <div />}
            {lostLbs > 0 ? (
              <div className="bg-[var(--secondary)]/50 rounded px-2.5 py-2">
                <div className="font-mono text-lg font-bold text-emerald-400 leading-none">{kneeRelief}</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] mt-1">lbs off knees</div>
              </div>
            ) : <div />}
            {strengthStats.length > 0 ? (
              <div className="bg-[var(--secondary)]/50 rounded px-2.5 py-2 relative overflow-hidden" style={{ minHeight: 42 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={strengthIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col justify-center px-2.5 py-2"
                  >
                    <div className="font-mono text-lg font-bold text-amber-400 leading-none">
                      Top {100 - strengthStats[strengthIdx % strengthStats.length].percentile}%
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] mt-1">
                      {strengthStats[strengthIdx % strengthStats.length].shortName}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : <div />}
          </div>
        )}
      </div>
      <div className="flex gap-6 items-center">
        <div className="relative py-6" style={{ width: 48 }}>
        <div className="relative" style={{ width: 48, height: gaugeH }}>
          <div className="absolute inset-0 border border-border bg-[var(--secondary)]" />
          <motion.div className="absolute bottom-0 left-0 right-0 bg-[var(--primary)]"
            initial={{ height: 0 }} animate={{ height: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }} style={{ opacity: 0.3 }} />
          <motion.div className="absolute left-0 right-0 h-0.5 bg-[var(--primary)]"
            initial={{ bottom: 0 }} animate={{ bottom: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }} />
          <div className="absolute left-0 right-0 top-0 h-px bg-[var(--primary)] opacity-50" />
          <div className="absolute left-0 right-0 bottom-0 h-px bg-border" />
          <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: -28 }}>
            <span className="text-[10px] font-mono text-[var(--primary)]">{u.wt(goalWeight, 0)}</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ bottom: -28 }}>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{u.wt(ATHLETE.startWeight, 0)}</span>
          </div>
        </div>
        </div>
        <div className="flex-1">
          <div className="font-mono text-4xl font-bold text-foreground leading-none">
            {u.wt(currentWeight, 0)}<span className="text-lg text-[var(--muted-foreground)] ml-1">{u.wtUnit}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {goalReached ? (
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> GOAL REACHED</span>
            ) : (
              <span className="text-xs font-mono text-[var(--muted-foreground)]">{u.wt(currentWeight - goalWeight, 0)} {u.wtUnit} to go</span>
            )}
          </div>
          <div className="mt-1 text-xs font-mono text-[var(--primary)]">{Math.round(progress)}% complete</div>
          <WeightTrendLine entries={entries} goalWeight={goalWeight} />
          <div className="space-y-0.5">
            {entries.slice(-5).map((e) => (
              <div key={e.date} className="group">
                {editingEntry === e.date ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-[var(--muted-foreground)] w-[82px] flex-shrink-0">{e.date}</span>
                    <input type="number" inputMode="decimal" step="0.1" value={editVal}
                      onChange={(ev) => setEditVal(ev.target.value)}
                      onKeyDown={(ev) => { if (ev.key === "Enter") handleEditSubmit(e.date); if (ev.key === "Escape") setEditingEntry(null); }}
                      autoFocus
                      className="w-16 bg-[var(--secondary)] border border-[var(--primary)] px-1.5 py-0.5 text-xs font-mono text-foreground text-right focus:outline-none" />
                    <button onClick={() => handleEditSubmit(e.date)} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingEntry(null)} className="text-[var(--muted-foreground)] hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)] cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => { setEditingEntry(e.date); setEditVal(String(e.weight)); }}>
                    <span>{e.date}</span>
                    <div className="flex items-center gap-2">
                      <span>{u.wt(e.weight)} {u.wtUnit}</span>
                      <button onClick={(ev) => { ev.stopPropagation(); setDeleteConfirm(e.date); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-opacity p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            {showInput ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="number" inputMode="decimal" step="0.1" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                  onFocus={e => { const v = e.target.value; e.target.value = ''; e.target.value = v; }}
                  placeholder="226.0" autoFocus
                  className="w-24 bg-[var(--secondary)] border border-border px-2 py-1 text-xs font-mono text-foreground text-right focus:border-[var(--primary)] focus:outline-none" />
                <button type="submit" className="bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">Log</button>
                <button type="button" onClick={() => setShowInput(false)} className="text-xs text-[var(--muted-foreground)] hover:text-foreground">✕</button>
              </form>
            ) : (
              <button onClick={() => setShowInput(true)}
                className="border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                + Log Weight
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Active Workout Session Panel (Mobile-First Fullscreen) ──────────────────────────
function ActiveWorkoutPanel({ dayId, exercises, onUpdate, onToggle, onSave, onCancel, lastSession, allSessions }: {
  dayId: string; exercises: ExerciseLog[];
  onUpdate: (i: number, field: keyof ExerciseLog, val: string | boolean) => void;
  onToggle: (i: number) => void;
  onSave: () => void;
  onCancel: () => void;
  lastSession?: { exercises: ExerciseLog[] } | null;
  allSessions: WorkoutSession[];
}) {
  const [prPopup, setPrPopup] = useState<{ name: string; weight: string } | null>(null);
  const day = WORKOUT_PLAN.find((d) => d.id === dayId);
  if (!day) return null;
  const isPickOne = day.pickOne === true;
  const doneCount = exercises.filter((e) => e.done).length;
  const allDone = isPickOne ? doneCount >= 1 : exercises.every((e) => e.done);
  const progressPct = isPickOne
    ? (doneCount >= 1 ? 100 : 0)
    : Math.round((doneCount / exercises.length) * 100);

  // Check if current weight is an all-time PR across all saved sessions
  const isNewPR = (exName: string, currentWeight: string, planUnit?: string): boolean => {
    const curr = parseFloat(currentWeight);
    if (isNaN(curr)) return false;
    for (const session of allSessions) {
      for (const e of session.exercises) {
        if (e.name === exName && e.done && e.weight) {
          const prev = parseFloat(e.weight);
          if (isNaN(prev)) continue;
          if (planUnit === "assist") {
            if (prev <= curr) return false; // someone did equal or better (lower)
          } else {
            if (prev >= curr) return false; // someone did equal or better (higher)
          }
        }
      }
    }
    return true; // no previous session beat this weight
  };

  // Compare current input to last session's value for beat-last-session indicator
  const getBeatIndicator = (ex: ExerciseLog, planUnit?: string) => {
    if (!lastSession || !ex.weight) return null;
    const lastEx = lastSession.exercises.find((e) => e.name === ex.name && e.done);
    if (!lastEx?.weight) return null;
    const curr = parseFloat(ex.weight);
    const prev = parseFloat(lastEx.weight);
    if (isNaN(curr) || isNaN(prev)) return null;
    if (planUnit === "assist") {
      // Lower is better for assist
      if (curr < prev) return "up";
      if (curr > prev) return "down";
      return "same";
    }
    if (curr > prev) return "up";
    if (curr < prev) return "down";
    return "same";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--primary)]/30 bg-[var(--primary)]/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">{day.icon}</span>
          <div>
            <div className="font-mono text-xs font-bold text-[var(--primary)] tracking-wider">ACTIVE SESSION</div>
            <div className="text-[10px] text-[var(--muted-foreground)] tracking-wide">{day.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--muted-foreground)]">{isPickOne ? (doneCount >= 1 ? "\u2713" : "Pick 1") : `${doneCount}/${exercises.length}`}</span>
          <button onClick={onCancel} className="text-[var(--muted-foreground)] hover:text-foreground p-1"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--secondary)] flex-shrink-0">
        <motion.div className="h-full bg-[var(--primary)]" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* Scrollable exercise list */}
      <div className="flex-1 overflow-y-auto">
        {isPickOne && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <span className="text-amber-400 text-sm">◉</span>
            <span className="text-xs font-mono text-amber-400/80 uppercase tracking-wider">Pick one activity — any choice counts as complete</span>
          </div>
        )}
        <div className="divide-y divide-border">
          {exercises.map((ex, i) => {
            const planEx = day.exercises[i];
            const goalHit = !!(planEx?.goalValue && ex.weight && ex.done && (
              planEx.unit === "assist"
                ? parseFloat(ex.weight) <= planEx.goalValue
                : parseFloat(ex.weight) >= planEx.goalValue
            ));
            const beat = getBeatIndicator(ex, planEx?.unit);
            const handleSwipeToggle = () => {
              // Check for PR before toggling
              if (!ex.done && ex.weight && isNewPR(ex.name, ex.weight, planEx?.unit)) {
                setPrPopup({ name: ex.name, weight: ex.weight });
                setTimeout(() => setPrPopup(null), 2500);
                haptic("success");
              } else {
                haptic("light");
              }
              onToggle(i);
            };
            return (
              <SwipeToComplete key={ex.name} onSwipeComplete={handleSwipeToggle} completed={ex.done}>
                <div className={`px-4 py-4 transition-colors ${ex.done ? "bg-[var(--primary)]/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={handleSwipeToggle}
                      className={`mt-0.5 w-8 h-8 border flex-shrink-0 flex items-center justify-center transition-all ${
                        isPickOne ? "rounded-full" : ""
                      } ${
                        ex.done ? (goalHit ? "bg-amber-500 border-amber-500" : "bg-[var(--primary)] border-[var(--primary)]")
                        : "border-border hover:border-[var(--primary)]"
                      }`}>
                      {ex.done && <span className={`text-sm font-bold ${goalHit ? "text-black" : "text-[var(--primary-foreground)]"}`}>{goalHit ? "★" : "✓"}</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-sm font-medium ${ex.done ? "line-through text-[var(--muted-foreground)]" : "text-foreground"}`}>{ex.name}</span>
                        <ExerciseSparkline exerciseName={ex.name} sessions={allSessions} lowerIsBetter={planEx?.unit === "assist"} />
                        {goalHit && <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5">GOAL HIT</span>}
                        {planEx?.videoUrl && (
                          <a href={planEx.videoUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                            <Play className="w-3 h-3" /> HOW-TO
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-mono text-[var(--muted-foreground)]">
                        <span>{planEx?.sets}×{planEx?.reps}</span>
                        <span>Goal: <span className="text-[var(--primary)]">{planEx?.goal}</span></span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="text" placeholder={planEx?.placeholder1 || "weight"}
                          value={ex.weight} onChange={(e) => onUpdate(i, "weight", e.target.value)}
                          className="w-24 h-10 bg-[var(--secondary)] border border-border px-3 py-2 text-sm font-mono text-foreground focus:border-[var(--primary)] focus:outline-none" />
                        <input type="text" placeholder={planEx?.placeholder2 || "reps"} value={ex.reps}
                          onChange={(e) => onUpdate(i, "reps", e.target.value)}
                          className="w-20 h-10 bg-[var(--secondary)] border border-border px-3 py-2 text-sm font-mono text-foreground focus:border-[var(--primary)] focus:outline-none" />
                        {beat && (
                          <span className={`flex items-center gap-0.5 text-[10px] font-mono font-bold ${
                            beat === "up" ? "text-green-400" : beat === "down" ? "text-red-400" : "text-[var(--muted-foreground)]"
                          }`}>
                            {beat === "up" && <ArrowUp className="w-3 h-3" />}
                            {beat === "down" && <ArrowDown className="w-3 h-3" />}
                            {beat === "up" ? "PR" : beat === "down" ? "DOWN" : "SAME"}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-1.5 italic leading-relaxed">{planEx?.notes}</div>
                    </div>
                  </div>
                </div>
              </SwipeToComplete>
            );
          })}
        </div>

        {/* PR Popup */}
        <AnimatePresence>
          {prPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-3 shadow-2xl shadow-amber-500/30 flex items-center gap-3"
            >
              <Trophy className="w-6 h-6" />
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider">NEW PERSONAL RECORD</div>
                <div className="font-mono text-sm font-bold">{prPopup.name} — {prPopup.weight}</div>
              </div>
              <Trophy className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky bottom save button */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--primary)]/30 bg-background">
        <button onClick={onSave}
          className={`w-full py-4 font-mono text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            allDone ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-foreground"
          }`}>
          <Save className="w-4 h-4" /> LOG WORKOUT {isPickOne ? (doneCount >= 1 ? "\u2713" : "(Pick 1)") : `(${doneCount}/${exercises.length})`}
        </button>
      </div>
    </motion.div>
  );
}

// ── Workout Card (Browse Mode) ────────────────────────────
function WorkoutCard({ day, onStart, hasHitGoal, getBestPerformance }: {
  day: WorkoutDay;
  onStart: (d: WorkoutDay) => void;
  hasHitGoal: (name: string, gv?: number, u?: string) => boolean;
  getBestPerformance: (name: string, unit?: string) => { weight: string; reps: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border bg-card">
      <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)} onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--secondary)] transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <span className="text-xl">{day.icon}</span>
          <div>
            <div className="font-mono text-sm font-bold text-foreground tracking-wider">{day.title}</div>
            <div className="text-xs text-[var(--muted-foreground)] tracking-wide">{day.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onStart(day); }}
            className="text-[10px] font-mono uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 hover:opacity-90 transition-opacity w-[60px] text-center">
            START
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-border">
              {day.exercises.map((ex) => {
                const goalMet = hasHitGoal(ex.name, ex.goalValue, ex.unit);
                return (
                  <div key={ex.name} className="flex items-start gap-3 p-4 border-b border-border last:border-b-0">
                    <div className={`mt-0.5 w-5 h-5 border flex-shrink-0 flex items-center justify-center ${
                      day.pickOne ? "rounded-full" : ""
                    } ${
                      goalMet ? "bg-amber-500 border-amber-500" : "border-border"
                    }`}>
                      {goalMet && <span className="text-[10px] font-bold text-black">★</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">{ex.name}</span>
                        {goalMet && <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5">GOAL REACHED</span>}
                        {ex.videoUrl && (
                          <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                            <Play className="w-3 h-3" /> HOW-TO
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="text-xs font-mono text-[var(--muted-foreground)]">{ex.sets}×{ex.reps}</span>
                        {(() => {
                          const best = getBestPerformance(ex.name, ex.unit);
                          const nowVal = best ? `${best.weight}${ex.unit === 'assist' ? ' assist' : ex.unit === 'sec' ? ' sec' : ex.unit === 'min' ? ' min' : ex.unit === 'lb' ? ' lb' : ''}` : ex.current;
                          return <span className="text-xs font-mono text-[var(--muted-foreground)]">Now: <span className={best ? 'text-[var(--primary)]' : 'text-foreground'}>{nowVal}</span></span>;
                        })()}
                        <span className="text-xs font-mono text-[var(--primary)]">Goal: {ex.goal}</span>
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

// ── Post-Workout Summary Modal ────────────────────────────
function SummaryModal({ session, allSessions, onClose }: {
  session: WorkoutSession; allSessions: WorkoutSession[]; onClose: () => void;
}) {
  const text = generateSummary(session, allSessions);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card border-2 border-[var(--primary)] max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-sm font-bold text-[var(--primary)] uppercase tracking-wider">Post-Workout Debrief</div>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="font-mono text-xs text-[var(--muted-foreground)] mb-2">{session.date} — {session.dayTitle}</div>
        <div className="space-y-2">
          {text.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm text-foreground leading-relaxed">{para}</p>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {session.exercises.filter((e) => e.done).map((ex) => (
            <span key={ex.name} className="text-[10px] font-mono bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1">{ex.name}: {ex.weight || "BW"}</span>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-6 w-full py-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
          DISMISS
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Workout History Calendar ─────────────────────────────
function WorkoutCalendar({ sessions, onDelete, onUpdate }: {
  sessions: WorkoutSession[];
  onDelete: (date: string, dayId: string, sessionIndex: number) => void;
  onUpdate: (date: string, dayId: string, sessionIndex: number, updated: WorkoutSession) => void;
}) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ date: string; dayId: string; sessionIndex: number } | null>(null);
  const [editing, setEditing] = useState<{ date: string; dayId: string; sessionIndex: number; exercises: ExerciseLog[]; newDate: string } | null>(null);
  if (sessions.length === 0) return null;

  const grouped: Record<string, WorkoutSession[]> = {};
  for (const s of sessions) {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  }
  const dates = Object.keys(grouped).sort().reverse();

  const startEdit = (s: WorkoutSession, si: number) => {
    setEditing({
      date: s.date,
      dayId: s.dayId,
      sessionIndex: si,
      exercises: s.exercises.map(ex => ({ ...ex })),
      newDate: s.date,
    });
  };

  const updateEditExercise = (exIndex: number, field: keyof ExerciseLog, value: string | boolean) => {
    if (!editing) return;
    setEditing(prev => {
      if (!prev) return prev;
      const updated = [...prev.exercises];
      updated[exIndex] = { ...updated[exIndex], [field]: value };
      return { ...prev, exercises: updated };
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    // Find the exact original session by walking the grouped list
    let matchCount = 0;
    let original: WorkoutSession | undefined;
    for (const s of sessions) {
      if (s.date === editing.date && s.dayId === editing.dayId) {
        if (matchCount === editing.sessionIndex) {
          original = s;
          break;
        }
        matchCount++;
      }
    }
    if (!original) return;
    onUpdate(editing.date, editing.dayId, editing.sessionIndex, {
      ...original,
      date: editing.newDate,
      exercises: editing.exercises,
    });
    // If date changed, expand the new date
    if (editing.newDate !== editing.date) {
      setExpandedDate(editing.newDate);
    }
    setEditing(null);
  };

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] font-mono">Workout History</h3>
        <span className="ml-auto text-[10px] font-mono text-[var(--muted-foreground)]">{sessions.length} sessions</span>
      </div>
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {dates.map((date) => {
          const daySessions = grouped[date];
          const isExpanded = expandedDate === date;
          return (
            <div key={date}>
              <button onClick={() => setExpandedDate(isExpanded ? null : date)}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors text-left">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-foreground">{date}</span>
                  <div className="flex gap-1">
                    {daySessions.map((s, i) => (
                      <span key={i} className="text-[10px] font-mono bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5">
                        {s.dayId.replace("day-", "").toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-3 h-3 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-3 h-3 text-[var(--muted-foreground)]" />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    {daySessions.map((s, si) => {
                      const isEditing = editing && editing.date === s.date && editing.dayId === s.dayId && editing.sessionIndex === si;
                      return (
                        <div key={si} className="px-4 pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[10px] font-mono text-[var(--primary)] uppercase tracking-wider">{s.dayTitle}</div>
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                                    className="text-green-400 hover:text-green-300 transition-colors p-1"
                                    title="Save changes"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditing(null); }}
                                    className="text-[var(--muted-foreground)] hover:text-foreground transition-colors p-1"
                                    title="Cancel edit"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startEdit(s, si); }}
                                    className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors p-1"
                                    title="Edit this session"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ date: s.date, dayId: s.dayId, sessionIndex: si }); }}
                                    className="text-[var(--muted-foreground)] hover:text-red-400 transition-colors p-1"
                                    title="Delete this session"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing && editing ? (
                            /* ── Edit Mode ── */
                            <div className="space-y-2">
                              {/* Date picker */}
                              <div className="flex items-center gap-2 pb-1 border-b border-border mb-1">
                                <Calendar className="w-3 h-3 text-[var(--muted-foreground)]" />
                                <label className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase">Date</label>
                                <input
                                  type="date"
                                  value={editing.newDate}
                                  onChange={(e) => setEditing(prev => prev ? { ...prev, newDate: e.target.value } : prev)}
                                  className="bg-background border border-border text-xs font-mono text-foreground px-2 py-1 focus:outline-none focus:border-[var(--primary)] flex-1"
                                />
                              </div>
                              {editing.exercises.map((ex, exIdx) => {
                                // Look up the original exercise definition to get context-aware labels
                                const dayDef = WORKOUT_PLAN.find(d => d.id === s.dayId);
                                const exDef = dayDef?.exercises.find(e => e.name === ex.name);
                                const label1 = exDef?.placeholder1 || "weight";
                                const label2 = exDef?.placeholder2 || "reps";
                                return (
                                <div key={exIdx} className={`border border-border p-2 transition-colors ${
                                  ex.done ? "bg-[var(--primary)]/5" : "bg-transparent opacity-60"
                                }`}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <button
                                      onClick={() => updateEditExercise(exIdx, "done", !ex.done)}
                                      className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${
                                        ex.done ? "border-[var(--primary)] bg-[var(--primary)]/20 text-[var(--primary)]" : "border-border"
                                      }`}
                                    >
                                      {ex.done && <Check className="w-2.5 h-2.5" />}
                                    </button>
                                    <span className="text-xs font-mono text-foreground flex-1">{ex.name}</span>
                                  </div>
                                  {ex.done && (
                                    <div className="flex gap-2 ml-6">
                                      <div className="flex-1">
                                        <label className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase block mb-0.5">{label1}</label>
                                        <input
                                          type="text"
                                          value={ex.weight}
                                          onChange={(e) => updateEditExercise(exIdx, "weight", e.target.value)}
                                          className="w-full bg-background border border-border text-xs font-mono text-foreground px-2 py-1 focus:outline-none focus:border-[var(--primary)]"
                                          placeholder="—"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase block mb-0.5">{label2}</label>
                                        <input
                                          type="text"
                                          value={ex.reps}
                                          onChange={(e) => updateEditExercise(exIdx, "reps", e.target.value)}
                                          className="w-full bg-background border border-border text-xs font-mono text-foreground px-2 py-1 focus:outline-none focus:border-[var(--primary)]"
                                          placeholder="—"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* ── View Mode ── */
                            <>
                              {s.exercises.filter((e) => e.done).map((ex) => {
                                const dayDef = WORKOUT_PLAN.find(d => d.id === s.dayId);
                                const exDef = dayDef?.exercises.find(e => e.name === ex.name);
                                const p1 = exDef?.placeholder1 || "weight";
                                const p2 = exDef?.placeholder2 || "reps";
                                // Format display based on exercise type
                                const isGym = p1 === "weight";
                                const val1 = ex.weight || (isGym ? "BW" : "—");
                                const val2 = ex.reps || "";
                                let display = "";
                                if (isGym) {
                                  display = `${val1}${val2 ? ` × ${val2}` : ""}`;
                                } else {
                                  // Cardio/mobility: show value + unit label
                                  const parts: string[] = [];
                                  if (ex.weight) parts.push(`${ex.weight} ${p1}`);
                                  if (ex.reps) parts.push(`${ex.reps} ${p2}`);
                                  display = parts.join(" · ") || "—";
                                }
                                return (
                                <div key={ex.name} className="flex justify-between text-xs font-mono text-[var(--muted-foreground)] py-0.5">
                                  <span className="text-foreground">{ex.name}</span>
                                  <span>{display}</span>
                                </div>
                                );
                              })}
                              {s.exercises.filter((e) => !e.done).length > 0 && (() => {
                                const dayDef = WORKOUT_PLAN.find((d) => d.id === s.dayId);
                                if (dayDef?.pickOne) return null;
                                return (
                                  <div className="text-[10px] text-red-400/70 mt-1">
                                    Skipped: {s.exercises.filter((e) => !e.done).map((e) => e.name).join(", ")}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      {/* Delete confirmation modal */}
      <ConfirmDeleteDialog
        open={!!confirmDelete}
        title="Delete Workout?"
        description="This workout session will be permanently removed. This cannot be undone."
        onConfirm={() => { if (confirmDelete) { onDelete(confirmDelete.date, confirmDelete.dayId, confirmDelete.sessionIndex); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ── Itinerary Row ─────────────────────────────────────────
function ItineraryRow({ day }: { day: ItineraryDay }) {
  const u = useUnits();
  const diffColor: Record<string, string> = {
    easy: "text-green-400", moderate: "text-yellow-400",
    hard: "text-[var(--primary)]", brutal: "text-red-400",
  };
  const diffBg: Record<string, string> = {
    easy: "bg-green-400/10", moderate: "bg-yellow-400/10",
    hard: "bg-[var(--primary)]/10", brutal: "bg-red-400/10",
  };
  return (
    <div className="border-b border-border hover:bg-[var(--secondary)] transition-colors">
      <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_5rem_5rem_5rem_5rem_6rem] gap-2 p-3 items-center">
        <span className="font-mono text-xs text-[var(--muted-foreground)]">D{day.day}</span>
        <div className="min-w-0">
          <div className="font-mono text-xs text-foreground truncate">{day.from} → {day.to}</div>
          <div className="text-[10px] text-[var(--muted-foreground)] sm:hidden mt-0.5">
            {u.dist(day.distanceMi)} {u.distUnit} · ↑{u.elev(day.ascent)} {u.elevUnit} · ↓{u.elev(day.descent)} {u.elevUnit} · {day.duration}
          </div>
        </div>
        <span className="hidden sm:block font-mono text-xs text-[var(--muted-foreground)] text-right">{u.dist(day.distanceMi)} {u.distUnit}</span>
        <span className="hidden sm:flex font-mono text-xs text-green-400 items-center justify-end gap-0.5"><ArrowUp className="w-3 h-3" />{u.elev(day.ascent)} {u.elevUnit}</span>
        <span className="hidden sm:flex font-mono text-xs text-red-400 items-center justify-end gap-0.5"><ArrowDown className="w-3 h-3" />{u.elev(day.descent)} {u.elevUnit}</span>
        <span className="hidden sm:block font-mono text-xs text-[var(--muted-foreground)] text-right">{day.duration}</span>
        <span className={`font-mono text-[10px] uppercase tracking-wider text-right px-2 py-0.5 ${diffColor[day.difficulty]} ${diffBg[day.difficulty]} justify-self-end`}>
          {day.difficulty}
        </span>
      </div>
      <div className="px-3 pb-2 text-[11px] text-[var(--muted-foreground)] italic">{day.note}</div>
    </div>
  );
}

// ── Elevation Chart ───────────────────────────────────────
function ElevationChart() {
  const u = useUnits();
  const maxA = Math.max(...TMB_ITINERARY.map((d) => d.ascent));
  const maxD = Math.max(...TMB_ITINERARY.map((d) => d.descent));
  const bw = 100 / TMB_ITINERARY.length;
  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] mb-3">Elevation Profile — 10 Hiking Days</h3>
      <svg viewBox="0 0 100 40" className="w-full h-24" preserveAspectRatio="none">
        {TMB_ITINERARY.map((day, i) => {
          const aH = (day.ascent / maxA) * 18;
          const dH = (day.descent / maxD) * 18;
          const x = i * bw + bw * 0.15;
          const w = bw * 0.35;
          return (
            <g key={day.day}>
              <rect x={x} y={20 - aH} width={w} height={aH} fill="oklch(0.65 0.15 145)" opacity="0.7" />
              <rect x={x + w} y={20} width={w} height={dH} fill="oklch(0.7 0.19 45)" opacity="0.7" />
              <text x={x + w} y={39} textAnchor="middle" fill="oklch(0.55 0.02 65)" fontSize="2.5" fontFamily="'JetBrains Mono', monospace">{day.day}</text>
            </g>
          );
        })}
        <line x1="0" y1="20" x2="100" y2="20" stroke="oklch(0.25 0.01 250)" strokeWidth="0.3" />
      </svg>
      <div className="flex justify-between mt-2">
        <span className="flex items-center gap-1 text-[10px] font-mono text-green-400"><ArrowUp className="w-3 h-3" /> Ascent ({u.elevUnit})</span>
        <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--primary)]"><ArrowDown className="w-3 h-3" /> Descent ({u.elevUnit})</span>
      </div>
    </div>
  );
}

// ── Itinerary Section (Collapsible) ──────────────────────
function ItinerarySection() {
  const [open, setOpen] = useState(false);
  return (
    <section className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-48 overflow-hidden relative cursor-pointer group"
      >
        <img src={HERO_IMAGES[2]} alt="Mont Blanc Massif" className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <h2 className="text-xs uppercase tracking-[0.4em] text-white font-mono flex items-center gap-2">
            <Mountain className="w-4 h-4" /> 10-Day Itinerary — July 25 to August 4, 2026
          </h2>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-white" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="container py-4">
              <ElevationChart />
              <div className="mt-4 border border-border bg-card">
                <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_5rem_6rem] gap-2 p-3 border-b border-border text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)]">
                  <span>Day</span><span>Route</span><span className="text-right">Dist</span>
                  <span className="text-right">Ascent</span><span className="text-right">Descent</span>
                  <span className="text-right">Time</span><span className="text-right">Rating</span>
                </div>
                {TMB_ITINERARY.map((day) => <ItineraryRow key={day.day} day={day} />)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Foot Mobility Section (Collapsible) ──────────────
function FootMobilitySection({ embedded = false }: { embedded?: boolean } = {}) {
  const [open, setOpen] = useState(embedded);
  return (
    <section className="container py-6">
      {!embedded && (
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground font-mono flex items-center gap-3 font-semibold">
          <span className="text-xl">🦶</span> Foot Mobility — High Transverse Arch Protocol
        </h2>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
        </motion.div>
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
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <div>
                <div className="border border-border bg-card p-4 mb-4">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] font-mono font-bold mb-2">Your Diagnosis</div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    You have an <span className="text-foreground font-medium">excessively high/rigid transverse arch</span> (pes cavus pattern).
                    The middle metatarsal heads (toes 2–4) are elevated — only the big toe pad and pinky toe pad contact the ground,
                    creating a &quot;bipod&quot; instead of full forefoot contact. This concentrates force on two points,
                    causes the foot to roll off the outside of the big toe, and sends shear force up into your knees on descents.
                    The fix is daily mobilization to allow those middle metatarsals to drop and share the load.
                  </p>
                </div>
                <div className="space-y-2">
                  {FOOT_VIDEOS.map((video) => (
                    <a key={video.url} href={video.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3 border border-border bg-card p-3 hover:border-[var(--primary)]/40 transition-colors group">
                      <div className="w-10 h-10 flex-shrink-0 bg-red-600/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs font-medium text-foreground group-hover:text-[var(--primary)] transition-colors truncate">{video.title}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">{video.channel}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-1 italic">{video.why}</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--muted-foreground)] flex-shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="border border-border overflow-hidden h-full">
                  <img src={HERO_IMAGES[1]} alt="Alpine descent" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Nutrition Card (wraps UtilityCard with dynamic calorie badge) ──
function NutritionCard() {
  const [calData, setCalData] = useState<{ current: number; target: number }>({ current: 0, target: 2300 });

  // Read today's calories from localStorage on mount so the banner is accurate before expanding
  useEffect(() => {
    try {
      // Read custom calorie target if set
      let target = 2300;
      try {
        const targetsRaw = localStorage.getItem("tmb-macro-targets");
        if (targetsRaw) {
          const parsed = JSON.parse(targetsRaw);
          if (parsed.calories) target = parsed.calories;
        }
      } catch { /* use default */ }

      let totalCal = 0;
      const raw = localStorage.getItem("tmb-nutrition-log");
      if (raw) {
        const logs = JSON.parse(raw) as { date: string; entries: { calories?: number }[] }[];
        const d = new Date();
        const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const todayLog = logs.find((l) => l.date === todayKey);
        if (todayLog && todayLog.entries.length > 0) {
          totalCal = todayLog.entries.reduce((s, e) => s + (e.calories || 0), 0);
        }
      }
      setCalData({ current: Math.round(totalCal), target });
    } catch { /* ignore */ }
  }, []);

  const handleCalorieUpdate = useCallback((current: number, target: number) => {
    setCalData({ current, target });
  }, []);
  return (
    <UtilityCard
      accent="border-l-green-500"
      accentBg="bg-green-500/5"
      icon={<span className="text-lg">🍎</span>}
      title="Nutrition Tracker"
      subtitle="Photo-based calorie tracking"
      tag={<>{calData.current.toLocaleString()} / {calData.target.toLocaleString()} CAL</>}
      tagColor={calData.current <= calData.target
        ? "text-green-400 bg-green-400/10"
        : ((calData.current - calData.target) / calData.target) <= 0.10
          ? "text-amber-400 bg-amber-400/10"
          : "text-red-400 bg-red-400/10"
      }
    >
      <NutritionTracker embedded onCalorieUpdate={handleCalorieUpdate} />
    </UtilityCard>
  );
}

// ── Body Fat Card (wraps UtilityCard with dynamic BF% badge) ──
function BodyFatCard() {
  const [bfData, setBfData] = useState<{ bf: number; label: string } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tmb-bodyfat-entries");
      if (!raw) return;
      const entries = JSON.parse(raw);
      if (entries.length > 0) {
        const latest = entries[0];
        const bf = latest.composite;
        const cats = [
          { label: "Essential", min: 0, max: 5.99 },
          { label: "Athletic", min: 6, max: 13.99 },
          { label: "Fitness", min: 14, max: 17.99 },
          { label: "Average", min: 18, max: 24.99 },
          { label: "Above Avg", min: 25, max: 100 },
        ];
        const cat = cats.find(c => bf >= c.min && bf <= c.max) || cats[cats.length - 1];
        setBfData({ bf, label: cat.label });
      }
    } catch { /* ignore */ }
  }, []);
  return (
    <UtilityCard
      accent="border-l-[var(--primary)]"
      accentBg="bg-[var(--primary)]/5"
      icon={<span className="text-lg">📏</span>}
      title="Body Fat Estimator"
      subtitle="Multi-formula composite"
      tag={bfData ? <>{bfData.bf}% · {bfData.label}</> : "No measurements yet"}
      tagColor={bfData ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-muted-foreground bg-muted/10"}
    >
      <BodyFatEstimator embedded />
    </UtilityCard>
  );
}

// ── Utility Card (for card grid) ───────────────────────────
function UtilityCard({ accent, accentBg, icon, title, subtitle, tag, tagColor, children }: {
  accent: string; accentBg: string; icon: React.ReactNode; title: string;
  subtitle: string; tag?: React.ReactNode; tagColor?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-border ${accentBg} border-l-4 ${accent} transition-all duration-200 ${
      open ? "sm:col-span-2 lg:col-span-3" : ""
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-bold text-foreground tracking-wider">{title}</div>
            <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 font-mono">{subtitle}</div>
            {tag && <span className={`inline-block text-[10px] font-mono uppercase tracking-wider mt-2 px-2 py-0.5 ${tagColor}`}>{tag}</span>}
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mode Toggle ──────────────────────────────────────────
type AppMode = "training" | "trail" | "travel";

function ModeToggle({ mode, setMode }: { mode: AppMode; setMode: (m: AppMode) => void }) {
  return (
    <div className="container py-6">
      <div className="flex items-center gap-1 p-1 bg-[var(--secondary)] border border-border w-full sm:w-auto sm:inline-flex">
        <button
          onClick={() => setMode("training")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-[0.2em] transition-all duration-200 ${
            mode === "training"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold"
              : "text-[var(--muted-foreground)] hover:text-foreground"
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          Training
        </button>
        <button
          onClick={() => setMode("trail")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-[0.2em] transition-all duration-200 ${
            mode === "trail"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold"
              : "text-[var(--muted-foreground)] hover:text-foreground"
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          Trail
        </button>
        <button
          onClick={() => setMode("travel")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-[0.2em] transition-all duration-200 ${
            mode === "travel"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold"
              : "text-[var(--muted-foreground)] hover:text-foreground"
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          Travel
        </button>
      </div>
      <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2 tracking-wide">
        {mode === "training" ? "Body composition, gear prep, analytics & mobility" : mode === "trail" ? "Route map, itinerary, budget, phrasebook & weather" : "Arrival, departure, transport, money & pre-trip checklist"}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function Home() {
  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    // Brief delay to allow data to hydrate from localStorage before showing UI
    const t = setTimeout(() => setAppReady(true), 150);
    return () => clearTimeout(t);
  }, []);
  // cloudSync removed
  const wt = useWeightTracker();
  const wl = useWorkoutLog();
  const milestone = useMilestoneDetector();
  const heroIdx = useHeroRotation(8000);
  const [dailyQuote] = useState(() => getDailyQuote());
  const [showSummary, setShowSummary] = useState<WorkoutSession | null>(null);
  const [highlightDay, setHighlightDay] = useState<number | null>(null);
  const [gpsPosition, setGpsPosition] = useState<GpsPosition | null>(null);
  const u = useUnits();
  // Auto-default to trail mode within 7 days of trip
  const daysLeft = getDaysUntilTrip();
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      const saved = localStorage.getItem("tmb-app-mode");
      if (saved === "training" || saved === "trail" || saved === "travel") return saved;
    } catch {}
    return daysLeft <= 7 ? "trail" : "training";
  });
  const handleModeChange = (m: AppMode) => {
    setMode(m);
    localStorage.setItem("tmb-app-mode", m);
  };
  // Pull-to-refresh — triggers page reload to re-sync
  const { pullDistance, isRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: async () => {
      // Dispatch cloud-sync-restored event to trigger re-reads from localStorage
      window.dispatchEvent(new Event("cloud-sync-restored"));
      // Small delay so user sees the refresh animation
      await new Promise(r => setTimeout(r, 600));
    },
  });

  // Compute exact totals from stitched GPX elevation profile data
  const totalMi = elevationData.totalDistance;
  const { totalAscent, totalDescent } = useMemo(() => {
    const pts = elevationData.points;
    let asc = 0, desc = 0;
    for (let i = 1; i < pts.length; i++) {
      const diff = pts[i].ele - pts[i - 1].ele;
      if (diff > 0) asc += diff; else desc += Math.abs(diff);
    }
    return { totalAscent: Math.round(asc), totalDescent: Math.round(desc) };
  }, []);
  const totalA = totalAscent;
  const totalD = totalDescent;

  // Workout history collapsed state
  const [workoutOpen, setWorkoutOpen] = useState(false);

  // Serialize data for Coach Sierra




  // Gear checklist progress for Coach Sierra


  // Pre-trip checklist progress for Coach Sierra


  const handleSave = () => {
    const session = wl.saveSession();
    if (session) {
      haptic("success");
      setShowSummary(session);
    }
  };

  // Show skeleton while app hydrates (must be after all hooks)
  if (!appReady) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <HeroSkeleton />
        <section className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div>
              <div className="flex items-baseline gap-3 mb-6">
                <div className="animate-pulse bg-[var(--secondary)] h-16 w-24 rounded" />
                <div className="animate-pulse bg-[var(--secondary)] h-4 w-20 rounded" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
            </div>
            <WeightGaugeSkeleton />
          </div>
        </section>
        <TrainingGridSkeleton />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      {...pullHandlers}
    >
      {/* Milestone celebration overlay */}
      {milestone.celebration && (
        <MilestoneCelebration
          currentWeight={milestone.celebration.current}
          previousWeight={milestone.celebration.previous}
          show={true}
          onComplete={milestone.dismiss}
        />
      )}
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center pointer-events-none transition-all"
          style={{ height: pullDistance, opacity: Math.min(pullDistance / 60, 1) }}
        >
          <div className={`w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full ${
            isRefreshing ? "animate-spin" : ""
          }`}
            style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)` }}
          />
        </div>
      )}
      {/* HERO */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img key={heroIdx} src={HERO_IMAGES[heroIdx]} alt="TMB" className="absolute inset-0 w-full h-full object-cover object-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--primary)] font-mono mb-2">Alpine Command Center</div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-none">Tour du Mont Blanc</h1>
            <p className="text-sm text-white/60 font-mono mt-2 tracking-wide">
              {ATHLETE.tripDays}-Day {ATHLETE.tripStyle} · {u.dist(totalMi)} {u.distUnitLong}
            </p>
            <div className="mt-4 max-w-md">
              <p className="text-xs text-white/40 italic font-serif leading-relaxed">
                "{dailyQuote.text}"
                <span className="text-white/25 ml-2 not-italic font-mono">— {dailyQuote.author}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* COUNTDOWN + WEIGHT */}
      <section className="relative border-b border-border" style={{ backgroundImage: `url(${TOPO})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-background/85" />
        <div className="relative container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div>
              <div className="flex items-center justify-between">
                <Countdown syncStatus={"idle"} />
                <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <button onClick={u.toggle}
                    className="text-[7px] font-mono uppercase tracking-wider border border-border/60 px-1.5 py-0.5 rounded bg-background/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors leading-none">
                    {u.isMetric ? 'KM/M' : 'MI/FT'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <StatCard label="Total Distance" value={u.dist(totalMi)} unit={u.distUnit} />
                <StatCard label="Total Ascent" value={u.elev(totalA)} unit={u.elevUnit} color="text-green-400" />
                <StatCard label="Total Descent" value={u.elev(totalD)} unit={u.elevUnit} color="text-[var(--primary)]" />
                <StatCard label="Pack Weight" value={ATHLETE.packWeight} unit="" />
              </div>
              <div className="mt-4">
                <ChamonixWeather />
              </div>
            </div>
            <WeightGauge currentWeight={wt.currentWeight} progress={wt.progress} entries={wt.entries} onAddWeight={(w: number) => { const prev = wt.currentWeight; wt.addEntry(w); milestone.checkMilestone(w, prev); }} onEditWeight={wt.editEntry} onDeleteWeight={wt.deleteEntry} goalWeight={wt.goalWeight} workoutSessions={wl.sessions} />
          </div>
        </div>
      </section>

      {/* WORKOUT PLAN — Collapsible */}
      <section className="container py-6">
        <button
          onClick={() => setWorkoutOpen(!workoutOpen)}
          className="w-full flex items-center justify-between group cursor-pointer"
        >
          <h2 className="text-sm uppercase tracking-[0.2em] text-foreground font-mono flex items-center gap-3 font-semibold">
            <span className="text-xl">🏋️</span> Training Protocol
          </h2>
          <div className="flex items-center gap-3">

            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{wl.sessions.length} sessions logged</span>
            <motion.div animate={{ rotate: workoutOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
            </motion.div>
          </div>
        </button>
        <AnimatePresence>
          {workoutOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2">
                {WORKOUT_PLAN.map((day) => (
                  <WorkoutCard key={day.id} day={day} onStart={wl.startSession} hasHitGoal={wl.hasHitGoal} getBestPerformance={wl.getBestPerformance} />
                ))}
              </div>
              <div className="mt-6">
                <WorkoutCalendar sessions={wl.sessions} onDelete={wl.deleteSession} onUpdate={wl.updateSession} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* MODE TOGGLE */}
      <div className="border-t border-border">
        <ModeToggle mode={mode} setMode={handleModeChange} />
      </div>

      <AnimatePresence mode="wait">
      {/* ═══ TRAINING MODE ═══ */}
      {mode === "training" && (
        <motion.div
          key="training"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* All training tools in one card grid */}
          <section className="container py-8">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-[var(--muted-foreground)] font-mono mb-4">Training Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nutrition Tracker Card */}
              <NutritionCard />

              {/* Garmin Analytics Card */}
              <UtilityCard
                accent="border-l-cyan-500"
                accentBg="bg-cyan-500/5"
                icon={<span className="text-lg">📈</span>}
                title="Garmin Analytics"
                subtitle="Training load & trends"
                tag="36 activities"
                tagColor="text-cyan-400 bg-cyan-400/10"
              >
                <TrainingAnalytics embedded />
              </UtilityCard>

              {/* Body Fat Card */}
              <BodyFatCard />

              {/* Gear Card */}
              <UtilityCard
                accent="border-l-violet-500"
                accentBg="bg-violet-500/5"
                icon={<span className="text-lg">🎒</span>}
                title="Gear Checklist"
                subtitle="Pack weight tracker"
                tag={`${u.wt(12, 0)}–${u.wt(16, 0)} ${u.wtUnit} target`}
                tagColor="text-violet-400 bg-violet-400/10"
              >
                <GearChecklist embedded />
              </UtilityCard>

              {/* Technique Videos Card */}
              <UtilityCard
                accent="border-l-red-500"
                accentBg="bg-red-500/5"
                icon={<span className="text-lg">🎥</span>}
                title="Technique Videos"
                subtitle="Descent & trail skills"
                tag="Video library"
                tagColor="text-red-400 bg-red-400/10"
              >
                <TechniqueVideos embedded />
              </UtilityCard>

              {/* Foot Mobility Card */}
              <UtilityCard
                accent="border-l-teal-500"
                accentBg="bg-teal-500/5"
                icon={<span className="text-lg">🦶</span>}
                title="Foot Mobility"
                subtitle="High transverse arch protocol"
                tag="Daily drills"
                tagColor="text-teal-400 bg-teal-400/10"
              >
                <FootMobilitySection embedded />
              </UtilityCard>
            </div>
          </section>
        </motion.div>
      )}

      {/* ═══ TRAIL MODE ═══ */}
      {mode === "trail" && (
        <motion.div
          key="trail"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* Full-width visual sections — with accents */}
          <div className="border-l-4 border-l-indigo-500 bg-indigo-500/[0.03]">
            <ItinerarySection />
          </div>
          <div className="border-l-4 border-l-green-500 bg-green-500/[0.03]">
            <TMBRouteMap highlightDay={highlightDay} onDayHover={setHighlightDay} onGpsUpdate={setGpsPosition} />
          </div>


          {/* Utility card grid */}
          <section className="container py-8">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-[var(--muted-foreground)] font-mono mb-4">Trail Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Budget Card */}
              <UtilityCard
                accent="border-l-emerald-500"
                accentBg="bg-emerald-500/5"
                icon={<span className="text-lg">💶</span>}
                title="Budget & Food"
                subtitle="€196–344 + CHF 60–95"
                tag="10 stages"
                tagColor="text-emerald-400 bg-emerald-400/10"
              >
                <DailyBudget embedded />
              </UtilityCard>

              {/* Travel Toolkit Card */}
              <UtilityCard
                accent="border-l-amber-500"
                accentBg="bg-amber-500/5"
                icon={<span className="text-lg">🌍</span>}
                title="Travel Toolkit"
                subtitle="Currency · Phrases · Etiquette"
                tag="FR · IT · CH"
                tagColor="text-amber-400 bg-amber-400/10"
              >
                <TravelToolkit embedded />
              </UtilityCard>

              {/* Weather Card */}
              <UtilityCard
                accent="border-l-sky-500"
                accentBg="bg-sky-500/5"
                icon={<span className="text-lg">⛅</span>}
                title="Weather Averages"
                subtitle="Late July conditions"
                tag="Historical"
                tagColor="text-sky-400 bg-sky-400/10"
              >
                <WeatherForecast embedded />
              </UtilityCard>
            </div>
          </section>
        </motion.div>
      )}

      {/* ═══ TRAVEL MODE ═══ */}
      {mode === "travel" && (
        <motion.div
          key="travel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <ArrivalDeparture embedded />
        </motion.div>
      )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-border py-6">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Alpine Command Center · TMB 2026</span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">"The summit is what drives us, but the climb itself is what matters."</span>
          </div>
        </div>
      </footer>

      {/* Fullscreen Active Workout Overlay */}
      <AnimatePresence>
        {wl.activeSession && (
          <ActiveWorkoutPanel
            dayId={wl.activeSession.dayId}
            exercises={wl.activeSession.exercises}
            onUpdate={wl.updateExercise}
            onToggle={wl.toggleDone}
            onSave={handleSave}
            onCancel={wl.cancelSession}
            lastSession={(() => {
              const prev = [...wl.sessions].reverse().find((s) => s.dayId === wl.activeSession!.dayId);
              return prev || null;
            })()}
            allSessions={wl.sessions}
          />
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <SummaryModal session={showSummary} allSessions={wl.sessions} onClose={() => setShowSummary(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
