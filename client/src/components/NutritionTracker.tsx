import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Check, Edit3, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  Trash2, X, AlertTriangle, TrendingUp, Pill, Utensils, Plus, RotateCcw,
  Loader2, Sparkles, ArrowUpToLine,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DAILY_VITAMINS, getDailyVitaminTotals, MACRO_TARGETS } from "@/lib/vitamin-data";

/* ── Types ─────────────────────────────────────────── */
interface FoodEntry {
  id: string;
  timestamp: number;
  foodName: string;
  imageUrl?: string;
  confidence: string;
  servingEstimate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  micronutrients: { name: string; amount: string; dailyValuePct: number }[];
  confirmed: boolean;
}

interface DailyLog {
  date: string; // YYYY-MM-DD
  entries: FoodEntry[];
  vitaminsAdded: boolean;
}

interface RecommendationFeedback {
  id: string;
  thumbsUp: boolean;
  timestamp: number;
}

/* ── LocalStorage Helpers ──────────────────────────── */
const STORAGE_KEY = "tmb-nutrition-log";
const FEEDBACK_KEY = "tmb-nutrition-feedback";

function getTodayKey(): string {
  // Use local date, not UTC — prevents timezone mismatch
  // (e.g. CDT user seeing April 4 when it's still April 3 locally)
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadLogs(): DailyLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: DailyLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function loadFeedback(): RecommendationFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFeedback(fb: RecommendationFeedback[]) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
}

function getOrCreateToday(logs: DailyLog[]): { logs: DailyLog[]; today: DailyLog } {
  const key = getTodayKey();
  let today = logs.find((l) => l.date === key);
  if (!today) {
    today = { date: key, entries: [], vitaminsAdded: false };
    logs = [...logs, today];
  }
  return { logs, today };
}

