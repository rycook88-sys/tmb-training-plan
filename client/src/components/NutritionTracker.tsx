import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Check, Edit3, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  Trash2, X, AlertTriangle, TrendingUp, Pill, Utensils, Plus, RotateCcw,
  Loader2, Sparkles, ArrowUpToLine, Zap, Bookmark, Briefcase, Coffee,
  Square, CheckSquare, Settings, BarChart3, ChefHat, Shuffle, Star, ShoppingCart, ImagePlus, Target,
  MessageSquare, Send, Type,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SwipeToDelete from "@/components/SwipeToDelete";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
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

/* ── Tiered color helper: green (under) → yellow (slightly over ≤10%) → red (way over >10%) */
function getMacroOverColor(current: number, target: number): { textClass: string; bgClass: string } {
  if (target <= 0 || current <= target) return { textClass: "text-foreground", bgClass: "" };
  const overPct = ((current - target) / target) * 100;
  if (overPct <= 10) return { textClass: "text-amber-400", bgClass: "bg-amber-400/15" }; // amber — slightly over
  return { textClass: "text-red-400", bgClass: "bg-red-400/15" }; // red — significantly over
}

/* ── Macro Progress Bar ────────────────────────────── */
function MacroBar({ label, current, target, color, unit = "g" }: {
  label: string; current: number; target: number; color: string; unit?: string;
}) {
  const over = current > target;
  const { textClass, bgClass } = getMacroOverColor(current, target);

  // Arcade-style double-fill: base layer fills to 100% at target,
  // overflow starts a second lighter layer from the left
  const basePct = Math.min((current / target) * 100, 100);
  // Overflow: how far past target, capped at another full bar (2x target)
  const overflowPct = over ? Math.min(((current - target) / target) * 100, 100) : 0;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        {over ? (
          <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${bgClass} ${textClass}`}>{label}</span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">{label}</span>
        )}
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          <span className={over ? textClass : "text-foreground"}>{Math.round(current)}</span>
          <span className="text-[var(--muted-foreground)]"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-[var(--secondary)] border border-border overflow-hidden relative">
        {/* Base layer: fills to 100% at target */}
        <motion.div
          className="h-full absolute inset-0"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${basePct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Overflow layer: lighter shade fills from left on top */}
        {over && (
          <motion.div
            className="h-full absolute inset-0"
            style={{ backgroundColor: color, opacity: 0.45 }}
            initial={{ width: 0 }}
            animate={{ width: `${overflowPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          />
        )}
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
                        n.dvPct > 0 ? "text-red-400" :
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
                        backgroundColor: n.dvPct >= 100 ? "#4ade80" : n.dvPct >= 50 ? "#facc15" : n.dvPct > 0 ? "#f87171" : "transparent",
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
  // Convert food name to bullet-pointed format for multi-item entries
  const initialText = useMemo(() => {
    const items = entry.foodName
      .split(/,\s*|\s+and\s+|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length <= 1) return entry.foodName;
    return items.map((item) => `\u2022 ${item}`).join("\n");
  }, [entry.foodName]);

  const [editText, setEditText] = useState(initialText);

  const handleConfirm = useCallback(() => {
    // Convert bullet-pointed text back to comma-separated for storage/analysis
    const cleaned = editText
      .split("\n")
      .map((line) => line.replace(/^[\u2022\-\*]\s*/, "").trim())
      .filter(Boolean)
      .join(", ");
    if (cleaned.trim()) {
      onConfirm(cleaned);
    }
  }, [editText, onConfirm]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Edit Food</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />}
            <button onClick={onCancel} className="p-1 text-[var(--muted-foreground)] hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Large textarea */}
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          autoFocus
          rows={10}
          className="w-full bg-[var(--secondary)] border border-border focus:border-[var(--primary)] rounded-lg px-4 py-4 text-sm font-mono text-foreground focus:outline-none resize-y leading-relaxed mb-3 min-h-[200px]"
          placeholder="Describe the food..."
        />

        <p className="text-[10px] font-mono text-[var(--muted-foreground)] italic mb-4">
          Edit the full description — AI will re-estimate all nutrients.
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 text-xs font-mono uppercase tracking-[0.15em] border border-border rounded-lg text-[var(--muted-foreground)] hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading}
            className="flex-1 py-3 text-xs font-mono uppercase tracking-[0.15em] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
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
  const handleSwipeDelete = useCallback(() => {
    onDelete(entry.id);
  }, [entry.id, onDelete]);

  return (
    <SwipeToDelete onSwipeDelete={handleSwipeDelete} className="mb-2">
      <div
        className="border border-border bg-card p-3 cursor-pointer hover:border-[var(--primary)]/30 transition-colors"
        onClick={() => onTap(entry)}
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
    </SwipeToDelete>
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
export default function NutritionTracker({ embedded = false, onCalorieUpdate }: { embedded?: boolean; onCalorieUpdate?: (current: number, target: number) => void }) {
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
  const [fillGapsStatus, setFillGapsStatus] = useState<string>("");
  const [fillGapsError, setFillGapsError] = useState(false);
  // Fill My Gaps controls: mode toggles + calorie slider
  const [fillGapsMode, setFillGapsMode] = useState<"macros" | "micros" | "both">("both");
  const [fillGapsCalorieCap, setFillGapsCalorieCap] = useState(500);
  const [showFillGapsConfig, setShowFillGapsConfig] = useState(false);

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
  const [confirmDeletePreset, setConfirmDeletePreset] = useState<{ tab: string; id: string } | null>(null);
  const [confirmDeleteCommon, setConfirmDeleteCommon] = useState<string | null>(null);

  // Text entry
  const [showTextEntry, setShowTextEntry] = useState(false);
  const [textEntryInput, setTextEntryInput] = useState("");
  const [textEntryStep, setTextEntryStep] = useState<"input" | "clarify" | "result">("input");
  const [textClarifyQuestion, setTextClarifyQuestion] = useState("");
  const [textClarifyAnswer, setTextClarifyAnswer] = useState("");
  const [textEntryResult, setTextEntryResult] = useState<any>(null);
  const [isTextAnalyzing, setIsTextAnalyzing] = useState(false);

  // Snap Pantry
  const [showPantry, setShowPantry] = useState(false);
  const [pantryImages, setPantryImages] = useState<Array<{ base64: string; mimeType: string; preview: string }>>([]);
  const [pantryResult, setPantryResult] = useState<any>(null);
  const [isPantryScanning, setIsPantryScanning] = useState(false);
  const [pantryStep, setPantryStep] = useState<"capture" | "meals" | "detail" | "grocery">("capture");
  const [selectedPantryMeal, setSelectedPantryMeal] = useState<number | null>(null);
  const [expandedPantryMeal, setExpandedPantryMeal] = useState<number | null>(null);
  const [groceryChecked, setGroceryChecked] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetFileRef = useRef<HTMLInputElement>(null);
  const commonFileRef = useRef<HTMLInputElement>(null);
  const pantryFileRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const analyzeMutation = trpc.nutrition.analyzePhoto.useMutation();
  const reAnalyzeMutation = trpc.nutrition.reAnalyze.useMutation();
  const trendsMutation = trpc.nutrition.getTrends.useMutation();
  const fillMacrosMutation = trpc.nutrition.fillMyMacros.useMutation();
  const backupMutation = trpc.nutrition.backup.useMutation();
  const mealPlanMutation = trpc.nutrition.planMeal.useMutation();
  const snapPantryMutation = trpc.nutrition.snapPantry.useMutation();
  const analyzeTextMutation = trpc.nutrition.analyzeText.useMutation();

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
          // Also backup body composition data from localStorage
          ...(localStorage.getItem("tmb-bodyfat-entries") ? [{ dataType: "bodyfatEntries", jsonData: localStorage.getItem("tmb-bodyfat-entries")! }] : []),
          ...(localStorage.getItem("tmb-weight-log") ? [{ dataType: "weightLog", jsonData: localStorage.getItem("tmb-weight-log")! }] : []),
          ...(localStorage.getItem("tmb-workout-sessions") ? [{ dataType: "workoutSessions", jsonData: localStorage.getItem("tmb-workout-sessions")! }] : []),
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

  // Notify parent of calorie updates
  useEffect(() => {
    onCalorieUpdate?.(Math.round(dailyTotals.calories), macroTargets.calories);
  }, [dailyTotals.calories, macroTargets.calories, onCalorieUpdate]);

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

  /* ── Fill My Gaps ────────────────────────────── */
  // Step 1: Open the config panel (toggles + slider)
  const handleFillMacros = useCallback(() => {
    setShowFillMacros(true);
    setShowFillGapsConfig(true);
    setFillMacrosSuggestions(null);
    setFillGapsError(false);
    setFillGapsStatus("");
  }, []);

  // Step 2: Run the analysis with the selected mode and calorie cap
  const handleFillGapsRun = useCallback(async () => {
    setShowFillGapsConfig(false);
    setFillMacrosSuggestions(null);
    setFillGapsError(false);
    setFillGapsStatus("Scanning food logs...");

    // Gather all days with food entries
    const daysWithEntries = logs.filter((l) => l.entries.length > 0);
    const numDays = daysWithEntries.length;
    if (numDays === 0) { setFillGapsStatus(`No days with food found (${logs.length} total log days)`); return; }

    // Compute per-day macro totals, then average
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
    // Compute per-day micro totals
    const microSums = new Map<string, number>();
    for (const micro of ALL_MICRONUTRIENTS) microSums.set(micro.name, 0);

    for (const day of daysWithEntries) {
      let dayCal = 0, dayProt = 0, dayCarbs = 0, dayFat = 0;
      for (const e of day.entries) {
        dayCal += e.calories; dayProt += e.protein; dayCarbs += e.carbs; dayFat += e.fat;
        for (const m of e.micronutrients || []) {
          const amt = typeof m.amount === "number" && !isNaN(m.amount) ? m.amount : 0;
          const prev = microSums.get(m.name) || 0;
          microSums.set(m.name, prev + amt);
        }
      }
      if (day.vitaminsAdded) {
        for (const supp of DAILY_VITAMINS) {
          dayCal += supp.nutrients.calories;
          dayProt += supp.nutrients.protein;
          dayCarbs += supp.nutrients.carbs;
          dayFat += supp.nutrients.fat;
          for (const mn of supp.micronutrients) {
            const prev = microSums.get(mn.name) || 0;
            microSums.set(mn.name, prev + mn.amount);
          }
        }
      }
      totalCal += dayCal; totalProt += dayProt; totalCarbs += dayCarbs; totalFat += dayFat;
    }

    const avgMacros = {
      calories: totalCal / numDays,
      protein: totalProt / numDays,
      carbs: totalCarbs / numDays,
      fat: totalFat / numDays,
    };

    const multiDayMicros: { name: string; avgPercent: number }[] = [];
    for (const micro of ALL_MICRONUTRIENTS) {
      const totalAmount = microSums.get(micro.name) || 0;
      const avgAmount = numDays > 0 ? totalAmount / numDays : 0;
      const rawPct = micro.dailyValue > 0 ? (avgAmount / micro.dailyValue) * 100 : 100;
      const pct = isNaN(rawPct) ? 0 : Math.round(rawPct);
      multiDayMicros.push({ name: micro.name, avgPercent: pct });
    }

    const modeLabel = fillGapsMode === "both" ? "macros + micros" : fillGapsMode;
    setFillGapsStatus(`Found ${numDays} day(s). Analyzing ${modeLabel} (≤${fillGapsCalorieCap} cal)...`);

    try {
      const result = await fillMacrosMutation.mutateAsync({
        daysTracked: numDays,
        multiDayMicros,
        avgMacros,
        macroTargets,
        mode: fillGapsMode,
        calorieCap: fillGapsCalorieCap,
      });
      setFillGapsStatus("Analysis complete!");
      setFillMacrosSuggestions(result);
    } catch (err: any) {
      console.error("Fill gaps failed:", err);
      setFillGapsError(true);
      setFillGapsStatus(`Analysis failed: ${err?.message || "Unknown error"}. Please try again.`);
      setFillMacrosSuggestions(null);
    }
  }, [logs, fillMacrosMutation, macroTargets, fillGapsMode, fillGapsCalorieCap]);

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

  /* ── Text Entry: Submit description ───────────── */
  const handleTextEntrySubmit = useCallback(async () => {
    if (!textEntryInput.trim()) return;
    setIsTextAnalyzing(true);
    try {
      const result = await analyzeTextMutation.mutateAsync({
        description: textEntryInput.trim(),
      });
      if (result.status === "clarification_needed") {
        setTextClarifyQuestion((result as any).question);
        setTextClarifyAnswer("");
        setTextEntryStep("clarify");
      } else {
        setTextEntryResult(result);
        setTextEntryStep("result");
      }
    } catch (err) {
      console.error("Text analysis failed:", err);
    } finally {
      setIsTextAnalyzing(false);
    }
  }, [textEntryInput, analyzeTextMutation]);

  /* ── Text Entry: Submit clarification answer ──── */
  const handleTextClarifySubmit = useCallback(async () => {
    if (!textClarifyAnswer.trim()) return;
    setIsTextAnalyzing(true);
    try {
      const result = await analyzeTextMutation.mutateAsync({
        description: textEntryInput.trim(),
        clarificationAnswer: textClarifyAnswer.trim(),
        previousQuestion: textClarifyQuestion,
      });
      setTextEntryResult(result);
      setTextEntryStep("result");
    } catch (err) {
      console.error("Clarification analysis failed:", err);
    } finally {
      setIsTextAnalyzing(false);
    }
  }, [textEntryInput, textClarifyAnswer, textClarifyQuestion, analyzeTextMutation]);

  /* ── Text Entry: Confirm and add to log ──────── */
  const handleTextEntryConfirm = useCallback(() => {
    if (!textEntryResult) return;
    const entry: FoodEntry = {
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      foodName: textEntryResult.foodName,
      confidence: textEntryResult.confidence,
      servingEstimate: textEntryResult.servingEstimate,
      calories: textEntryResult.calories,
      protein: textEntryResult.protein,
      carbs: textEntryResult.carbs,
      fat: textEntryResult.fat,
      fiber: textEntryResult.fiber || 0,
      sugar: textEntryResult.sugar || 0,
      sodium: textEntryResult.sodium || 0,
      micronutrients: normalizeMicros(textEntryResult.micronutrients),
      confirmed: true,
    };
    setLogs((prev) => {
      const { logs: updated } = getOrCreateToday(prev);
      return updated.map((l) => l.date === todayKey ? { ...l, entries: [...l.entries, entry] } : l);
    });
    // Reset text entry state
    setShowTextEntry(false);
    setTextEntryInput("");
    setTextEntryStep("input");
    setTextClarifyQuestion("");
    setTextClarifyAnswer("");
    setTextEntryResult(null);
  }, [textEntryResult, todayKey]);

  // ── Snap Pantry handlers ────────────────────
  const handlePantryCapture = useCallback(() => { pantryFileRef.current?.click(); }, []);

  const handlePantryFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const mimeType = file.type || "image/jpeg";
      const preview = reader.result as string;
      setPantryImages((prev) => [...prev, { base64, mimeType, preview }]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handlePantryScan = useCallback(async () => {
    if (pantryImages.length === 0) return;
    setIsPantryScanning(true);
    setPantryStep("meals");
    setGroceryChecked(new Set());

    const microGaps: { name: string; currentPercent: number }[] = [];
    for (const micro of ALL_MICRONUTRIENTS) {
      const current = dailyMicroTotals.get(micro.name) || 0;
      const pct = micro.dailyValue > 0 ? Math.round((current / micro.dailyValue) * 100) : 100;
      microGaps.push({ name: micro.name, currentPercent: pct });
    }

    const rated = savedPlans.filter((p) => p.rating && p.rating > 0).map((p) => ({
      name: p.name,
      rating: p.rating!,
      meals: p.meals.map((m: any) => m.name || m.foodName || "meal"),
    }));

    try {
      const result = await snapPantryMutation.mutateAsync({
        images: pantryImages.map((img) => ({ imageBase64: img.base64, mimeType: img.mimeType })),
        remainingCalories: Math.max(macroTargets.calories - dailyTotals.calories, 0),
        remainingProtein: Math.max(macroTargets.protein - dailyTotals.protein, 0),
        remainingCarbs: Math.max(macroTargets.carbs - dailyTotals.carbs, 0),
        remainingFat: Math.max(macroTargets.fat - dailyTotals.fat, 0),
        microGaps,
        ratedPlans: rated,
      });
      setPantryResult(result);
    } catch (err) {
      console.error("Pantry scan failed:", err);
      setPantryResult(null);
    } finally {
      setIsPantryScanning(false);
    }
  }, [pantryImages, dailyTotals, dailyMicroTotals, macroTargets, savedPlans, snapPantryMutation]);

  const isAnalyzing = analyzeMutation.isPending;
  const isReAnalyzing = reAnalyzeMutation.isPending;
  const isTrendLoading = trendsMutation.isPending;
  const isFillMacrosLoading = fillMacrosMutation.isPending;
  const hasFillGapsResults = !isFillMacrosLoading && fillMacrosSuggestions && !fillGapsError;

  return (
    <div className={embedded ? "" : "container py-6"}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={presetFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePresetPhotoCapture} />
      <input ref={commonFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCommonPhotoCapture} />
      <input ref={pantryFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePantryFileChange} />

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
            <div className={`font-mono text-3xl font-black leading-none tracking-tight ${dailyTotals.calories > macroTargets.calories ? getMacroOverColor(dailyTotals.calories, macroTargets.calories).textClass : "text-[var(--primary)]"}`}>
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

      {/* ── Action Buttons (3×3 Color-Coded Grid) ──── */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {/* Row 1 — Food Input (Orange) */}
          <button onClick={handleCapture} disabled={isAnalyzing}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#e8772e] bg-transparent py-4 text-[#e8772e] hover:bg-[#e8772e]/10 transition-colors disabled:opacity-50 rounded">
            <Camera className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">Snap Food</span>
          </button>

          <button onClick={() => { setShowTextEntry(true); setTextEntryInput(""); setTextEntryStep("input"); setTextClarifyQuestion(""); setTextClarifyAnswer(""); setTextEntryResult(null); }}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#e8772e] bg-transparent py-4 text-[#e8772e] hover:bg-[#e8772e]/10 transition-colors rounded">
            <Type className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">Type Food</span>
          </button>

          <button onClick={() => { setShowPantry(true); setPantryStep("capture"); setPantryImages([]); setPantryResult(null); setGroceryChecked(new Set()); }}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#e8772e] bg-transparent py-4 text-[#e8772e] hover:bg-[#e8772e]/10 transition-colors rounded">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">Snap Pantry</span>
          </button>

          {/* Row 2 — Quick Access (Teal) */}
          <button onClick={() => setShowPresetsPanel(!showPresetsPanel)}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#2dd4bf] bg-transparent py-4 text-[#2dd4bf] hover:bg-[#2dd4bf]/10 transition-colors rounded">
            <Coffee className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">Daily Items</span>
          </button>

          <button onClick={() => setShowCommonPanel(!showCommonPanel)}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#2dd4bf] bg-transparent py-4 text-[#2dd4bf] hover:bg-[#2dd4bf]/10 transition-colors rounded">
            <Bookmark className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">Common</span>
          </button>

          <button onClick={handleFillMacros} disabled={isFillMacrosLoading}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#2dd4bf] bg-transparent py-4 text-[#2dd4bf] hover:bg-[#2dd4bf]/10 transition-colors disabled:opacity-50 rounded">
            <Zap className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">{isFillMacrosLoading ? "Thinking..." : "Fill My Gaps"}</span>
          </button>

          {/* Row 3 — Analytics (Purple) */}
          <button onClick={handleFetchTrends} disabled={isTrendLoading}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#a78bfa] bg-transparent py-4 text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors disabled:opacity-50 rounded">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">{isTrendLoading ? "Analyzing..." : "Trends"}</span>
          </button>

          <button onClick={() => setShowWeeklyChart(true)}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#a78bfa] bg-transparent py-4 text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors rounded">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">Weekly</span>
          </button>

          <button onClick={() => { setShowMealPlanner(true); setMealPlanResult(null); setMealPlanType("single"); setMealStyle(""); setMealSurpriseMe(false); setMealNotes(""); setMealPrepDays(3); }}
            className="flex flex-col items-center justify-center gap-1.5 border border-[#a78bfa] bg-transparent py-4 text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors rounded">
            <ChefHat className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-bold">Plan Meal</span>
          </button>
        </div>

        {/* Saved Plans — shown as extra row when plans exist */}
        {savedPlans.length > 0 && (
          <div className="mt-2">
            <button onClick={() => { setShowSavedPlans(true); setExpandedPlanId(null); }}
              className="flex items-center justify-center gap-2 w-full border border-[#a78bfa]/50 bg-transparent py-2 text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors rounded text-[9px] font-mono uppercase tracking-[0.15em] font-bold">
              <Bookmark className="w-3.5 h-3.5" /> Saved Plans ({savedPlans.length})
            </button>
          </div>
        )}
      </div>
      <div className="px-4 pb-2">
        <p className="text-[10px] font-mono text-[var(--muted-foreground)]/60 italic">
          ✨ Tip: Place a can, fork, or your hand next to food when snapping for more accurate portions
        </p>
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
                <SwipeToDelete key={item.id} onSwipeDelete={() => setConfirmDeletePreset({ tab: activePresetTab, id: item.id })} className="border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between py-1.5 bg-card">
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
                      <button onClick={() => setConfirmDeletePreset({ tab: activePresetTab, id: item.id })} className="text-[var(--muted-foreground)] hover:text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </SwipeToDelete>
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
                <SwipeToDelete key={item.id} onSwipeDelete={() => setConfirmDeleteCommon(item.id)} className="border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 py-1.5 bg-card">
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
                      <button onClick={() => setConfirmDeleteCommon(item.id)}
                        className="text-[var(--muted-foreground)] hover:text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </SwipeToDelete>
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

      {/* ── Text Entry Panel ────────────────────── */}
      <AnimatePresence>
        {showTextEntry && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-3 border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Type What You Ate</span>
                </div>
                <button onClick={() => { setShowTextEntry(false); setTextEntryInput(""); setTextEntryStep("input"); setTextClarifyQuestion(""); setTextClarifyAnswer(""); setTextEntryResult(null); }}
                  className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>

              {/* Step 1: Text input */}
              {textEntryStep === "input" && (
                <div>
                  <textarea
                    value={textEntryInput}
                    onChange={(e) => setTextEntryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextEntrySubmit(); } }}
                    placeholder='e.g. "8oz grilled chicken with a cup of rice and steamed broccoli"'
                    className="w-full bg-[var(--secondary)] border border-border px-3 py-2.5 text-xs font-mono text-foreground placeholder:text-[var(--muted-foreground)]/60 focus:border-[var(--primary)] focus:outline-none resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleTextEntrySubmit} disabled={!textEntryInput.trim() || isTextAnalyzing}
                      className="flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                      {isTextAnalyzing ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</> : <><Send className="w-3 h-3" /> Analyze</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: AI asks a clarifying question */}
              {textEntryStep === "clarify" && (
                <div>
                  <div className="mb-3 p-2.5 bg-[var(--secondary)] border border-border">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--primary)] mb-1 font-bold">Quick question</p>
                        <p className="text-xs font-mono text-foreground">{textClarifyQuestion}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={textClarifyAnswer}
                      onChange={(e) => setTextClarifyAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleTextClarifySubmit(); } }}
                      placeholder="Your answer..."
                      className="flex-1 bg-[var(--secondary)] border border-border px-3 py-2 text-xs font-mono text-foreground placeholder:text-[var(--muted-foreground)]/60 focus:border-[var(--primary)] focus:outline-none"
                      autoFocus
                    />
                    <button onClick={handleTextClarifySubmit} disabled={!textClarifyAnswer.trim() || isTextAnalyzing}
                      className="flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-2 text-[10px] font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                      {isTextAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-1.5 italic">
                    You said: "{textEntryInput}"
                  </p>
                </div>
              )}

              {/* Step 3: Show result */}
              {textEntryStep === "result" && textEntryResult && (
                <div>
                  <div className="mb-2">
                    <span className="font-mono text-xs font-bold text-foreground">{textEntryResult.foodName}</span>
                    {textEntryResult.confidence === "low" && (
                      <span className="ml-2 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 text-red-400 bg-red-400/10">⚠ low confidence</span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] italic mb-2">{textEntryResult.servingEstimate}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono mb-3">
                    <span className="text-[var(--primary)] font-bold">{textEntryResult.calories} cal</span>
                    <span className="text-blue-400">P: {textEntryResult.protein}g</span>
                    <span className="text-amber-400">C: {textEntryResult.carbs}g</span>
                    <span className="text-rose-400">F: {textEntryResult.fat}g</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleTextEntryConfirm}
                      className="flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity">
                      <Check className="w-3 h-3" /> Confirm
                    </button>
                    <button onClick={() => { setTextEntryStep("input"); setTextEntryResult(null); }}
                      className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => { setShowTextEntry(false); setTextEntryInput(""); setTextEntryStep("input"); setTextClarifyQuestion(""); setTextClarifyAnswer(""); setTextEntryResult(null); }}
                      className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-foreground transition-colors">
                      <X className="w-3 h-3" /> Discard
                    </button>
                  </div>
                </div>
              )}
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

      {/* ── Fill My Gaps Panel (Multi-Day Analysis) ── */}
      <AnimatePresence>
        {showFillMacros && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-3 border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold">Fill My Gaps</span>
                </div>
                <button onClick={() => { setShowFillMacros(false); setShowFillGapsConfig(false); }} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>

              {/* ── Config Panel: Mode Toggles + Calorie Slider ── */}
              {showFillGapsConfig && !isFillMacrosLoading && (
                <div className="space-y-4 py-2">
                  {/* Mode Toggle Buttons */}
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] font-bold block mb-2">Analyze</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFillGapsMode(fillGapsMode === "macros" ? "both" : fillGapsMode === "both" ? "micros" : "both")}
                        className={`flex-1 py-2.5 px-3 border text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                          fillGapsMode === "macros" || fillGapsMode === "both"
                            ? "border-amber-500 bg-amber-500/15 text-amber-400"
                            : "border-border text-[var(--muted-foreground)] hover:border-amber-500/50"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Macros
                        </span>
                      </button>
                      <button
                        onClick={() => setFillGapsMode(fillGapsMode === "micros" ? "both" : fillGapsMode === "both" ? "macros" : "both")}
                        className={`flex-1 py-2.5 px-3 border text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                          fillGapsMode === "micros" || fillGapsMode === "both"
                            ? "border-[#2dd4bf] bg-[#2dd4bf]/15 text-[#2dd4bf]"
                            : "border-border text-[var(--muted-foreground)] hover:border-[#2dd4bf]/50"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Pill className="w-3.5 h-3.5" />
                          Micros
                        </span>
                      </button>
                    </div>
                    <p className="text-[9px] font-mono text-[var(--muted-foreground)] mt-1.5 text-center">
                      {fillGapsMode === "both" ? "Analyzing both macro and micronutrient gaps" : fillGapsMode === "macros" ? "Analyzing macro gaps only (protein, carbs, fat)" : "Analyzing micronutrient gaps only (vitamins, minerals)"}
                    </p>
                  </div>

                  {/* Calorie Cap Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] font-bold">Max Calories Per Food</span>
                      <span className="text-sm font-mono font-bold text-[var(--primary)]">{fillGapsCalorieCap} cal</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={1000}
                      step={50}
                      value={fillGapsCalorieCap}
                      onChange={(e) => setFillGapsCalorieCap(Number(e.target.value))}
                      className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]
                        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
                        [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-[var(--muted-foreground)] mt-0.5">
                      <span>100</span>
                      <span>500</span>
                      <span>1000</span>
                    </div>
                  </div>

                  {/* Run Button */}
                  <button
                    onClick={handleFillGapsRun}
                    className="w-full py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    Analyze My Gaps
                  </button>
                </div>
              )}

              {/* ── Loading State ── */}
              {isFillMacrosLoading && (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">{fillGapsStatus || "Analyzing your multi-day nutrition patterns..."}</span>
                </div>
              )}

              {/* ── Error / Empty State ── */}
              {!showFillGapsConfig && !isFillMacrosLoading && !hasFillGapsResults && fillGapsStatus && (
                <div className="py-4 text-center">
                  <p className={`text-xs font-mono ${fillGapsError ? "text-rose-400" : "text-[var(--muted-foreground)]"}`}>{fillGapsStatus}</p>
                  {fillGapsError && (
                    <button onClick={() => setShowFillGapsConfig(true)} className="mt-2 text-[10px] font-mono text-[var(--primary)] hover:underline cursor-pointer">Try Again</button>
                  )}
                  <button onClick={() => setShowFillMacros(false)} className="mt-2 ml-3 text-[10px] font-mono text-[var(--muted-foreground)] hover:underline cursor-pointer">Close</button>
                </div>
              )}

              {/* ── Results ── */}
              {hasFillGapsResults && (
                <>
                  {/* Mode + calorie badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[9px] font-mono font-bold uppercase">
                      {fillGapsMode === "both" ? "Macros + Micros" : fillGapsMode === "macros" ? "Macros Only" : "Micros Only"}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-border/50 text-[var(--muted-foreground)] text-[9px] font-mono">
                      ≤{fillGapsCalorieCap} cal/item
                    </span>
                    <button onClick={() => { setShowFillGapsConfig(true); setFillMacrosSuggestions(null); setFillGapsStatus(""); }} className="ml-auto text-[9px] font-mono text-[var(--primary)] hover:underline cursor-pointer">Change</button>
                  </div>

                  {/* Confidence note */}
                  {fillMacrosSuggestions.confidenceNote && (
                    <p className="text-[10px] font-mono text-[var(--muted-foreground)] italic mb-2 px-1">{fillMacrosSuggestions.confidenceNote}</p>
                  )}

                  {/* Micronutrient Deficiencies */}
                  {fillMacrosSuggestions.microDeficiencies?.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-rose-400 font-bold">Micronutrient Gaps</span>
                      <div className="mt-1.5 space-y-1">
                        {fillMacrosSuggestions.microDeficiencies.map((d: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              d.severity === "critical" ? "bg-red-500" : d.severity === "low" ? "bg-orange-400" : "bg-yellow-400"
                            }`} />
                            <span className="text-[10px] font-mono text-foreground flex-1">{d.name}</span>
                            <span className={`text-[10px] font-mono font-bold ${
                              d.severity === "critical" ? "text-red-400" : d.severity === "low" ? "text-orange-400" : "text-yellow-400"
                            }`}>{Math.round(d.avgPercent)}% avg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Macro Notes */}
                  {fillMacrosSuggestions.macroNotes?.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-amber-400 font-bold">Macro Imbalances</span>
                      <div className="mt-1.5 space-y-1">
                        {fillMacrosSuggestions.macroNotes.map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-foreground capitalize">{m.macro}</span>
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{Math.round(m.avgDaily)}g avg / {m.target}g target</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No gaps */}
                  {fillMacrosSuggestions.microDeficiencies?.length === 0 && fillMacrosSuggestions.macroNotes?.length === 0 && (
                    <p className="text-xs font-mono text-emerald-400 py-2">Looking good — no major nutritional gaps detected!</p>
                  )}

                  {/* Food Suggestions */}
                  {fillMacrosSuggestions.suggestions?.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-emerald-400 font-bold">Add to Your Diet</span>
                      <div className="mt-1.5 space-y-2">
                        {fillMacrosSuggestions.suggestions.map((s: any, i: number) => (
                          <div key={i} className="border border-border p-2">
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
                            {s.coversNutrients && s.coversNutrients.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {s.coversNutrients.map((c: { name: string; percentDV: number }, ci: number) => (
                                  <span key={ci} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono">
                                    {c.name} +{c.percentDV}%
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{s.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overall Summary */}
                  {fillMacrosSuggestions.overallSummary && (
                    <p className="text-[10px] font-mono text-[var(--muted-foreground)] italic mt-1 border-t border-border pt-2">{fillMacrosSuggestions.overallSummary}</p>
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
      {todayEntries.length === 0 && !capturedImage && !showTextEntry && (
        <div className="px-4 pb-4">
          <div className="border border-dashed border-border p-6 text-center">
            <Camera className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-40" />
            <p className="text-xs font-mono text-[var(--muted-foreground)]">
              No meals logged today. <span className="text-[var(--primary)]">Snap</span> a photo or <span className="text-[var(--primary)]">Type</span> what you ate.
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
                          inputMode="decimal"
                          value={tempTargets[key]}
                          onChange={(e) => setTempTargets((p) => ({ ...p, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                          onFocus={e => { const v = e.target.value; e.target.value = ''; e.target.value = v; }}
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

              {/* Calorie bars — scaled to max recorded value */}
              {(() => {
                const maxCal = Math.max(...weeklyChartData.map((d) => d.calories), 1);
                const targetPct = macroTargets.calories > 0 ? Math.min((macroTargets.calories / maxCal) * 100, 100) : 100;
                return (
                  <div className="mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-2 block">Calories</span>
                    <div className="space-y-1.5">
                      {weeklyChartData.map((d) => {
                        const pct = d.calories > 0 ? (d.calories / maxCal) * 100 : 0;
                        const isToday = d.date === todayKey;
                        return (
                          <div key={d.date} className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono w-8 ${isToday ? "text-[var(--primary)] font-bold" : "text-[var(--muted-foreground)]"}`}>{d.label}</span>
                            <div className="flex-1 h-5 bg-[var(--secondary)] relative">
                              <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${pct}%` }} />
                              {/* Target line */}
                              <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: `${targetPct}%` }} title={`Target: ${macroTargets.calories} cal`} />
                            </div>
                            <span className={`text-[10px] font-mono w-12 text-right ${d.calories === 0 ? "text-[var(--muted-foreground)]/50" : d.calories > macroTargets.calories ? getMacroOverColor(d.calories, macroTargets.calories).textClass : "text-foreground"}`}>{d.calories || "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-[9px] font-mono text-[var(--muted-foreground)]">Target: {macroTargets.calories} cal</span>
                    </div>
                  </div>
                );
              })()}

              {/* Protein bars — scaled to max recorded value */}
              {(() => {
                const maxProt = Math.max(...weeklyChartData.map((d) => d.protein), 1);
                const targetProtPct = macroTargets.protein > 0 ? Math.min((macroTargets.protein / maxProt) * 100, 100) : 100;
                return (
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-2 block">Protein</span>
                    <div className="space-y-1.5">
                      {weeklyChartData.map((d) => {
                        const pct = d.protein > 0 ? (d.protein / maxProt) * 100 : 0;
                        const isToday = d.date === todayKey;
                        return (
                          <div key={d.date} className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono w-8 ${isToday ? "text-[var(--primary)] font-bold" : "text-[var(--muted-foreground)]"}`}>{d.label}</span>
                            <div className="flex-1 h-5 bg-[var(--secondary)] relative">
                              <div className="h-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
                              {/* Target line */}
                              <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: `${targetProtPct}%` }} title={`Target: ${macroTargets.protein}g`} />
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
                );
              })()}

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
                      <p className={`text-sm font-mono font-bold ${avgCal > macroTargets.calories ? getMacroOverColor(avgCal, macroTargets.calories).textClass : "text-[var(--primary)]"}`}>{avgCal}</p>
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
      <ConfirmDeleteDialog
        open={!!confirmDeletePlan}
        title="Delete Plan?"
        description="This saved meal plan will be permanently removed."
        onConfirm={() => {
          const updated = savedPlans.filter((p) => p.id !== confirmDeletePlan);
          setSavedPlans(updated);
          saveSavedPlans(updated);
          setConfirmDeletePlan(null);
          if (expandedPlanId === confirmDeletePlan) setExpandedPlanId(null);
        }}
        onCancel={() => setConfirmDeletePlan(null)}
      />

      {/* ── Snap Pantry Modal ──────────────────── */}
      <AnimatePresence>
        {showPantry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowPantry(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-card border border-border w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-[var(--primary)] font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Snap Pantry
                </h3>
                <button onClick={() => setShowPantry(false)} className="text-[var(--muted-foreground)] hover:text-foreground p-0.5"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {pantryStep === "capture" && (
                  <div>
                    <p className="text-xs font-mono text-[var(--muted-foreground)] mb-3">
                      Take photos of your fridge, pantry, or groceries. Add as many as you need, then hit Scan.
                    </p>

                    {/* Photo grid */}
                    {pantryImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {pantryImages.map((img, i) => (
                          <div key={i} className="relative aspect-square border border-border overflow-hidden">
                            <img src={img.preview} alt={`Pantry ${i + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => setPantryImages((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 bg-black/70 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={handlePantryCapture}
                        className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border py-3 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                        <ImagePlus className="w-4 h-4" /> Add Photo {pantryImages.length > 0 ? `(${pantryImages.length})` : ""}
                      </button>

                      {pantryImages.length > 0 && (
                        <button onClick={handlePantryScan}
                          className="flex-1 flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] py-3 text-xs font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity">
                          <Sparkles className="w-4 h-4" /> Scan & Plan
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Meals step: loading or meal selection cards */}
                {pantryStep === "meals" && (
                  <div>
                    {isPantryScanning ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                        <p className="text-xs font-mono text-[var(--muted-foreground)] animate-pulse">Scanning your kitchen...</p>
                        <p className="text-[10px] font-mono text-[var(--muted-foreground)]">Identifying items, planning meals, building grocery list</p>
                      </div>
                    ) : pantryResult?.meals?.length > 0 ? (
                      <div className="space-y-3">
                        {/* Wishlist */}
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> Wishlist
                          </h4>
                          <div className="space-y-1">
                            {pantryResult.wishlist?.map((item: any, i: number) => (
                              <div key={i} className="flex gap-2 text-xs font-mono">
                                <span className="text-[var(--primary)] font-bold shrink-0">•</span>
                                <span><span className="text-foreground font-semibold">{item.item}</span> <span className="text-[var(--muted-foreground)]">— {item.reason}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Meal Options */}
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold mb-2 flex items-center gap-1.5">
                            <ChefHat className="w-3 h-3" /> Pick a Meal
                          </h4>
                          <div className="space-y-2">
                            {pantryResult.meals.map((meal: any, i: number) => (
                              <div key={i}>
                                <button
                                  onClick={() => setExpandedPantryMeal(expandedPantryMeal === i ? null : i)}
                                  className={`w-full text-left p-3 border transition-all ${
                                    expandedPantryMeal === i
                                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                      : "border-border hover:border-[var(--primary)]/50"
                                  }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-mono font-bold text-foreground">{meal.name}</span>
                                      {meal.calorieFlexible && (
                                        <span className="text-[8px] font-mono bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 uppercase">Flex</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-[var(--primary)]">{meal.totalCalories} cal</span>
                                      <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform ${
                                        expandedPantryMeal === i ? "rotate-180" : ""
                                      }`} />
                                    </div>
                                  </div>
                                  <div className="flex gap-3 text-[10px] font-mono mt-1">
                                    <span className="text-red-400">P: {meal.protein}g</span>
                                    <span className="text-yellow-400">C: {meal.carbs}g</span>
                                    <span className="text-orange-400">F: {meal.fat}g</span>
                                  </div>
                                </button>

                                {/* Expanded detail */}
                                <AnimatePresence>
                                  {expandedPantryMeal === i && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden border-x border-b border-[var(--primary)]/30">
                                      <div className="p-3 space-y-2">
                                        {/* Key Micros */}
                                        {meal.keyMicros?.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {meal.keyMicros.map((m: any, j: number) => (
                                              <span key={j} className="text-[9px] font-mono bg-green-900/30 text-green-400 px-1.5 py-0.5">
                                                {m.name} {m.percentDV}%
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {/* Ingredients */}
                                        <div>
                                          <p className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Ingredients:</p>
                                          {meal.ingredients?.map((ing: any, j: number) => (
                                            <div key={j} className="flex items-center gap-2 text-xs font-mono py-0.5">
                                              <span className={ing.fromPantry ? "text-green-400" : "text-yellow-400"}>{ing.fromPantry ? "✓" : "○"}</span>
                                              <span className="text-foreground">{ing.quantity} {ing.item}</span>
                                              {ing.fromPantry && <span className="text-[9px] text-green-400/60">(have)</span>}
                                            </div>
                                          ))}
                                        </div>

                                        {/* Instructions */}
                                        <p className="text-xs font-mono text-[var(--muted-foreground)] leading-relaxed">{meal.instructions}</p>

                                        {/* Select This Meal button */}
                                        <button
                                          onClick={() => {
                                            setSelectedPantryMeal(i);
                                            setGroceryChecked(new Set());
                                            setPantryStep("grocery");
                                          }}
                                          className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 text-xs font-mono uppercase tracking-wider font-bold hover:opacity-90 transition-opacity mt-1">
                                          <Target className="w-3.5 h-3.5" /> Make This One
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Scan Again */}
                        <button onClick={() => { setPantryStep("capture"); setPantryImages([]); setPantryResult(null); setExpandedPantryMeal(null); }}
                          className="w-full flex items-center justify-center gap-2 border border-border py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" /> Scan Again
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-xs font-mono text-red-400">Scan failed. Try again with clearer photos.</p>
                        <button onClick={() => { setPantryStep("capture"); setPantryImages([]); }}
                          className="mt-3 text-xs font-mono text-[var(--primary)] hover:underline">Try Again</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Grocery step: selected meal summary + grocery list */}
                {pantryStep === "grocery" && pantryResult && selectedPantryMeal !== null && (() => {
                  const meal = pantryResult.meals[selectedPantryMeal];
                  // Filter grocery list to only items needed for the selected meal
                  const relevantGroceries = pantryResult.groceryList?.filter((item: any) =>
                    item.forMeals?.some((m: string) => m.toLowerCase() === meal.name.toLowerCase())
                  ) || [];
                  // If no meal-specific filtering matched, show all (fallback)
                  const groceries = relevantGroceries.length > 0 ? relevantGroceries : pantryResult.groceryList || [];
                  return (
                    <div className="space-y-4">
                      {/* Selected meal summary */}
                      <div className="border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold mb-1 flex items-center gap-1.5">
                          <ChefHat className="w-3 h-3" /> Selected Meal
                        </h4>
                        <p className="text-sm font-mono font-bold text-foreground mb-1">{meal.name}</p>
                        <div className="flex gap-3 text-[10px] font-mono mb-2">
                          <span className="text-[var(--primary)]">{meal.totalCalories} cal</span>
                          <span className="text-red-400">P: {meal.protein}g</span>
                          <span className="text-yellow-400">C: {meal.carbs}g</span>
                          <span className="text-orange-400">F: {meal.fat}g</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Ingredients:</p>
                          {meal.ingredients?.map((ing: any, j: number) => (
                            <div key={j} className="flex items-center gap-2 text-xs font-mono py-0.5">
                              <span className={ing.fromPantry ? "text-green-400" : "text-yellow-400"}>{ing.fromPantry ? "✓" : "○"}</span>
                              <span className="text-foreground">{ing.quantity} {ing.item}</span>
                              {ing.fromPantry && <span className="text-[9px] text-green-400/60">(have)</span>}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs font-mono text-[var(--muted-foreground)] leading-relaxed mt-2">{meal.instructions}</p>
                      </div>

                      {/* Grocery List */}
                      {groceries.length > 0 ? (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--primary)] font-bold mb-2 flex items-center gap-1.5">
                            <ShoppingCart className="w-3 h-3" /> Grocery List
                          </h4>
                          <div className="space-y-1">
                            {groceries.map((item: any, i: number) => {
                              const checked = groceryChecked.has(i);
                              return (
                                <button key={i}
                                  onClick={() => setGroceryChecked((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(i)) next.delete(i); else next.add(i);
                                    return next;
                                  })}
                                  className={`w-full flex items-center gap-2 text-xs font-mono py-1.5 px-2 text-left transition-all ${
                                    checked ? "opacity-40 line-through" : "hover:bg-muted/30"
                                  }`}>
                                  {checked
                                    ? <CheckSquare className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                    : <Square className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />}
                                  <span className="flex-1">{item.quantity} {item.item}</span>
                                  <span className="text-[9px] text-[var(--muted-foreground)] uppercase">{item.category}</span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-2">
                            {groceryChecked.size}/{groceries.length} items checked
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs font-mono text-green-400">You have everything you need!</p>
                        </div>
                      )}

                      {/* Back / Scan Again */}
                      <div className="flex gap-2">
                        <button onClick={() => { setPantryStep("meals"); setSelectedPantryMeal(null); setGroceryChecked(new Set()); }}
                          className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                          ← Other Meals
                        </button>
                        <button onClick={() => { setPantryStep("capture"); setPantryImages([]); setPantryResult(null); setSelectedPantryMeal(null); setExpandedPantryMeal(null); }}
                          className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" /> Scan Again
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* ── Delete Confirmation Modal ──────────── */}
      <ConfirmDeleteDialog
        open={!!confirmDelete}
        title="Delete Entry?"
        description="This food entry will be permanently removed."
        onConfirm={confirmDeleteEntry}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* ── Delete Preset Item Confirmation ────── */}
      <ConfirmDeleteDialog
        open={!!confirmDeletePreset}
        title="Delete Preset Item?"
        description="This item will be removed from your preset."
        onConfirm={() => {
          if (!confirmDeletePreset) return;
          const tab = confirmDeletePreset.tab as keyof PresetLists;
          setPresets((prev) => ({
            ...prev,
            [tab]: prev[tab].filter((i: PresetItem) => i.id !== confirmDeletePreset.id),
          }));
          setConfirmDeletePreset(null);
        }}
        onCancel={() => setConfirmDeletePreset(null)}
      />

      {/* ── Delete Common Item Confirmation ────── */}
      <ConfirmDeleteDialog
        open={!!confirmDeleteCommon}
        title="Delete Common Item?"
        description="This item will be removed from your common items."
        onConfirm={() => {
          if (!confirmDeleteCommon) return;
          setCommonItems((prev) => prev.filter((i) => i.id !== confirmDeleteCommon));
          setConfirmDeleteCommon(null);
        }}
        onCancel={() => setConfirmDeleteCommon(null)}
      />
    </div>
  );
}
