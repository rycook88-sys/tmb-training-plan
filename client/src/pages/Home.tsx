import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ATHLETE, TMB_ITINERARY, WORKOUT_PLAN, FOOT_VIDEOS,
  WEEKLY_BLOCKS, getDaysUntilTrip,
} from "@/lib/data";
import type { ItineraryDay, WorkoutDay } from "@/lib/data";
import { useWeightTracker, useWorkoutLog, generateSummary } from "@/lib/hooks";
import type { ExerciseLog, WorkoutSession } from "@/lib/hooks";
import {
  Mountain, ChevronDown, ChevronUp, ExternalLink, Footprints,
  Target, ArrowDown, ArrowUp, Play, Calendar, Trophy, Save, X,
} from "lucide-react";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/hero-tmb-ridge-TA9BE2JzZxaxi68um9vvG9.webp";
const TOPO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/topo-texture-3ai3ccpyxv32r72SNbY3MU.webp";
const DESC = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/alpine-descent-fVYu9fsGi368uNUQov45Qu.webp";
const MASS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/mont-blanc-massif-9zhRqKCwtJsZQ3ZMrMW65f.webp";

// ── Countdown ─────────────────────────────────────────────
function Countdown() {
  const [days, setDays] = useState(getDaysUntilTrip());
  useEffect(() => {
    const t = setInterval(() => setDays(getDaysUntilTrip()), 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-5xl sm:text-7xl font-bold text-[var(--primary)] tracking-tighter leading-none">{days}</span>
      <span className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">days to go</span>
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
function WeightGauge({ currentWeight, progress, entries, onAddWeight }: {
  currentWeight: number; progress: number;
  entries: { date: string; weight: number }[];
  onAddWeight: (w: number) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const [showInput, setShowInput] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(inputVal);
    if (w > 150 && w < 300) { onAddWeight(w); setInputVal(""); setShowInput(false); }
  };
  const gaugeH = 280;
  const goalReached = currentWeight <= ATHLETE.goalWeight;

  return (
    <div className="border border-border p-5 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)]">Altitude Gauge</h3>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">{ATHLETE.startWeight} → {ATHLETE.goalWeight} lb</span>
      </div>
      <div className="flex gap-6 items-center">
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
          <span className="absolute -right-8 top-0 text-[10px] font-mono text-[var(--primary)] translate-y-[-50%]">{ATHLETE.goalWeight}</span>
          <span className="absolute -right-8 bottom-0 text-[10px] font-mono text-[var(--muted-foreground)] translate-y-[50%]">{ATHLETE.startWeight}</span>
        </div>
        <div className="flex-1">
          <div className="font-mono text-4xl font-bold text-foreground leading-none">
            {currentWeight}<span className="text-lg text-[var(--muted-foreground)] ml-1">lb</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {goalReached ? (
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> GOAL REACHED</span>
            ) : (
              <span className="text-xs font-mono text-[var(--muted-foreground)]">{currentWeight - ATHLETE.goalWeight} lb to go</span>
            )}
          </div>
          <div className="mt-1 text-xs font-mono text-[var(--primary)]">{Math.round(progress)}% complete</div>
          <div className="mt-4 space-y-1">
            {entries.slice(-4).map((e) => (
              <div key={e.date} className="flex justify-between text-xs font-mono text-[var(--muted-foreground)]">
                <span>{e.date}</span><span>{e.weight} lb</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            {showInput ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="number" step="0.1" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                  placeholder="226.0" autoFocus
                  className="w-24 bg-[var(--secondary)] border border-border px-2 py-1 text-xs font-mono text-foreground focus:border-[var(--primary)] focus:outline-none" />
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

// ── Active Workout Session Panel ──────────────────────────
function ActiveWorkoutPanel({ dayId, exercises, onUpdate, onToggle, onSave, onCancel }: {
  dayId: string; exercises: ExerciseLog[];
  onUpdate: (i: number, field: keyof ExerciseLog, val: string | boolean) => void;
  onToggle: (i: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const day = WORKOUT_PLAN.find((d) => d.id === dayId);
  if (!day) return null;
  const allDone = exercises.every((e) => e.done);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="border-2 border-[var(--primary)] bg-card">
      <div className="flex items-center justify-between p-4 border-b border-[var(--primary)]/30 bg-[var(--primary)]/5">
        <div className="flex items-center gap-3">
          <span className="text-xl">{day.icon}</span>
          <div>
            <div className="font-mono text-sm font-bold text-[var(--primary)] tracking-wider">ACTIVE SESSION</div>
            <div className="text-xs text-[var(--muted-foreground)] tracking-wide">{day.title} — {day.subtitle}</div>
          </div>
        </div>
        <button onClick={onCancel} className="text-[var(--muted-foreground)] hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      <div className="divide-y divide-border">
        {exercises.map((ex, i) => {
          const planEx = day.exercises[i];
          const goalHit = !!(planEx?.goalValue && ex.weight && ex.done && (
            planEx.unit === "assist"
              ? parseFloat(ex.weight) <= planEx.goalValue
              : parseFloat(ex.weight) >= planEx.goalValue
          ));
          return (
            <div key={ex.name} className={`p-4 transition-colors ${ex.done ? "bg-[var(--primary)]/5" : ""}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => onToggle(i)}
                  className={`mt-0.5 w-6 h-6 border flex-shrink-0 flex items-center justify-center transition-all ${
                    ex.done ? (goalHit ? "bg-amber-500 border-amber-500" : "bg-[var(--primary)] border-[var(--primary)]")
                    : "border-border hover:border-[var(--primary)]"
                  }`}>
                  {ex.done && <span className={`text-xs font-bold ${goalHit ? "text-black" : "text-[var(--primary-foreground)]"}`}>{goalHit ? "★" : "✓"}</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono text-sm font-medium ${ex.done ? "line-through text-[var(--muted-foreground)]" : "text-foreground"}`}>{ex.name}</span>
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    <input type="text" placeholder={planEx?.unit === "sec" || planEx?.unit === "min" ? "duration" : "weight"}
                      value={ex.weight} onChange={(e) => onUpdate(i, "weight", e.target.value)}
                      className="w-20 bg-[var(--secondary)] border border-border px-2 py-1 text-xs font-mono text-foreground focus:border-[var(--primary)] focus:outline-none" />
                    <input type="text" placeholder="reps" value={ex.reps}
                      onChange={(e) => onUpdate(i, "reps", e.target.value)}
                      className="w-16 bg-[var(--secondary)] border border-border px-2 py-1 text-xs font-mono text-foreground focus:border-[var(--primary)] focus:outline-none" />
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)] mt-1 italic">{planEx?.notes}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-[var(--primary)]/30">
        <button onClick={onSave}
          className={`w-full py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            allDone ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-foreground"
          }`}>
          <Save className="w-4 h-4" /> LOG WORKOUT
        </button>
      </div>
    </motion.div>
  );
}

// ── Workout Card (Browse Mode) ────────────────────────────
function WorkoutCard({ day, onStart, hasHitGoal }: {
  day: WorkoutDay;
  onStart: (d: WorkoutDay) => void;
  hasHitGoal: (name: string, gv?: number, u?: string) => boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border bg-card">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--secondary)] transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xl">{day.icon}</span>
          <div>
            <div className="font-mono text-sm font-bold text-foreground tracking-wider">{day.title}</div>
            <div className="text-xs text-[var(--muted-foreground)] tracking-wide">{day.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); onStart(day); }}
            className="text-[10px] font-mono uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 hover:opacity-90 transition-opacity">
            START
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />}
        </div>
      </button>
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
                        <span className="text-xs font-mono text-[var(--muted-foreground)]">Now: <span className="text-foreground">{ex.current}</span></span>
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

// ── Workout History Calendar ──────────────────────────────
function WorkoutCalendar({ sessions }: { sessions: WorkoutSession[] }) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  if (sessions.length === 0) return null;

  const grouped: Record<string, WorkoutSession[]> = {};
  for (const s of sessions) {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  }
  const dates = Object.keys(grouped).sort().reverse();

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
                    {daySessions.map((s, si) => (
                      <div key={si} className="px-4 pb-3">
                        <div className="text-[10px] font-mono text-[var(--primary)] uppercase tracking-wider mb-1">{s.dayTitle}</div>
                        {s.exercises.filter((e) => e.done).map((ex) => (
                          <div key={ex.name} className="flex justify-between text-xs font-mono text-[var(--muted-foreground)] py-0.5">
                            <span className="text-foreground">{ex.name}</span>
                            <span>{ex.weight || "BW"} {ex.reps ? `× ${ex.reps}` : ""}</span>
                          </div>
                        ))}
                        {s.exercises.filter((e) => !e.done).length > 0 && (
                          <div className="text-[10px] text-red-400/70 mt-1">
                            Skipped: {s.exercises.filter((e) => !e.done).map((e) => e.name).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Itinerary Row ─────────────────────────────────────────
function ItineraryRow({ day }: { day: ItineraryDay }) {
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
            {day.distanceMi} mi · ↑{day.ascent}' · ↓{day.descent}' · {day.duration}
          </div>
        </div>
        <span className="hidden sm:block font-mono text-xs text-[var(--muted-foreground)] text-right">{day.distanceMi} mi</span>
        <span className="hidden sm:flex font-mono text-xs text-green-400 items-center justify-end gap-0.5"><ArrowUp className="w-3 h-3" />{day.ascent}'</span>
        <span className="hidden sm:flex font-mono text-xs text-red-400 items-center justify-end gap-0.5"><ArrowDown className="w-3 h-3" />{day.descent}'</span>
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
  const maxA = Math.max(...TMB_ITINERARY.map((d) => d.ascent));
  const maxD = Math.max(...TMB_ITINERARY.map((d) => d.descent));
  const bw = 100 / TMB_ITINERARY.length;
  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] mb-3">Elevation Profile — 10 Days</h3>
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
        <span className="flex items-center gap-1 text-[10px] font-mono text-green-400"><ArrowUp className="w-3 h-3" /> Ascent</span>
        <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--primary)]"><ArrowDown className="w-3 h-3" /> Descent</span>
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
        <img src={MASS} alt="Mont Blanc Massif" className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <h2 className="text-xs uppercase tracking-[0.4em] text-white font-mono flex items-center gap-2">
            <Mountain className="w-4 h-4" /> 10-Day Itinerary — July 26 to August 4, 2026
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
function FootMobilitySection() {
  const [open, setOpen] = useState(false);
  return (
    <section className="container py-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2">
          <Footprints className="w-3.5 h-3.5 text-[var(--primary)]" /> Foot Mobility — High Transverse Arch Protocol
        </h2>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
        </motion.div>
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
                  <img src={DESC} alt="Alpine descent" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function Home() {
  const wt = useWeightTracker();
  const wl = useWorkoutLog();
  const [showSummary, setShowSummary] = useState<WorkoutSession | null>(null);
  const totalA = TMB_ITINERARY.reduce((s, d) => s + d.ascent, 0);
  const totalD = TMB_ITINERARY.reduce((s, d) => s + d.descent, 0);
  const totalMi = TMB_ITINERARY.reduce((s, d) => s + d.distanceMi, 0);

  const handleSave = () => {
    const session = wl.saveSession();
    if (session) setShowSummary(session);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <img src={HERO} alt="TMB Ridge" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--primary)] font-mono mb-2">Alpine Command Center</div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-none">Tour du Mont Blanc</h1>
            <p className="text-sm text-white/60 font-mono mt-2 tracking-wide">
              {ATHLETE.tripDays}-Day {ATHLETE.tripStyle} · {totalMi.toFixed(1)} miles · {totalA.toLocaleString()}' gain · {totalD.toLocaleString()}' loss
            </p>
          </motion.div>
        </div>
      </section>

      {/* COUNTDOWN + WEIGHT */}
      <section className="relative border-b border-border" style={{ backgroundImage: `url(${TOPO})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-background/85" />
        <div className="relative container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div>
              <Countdown />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <StatCard label="Total Distance" value={`${totalMi.toFixed(1)}`} unit="mi" />
                <StatCard label="Total Ascent" value={totalA.toLocaleString()} unit="ft" color="text-green-400" />
                <StatCard label="Total Descent" value={totalD.toLocaleString()} unit="ft" color="text-[var(--primary)]" />
                <StatCard label="Pack Weight" value={ATHLETE.packWeight} unit="" />
              </div>
            </div>
            <WeightGauge currentWeight={wt.currentWeight} progress={wt.progress} entries={wt.entries} onAddWeight={wt.addEntry} />
          </div>
        </div>
      </section>

      {/* WORKOUT PLAN */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[var(--primary)]" /> Training Protocol
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {WEEKLY_BLOCKS.map((block) => (
            <div key={block.label} className="border border-border bg-card p-4">
              <div className="font-mono text-xs font-bold text-foreground tracking-wider mb-2">{block.label}</div>
              <div className="flex gap-2 flex-wrap">
                {block.pattern.map((p, i) => (
                  <span key={i} className="text-[10px] font-mono bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-1">{p}</span>
                ))}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-2 italic">{block.notes}</div>
            </div>
          ))}
        </div>

        {/* Active session or browse cards */}
        {wl.activeSession ? (
          <ActiveWorkoutPanel
            dayId={wl.activeSession.dayId}
            exercises={wl.activeSession.exercises}
            onUpdate={wl.updateExercise}
            onToggle={wl.toggleDone}
            onSave={handleSave}
            onCancel={wl.cancelSession}
          />
        ) : (
          <div className="space-y-2">
            {WORKOUT_PLAN.map((day) => (
              <WorkoutCard key={day.id} day={day} onStart={wl.startSession} hasHitGoal={wl.hasHitGoal} />
            ))}
          </div>
        )}

        {/* Workout History */}
        <div className="mt-6">
          <WorkoutCalendar sessions={wl.sessions} />
        </div>
      </section>

      {/* TMB ITINERARY */}
      <ItinerarySection />

      {/* FOOT MOBILITY (Collapsible) */}
      <FootMobilitySection />

      {/* FOOTER */}
      <footer className="border-t border-border py-6">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Alpine Command Center · TMB 2026</span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">"The summit is what drives us, but the climb itself is what matters."</span>
          </div>
        </div>
      </footer>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <SummaryModal session={showSummary} allSessions={wl.sessions} onClose={() => setShowSummary(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