/* ── Macro Progress Bar ────────────────────────────── */
function MacroBar({ label, current, target, color, unit = "g" }: {
  label: string; current: number; target: number; color: string; unit?: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  const over = current > target;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">{label}</span>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          <span className={over ? "text-red-400" : "text-foreground"}>{Math.round(current)}</span>
          <span className="text-[var(--muted-foreground)]"> / {target}{unit}</span>
          {!over && <span className="text-[var(--muted-foreground)] ml-1">({Math.round(remaining)} left)</span>}
          {over && <span className="text-red-400 ml-1">(+{Math.round(current - target)} over)</span>}
        </span>
      </div>
      <div className="h-2.5 bg-[var(--secondary)] border border-border overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: over ? "#ef4444" : color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ── Micro Nutrient Dropdown ───────────────────────── */
function MicroDropdown({ micros }: { micros: { name: string; amount: string; dailyValuePct: number }[] }) {
  const [open, setOpen] = useState(false);
  if (micros.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer"
      >
        <Pill className="w-3 h-3" />
        Micronutrients ({micros.length})
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {micros.map((m) => (
                <div key={m.name} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-foreground">{m.amount}</span>
                    <span className={`text-[10px] font-mono ${
                      m.dailyValuePct >= 100 ? "text-green-400" :
                      m.dailyValuePct >= 50 ? "text-yellow-400" :
                      "text-[var(--muted-foreground)]"
                    }`}>
                      {m.dailyValuePct > 0 ? `${m.dailyValuePct}% DV` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Food Entry Card ───────────────────────────────── */
function FoodEntryCard({ entry, onDelete }: {
  entry: FoodEntry;
  onDelete: (id: string) => void;
}) {
  const [showMicros, setShowMicros] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="border border-border bg-card p-3 mb-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Utensils className="w-3 h-3 text-[var(--primary)] flex-shrink-0" />
            <span className="font-mono text-xs font-medium text-foreground truncate">{entry.foodName}</span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{time}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] font-mono">
            <span className="text-[var(--primary)]">{entry.calories} cal</span>
            <span className="text-blue-400">P: {entry.protein}g</span>
            <span className="text-amber-400">C: {entry.carbs}g</span>
            <span className="text-rose-400">F: {entry.fat}g</span>
          </div>
          {entry.servingEstimate && (
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 italic">{entry.servingEstimate}</div>
          )}
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          className="text-[var(--muted-foreground)] hover:text-red-400 transition-colors p-1 flex-shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {entry.micronutrients.length > 0 && (
        <MicroDropdown micros={entry.micronutrients} />
      )}
    </div>
  );
}

/* ── Recommendation Card ───────────────────────────── */
function RecommendationCard({ rec, onFeedback, existingFeedback }: {
  rec: { id: string; severity: string; title: string; message: string; nutrient: string };
  onFeedback: (id: string, thumbsUp: boolean) => void;
  existingFeedback?: RecommendationFeedback;
}) {
  const severityColor = rec.severity === "action" ? "border-l-red-500 bg-red-500/5"
    : rec.severity === "warning" ? "border-l-amber-500 bg-amber-500/5"
    : "border-l-blue-500 bg-blue-500/5";

  const severityIcon = rec.severity === "action" ? "text-red-400"
    : rec.severity === "warning" ? "text-amber-400"
    : "text-blue-400";

  return (
    <div className={`border border-border border-l-4 ${severityColor} p-3 mb-2`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-3 h-3 ${severityIcon} flex-shrink-0`} />
            <span className="font-mono text-xs font-medium text-foreground">{rec.title}</span>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-1 leading-relaxed">{rec.message}</p>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={() => onFeedback(rec.id, true)}
            className={`p-1 transition-colors ${
              existingFeedback?.thumbsUp === true ? "text-green-400" : "text-[var(--muted-foreground)] hover:text-green-400"
            }`}
            title="Useful recommendation"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onFeedback(rec.id, false)}
            className={`p-1 transition-colors ${
              existingFeedback?.thumbsUp === false ? "text-red-400" : "text-[var(--muted-foreground)] hover:text-red-400"
            }`}
            title="Not useful"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main NutritionTracker Component ───────────────── */
export default function NutritionTracker({ embedded = false }: { embedded?: boolean }) {
  const [logs, setLogs] = useState<DailyLog[]>(loadLogs);
  const [feedback, setFeedback] = useState<RecommendationFeedback[]>(loadFeedback);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedMime, setCapturedMime] = useState<string>("image/jpeg");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showTrends, setShowTrends] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showVitamins, setShowVitamins] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const analyzeMutation = trpc.nutrition.analyzePhoto.useMutation();
  const reAnalyzeMutation = trpc.nutrition.reAnalyze.useMutation();
  const trendsMutation = trpc.nutrition.getTrends.useMutation();

  // Persist logs
  useEffect(() => { saveLogs(logs); }, [logs]);
  useEffect(() => { saveFeedback(feedback); }, [feedback]);

  // Get today's data
  const todayKey = getTodayKey();
  const todayLog = useMemo(() => logs.find((l) => l.date === todayKey), [logs, todayKey]);
  const todayEntries = todayLog?.entries || [];
  const vitaminsAdded = todayLog?.vitaminsAdded || false;

  // Calculate today's totals (food + vitamins)
  const vitaminTotals = useMemo(() => getDailyVitaminTotals(), []);

  const dailyTotals = useMemo(() => {
    let cal = 0, prot = 0, carb = 0, fat = 0, fiber = 0, sugar = 0, sodium = 0;
    for (const e of todayEntries) {
      cal += e.calories;
      prot += e.protein;
      carb += e.carbs;
      fat += e.fat;
      fiber += e.fiber;
      sugar += e.sugar;
      sodium += e.sodium;
    }
    // Add vitamins if they've been added today
    if (vitaminsAdded) {
      cal += vitaminTotals.calories;
      prot += vitaminTotals.protein;
      carb += vitaminTotals.carbs;
      fat += vitaminTotals.fat;
    }
    return { calories: cal, protein: prot, carbs: carb, fat, fiber, sugar, sodium };
  }, [todayEntries, vitaminsAdded, vitaminTotals]);

  // Combine micronutrients from all entries + vitamins
  const dailyMicros = useMemo(() => {
    const map = new Map<string, { amount: string; dailyValuePct: number }>();
    for (const e of todayEntries) {
      for (const m of e.micronutrients) {
        const existing = map.get(m.name);
        if (existing) {
          map.set(m.name, {
            amount: `${existing.amount} + ${m.amount}`,
            dailyValuePct: existing.dailyValuePct + m.dailyValuePct,
          });
        } else {
          map.set(m.name, { amount: m.amount, dailyValuePct: m.dailyValuePct });
        }
      }
    }
    if (vitaminsAdded) {
      for (const m of vitaminTotals.micronutrients) {
        const existing = map.get(m.name);
        if (existing) {
          map.set(m.name, {
            amount: `${existing.amount} + ${m.amount}`,
            dailyValuePct: existing.dailyValuePct + m.dailyValuePct,
          });
        } else {
          map.set(m.name, { amount: m.amount, dailyValuePct: m.dailyValuePct });
        }
      }
    }
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      dailyValuePct: data.dailyValuePct,
    }));
  }, [todayEntries, vitaminsAdded, vitaminTotals]);

  /* ── Camera / File Capture ─────────────────────── */
  const handleCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      const mime = file.type || "image/jpeg";
      setCapturedImage(dataUrl);
      setCapturedMime(mime);
      setAnalysisResult(null);
      setEditingName(false);

      // Analyze the photo
      try {
        const result = await analyzeMutation.mutateAsync({
          imageBase64: base64,
          mimeType: mime,
        });
        setAnalysisResult(result);
        setEditedName(result.foodName);
      } catch (err) {
        console.error("Food analysis failed:", err);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [analyzeMutation]);

  /* ── Edit Food Name & Re-analyze ───────────────── */
  const handleEditName = useCallback(() => {
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, []);

  const handleNameConfirm = useCallback(async () => {
    if (editedName.trim() && editedName !== analysisResult?.foodName) {
      try {
        const result = await reAnalyzeMutation.mutateAsync({
          foodName: editedName.trim(),
          servingEstimate: analysisResult?.servingEstimate,
        });
        setAnalysisResult((prev: any) => ({
          ...prev,
          ...result,
          foodName: editedName.trim(),
        }));
      } catch (err) {
        console.error("Re-analysis failed:", err);
      }
    }
    setEditingName(false);
  }, [editedName, analysisResult, reAnalyzeMutation]);

  /* ── Confirm Food Entry ────────────────────────── */
  const handleConfirmFood = useCallback(() => {
    if (!analysisResult) return;

    const entry: FoodEntry = {
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      foodName: editedName || analysisResult.foodName,
      imageUrl: analysisResult.imageUrl,
      confidence: analysisResult.confidence,
      servingEstimate: analysisResult.servingEstimate,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fat: analysisResult.fat,
      fiber: analysisResult.fiber || 0,
      sugar: analysisResult.sugar || 0,
      sodium: analysisResult.sodium || 0,
      micronutrients: analysisResult.micronutrients || [],
      confirmed: true,
    };

    setLogs((prev) => {
      const { logs: updated } = getOrCreateToday(prev);
      return updated.map((l) =>
        l.date === todayKey ? { ...l, entries: [...l.entries, entry] } : l
      );
    });

    // Reset capture state
    setCapturedImage(null);
    setAnalysisResult(null);
    setEditingName(false);
  }, [analysisResult, editedName, todayKey]);

  /* ── Delete Entry ──────────────────────────────── */
  const handleDeleteEntry = useCallback((id: string) => {
    setConfirmDelete(id);
  }, []);

  const confirmDeleteEntry = useCallback(() => {
    if (!confirmDelete) return;
    setLogs((prev) =>
      prev.map((l) =>
        l.date === todayKey
          ? { ...l, entries: l.entries.filter((e) => e.id !== confirmDelete) }
          : l
      )
    );
    setConfirmDelete(null);
  }, [confirmDelete, todayKey]);

  /* ── Add Daily Vitamins ────────────────────────── */
  const handleAddVitamins = useCallback(() => {
    // Only flip the vitaminsAdded flag on today's log.
    // If today's log doesn't exist yet (no meals), create it but
    // it won't count as a "logged day" for trends/history until
    // actual food entries are added.
    setLogs((prev) => {
      const { logs: updated } = getOrCreateToday(prev);
      return updated.map((l) =>
        l.date === todayKey ? { ...l, vitaminsAdded: true } : l
      );
    });
  }, [todayKey]);

  /* ── Fetch Trends ──────────────────────────────── */
  const handleFetchTrends = useCallback(async () => {
    setShowTrends(true);
    // Get last 3+ days of data
    // Only count days with actual food entries for trend analysis.
    // Vitamin-only days don't represent real eating patterns.
    const recentLogs = logs
      .filter((l) => l.entries.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    if (recentLogs.length < 3) {
      setRecommendations([]);
      return;
    }

    const dailyLogs = recentLogs.map((l) => {
      let cal = 0, prot = 0, carb = 0, fat = 0, fiber = 0, sodium = 0;
      for (const e of l.entries) {
        cal += e.calories;
        prot += e.protein;
        carb += e.carbs;
        fat += e.fat;
        fiber += e.fiber;
        sodium += e.sodium;
      }
      if (l.vitaminsAdded) {
        const vt = getDailyVitaminTotals();
        cal += vt.calories;
        prot += vt.protein;
        carb += vt.carbs;
        fat += vt.fat;
      }
      return {
        date: l.date,
        totalCalories: cal,
        totalProtein: prot,
        totalCarbs: carb,
        totalFat: fat,
        totalFiber: fiber,
        totalSodium: sodium,
      };
    });

    try {
      const result = await trendsMutation.mutateAsync({
        dailyLogs,
        targets: MACRO_TARGETS,
      });
      setRecommendations(result.recommendations || []);
    } catch (err) {
      console.error("Trends fetch failed:", err);
      setRecommendations([]);
    }
  }, [logs, trendsMutation]);

  /* ── Feedback ──────────────────────────────────── */
  const handleFeedback = useCallback((id: string, thumbsUp: boolean) => {
    setFeedback((prev) => {
      const existing = prev.findIndex((f) => f.id === id);
      const entry: RecommendationFeedback = { id, thumbsUp, timestamp: Date.now() };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  }, []);

  /* ── Cancel capture ────────────────────────────── */
  const handleCancelCapture = useCallback(() => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setEditingName(false);
  }, []);

  const isAnalyzing = analyzeMutation.isPending;
  const isReAnalyzing = reAnalyzeMutation.isPending;
  const isTrendLoading = trendsMutation.isPending;

  return (
    <div className={embedded ? "" : "container py-6"}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Header Stats ─────────────────────────── */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Today's Nutrition</span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{todayKey}</span>
          </div>
          <span className={`font-mono text-sm font-bold ${
            dailyTotals.calories > MACRO_TARGETS.calories ? "text-red-400" : "text-foreground"
          }`}>
            {Math.round(dailyTotals.calories)} / {MACRO_TARGETS.calories} cal
          </span>
        </div>

        {/* Macro Progress Bars */}
        <MacroBar label="Calories" current={dailyTotals.calories} target={MACRO_TARGETS.calories} color="oklch(0.7 0.18 55)" unit=" cal" />
        <MacroBar label="Protein" current={dailyTotals.protein} target={MACRO_TARGETS.protein} color="oklch(0.65 0.15 250)" />
        <MacroBar label="Carbs" current={dailyTotals.carbs} target={MACRO_TARGETS.carbs} color="oklch(0.7 0.15 85)" />
        <MacroBar label="Fat" current={dailyTotals.fat} target={MACRO_TARGETS.fat} color="oklch(0.7 0.15 15)" />

        {/* Daily Micronutrients */}
        {dailyMicros.length > 0 && <MicroDropdown micros={dailyMicros} />}
      </div>

      {/* ── Action Buttons ───────────────────────── */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <button
          onClick={handleCapture}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Snap Food
        </button>

        {!vitaminsAdded && (
          <button
            onClick={handleAddVitamins}
            className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
          >
            <Pill className="w-3.5 h-3.5" />
            Add Vitamins
          </button>
        )}

        {vitaminsAdded && (
          <button
            onClick={() => {
              setLogs((prev) =>
                prev.map((l) =>
                  l.date === todayKey ? { ...l, vitaminsAdded: false } : l
                )
              );
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider text-green-400 bg-green-400/10 hover:bg-red-400/10 hover:text-red-400 transition-colors group cursor-pointer"
            title="Click to undo vitamins"
          >
            <Check className="w-3 h-3 group-hover:hidden" />
            <RotateCcw className="w-3 h-3 hidden group-hover:block" />
            <span className="group-hover:hidden">Vitamins Added</span>
            <span className="hidden group-hover:inline">Undo Vitamins</span>
          </button>
        )}

        <button
          onClick={handleFetchTrends}
          disabled={isTrendLoading}
          className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-50"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {isTrendLoading ? "Analyzing..." : "Trends"}
        </button>
      </div>

      {/* ── Photo Analysis Panel ─────────────────── */}
      <AnimatePresence>
        {capturedImage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 border border-border overflow-hidden bg-[var(--secondary)]">
                  <img src={capturedImage} alt="Captured food" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                      <span className="text-xs font-mono text-[var(--muted-foreground)]">Analyzing food...</span>
                    </div>
                  )}

                  {analysisResult && !isAnalyzing && (
                    <>
                      {/* Food Name (editable) */}
                      <div className="flex items-center gap-2 mb-1">
                        {editingName ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              ref={nameInputRef}
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleNameConfirm()}
                              className="flex-1 bg-[var(--secondary)] border border-border px-2 py-1 text-xs font-mono text-foreground focus:border-[var(--primary)] focus:outline-none"
                            />
                            <button onClick={handleNameConfirm} className="text-green-400 hover:text-green-300 p-0.5">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingName(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-xs font-bold text-foreground truncate">
                              {isReAnalyzing ? "Re-analyzing..." : (editedName || analysisResult.foodName)}
                            </span>
                            <button onClick={handleEditName} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] p-0.5 flex-shrink-0">
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Confidence */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 ${
                          analysisResult.confidence === "high" ? "text-green-400 bg-green-400/10" :
                          analysisResult.confidence === "medium" ? "text-amber-400 bg-amber-400/10" :
                          "text-red-400 bg-red-400/10"
                        }`}>
                          {analysisResult.confidence} confidence
                        </span>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)] italic">{analysisResult.servingEstimate}</span>
                      </div>

                      {/* Quick Macros */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono mb-2">
                        <span className="text-[var(--primary)] font-bold">{analysisResult.calories} cal</span>
                        <span className="text-blue-400">P: {analysisResult.protein}g</span>
                        <span className="text-amber-400">C: {analysisResult.carbs}g</span>
                        <span className="text-rose-400">F: {analysisResult.fat}g</span>
                      </div>

                      {/* Confirm / Cancel */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleConfirmFood}
                          disabled={isReAnalyzing}
                          className="flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                        <button
                          onClick={handleCancelCapture}
                          className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" /> Discard
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trends Panel ─────────────────────────── */}
      <AnimatePresence>
        {showTrends && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">3-Day Trends</span>
                </div>
                <button onClick={() => setShowTrends(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {isTrendLoading && (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">Analyzing trends...</span>
                </div>
              )}

              {!isTrendLoading && recommendations.length === 0 && (
                <div className="py-3 text-center">
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">
                    {logs.filter((l) => l.entries.length > 0).length < 3
                      ? "Need at least 3 days of data for trends"
                      : "Looking good — no issues to flag"}
                  </span>
                </div>
              )}

              {!isTrendLoading && recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onFeedback={handleFeedback}
                  existingFeedback={feedback.find((f) => f.id === rec.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Vitamin Details ──────────────────────── */}
      {vitaminsAdded && (
        <div className="px-4 mb-3">
          <button
            onClick={() => setShowVitamins(!showVitamins)}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer"
          >
            <Pill className="w-3 h-3" />
            Vitamin Details ({DAILY_VITAMINS.length} supplements)
            {showVitamins ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showVitamins && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {DAILY_VITAMINS.map((v) => (
                    <div key={v.name} className="border border-border bg-card p-2">
                      <div className="font-mono text-[10px] font-medium text-foreground">{v.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{v.servingSize} · {v.nutrients.calories} cal</div>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {v.micronutrients.map((m) => (
                          <div key={m.name} className="flex justify-between text-[10px] font-mono">
                            <span className="text-[var(--muted-foreground)]">{m.name}</span>
                            <span className={m.dailyValuePct >= 100 ? "text-green-400" : "text-foreground"}>
                              {m.dailyValuePct > 0 ? `${m.dailyValuePct}%` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Today's Food Log ─────────────────────── */}
      {todayEntries.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Today's Meals ({todayEntries.length})
            </span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
              {Math.round(todayEntries.reduce((s, e) => s + e.calories, 0))} cal from food
            </span>
          </div>
          {todayEntries.map((entry) => (
            <FoodEntryCard key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
          ))}
        </div>
      )}

      {/* ── Previous Days (collapsed) ────────────── */}
      {logs.filter((l) => l.date !== todayKey && l.entries.length > 0).length > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer"
          >
            Previous Days
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-3">
                  {logs
                    .filter((l) => l.date !== todayKey && l.entries.length > 0)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((log) => {
                      const dayTotal = log.entries.reduce((s, e) => s + e.calories, 0);
                      return (
                        <div key={log.date} className="border border-border bg-card p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-medium text-foreground">{log.date}</span>
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{Math.round(dayTotal)} cal</span>
                          </div>
                          {log.entries.map((e) => (
                            <div key={e.id} className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)] py-0.5">
                              <span className="truncate">{e.foodName}</span>
                              <span>{e.calories} cal</span>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              // Move this day's entries into today's log
                              setLogs((prev) => {
                                const { logs: updated } = getOrCreateToday(prev);
                                const sourceDay = updated.find((l) => l.date === log.date);
                                if (!sourceDay) return updated;
                                return updated.map((l) => {
                                  if (l.date === todayKey) {
                                    return {
                                      ...l,
                                      entries: [...l.entries, ...sourceDay.entries],
                                      vitaminsAdded: l.vitaminsAdded || sourceDay.vitaminsAdded,
                                    };
                                  }
                                  if (l.date === log.date) {
                                    return { ...l, entries: [], vitaminsAdded: false };
                                  }
                                  return l;
                                });
                              });
                            }}
                            className="mt-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors cursor-pointer"
                          >
                            <ArrowUpToLine className="w-3 h-3" />
                            Restore to Active
                          </button>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Empty State ──────────────────────────── */}
      {todayEntries.length === 0 && !capturedImage && (
        <div className="px-4 pb-4">
          <div className="border border-dashed border-border p-6 text-center">
            <Camera className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-40" />
            <p className="text-xs font-mono text-[var(--muted-foreground)]">
              No meals logged today. Tap <span className="text-[var(--primary)]">Snap Food</span> to photograph your meal.
            </p>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-6 max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-foreground font-semibold mb-2">Delete Entry?</h3>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mb-4">This food entry will be permanently removed.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEntry}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer font-bold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
