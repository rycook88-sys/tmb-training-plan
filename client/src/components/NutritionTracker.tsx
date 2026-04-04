import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Check, Edit3, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  Trash2, X, AlertTriangle, TrendingUp, Pill, Utensils, Plus, RotateCcw,
  Loader2, Sparkles, ArrowUpToLine, Zap, Bookmark, Briefcase, Coffee,
  Square, CheckSquare, Settings, BarChart3, ChefHat, Shuffle, Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DAILY_VITAMINS, getDailyVitaminTotals, loadMacroTargets, saveMacroTargets,
  ALL_MICRONUTRIENTS, formatMicroAmount, getMicroDVPercent,
} from "@/lib/vitamin-data";
import type { NumericMicro } from "@/lib/vitamin-data";

/* ── Types ─────────────────────────────────────────── */
interface FoodMicro {
  name: string;
  amount: number;  // in standard unit (same as DV reference)
  unit: string;    // "mg" | "mcg" | "g"
}

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
  micronutrients: FoodMicro[];
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

interface PresetItem {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  micronutrients: FoodMicro[];
}

interface CommonItem extends PresetItem {
  imageUrl?: string;
}

/* ── LocalStorage Helpers ──────────────────────────── */
const STORAGE_KEY = "tmb-nutrition-log";
const FEEDBACK_KEY = "tmb-nutrition-feedback";
const PRESETS_KEY = "tmb-nutrition-presets";
const COMMON_KEY = "tmb-nutrition-common";

function getTodayKey(): string {
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
  } catch { return []; }
}
function saveLogs(logs: DailyLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}
function loadFeedback(): RecommendationFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveFeedback(fb: RecommendationFeedback[]) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
}

/**
 * Build default vitamin preset items from the DAILY_VITAMINS data.
 */
function buildVitaminPresetItems(): PresetItem[] {
  return DAILY_VITAMINS.map((v, i) => ({
    id: `preset-vitamin-${i}`,
    foodName: v.name,
    calories: v.nutrients.calories,
    protein: v.nutrients.protein,
    carbs: v.nutrients.carbs,
    fat: v.nutrients.fat,
    fiber: 0,
    sugar: v.nutrients.sugars,
    sodium: v.micronutrients.find((m) => m.name === "Sodium")?.amount || 0,
    micronutrients: v.micronutrients.map((m) => ({ name: m.name, amount: m.amount, unit: m.unit })),
  }));
}

interface PresetLists {
  workDay: PresetItem[];
  offDay: PresetItem[];
}
function loadPresets(): PresetLists {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate: add vitamin presets if not already present
      const vitaminItems = buildVitaminPresetItems();
      const vitaminIds = vitaminItems.map((v) => v.id);
      const hasVitamins = parsed.workDay?.some((i: PresetItem) => vitaminIds.includes(i.id));
      if (!hasVitamins) {
        parsed.workDay = [...(parsed.workDay || []), ...vitaminItems];
        parsed.offDay = [...(parsed.offDay || []), ...vitaminItems];
      }
      return parsed;
    }
  } catch {}
  // Default presets — include vitamins
  const vitaminItems = buildVitaminPresetItems();
  return {
    workDay: [
      { id: "preset-coffee", foodName: "Black Coffee", calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5, micronutrients: [{ name: "Potassium", amount: 116, unit: "mg" }, { name: "Magnesium", amount: 7, unit: "mg" }] },
      ...vitaminItems,
    ],
    offDay: [
      { id: "preset-coffee-off", foodName: "Black Coffee", calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5, micronutrients: [{ name: "Potassium", amount: 116, unit: "mg" }, { name: "Magnesium", amount: 7, unit: "mg" }] },
      ...vitaminItems,
    ],
  };
}
function savePresets(p: PresetLists) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(p));
}

function loadCommonItems(): CommonItem[] {
  try {
    const raw = localStorage.getItem(COMMON_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCommonItems(items: CommonItem[]) {
  localStorage.setItem(COMMON_KEY, JSON.stringify(items));
}

// ── Saved Meal Plans ──────────────────────────────────────
const SAVED_PLANS_KEY = "tmb-saved-meal-plans";

interface SavedMealPlan {
  id: string;
  name: string;
  savedAt: string;
  type: "single" | "prep";
  meals: {
    name: string;
    dayLabel?: string;
    ingredients: string[];
    instructions: string;
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    keyMicros?: { name: string; percentDV: number }[];
  }[];
  summary: string;
  rating?: number; // 1-5 stars, undefined = unrated
}

function loadSavedPlans(): SavedMealPlan[] {
  try {
    const raw = localStorage.getItem(SAVED_PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveSavedPlans(plans: SavedMealPlan[]) {
  localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));
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

/**
 * Normalize micronutrients from the AI response.
 * The server now converts the fixed-object schema into an array of
 * { name, amountMg, unit } before sending to the client.
 * This function handles both the new format and any legacy data in localStorage.
 */
function normalizeMicros(aiMicros: any[]): FoodMicro[] {
  if (!Array.isArray(aiMicros)) return [];
  return aiMicros.map((m) => {
    const ref = ALL_MICRONUTRIENTS.find((r) => r.name === m.name);
    // Support both "amountMg" (from server) and "amount" (from localStorage/presets)
    let amount = typeof m.amountMg === "number" ? m.amountMg : (typeof m.amount === "number" ? m.amount : 0);
    const unit = m.unit || ref?.unit || "mg";
    return { name: m.name, amount, unit };
  });
}

/**
 * Format a timestamp for display in a consistent column.
 */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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

/* ── Micro Nutrient Progress Dropdown ─────────────── */
function MicroProgressDropdown({ microTotals }: { microTotals: Map<string, number> }) {
  const [open, setOpen] = useState(false);

  // Build a list of ALL important nutrients, showing 0% for missing ones
  const allNutrients = useMemo(() => {
    return ALL_MICRONUTRIENTS.map((ref) => {
      const amount = microTotals.get(ref.name) || 0;
      const dvPct = ref.dailyValue > 0 ? Math.round((amount / ref.dailyValue) * 100) : 0;
      return { ...ref, amount, dvPct };
    });
  }, [microTotals]);

  const trackedCount = allNutrients.filter((n) => n.amount > 0).length;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer"
      >
        <Pill className="w-3 h-3" />
        Micronutrients ({trackedCount}/{allNutrients.length})
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
            <div className="mt-2 space-y-1.5">
              {allNutrients.map((n) => (
                <div key={n.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{n.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-foreground">
                        {n.amount > 0 ? formatMicroAmount(n.name, n.amount) : "—"}
                      </span>
                      <span className={`text-[10px] font-mono w-12 text-right ${
                        n.dvPct >= 100 ? "text-green-400" :
                        n.dvPct >= 50 ? "text-yellow-400" :
                        n.dvPct > 0 ? "text-[var(--muted-foreground)]" :
                        "text-red-400/50"
                      }`}>
                        {n.dvPct}% DV
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[var(--secondary)] border border-border/50 overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{
                        backgroundColor: n.dvPct >= 100 ? "#4ade80" : n.dvPct >= 50 ? "#facc15" : n.dvPct > 0 ? "#6b7280" : "transparent",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(n.dvPct, 100)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
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

/* ── Food Detail Popup ───────────────────────────── */
function FoodDetailPopup({ entry, onClose }: { entry: FoodEntry; onClose: () => void }) {
  const nonZeroMicros = useMemo(() => {
    return entry.micronutrients
      .filter((m) => m.amount > 0)
      .map((m) => {
        const dvPct = getMicroDVPercent(m.name, m.amount);
        return { ...m, dvPct };
      })
      .sort((a, b) => b.dvPct - a.dvPct);
  }, [entry.micronutrients]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-xs font-bold text-foreground leading-relaxed">{entry.foodName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{formatTime(entry.timestamp)}</span>

            </div>
            {entry.servingEstimate && (
              <p className="text-[10px] font-mono text-[var(--muted-foreground)] italic mt-1">{entry.servingEstimate}</p>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5 flex-shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Macros */}
        <div className="border border-border bg-[var(--secondary)]/30 p-3 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--primary)] font-bold">Macros</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--muted-foreground)]">Calories</span>
              <span className="text-[var(--primary)] font-bold">{entry.calories}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--muted-foreground)]">Protein</span>
              <span className="text-blue-400">{entry.protein}g</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--muted-foreground)]">Carbs</span>
              <span className="text-amber-400">{entry.carbs}g</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--muted-foreground)]">Fat</span>
              <span className="text-rose-400">{entry.fat}g</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--muted-foreground)]">Fiber</span>
              <span className="text-foreground">{entry.fiber}g</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--muted-foreground)]">Sodium</span>
              <span className="text-foreground">{entry.sodium}mg</span>
            </div>
          </div>
        </div>

        {/* Micronutrients — only non-zero */}
        {nonZeroMicros.length > 0 && (
          <div className="border border-border bg-[var(--secondary)]/30 p-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--primary)] font-bold">
              Micronutrients ({nonZeroMicros.length})
            </span>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {nonZeroMicros.map((m) => (
                <div key={m.name} className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--muted-foreground)] truncate mr-1">{m.name}</span>
                  <span className={m.dvPct >= 100 ? "text-green-400" : m.dvPct >= 50 ? "text-yellow-400" : "text-foreground"}>
                    {m.dvPct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Edit Entry Modal ────────────────────────────── */
function EditEntryModal({ entry, onConfirm, onCancel, isLoading }: {
  entry: FoodEntry;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  // Split food name by commas, "and", or newlines for display as separate lines
  const foodItems = useMemo(() => {
    return entry.foodName
      .split(/,\s*|\s+and\s+|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [entry.foodName]);

  const [editedItems, setEditedItems] = useState<string[]>(foodItems);

  const handleItemChange = useCallback((index: number, value: string) => {
    setEditedItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAddItem = useCallback(() => {
    setEditedItems((prev) => [...prev, ""]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setEditedItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirm = useCallback(() => {
    const combined = editedItems.filter((s) => s.trim()).join(", ");
    if (combined.trim()) {
      onConfirm(combined);
    }
  }, [editedItems, onConfirm]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Edit Food</span>
          </div>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />}
        </div>

        {/* Individual food items, each on its own line */}
        <div className="space-y-2 mb-3">
          {editedItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(i, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                autoFocus={i === 0}
                className="flex-1 bg-[var(--secondary)] border border-border px-3 py-2 text-xs font-mono text-foreground focus:border-[var(--primary)] focus:outline-none"
                placeholder={`Food item ${i + 1}`}
              />
              {editedItems.length > 1 && (
                <button onClick={() => handleRemoveItem(i)}
                  className="text-[var(--muted-foreground)] hover:text-red-400 p-1 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleAddItem}
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors mb-4">
          <Plus className="w-3 h-3" /> Add Item
        </button>

        <p className="text-[10px] font-mono text-[var(--muted-foreground)] mb-3">
          Edit names and confirm — AI will re-estimate all nutrients.
        </p>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading}
            className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
            {isLoading ? "Analyzing..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Food Entry Card (with tap-to-detail + edit + timestamp column) ── */
function FoodEntryCard({ entry, onDelete, onEdit, onTap }: {
  entry: FoodEntry;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onTap: (entry: FoodEntry) => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const DELETE_THRESHOLD = -80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startX;
    setSwipeX(Math.min(0, diff)); // only left swipe
  };
  const handleTouchEnd = () => {
    setSwiping(false);
    if (swipeX < DELETE_THRESHOLD) {
      onDelete(entry.id);
    }
    setSwipeX(0);
  };

  return (
    <div className="relative mb-2 overflow-hidden">
      {/* Delete background revealed on swipe */}
      <div className="absolute inset-0 flex items-center justify-end bg-red-500/20 pr-4">
        <Trash2 className="w-4 h-4 text-red-400" />
      </div>
      {/* Swipeable card */}
      <div
        className="border border-border bg-card p-3 cursor-pointer hover:border-[var(--primary)]/30 transition-colors relative"
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? "none" : "transform 0.2s ease-out" }}
        onClick={() => { if (Math.abs(swipeX) < 5) onTap(entry); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start gap-2">
          {/* Main content — tappable */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Utensils className="w-3 h-3 text-[var(--primary)] flex-shrink-0" />
              <span className="font-mono text-xs font-medium text-foreground truncate">{entry.foodName}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] font-mono">
              <span className="text-[var(--primary)]">{entry.calories} cal</span>
              <span className="text-blue-400">P: {entry.protein}g</span>
              <span className="text-amber-400">C: {entry.carbs}g</span>
              <span className="text-rose-400">F: {entry.fat}g</span>
            </div>
          </div>

          {/* Right column: timestamp + actions, vertically aligned */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[10px] font-mono text-[var(--muted-foreground)] tabular-nums">{formatTime(entry.timestamp)}</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(entry.id); }}
                className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors p-1"
                title="Edit food entry"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                className="text-[var(--muted-foreground)] hover:text-red-400 transition-colors p-1"
                title="Delete entry"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
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
    : rec.severity === "warning" ? "text-amber-400" : "text-blue-400";

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
            className={`p-1 transition-colors ${existingFeedback?.thumbsUp === true ? "text-green-400" : "text-[var(--muted-foreground)] hover:text-green-400"}`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onFeedback(rec.id, false)}
            className={`p-1 transition-colors ${existingFeedback?.thumbsUp === false ? "text-red-400" : "text-[var(--muted-foreground)] hover:text-red-400"}`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ██  Main NutritionTracker Component
   ══════════════════════════════════════════════════════ */
export default function NutritionTracker({ embedded = false }: { embedded?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>(loadLogs);
  const [feedback, setFeedback] = useState<RecommendationFeedback[]>(loadFeedback);
  const [presets, setPresets] = useState<PresetLists>(loadPresets);
  const [commonItems, setCommonItems] = useState<CommonItem[]>(loadCommonItems);
  const [backupStatus, setBackupStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [macroTargets, setMacroTargets] = useState(loadMacroTargets);
  const [showTargetSettings, setShowTargetSettings] = useState(false);
  const [tempTargets, setTempTargets] = useState(loadMacroTargets);

  // UI state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedMime, setCapturedMime] = useState<string>("image/jpeg");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showTrends, setShowTrends] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showFillMacros, setShowFillMacros] = useState(false);
  const [fillMacrosSuggestions, setFillMacrosSuggestions] = useState<any>(null);

  // Food detail popup
  const [detailEntry, setDetailEntry] = useState<FoodEntry | null>(null);

  // Edit entry modal
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  // Presets & Common Items panels
  const [showPresetsPanel, setShowPresetsPanel] = useState(false);
  const [activePresetTab, setActivePresetTab] = useState<"workDay" | "offDay">("workDay");
  const [showCommonPanel, setShowCommonPanel] = useState(false);
  const [commonSelected, setCommonSelected] = useState<Set<string>>(new Set());
  const [addingToPreset, setAddingToPreset] = useState<"workDay" | "offDay" | null>(null);
  const [addingToCommon, setAddingToCommon] = useState(false);
  const [editingPresetItem, setEditingPresetItem] = useState<{ tab: "workDay" | "offDay"; item: PresetItem } | null>(null);
  const [editingCommonItem, setEditingCommonItem] = useState<CommonItem | null>(null);
  const [editItemName, setEditItemName] = useState("");

  // Weekly chart popup
  const [showWeeklyChart, setShowWeeklyChart] = useState(false);

  // Meal planner wizard
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [mealPlanType, setMealPlanType] = useState<"single" | "prep">("single");
  const [mealPrepDays, setMealPrepDays] = useState(3);
  const [mealStyle, setMealStyle] = useState<string>("");
  const [mealSurpriseMe, setMealSurpriseMe] = useState(false);
  const [mealNotes, setMealNotes] = useState("");
  const [mealPlanResult, setMealPlanResult] = useState<any>(null);
  const [isMealPlanning, setIsMealPlanning] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>(() => loadSavedPlans());
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetFileRef = useRef<HTMLInputElement>(null);
  const commonFileRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const analyzeMutation = trpc.nutrition.analyzePhoto.useMutation();
  const reAnalyzeMutation = trpc.nutrition.reAnalyze.useMutation();
  const trendsMutation = trpc.nutrition.getTrends.useMutation();
  const fillMacrosMutation = trpc.nutrition.fillMyMacros.useMutation();
  const backupMutation = trpc.nutrition.backup.useMutation();
  const mealPlanMutation = trpc.nutrition.planMeal.useMutation();

  // Restore from server on mount if localStorage is empty and user is logged in
  const restoreQuery = trpc.nutrition.restore.useQuery(undefined, {
    enabled: isAuthenticated && logs.length === 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (restoreQuery.data && logs.length === 0) {
      const b = restoreQuery.data.backups;
      let restored = false;
      if (b.foodLog) {
        try {
          const parsed = JSON.parse(b.foodLog);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLogs(parsed);
            saveLogs(parsed);
            restored = true;
          }
        } catch {}
      }
      if (b.presets) {
        try {
          const parsed = JSON.parse(b.presets);
          if (parsed.workDay || parsed.offDay) {
            setPresets(parsed);
            savePresets(parsed);
            restored = true;
          }
        } catch {}
      }
      if (b.commonItems) {
        try {
          const parsed = JSON.parse(b.commonItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCommonItems(parsed);
            saveCommonItems(parsed);
            restored = true;
          }
        } catch {}
      }
      if (b.savedMealPlans) {
        try {
          const parsed = JSON.parse(b.savedMealPlans);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedPlans(parsed);
            saveSavedPlans(parsed);
            restored = true;
          }
        } catch {}
      }
      if (restored) {
        setBackupStatus("synced");
        console.log("[Backup] Restored nutrition data from server");
      }
    }
  }, [restoreQuery.data]);

  // Background backup: debounced sync to server after any data change
  const backupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doBackup = useCallback(() => {
    if (!isAuthenticated) return;
    setBackupStatus("syncing");
    backupMutation.mutate(
      {
        data: [
          { dataType: "foodLog", jsonData: JSON.stringify(logs) },
          { dataType: "presets", jsonData: JSON.stringify(presets) },
          { dataType: "commonItems", jsonData: JSON.stringify(commonItems) },
          { dataType: "savedMealPlans", jsonData: JSON.stringify(savedPlans) },
        ],
      },
      {
        onSuccess: () => {
          setBackupStatus("synced");
          console.log("[Backup] Nutrition data backed up to server");
        },
        onError: () => {
          setBackupStatus("error");
          console.warn("[Backup] Failed to backup nutrition data");
        },
      }
    );
  }, [isAuthenticated, logs, presets, commonItems, savedPlans, backupMutation]);

  // Trigger backup 5 seconds after any data change
  useEffect(() => {
    if (!isAuthenticated) return;
    if (backupTimerRef.current) clearTimeout(backupTimerRef.current);
    backupTimerRef.current = setTimeout(doBackup, 5000);
    return () => { if (backupTimerRef.current) clearTimeout(backupTimerRef.current); };
  }, [logs, presets, commonItems, savedPlans, isAuthenticated]);

  // Persist to localStorage
  useEffect(() => { saveLogs(logs); }, [logs]);
  useEffect(() => { saveFeedback(feedback); }, [feedback]);
  useEffect(() => { savePresets(presets); }, [presets]);
  useEffect(() => { saveCommonItems(commonItems); }, [commonItems]);
  useEffect(() => { saveSavedPlans(savedPlans); }, [savedPlans]);

  // Today's data
  const todayKey = getTodayKey();
  const todayLog = useMemo(() => logs.find((l) => l.date === todayKey), [logs, todayKey]);
  const todayEntries = todayLog?.entries || [];
  const vitaminsAdded = todayLog?.vitaminsAdded || false;

  // Calculate totals
  const vitaminTotals = useMemo(() => getDailyVitaminTotals(), []);

  const dailyTotals = useMemo(() => {
    let cal = 0, prot = 0, carb = 0, fat = 0, fiber = 0, sugar = 0, sodium = 0;
    for (const e of todayEntries) {
      cal += e.calories; prot += e.protein; carb += e.carbs;
      fat += e.fat; fiber += e.fiber; sugar += e.sugar; sodium += e.sodium;
    }
    if (vitaminsAdded) {
      cal += vitaminTotals.calories; prot += vitaminTotals.protein;
      carb += vitaminTotals.carbs; fat += vitaminTotals.fat;
    }
    return { calories: cal, protein: prot, carbs: carb, fat, fiber, sugar, sodium };
  }, [todayEntries, vitaminsAdded, vitaminTotals]);

  // Combine ALL micronutrients — numeric totals only
  const dailyMicroTotals = useMemo(() => {
    const map = new Map<string, number>();
    // Food entries
    for (const e of todayEntries) {
      for (const m of e.micronutrients) {
        if (typeof m.amount === "number" && m.amount > 0) {
          map.set(m.name, (map.get(m.name) || 0) + m.amount);
        }
      }
    }
    // Add sodium from food entries
    if (dailyTotals.sodium > 0) {
      map.set("Sodium", (map.get("Sodium") || 0));
      // Sodium is already tracked via micronutrients from AI, don't double-count
    }
    // Vitamins
    if (vitaminsAdded) {
      for (const [name, amount] of Array.from(vitaminTotals.micronutrients)) {
        map.set(name, (map.get(name) || 0) + amount);
      }
    }
    return map;
  }, [todayEntries, vitaminsAdded, vitaminTotals, dailyTotals.sodium]);

  const daysWithFood = useMemo(() => logs.filter((l) => l.entries.length > 0).length, [logs]);

  // Weekly chart data — last 7 days
  const weeklyChartData = useMemo(() => {
    const days: { date: string; label: string; calories: number; protein: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayLog = logs.find((l) => l.date === key);
      let cal = 0, prot = 0;
      if (dayLog) {
        for (const e of dayLog.entries) { cal += e.calories; prot += e.protein; }
        if (dayLog.vitaminsAdded) { const vt = getDailyVitaminTotals(); cal += vt.calories; prot += vt.protein; }
      }
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      days.push({ date: key, label: dayNames[d.getDay()], calories: Math.round(cal), protein: Math.round(prot) });
    }
    return days;
  }, [logs]);

  /* ── Camera / File Capture ─────────────────────── */
  const handleCapture = useCallback(() => { fileInputRef.current?.click(); }, []);

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
      try {
        const result = await analyzeMutation.mutateAsync({ imageBase64: base64, mimeType: mime });
        setAnalysisResult(result);
        setEditedName(result.foodName);
      } catch (err) {
        console.error("Food analysis failed:", err);
      }
    };
    reader.readAsDataURL(file);
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
        setAnalysisResult((prev: any) => ({ ...prev, ...result, foodName: editedName.trim() }));
      } catch (err) { console.error("Re-analysis failed:", err); }
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
      micronutrients: normalizeMicros(analysisResult.micronutrients),
      confirmed: true,
    };
    setLogs((prev) => {
      const { logs: updated } = getOrCreateToday(prev);
      return updated.map((l) => l.date === todayKey ? { ...l, entries: [...l.entries, entry] } : l);
    });
    setCapturedImage(null);
    setAnalysisResult(null);
    setEditingName(false);
  }, [analysisResult, editedName, todayKey]);

  /* ── Delete Entry ──────────────────────────────── */
  const handleDeleteEntry = useCallback((id: string) => { setConfirmDelete(id); }, []);
  const confirmDeleteEntry = useCallback(() => {
    if (!confirmDelete) return;
    setLogs((prev) => prev.map((l) =>
      l.date === todayKey ? { ...l, entries: l.entries.filter((e) => e.id !== confirmDelete) } : l
    ));
    setConfirmDelete(null);
  }, [confirmDelete, todayKey]);

  /* ── Edit Existing Food Entry (modal) ──────────── */
  const handleStartEditEntry = useCallback((id: string) => {
    const entry = todayEntries.find((e) => e.id === id);
    if (!entry) return;
    setEditingEntry(entry);
  }, [todayEntries]);

  const handleConfirmEditEntry = useCallback(async (newName: string) => {
    if (!editingEntry) return;
    if (newName.trim() === editingEntry.foodName) {
      setEditingEntry(null);
      return;
    }
    try {
      const result = await reAnalyzeMutation.mutateAsync({
        foodName: newName.trim(),
        servingEstimate: editingEntry.servingEstimate,
      });
      setLogs((prev) => prev.map((l) =>
        l.date === todayKey ? {
          ...l,
          entries: l.entries.map((e) => e.id === editingEntry.id ? {
            ...e,
            foodName: newName.trim(),
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            fiber: result.fiber || 0,
            sugar: result.sugar || 0,
            sodium: result.sodium || 0,
            micronutrients: normalizeMicros(result.micronutrients),
            confidence: result.confidence,
            servingEstimate: result.servingEstimate,
          } : e),
        } : l
      ));
    } catch (err) { console.error("Edit re-analysis failed:", err); }
    setEditingEntry(null);
  }, [editingEntry, todayKey, reAnalyzeMutation]);

  /* ── Add Daily Vitamins ────────────────────────── */
  const handleAddVitamins = useCallback(() => {
    setLogs((prev) => {
      const { logs: updated } = getOrCreateToday(prev);
      return updated.map((l) => l.date === todayKey ? { ...l, vitaminsAdded: true } : l);
    });
  }, [todayKey]);

  /* ── Presets: Add all items from a preset list ─── */
  const handleApplyPreset = useCallback((list: "workDay" | "offDay") => {
    const items = presets[list];
    if (items.length === 0) return;
    const newEntries: FoodEntry[] = items.map((item) => ({
      ...item,
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      imageUrl: undefined,
      confidence: "preset",
      servingEstimate: "",
      confirmed: true,
    }));
    setLogs((prev) => {
      const { logs: updated } = getOrCreateToday(prev);
      return updated.map((l) =>
        l.date === todayKey ? { ...l, entries: [...l.entries, ...newEntries] } : l
      );
    });
    setShowPresetsPanel(false);
  }, [presets, todayKey]);

  /* ── Presets: Add item via photo ────────────────── */
  const handlePresetPhotoCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !addingToPreset) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      try {
        const result = await analyzeMutation.mutateAsync({ imageBase64: base64, mimeType: file.type || "image/jpeg" });
        const newItem: PresetItem = {
          id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          foodName: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber || 0,
          sugar: result.sugar || 0,
          sodium: result.sodium || 0,
          micronutrients: normalizeMicros(result.micronutrients),
        };
        setPresets((prev) => ({
          ...prev,
          [addingToPreset]: [...prev[addingToPreset], newItem],
        }));
      } catch (err) { console.error("Preset photo analysis failed:", err); }
      setAddingToPreset(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [addingToPreset, analyzeMutation]);

  /* ── Common Items: Add via photo ───────────────── */
  const handleCommonPhotoCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      try {
        const result = await analyzeMutation.mutateAsync({ imageBase64: base64, mimeType: file.type || "image/jpeg" });
        const newItem: CommonItem = {
          id: `common-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          foodName: result.foodName,
          imageUrl: result.imageUrl,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber || 0,
          sugar: result.sugar || 0,
          sodium: result.sodium || 0,
          micronutrients: normalizeMicros(result.micronutrients),
        };
        setCommonItems((prev) => [...prev, newItem]);
      } catch (err) { console.error("Common item photo analysis failed:", err); }
      setAddingToCommon(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [analyzeMutation]);

  /* ── Common Items: Post selected ───────────────── */
  const handlePostCommonItems = useCallback(() => {
    const selected = commonItems.filter((item) => commonSelected.has(item.id));
    if (selected.length === 0) return;
    const newEntries: FoodEntry[] = selected.map((item) => ({
      ...item,
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      confidence: "common",
      servingEstimate: "",
      confirmed: true,
    }));
    setLogs((prev) => {
      const { logs: updated } = getOrCreateToday(prev);
      return updated.map((l) =>
        l.date === todayKey ? { ...l, entries: [...l.entries, ...newEntries] } : l
      );
    });
    setCommonSelected(new Set());
    setShowCommonPanel(false);
  }, [commonItems, commonSelected, todayKey]);

  /* ── Fetch Trends (manual override: skip 3-day minimum) ── */
  const handleFetchTrends = useCallback(async () => {
    setShowTrends(true);
    const recentLogs = logs.filter((l) => l.entries.length > 0).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    if (recentLogs.length === 0) { setRecommendations([]); return; }
    const dailyLogs = recentLogs.map((l) => {
      let cal = 0, prot = 0, carb = 0, fat = 0, fiber = 0, sodium = 0;
      for (const e of l.entries) { cal += e.calories; prot += e.protein; carb += e.carbs; fat += e.fat; fiber += e.fiber; sodium += e.sodium; }
      if (l.vitaminsAdded) { const vt = getDailyVitaminTotals(); cal += vt.calories; prot += vt.protein; carb += vt.carbs; fat += vt.fat; }
      return { date: l.date, totalCalories: cal, totalProtein: prot, totalCarbs: carb, totalFat: fat, totalFiber: fiber, totalSodium: sodium };
    });
    try {
      const result = await trendsMutation.mutateAsync({ dailyLogs, targets: macroTargets });
      setRecommendations(result.recommendations || []);
    } catch (err) { console.error("Trends fetch failed:", err); setRecommendations([]); }
  }, [logs, trendsMutation]);

  /* ── Fill My Macros ────────────────────────────── */
  const handleFillMacros = useCallback(async () => {
    setShowFillMacros(true);
    const hour = new Date().getHours();
    const timeOfDay = hour < 11 ? "morning" : hour < 15 ? "afternoon" : hour < 19 ? "evening" : "night";
    // Compute micronutrient gaps from dailyMicroTotals
    const microGaps: { name: string; currentPercent: number }[] = [];
    for (const micro of ALL_MICRONUTRIENTS) {
      const current = dailyMicroTotals.get(micro.name) || 0;
      const pct = micro.dailyValue > 0 ? Math.round((current / micro.dailyValue) * 100) : 100;
      microGaps.push({ name: micro.name, currentPercent: pct });
    }
    try {
      const result = await fillMacrosMutation.mutateAsync({
        remainingCalories: Math.max(macroTargets.calories - dailyTotals.calories, 0),
        remainingProtein: Math.max(macroTargets.protein - dailyTotals.protein, 0),
        remainingCarbs: Math.max(macroTargets.carbs - dailyTotals.carbs, 0),
        remainingFat: Math.max(macroTargets.fat - dailyTotals.fat, 0),
        timeOfDay,
        daysTracked: daysWithFood,
        microGaps,
      });
      setFillMacrosSuggestions(result);
    } catch (err) { console.error("Fill macros failed:", err); setFillMacrosSuggestions(null); }
  }, [dailyTotals, dailyMicroTotals, daysWithFood, fillMacrosMutation, macroTargets]);

  /* ── Feedback ──────────────────────────────────── */
  const handleFeedback = useCallback((id: string, thumbsUp: boolean) => {
    setFeedback((prev) => {
      const existing = prev.findIndex((f) => f.id === id);
      const entry: RecommendationFeedback = { id, thumbsUp, timestamp: Date.now() };
      if (existing >= 0) { const updated = [...prev]; updated[existing] = entry; return updated; }
      return [...prev, entry];
    });
  }, []);

  const handleCancelCapture = useCallback(() => {
    setCapturedImage(null); setAnalysisResult(null); setEditingName(false);
  }, []);

  const isAnalyzing = analyzeMutation.isPending;
  const isReAnalyzing = reAnalyzeMutation.isPending;
  const isTrendLoading = trendsMutation.isPending;
  const isFillMacrosLoading = fillMacrosMutation.isPending;

  return (
    <div className={embedded ? "" : "container py-6"}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={presetFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePresetPhotoCapture} />
      <input ref={commonFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCommonPhotoCapture} />

      {/* ── Header Stats ─────────────────────────── */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Today's Nutrition</span>
              <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{todayKey}</span>
              <button onClick={() => { setTempTargets({ ...macroTargets }); setShowTargetSettings(true); }}
                className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors p-0.5" title="Adjust macro targets">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Big calorie display — right-aligned, loud */}
          <div className="text-right">
            <div className={`font-mono text-3xl font-black leading-none tracking-tight ${dailyTotals.calories > macroTargets.calories ? "text-red-400" : "text-[var(--primary)]"}`}>
              {Math.round(dailyTotals.calories)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mt-0.5">
              / {macroTargets.calories} cal
            </div>

          </div>
        </div>

        <MacroBar label="Calories" current={dailyTotals.calories} target={macroTargets.calories} color="oklch(0.7 0.18 55)" unit=" cal" />
        <MacroBar label="Protein" current={dailyTotals.protein} target={macroTargets.protein} color="oklch(0.65 0.15 250)" />
        <MacroBar label="Carbs" current={dailyTotals.carbs} target={macroTargets.carbs} color="oklch(0.7 0.15 85)" />
        <MacroBar label="Fat" current={dailyTotals.fat} target={macroTargets.fat} color="oklch(0.7 0.15 15)" />

        {/* Daily Micronutrients — progress bars for ALL nutrients */}
        <MicroProgressDropdown microTotals={dailyMicroTotals} />
      </div>

      {/* ── Action Buttons ───────────────────────── */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <button onClick={handleCapture} disabled={isAnalyzing}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
          <Camera className="w-4 h-4" /> Snap Food
        </button>

        {/* Daily Presets button */}
        <button onClick={() => setShowPresetsPanel(!showPresetsPanel)}
          className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
          <Coffee className="w-3.5 h-3.5" /> Daily Items
        </button>

        {/* Common Items button */}
        <button onClick={() => setShowCommonPanel(!showCommonPanel)}
          className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
          <Bookmark className="w-3.5 h-3.5" /> Common
        </button>

        <button onClick={handleFetchTrends} disabled={isTrendLoading}
          className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-50">
          <TrendingUp className="w-3.5 h-3.5" /> {isTrendLoading ? "Analyzing..." : "Trends"}
        </button>

        <button onClick={handleFillMacros} disabled={isFillMacrosLoading}
          className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-50">
          <Zap className="w-3.5 h-3.5" /> {isFillMacrosLoading ? "Thinking..." : "Fill My Gaps"}
        </button>

        <button onClick={() => setShowWeeklyChart(true)}
          className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
          <BarChart3 className="w-3.5 h-3.5" /> Weekly
        </button>

        <button onClick={() => { setShowMealPlanner(true); setMealPlanResult(null); setMealPlanType("single"); setMealStyle(""); setMealSurpriseMe(false); setMealNotes(""); setMealPrepDays(3); }}
          className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
          <ChefHat className="w-3.5 h-3.5" /> Plan Meal
        </button>

        {savedPlans.length > 0 && (
          <button onClick={() => { setShowSavedPlans(true); setExpandedPlanId(null); }}
            className="flex items-center gap-2 border border-border px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
            <Bookmark className="w-3.5 h-3.5" /> Saved ({savedPlans.length})
          </button>
        )}
      </div>

      {/* ── Daily Presets Panel ──────────────────── */}
      <AnimatePresence>
        {showPresetsPanel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-3 border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Daily Items</span>
                <button onClick={() => setShowPresetsPanel(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                <button onClick={() => setActivePresetTab("workDay")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${activePresetTab === "workDay" ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50" : "border border-border text-[var(--muted-foreground)] hover:text-foreground"}`}>
                  <Briefcase className="w-3 h-3" /> Work Day
                </button>
                <button onClick={() => setActivePresetTab("offDay")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${activePresetTab === "offDay" ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50" : "border border-border text-[var(--muted-foreground)] hover:text-foreground"}`}>
                  <Coffee className="w-3 h-3" /> Off Day
                </button>
              </div>

              {/* Preset items */}
              {presets[activePresetTab].length === 0 && (
                <p className="text-[10px] font-mono text-[var(--muted-foreground)] text-center py-3">No items yet. Snap a photo to add one.</p>
              )}
              {presets[activePresetTab].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="cursor-pointer" onClick={() => setDetailEntry({
                    id: item.id, foodName: item.foodName, timestamp: Date.now(),
                    calories: item.calories, protein: item.protein, carbs: item.carbs,
                    fat: item.fat, fiber: item.fiber, sugar: item.sugar, sodium: item.sodium,
                    micronutrients: item.micronutrients, confidence: "preset", servingEstimate: "", confirmed: true,
                  })}>
                    <span className="text-[11px] font-mono text-foreground">{item.foodName}</span>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] ml-2">{item.calories} cal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingPresetItem({ tab: activePresetTab, item }); }} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] p-0.5"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => {
                      setPresets((prev) => ({
                        ...prev,
                        [activePresetTab]: prev[activePresetTab].filter((i) => i.id !== item.id),
                      }));
                    }} className="text-[var(--muted-foreground)] hover:text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setAddingToPreset(activePresetTab); presetFileRef.current?.click(); }}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-border text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-50">
                  <Camera className="w-3 h-3" /> {isAnalyzing && addingToPreset ? "Analyzing..." : "Add Item"}
                </button>
                <button onClick={() => handleApplyPreset(activePresetTab)}
                  disabled={presets[activePresetTab].length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90 disabled:opacity-50">
                  <Plus className="w-3 h-3" /> Log All ({presets[activePresetTab].length})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Common Items Panel ──────────────────── */}
      <AnimatePresence>
        {showCommonPanel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-3 border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Common Items</span>
                <button onClick={() => setShowCommonPanel(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>

              {commonItems.length === 0 && (
                <p className="text-[10px] font-mono text-[var(--muted-foreground)] text-center py-3">No common items saved. Snap a photo to add one.</p>
              )}

              {commonItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <button onClick={() => {
                    setCommonSelected((prev) => {
                      const next = new Set(prev);
                      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                      return next;
                    });
                  }} className="flex-shrink-0">
                    {commonSelected.has(item.id) ? <CheckSquare className="w-4 h-4 text-[var(--primary)]" /> : <Square className="w-4 h-4 text-[var(--muted-foreground)]" />}
                  </button>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailEntry({
                    id: item.id, foodName: item.foodName, timestamp: Date.now(),
                    calories: item.calories, protein: item.protein, carbs: item.carbs,
                    fat: item.fat, fiber: item.fiber, sugar: item.sugar, sodium: item.sodium,
                    micronutrients: item.micronutrients, confidence: "common", servingEstimate: "", confirmed: true,
                  })}>
                    <span className="text-[11px] font-mono text-foreground truncate block">{item.foodName}</span>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                      {item.calories} cal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCommonItem(item); }} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] p-0.5"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => setCommonItems((prev) => prev.filter((i) => i.id !== item.id))}
                      className="text-[var(--muted-foreground)] hover:text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-3">
                <button onClick={() => { setAddingToCommon(true); commonFileRef.current?.click(); }}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-border text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-50">
                  <Camera className="w-3 h-3" /> {isAnalyzing && addingToCommon ? "Analyzing..." : "Add Item"}
                </button>
                {commonSelected.size > 0 && (
                  <button onClick={handlePostCommonItems}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90">
                    <Plus className="w-3 h-3" /> Log Selected ({commonSelected.size})
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo Analysis Panel ─────────────────── */}
      <AnimatePresence>
        {capturedImage && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-3 border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
              <div className="flex items-start gap-3">
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
                      <div className="flex items-center gap-2 mb-1">
                        {editingName ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input ref={nameInputRef} type="text" value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleNameConfirm()}
                              className="flex-1 bg-[var(--secondary)] border border-border px-2 py-1 text-xs font-mono text-foreground focus:border-[var(--primary)] focus:outline-none" />
                            <button onClick={handleNameConfirm} className="text-green-400 hover:text-green-300 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingName(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-xs font-bold text-foreground truncate">
                              {isReAnalyzing ? "Re-analyzing..." : (editedName || analysisResult.foodName)}
                            </span>
                            <button onClick={handleEditName} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] p-0.5 flex-shrink-0"><Edit3 className="w-3 h-3" /></button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {analysisResult.confidence === "low" && (
                          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 text-red-400 bg-red-400/10">⚠ low confidence</span>
                        )}
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)] italic">{analysisResult.servingEstimate}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono mb-2">
                        <span className="text-[var(--primary)] font-bold">{analysisResult.calories} cal</span>
                        <span className="text-blue-400">P: {analysisResult.protein}g</span>
                        <span className="text-amber-400">C: {analysisResult.carbs}g</span>
                        <span className="text-rose-400">F: {analysisResult.fat}g</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleConfirmFood} disabled={isReAnalyzing}
                          className="flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                        <button onClick={handleCancelCapture}
                          className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors">
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-3 border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Nutrition Insights</span>
                </div>
                <button onClick={() => setShowTrends(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>
              {isTrendLoading && (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">Analyzing your data...</span>
                </div>
              )}
              {!isTrendLoading && recommendations.length === 0 && (
                <div className="py-3 text-center">
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">
                    {daysWithFood === 0 ? "No food data yet — log some meals first" : "Looking good — no issues to flag"}
                  </span>
                </div>
              )}
              {!isTrendLoading && recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} onFeedback={handleFeedback} existingFeedback={feedback.find((f) => f.id === rec.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fill My Macros Panel ──────────────────── */}
      <AnimatePresence>
        {showFillMacros && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-3 border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Fill My Gaps</span>
                </div>
                <button onClick={() => setShowFillMacros(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>
              {isFillMacrosLoading && (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">Finding foods to fill your gaps...</span>
                </div>
              )}
              {!isFillMacrosLoading && fillMacrosSuggestions && (
                <>
                  {fillMacrosSuggestions.suggestions?.length === 0 && (
                    <p className="text-xs font-mono text-[var(--muted-foreground)] py-2">You're on track — no big gaps to fill!</p>
                  )}
                  {fillMacrosSuggestions.suggestions?.map((s: any, i: number) => (
                    <div key={i} className="border border-border p-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-foreground">{s.foodName}</span>
                        <span className="text-[10px] font-mono text-[var(--primary)]">{s.calories} cal</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] italic">{s.portion}</span>
                      <div className="flex gap-3 mt-1 text-[10px] font-mono">
                        <span className="text-blue-400">P: {s.protein}g</span>
                        <span className="text-amber-400">C: {s.carbs}g</span>
                        <span className="text-rose-400">F: {s.fat}g</span>
                      </div>
                      {s.keyMicros && s.keyMicros.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {s.keyMicros.map((m: { name: string; percentDV: number }, mi: number) => (
                            <span key={mi} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono">
                              {m.name} {m.percentDV}%
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{s.reason}</p>
                    </div>
                  ))}
                  {fillMacrosSuggestions.summary && (
                    <p className="text-[10px] font-mono text-[var(--muted-foreground)] italic mt-1">{fillMacrosSuggestions.summary}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Today's Food Log ─────────────────────── */}
      {todayEntries.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Today's Meals ({todayEntries.length})</span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{Math.round(todayEntries.reduce((s, e) => s + e.calories, 0))} cal from food</span>
          </div>
          {todayEntries.map((entry) => (
            <FoodEntryCard
              key={entry.id}
              entry={entry}
              onDelete={handleDeleteEntry}
              onEdit={handleStartEditEntry}
              onTap={(e) => setDetailEntry(e)}
            />
          ))}
        </div>
      )}

      {/* ── Previous Days ────────────────────────── */}
      {logs.filter((l) => l.date !== todayKey && l.entries.length > 0).length > 0 && (
        <div className="px-4 pb-3">
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer">
            Previous Days
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-2 space-y-3">
                  {logs.filter((l) => l.date !== todayKey && l.entries.length > 0).sort((a, b) => b.date.localeCompare(a.date)).map((log) => {
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
                        <button onClick={() => {
                          setLogs((prev) => {
                            const { logs: updated } = getOrCreateToday(prev);
                            const sourceDay = updated.find((l) => l.date === log.date);
                            if (!sourceDay) return updated;
                            return updated.map((l) => {
                              if (l.date === todayKey) return { ...l, entries: [...l.entries, ...sourceDay.entries], vitaminsAdded: l.vitaminsAdded || sourceDay.vitaminsAdded };
                              if (l.date === log.date) return { ...l, entries: [], vitaminsAdded: false };
                              return l;
                            });
                          });
                        }}
                          className="mt-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors cursor-pointer">
                          <ArrowUpToLine className="w-3 h-3" /> Restore to Active
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

      {/* ── Food Detail Popup ────────────────────── */}
      <AnimatePresence>
        {detailEntry && (
          <FoodDetailPopup entry={detailEntry} onClose={() => setDetailEntry(null)} />
        )}
      </AnimatePresence>

      {/* ── Edit Entry Modal ─────────────────────── */}
      <AnimatePresence>
        {editingEntry && (
          <EditEntryModal
            entry={editingEntry}
            onConfirm={handleConfirmEditEntry}
            onCancel={() => setEditingEntry(null)}
            isLoading={isReAnalyzing}
          />
        )}
      </AnimatePresence>

      {/* ── Edit Preset Item Modal ─────────────── */}
      <AnimatePresence>
        {editingPresetItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setEditingPresetItem(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-[var(--primary)] font-bold mb-3">Edit Preset Item</h3>
              <textarea
                className="w-full bg-[var(--secondary)] border border-border text-foreground text-xs font-mono p-3 min-h-[80px] resize-none focus:outline-none focus:border-[var(--primary)]"
                defaultValue={editingPresetItem.item.foodName}
                onChange={(e) => setEditItemName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditingPresetItem(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer">Cancel</button>
                <button
                  disabled={isReAnalyzing}
                  onClick={async () => {
                    const name = editItemName.trim() || editingPresetItem.item.foodName;
                    if (name === editingPresetItem.item.foodName) { setEditingPresetItem(null); return; }
                    try {
                      const result = await reAnalyzeMutation.mutateAsync({ foodName: name, servingEstimate: "" });
                      const updated: PresetItem = {
                        ...editingPresetItem.item,
                        foodName: name,
                        calories: result.calories, protein: result.protein, carbs: result.carbs,
                        fat: result.fat, fiber: result.fiber || 0, sugar: result.sugar || 0, sodium: result.sodium || 0,
                        micronutrients: normalizeMicros(result.micronutrients),
                      };
                      setPresets((prev) => ({
                        ...prev,
                        [editingPresetItem.tab]: prev[editingPresetItem.tab].map((i) => i.id === editingPresetItem.item.id ? updated : i),
                      }));
                    } catch (err) { console.error("Preset edit failed:", err); }
                    setEditingPresetItem(null);
                  }}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer">
                  {isReAnalyzing ? "Analyzing..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Common Item Modal ─────────────── */}
      <AnimatePresence>
        {editingCommonItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setEditingCommonItem(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-[var(--primary)] font-bold mb-3">Edit Common Item</h3>
              <textarea
                className="w-full bg-[var(--secondary)] border border-border text-foreground text-xs font-mono p-3 min-h-[80px] resize-none focus:outline-none focus:border-[var(--primary)]"
                defaultValue={editingCommonItem.foodName}
                onChange={(e) => setEditItemName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditingCommonItem(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer">Cancel</button>
                <button
                  disabled={isReAnalyzing}
                  onClick={async () => {
                    const name = editItemName.trim() || editingCommonItem.foodName;
                    if (name === editingCommonItem.foodName) { setEditingCommonItem(null); return; }
                    try {
                      const result = await reAnalyzeMutation.mutateAsync({ foodName: name, servingEstimate: "" });
                      setCommonItems((prev) => prev.map((i) => i.id === editingCommonItem.id ? {
                        ...i,
                        foodName: name,
                        calories: result.calories, protein: result.protein, carbs: result.carbs,
                        fat: result.fat, fiber: result.fiber || 0, sugar: result.sugar || 0, sodium: result.sodium || 0,
                        micronutrients: normalizeMicros(result.micronutrients),
                      } : i));
                    } catch (err) { console.error("Common item edit failed:", err); }
                    setEditingCommonItem(null);
                  }}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer">
                  {isReAnalyzing ? "Analyzing..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Macro Targets Settings Modal ─────── */}
      <AnimatePresence>
        {showTargetSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowTargetSettings(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Macro Targets</h3>
                <button onClick={() => setShowTargetSettings(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {(["calories", "protein", "carbs", "fat"] as const).map((key) => {
                  const label = key.charAt(0).toUpperCase() + key.slice(1);
                  const unit = key === "calories" ? "cal" : "g";
                  const step = key === "calories" ? 50 : 5;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] w-20">{label}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setTempTargets((p) => ({ ...p, [key]: Math.max(0, p[key] - step) }))}
                          className="w-7 h-7 flex items-center justify-center border border-border text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors font-mono text-sm font-bold cursor-pointer">−</button>
                        <input
                          type="number"
                          value={tempTargets[key]}
                          onChange={(e) => setTempTargets((p) => ({ ...p, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                          className="w-16 text-center bg-[var(--secondary)] border border-border text-foreground text-xs font-mono py-1 focus:outline-none focus:border-[var(--primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-6">{unit}</span>
                        <button onClick={() => setTempTargets((p) => ({ ...p, [key]: p[key] + step }))}
                          className="w-7 h-7 flex items-center justify-center border border-border text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors font-mono text-sm font-bold cursor-pointer">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowTargetSettings(false)}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-foreground transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => {
                  setMacroTargets(tempTargets);
                  saveMacroTargets(tempTargets);
                  setShowTargetSettings(false);
                }}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90 transition-colors cursor-pointer">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Weekly Chart Popup ──────────────────── */}
      <AnimatePresence>
        {showWeeklyChart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowWeeklyChart(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-5 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">7-Day Overview</h3>
                </div>
                <button onClick={() => setShowWeeklyChart(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-4 h-4" /></button>
              </div>

              {/* Calorie bars */}
              <div className="mb-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-2 block">Calories</span>
                <div className="space-y-1.5">
                  {weeklyChartData.map((d) => {
                    const pct = macroTargets.calories > 0 ? Math.min((d.calories / macroTargets.calories) * 100, 100) : 0;
                    const isToday = d.date === todayKey;
                    return (
                      <div key={d.date} className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono w-8 ${isToday ? "text-[var(--primary)] font-bold" : "text-[var(--muted-foreground)]"}`}>{d.label}</span>
                        <div className="flex-1 h-5 bg-[var(--secondary)] relative">
                          <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${pct}%` }} />
                          {/* Target line */}
                          <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: '100%' }} />
                        </div>
                        <span className={`text-[10px] font-mono w-12 text-right ${d.calories === 0 ? "text-[var(--muted-foreground)]/50" : d.calories > macroTargets.calories ? "text-red-400" : "text-foreground"}`}>{d.calories || "—"}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-[9px] font-mono text-[var(--muted-foreground)]">Target: {macroTargets.calories} cal</span>
                </div>
              </div>

              {/* Protein bars */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-2 block">Protein</span>
                <div className="space-y-1.5">
                  {weeklyChartData.map((d) => {
                    const pct = macroTargets.protein > 0 ? Math.min((d.protein / macroTargets.protein) * 100, 100) : 0;
                    const isToday = d.date === todayKey;
                    return (
                      <div key={d.date} className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono w-8 ${isToday ? "text-[var(--primary)] font-bold" : "text-[var(--muted-foreground)]"}`}>{d.label}</span>
                        <div className="flex-1 h-5 bg-[var(--secondary)] relative">
                          <div className="h-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[10px] font-mono w-12 text-right ${d.protein === 0 ? "text-[var(--muted-foreground)]/50" : d.protein >= macroTargets.protein ? "text-green-400" : "text-foreground"}`}>{d.protein ? `${d.protein}g` : "—"}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-[9px] font-mono text-[var(--muted-foreground)]">Target: {macroTargets.protein}g</span>
                </div>
              </div>

              {/* Weekly averages */}
              {(() => {
                const daysWithData = weeklyChartData.filter((d) => d.calories > 0);
                if (daysWithData.length === 0) return null;
                const avgCal = Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length);
                const avgProt = Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length);
                return (
                  <div className="mt-4 pt-3 border-t border-border flex justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Avg Calories</span>
                      <p className={`text-sm font-mono font-bold ${avgCal > macroTargets.calories ? "text-red-400" : "text-[var(--primary)]"}`}>{avgCal}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Avg Protein</span>
                      <p className={`text-sm font-mono font-bold ${avgProt >= macroTargets.protein ? "text-green-400" : "text-red-400"}`}>{avgProt}g</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Meal Planner Wizard ─────────────────────── */}
      <AnimatePresence>
        {showMealPlanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowMealPlanner(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-5 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[var(--primary)]" />
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Meal Planner</h3>
                </div>
                <button onClick={() => setShowMealPlanner(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-4 h-4" /></button>
              </div>

              {!mealPlanResult ? (
                <div className="space-y-4">
                  {/* Meal type selection */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-2 block">What are you making?</span>
                    <div className="flex gap-2">
                      <button onClick={() => setMealPlanType("single")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                          mealPlanType === "single" ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-border text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                        }`}>
                        <Utensils className="w-3.5 h-3.5" /> Single Meal
                      </button>
                      <button onClick={() => setMealPlanType("prep")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                          mealPlanType === "prep" ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-border text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                        }`}>
                        <Briefcase className="w-3.5 h-3.5" /> Meal Prep
                      </button>
                    </div>
                  </div>

                  {/* Days slider — only for meal prep */}
                  <AnimatePresence>
                    {mealPlanType === "prep" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-2 block">How many days?</span>
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min={2} max={7} value={mealPrepDays}
                            onChange={(e) => setMealPrepDays(Number(e.target.value))}
                            className="flex-1 h-1.5 appearance-none bg-[var(--secondary)] rounded-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:cursor-pointer"
                          />
                          <span className="text-lg font-mono font-bold text-[var(--primary)] w-8 text-center">{mealPrepDays}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Food style */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-2 block">Style</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Comfort", "Lean & Clean", "International", "High Protein", "Quick & Easy", "Budget"].map((style) => (
                        <button key={style}
                          disabled={mealSurpriseMe}
                          onClick={() => setMealStyle(mealStyle === style ? "" : style)}
                          className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer disabled:opacity-30 ${
                            mealStyle === style && !mealSurpriseMe ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-border text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                          }`}>
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Surprise me */}
                  <button onClick={() => { setMealSurpriseMe(!mealSurpriseMe); if (!mealSurpriseMe) setMealStyle(""); }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                      mealSurpriseMe ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-border text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                    }`}>
                    <Shuffle className="w-3.5 h-3.5" /> Surprise Me
                  </button>

                  {/* Optional notes */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-1.5 block">Anything specific? <span className="text-[var(--muted-foreground)]/50">(optional)</span></span>
                    <textarea
                      value={mealNotes}
                      onChange={(e) => setMealNotes(e.target.value)}
                      placeholder="e.g. I have chicken thighs and rice..."
                      className="w-full bg-[var(--secondary)] border border-border text-foreground text-xs font-mono p-3 min-h-[60px] resize-none focus:outline-none focus:border-[var(--primary)] placeholder:text-[var(--muted-foreground)]/40"
                    />
                  </div>

                  {/* Generate button */}
                  <button
                    disabled={isMealPlanning}
                    onClick={async () => {
                      setIsMealPlanning(true);
                      const microGaps: { name: string; currentPercent: number }[] = [];
                      for (const micro of ALL_MICRONUTRIENTS) {
                        const current = dailyMicroTotals.get(micro.name) || 0;
                        const pct = micro.dailyValue > 0 ? Math.round((current / micro.dailyValue) * 100) : 100;
                        microGaps.push({ name: micro.name, currentPercent: pct });
                      }
                      try {
                        const result = await mealPlanMutation.mutateAsync({
                          type: mealPlanType,
                          days: mealPlanType === "prep" ? mealPrepDays : 1,
                          style: mealSurpriseMe ? "surprise" : (mealStyle || "any"),
                          notes: mealNotes,
                          remainingCalories: Math.max(macroTargets.calories - dailyTotals.calories, 0),
                          remainingProtein: Math.max(macroTargets.protein - dailyTotals.protein, 0),
                          remainingCarbs: Math.max(macroTargets.carbs - dailyTotals.carbs, 0),
                          remainingFat: Math.max(macroTargets.fat - dailyTotals.fat, 0),
                          microGaps,
                          ratedPlans: savedPlans
                            .filter((p) => p.rating)
                            .map((p) => ({
                              name: p.name,
                              rating: p.rating!,
                              meals: p.meals.map((m) => m.name),
                            })),
                        });
                        setMealPlanResult(result);
                      } catch (err) { console.error("Meal plan failed:", err); }
                      setIsMealPlanning(false);
                    }}
                    className="w-full py-3 text-xs font-mono uppercase tracking-[0.2em] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2">
                    {isMealPlanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Planning...</> : <><ChefHat className="w-4 h-4" /> Generate Plan</>}
                  </button>
                </div>
              ) : (
                /* ── Meal Plan Results ── */
                <div className="space-y-3">
                  {mealPlanResult.meals?.map((meal: any, i: number) => (
                    <div key={i} className="border border-border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-foreground">{meal.name}</span>
                        <span className="text-[10px] font-mono text-[var(--primary)]">{meal.totalCalories} cal</span>
                      </div>
                      {meal.dayLabel && <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">{meal.dayLabel}</span>}
                      <div className="space-y-1 mt-2">
                        {meal.ingredients?.map((ing: string, j: number) => (
                          <div key={j} className="text-[10px] font-mono text-[var(--muted-foreground)] flex items-start gap-1.5">
                            <span className="text-[var(--primary)] mt-0.5">•</span> {ing}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-2 text-[10px] font-mono">
                        <span className="text-blue-400">P: {meal.protein}g</span>
                        <span className="text-amber-400">C: {meal.carbs}g</span>
                        <span className="text-rose-400">F: {meal.fat}g</span>
                      </div>
                      {meal.keyMicros && meal.keyMicros.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {meal.keyMicros.map((m: { name: string; percentDV: number }, mi: number) => (
                            <span key={mi} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono">
                              {m.name} {m.percentDV}%
                            </span>
                          ))}
                        </div>
                      )}
                      {meal.instructions && (
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-2 leading-relaxed italic">{meal.instructions}</p>
                      )}
                    </div>
                  ))}
                  {mealPlanResult.summary && (
                    <p className="text-[10px] font-mono text-[var(--muted-foreground)] italic">{mealPlanResult.summary}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const plan: SavedMealPlan = {
                        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                        name: mealPlanResult.meals?.length === 1
                          ? mealPlanResult.meals[0].name
                          : `${mealPlanType === "prep" ? `${mealPrepDays}-Day Prep` : "Meal"} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
                        savedAt: new Date().toISOString(),
                        type: mealPlanType,
                        meals: mealPlanResult.meals || [],
                        summary: mealPlanResult.summary || "",
                      };
                      const updated = [plan, ...savedPlans];
                      setSavedPlans(updated);
                      saveSavedPlans(updated);
                      setShowMealPlanner(false);
                      setMealPlanResult(null);
                    }}
                      className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:opacity-90 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" /> Save Plan
                    </button>
                    <button onClick={() => setMealPlanResult(null)}
                      className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer">
                      Plan Another
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Saved Plans Browser ──────────────────── */}
      <AnimatePresence>
        {showSavedPlans && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowSavedPlans(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-5 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[var(--primary)]" />
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Saved Plans ({savedPlans.length})</h3>
                </div>
                <button onClick={() => setShowSavedPlans(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-4 h-4" /></button>
              </div>

              {savedPlans.length === 0 ? (
                <p className="text-xs font-mono text-[var(--muted-foreground)] text-center py-6">No saved plans yet. Generate a meal plan and hit Save.</p>
              ) : (
                <div className="space-y-2">
                  {savedPlans.map((plan) => (
                    <div key={plan.id} className="border border-border">
                      {/* Plan header — tap to expand */}
                      <button
                        onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)]/50 transition-colors cursor-pointer text-left">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-foreground truncate">{plan.name}</span>
                            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-border text-[var(--muted-foreground)]">
                              {plan.type === "prep" ? `${plan.meals.length}-day prep` : "single"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-[var(--muted-foreground)]">
                              {new Date(plan.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {plan.rating && (
                              <span className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map((s) => (
                                  <Star key={s} className={`w-2.5 h-2.5 ${s <= plan.rating! ? "text-amber-400 fill-amber-400" : "text-border"}`} />
                                ))}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeletePlan(plan.id); }}
                            className="p-1 text-[var(--muted-foreground)] hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {expandedPlanId === plan.id ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />}
                        </div>
                      </button>

                      {/* Expanded plan details */}
                      <AnimatePresence>
                        {expandedPlanId === plan.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 space-y-2">
                              {plan.meals.map((meal, i) => (
                                <div key={i} className="border border-border/50 p-2.5 bg-[var(--secondary)]/30">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono text-[11px] font-bold text-foreground">{meal.name}</span>
                                    <span className="text-[10px] font-mono text-[var(--primary)]">{meal.totalCalories} cal</span>
                                  </div>
                                  {meal.dayLabel && <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-1 block">{meal.dayLabel}</span>}
                                  <div className="space-y-0.5 mt-1.5">
                                    {meal.ingredients.map((ing, j) => (
                                      <div key={j} className="text-[10px] font-mono text-[var(--muted-foreground)] flex items-start gap-1.5">
                                        <span className="text-[var(--primary)] mt-0.5">•</span> {ing}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-3 mt-1.5 text-[10px] font-mono">
                                    <span className="text-blue-400">P: {meal.protein}g</span>
                                    <span className="text-amber-400">C: {meal.carbs}g</span>
                                    <span className="text-rose-400">F: {meal.fat}g</span>
                                  </div>
                                  {meal.keyMicros && meal.keyMicros.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {meal.keyMicros.map((m, mi) => (
                                        <span key={mi} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono">
                                          {m.name} {m.percentDV}%
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {meal.instructions && (
                                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-relaxed italic">{meal.instructions}</p>
                                  )}
                                </div>
                              ))}
                              {plan.summary && (
                                <p className="text-[9px] font-mono text-[var(--muted-foreground)] italic">{plan.summary}</p>
                              )}
                              {/* Star Rating */}
                              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Rate:</span>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((s) => (
                                    <button key={s}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = savedPlans.map((p) => p.id === plan.id ? { ...p, rating: p.rating === s ? undefined : s } : p);
                                        setSavedPlans(updated);
                                        saveSavedPlans(updated);
                                      }}
                                      className="p-0.5 transition-colors cursor-pointer hover:scale-110">
                                      <Star className={`w-4 h-4 ${s <= (plan.rating || 0) ? "text-amber-400 fill-amber-400" : "text-[var(--muted-foreground)]/40 hover:text-amber-400/60"}`} />
                                    </button>
                                  ))}
                                </div>
                                {plan.rating && <span className="text-[9px] font-mono text-amber-400">{plan.rating}/5</span>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Plan Confirmation ─────────────── */}
      <AnimatePresence>
        {confirmDeletePlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setConfirmDeletePlan(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-foreground font-semibold mb-2">Delete Plan?</h3>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mb-4">This saved meal plan will be permanently removed.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeletePlan(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => {
                  const updated = savedPlans.filter((p) => p.id !== confirmDeletePlan);
                  setSavedPlans(updated);
                  saveSavedPlans(updated);
                  setConfirmDeletePlan(null);
                  if (expandedPlanId === confirmDeletePlan) setExpandedPlanId(null);
                }}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer font-bold">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-foreground font-semibold mb-2">Delete Entry?</h3>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mb-4">This food entry will be permanently removed.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-[var(--muted-foreground)] hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer">Cancel</button>
                <button onClick={confirmDeleteEntry}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer font-bold">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
