// ============================================================
// Body Fat Estimator — Multi-Formula (Navy, YMCA, Covert Bailey)
// Design: Alpine Command Center / Topographic Brutalism
// ============================================================
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info, X, Camera, Trash2, RotateCcw } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { useUnits } from "@/contexts/UnitContext";

// ── Guide images (CDN) ──────────────────────────────────────
const GUIDE_IMAGES: Record<string, string> = {
  neck: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-neck-dU4hoeM9RNsTid6yU45zP4.webp",
  waist: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-waist-5vVK8eK8GgnLzRhm93wTh8.webp",
  hip: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-hip-ihFs99LzAw8JaiCMEYEMB8.webp",
  chest: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-chest-hWaJ9xpiagt6zAHECEg42D.webp",
  bicep: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-bicep-Muxh72Tr95FUMMwDzBTuLP.webp",
  thigh: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-thigh-JBYcKqeDhaVBtZvBeNMZU2.webp",
  forearm: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-forearm-EUt7rSkBaSmnR67bnLJfEo.webp",
  wrist: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-wrist-56qTtqsbwSNQTeySyrUDji.webp",
};

// ── Measurement fields ──────────────────────────────────────
type FieldKey = "neck" | "waist" | "hip" | "chest" | "bicep" | "thigh" | "forearm" | "wrist";

interface MeasurementField {
  key: FieldKey;
  label: string;
  hint: string;
  guideImage: string;
  required: boolean; // required for Navy formula
}

const FIELDS: MeasurementField[] = [
  { key: "neck", label: "Neck", hint: "Measure at the narrowest point, just below the Adam's apple", guideImage: GUIDE_IMAGES.neck, required: true },
  { key: "chest", label: "Chest", hint: "Measure at nipple level with arms relaxed at sides", guideImage: GUIDE_IMAGES.chest, required: false },
  { key: "bicep", label: "Bicep", hint: "Measure at the widest point, arm relaxed and hanging (not flexed)", guideImage: GUIDE_IMAGES.bicep, required: false },
  { key: "forearm", label: "Forearm", hint: "Measure at the widest point, about 2 inches below the elbow", guideImage: GUIDE_IMAGES.forearm, required: false },
  { key: "waist", label: "Waist", hint: "Measure at navel level, relaxed (don't suck in)", guideImage: GUIDE_IMAGES.waist, required: true },
  { key: "hip", label: "Hip", hint: "Measure at the widest point of the buttocks", guideImage: GUIDE_IMAGES.hip, required: false },
  { key: "thigh", label: "Thigh", hint: "Measure at the widest point of the upper thigh, just below the glute fold", guideImage: GUIDE_IMAGES.thigh, required: false },
  { key: "wrist", label: "Wrist", hint: "Measure at the narrowest point, just above the wrist bone (below the bump)", guideImage: GUIDE_IMAGES.wrist, required: false },
];

// ── Body fat categories ─────────────────────────────────────
interface BFCategory {
  label: string;
  range: string;
  min: number;
  max: number;
  color: string;
  barColor: string;
}

const CATEGORIES: BFCategory[] = [
  { label: "Essential", range: "2–5%", min: 0, max: 5.99, color: "text-red-400", barColor: "bg-red-500" },
  { label: "Athletic", range: "6–13%", min: 6, max: 13.99, color: "text-[var(--primary)]", barColor: "bg-[var(--primary)]" },
  { label: "Fitness", range: "14–17%", min: 14, max: 17.99, color: "text-green-400", barColor: "bg-green-500" },
  { label: "Average", range: "18–24%", min: 18, max: 24.99, color: "text-yellow-400", barColor: "bg-yellow-500" },
  { label: "Above Avg", range: "25%+", min: 25, max: 100, color: "text-red-300", barColor: "bg-red-400" },
];

function getCategory(bf: number): BFCategory {
  return CATEGORIES.find(c => bf >= c.min && bf <= c.max) || CATEGORIES[CATEGORIES.length - 1];
}

// ── Formulas ────────────────────────────────────────────────

// Navy / DoD (male): BF% = 86.010 × log10(waist − neck) − 70.041 × log10(height) + 36.76
function navyBodyFat(neck: number, waist: number, heightIn: number): number | null {
  const diff = waist - neck;
  if (diff <= 0 || heightIn <= 0) return null;
  return 86.010 * Math.log10(diff) - 70.041 * Math.log10(heightIn) + 36.76;
}

// YMCA (male): BF% = (-98.42 + 4.15 × waist − 0.082 × weight) / weight × 100
// Published formula from YMCA fitness testing protocol
function ymcaBodyFat(waist: number, weightLbs: number): number | null {
  if (waist <= 0 || weightLbs <= 0) return null;
  const bf = (-98.42 + 4.15 * waist - 0.082 * weightLbs) / weightLbs * 100;
  return bf > 0 ? bf : null;
}

// Covert Bailey (male) from "Fit or Fat?" by Covert Bailey
// Men: BF% = waist + (0.5 × hip) − (3.0 × forearm) − wrist
// All measurements in inches
function covertBaileyBodyFat(waist: number, hip: number, forearm: number, wrist: number): number | null {
  if (waist <= 0 || hip <= 0 || forearm <= 0 || wrist <= 0) return null;
  const bf = waist + (0.5 * hip) - (3.0 * forearm) - wrist;
  return bf > 0 ? bf : null;
}

interface FormulaResult {
  name: string;
  shortName: string;
  bf: number;
  available: boolean;
  note: string;
}

function getWeightFromGauge(): number {
  try {
    const raw = localStorage.getItem("tmb-weight-log");
    if (!raw) return 226;
    const entries = JSON.parse(raw);
    if (entries.length > 0) return entries[entries.length - 1].weight || 226;
  } catch { /* ignore */ }
  return 226;
}

// ── Persistence ─────────────────────────────────────────────
const STORAGE_KEY = "tmb-bodyfat-entries";

interface BFEntry {
  id: string;
  date: string;
  measurements: Record<FieldKey, number>;
  heightIn: number;
  weightLbs: number;
  navy: number | null;
  ymca: number | null;
  covertBailey: number | null;
  composite: number;
  method: "tape";
  photos?: string[];
}

function loadEntries(): BFEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Handle legacy entries
    return parsed.map((e: any) => {
      if (e.measurements) return e;
      return {
        ...e,
        measurements: { neck: e.neck || 0, waist: e.waist || 0, hip: e.hip || 0, chest: 0, bicep: 0, thigh: 0, forearm: 0 },
        weightLbs: e.weightLbs || 226,
        navy: e.bf || null,
        ymca: null,
        covertBailey: null,
        composite: e.bf || 0,
      };
    });
  } catch { return []; }
}

function saveEntries(entries: BFEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Guide Modal ─────────────────────────────────────────────
function GuideModal({ field, onClose }: { field: MeasurementField; onClose: () => void }) {
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
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-card border border-border max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-foreground font-semibold">
            {field.label} Measurement
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2">
          <img
            src={field.guideImage}
            alt={`How to measure ${field.label}`}
            className="w-full aspect-square object-cover"
          />
        </div>
        <div className="p-4 border-t border-border">
          <p className="text-xs font-mono text-muted-foreground leading-relaxed">{field.hint}</p>
          <p className="text-[10px] font-mono text-muted-foreground/60 mt-2">
            Keep tape snug but not tight. Measure twice for accuracy.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function BodyFatEstimator({ embedded = false }: { embedded?: boolean } = {}) {
  const uu = useUnits();
  const [open, setOpen] = useState(embedded);
  const [guideField, setGuideField] = useState<MeasurementField | null>(null);

  // Inputs
  const [heightFt, setHeightFt] = useState("6");
  const [heightInR, setHeightInR] = useState("2");
  const [measurements, setMeasurements] = useState<Record<FieldKey, string>>({
    neck: "", chest: "", bicep: "", forearm: "", waist: "", hip: "", thigh: "", wrist: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [outlierWarnings, setOutlierWarnings] = useState<{ key: string; label: string; current: number; previous: number; pctChange: number }[]>([]);
  const [showOutlierWarning, setShowOutlierWarning] = useState(false);
  const [unit, setUnit] = useState<"in" | "cm">("in");

  // Sync tape unit with global metric toggle
  useEffect(() => {
    const newUnit = uu.isMetric ? "cm" : "in";
    if (newUnit !== unit) {
      // Convert existing measurements
      setMeasurements(prev => {
        const converted: Record<FieldKey, string> = {} as any;
        for (const key of Object.keys(prev) as FieldKey[]) {
          const v = parseFloat(prev[key]);
          if (!v) { converted[key] = prev[key]; continue; }
          converted[key] = newUnit === "cm"
            ? (Math.round(v * 2.54 * 10) / 10).toString()
            : (Math.round((v / 2.54) * 10) / 10).toString();
        }
        return converted;
      });
      setUnit(newUnit);
    }
  }, [uu.isMetric]);
  const [weightInput, setWeightInput] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // History
  const [entries, setEntries] = useState<BFEntry[]>([]);
  const [retentionPct, setRetentionPct] = useState(() => {
    const saved = localStorage.getItem("tmb-bf-retention");
    return saved ? Number(saved) : 75;
  });
  const loadAndPopulate = useCallback(() => {
    const loaded = loadEntries();
    setEntries(loaded);
    if (loaded.length > 0) {
      const last = loaded[0];
      const m = last.measurements;
      setMeasurements({
        neck: m.neck ? String(m.neck) : "",
        chest: m.chest ? String(m.chest) : "",
        bicep: m.bicep ? String(m.bicep) : "",
        forearm: m.forearm ? String(m.forearm) : "",
        waist: m.waist ? String(m.waist) : "",
        hip: m.hip ? String(m.hip) : "",
        thigh: m.thigh ? String(m.thigh) : "",
        wrist: (m as any).wrist ? String((m as any).wrist) : "",
      });
      if (last.weightLbs) setWeightInput(String(last.weightLbs));
      setPrefilled(true);
    }
  }, []);

  useEffect(() => {
    loadAndPopulate();
  }, []);

  // Re-read from localStorage when cloud sync restores data
  useEffect(() => {
    const handler = () => loadAndPopulate();
    window.addEventListener("cloud-sync-restored", handler);
    return () => window.removeEventListener("cloud-sync-restored", handler);
  }, [loadAndPopulate]);

  // Computed
  const heightIn = (parseInt(heightFt) || 0) * 12 + (parseInt(heightInR) || 0);
  const toIn = (v: string) => {
    const n = parseFloat(v) || 0;
    return unit === "cm" ? Math.round((n / 2.54) * 10) / 10 : n;
  };

  const vals: Record<FieldKey, number> = {} as any;
  for (const f of FIELDS) {
    vals[f.key] = toIn(measurements[f.key]);
  }

  const gaugeWeight = getWeightFromGauge();
  const weightLbs = weightInput ? (parseFloat(weightInput) || gaugeWeight) : gaugeWeight;

  // Run all formulas
  const navyResult = navyBodyFat(vals.neck, vals.waist, heightIn);
  const ymcaResult = ymcaBodyFat(vals.waist, weightLbs);
  const cbResult = covertBaileyBodyFat(vals.waist, vals.hip, vals.forearm, vals.wrist);

  const formulas: FormulaResult[] = [
    {
      name: "Navy / DoD Method",
      shortName: "Navy",
      bf: navyResult ?? 0,
      available: navyResult !== null && navyResult > 0,
      note: "Uses neck, waist, height",
    },
    {
      name: "YMCA Formula",
      shortName: "YMCA",
      bf: ymcaResult ?? 0,
      available: ymcaResult !== null && ymcaResult > 0,
      note: `Uses waist, weight (${uu.wt(weightLbs)} ${uu.wtUnit})`,
    },
    {
      name: "Covert Bailey Method",
      shortName: "C. Bailey",
      bf: cbResult ?? 0,
      available: cbResult !== null && cbResult > 0,
      note: "Uses waist, hip, forearm, wrist",
    },
  ];

  const availableFormulas = formulas.filter(f => f.available);
  const composite = availableFormulas.length > 0
    ? availableFormulas.reduce((sum, f) => sum + f.bf, 0) / availableFormulas.length
    : null;
  const compositeCat = composite !== null ? getCategory(composite) : null;

  const handleMeasurement = useCallback((key: FieldKey, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos(prev => [...prev, reader.result as string].slice(-4));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, []);

  // Reasonable anatomical ranges for adult male (inches)
  const REASONABLE_RANGES: Record<string, [number, number]> = {
    neck: [12, 22], waist: [26, 55], hip: [30, 55], chest: [32, 56],
    bicep: [9, 22], forearm: [8, 18], thigh: [18, 35], wrist: [5, 10],
  };

  const checkOutliers = useCallback((): { key: string; label: string; current: number; previous: number; pctChange: number }[] => {
    const warnings: { key: string; label: string; current: number; previous: number; pctChange: number }[] = [];
    const prev = entries[0];
    for (const f of FIELDS) {
      const cur = vals[f.key];
      if (!cur || cur <= 0) continue;
      // Check reasonable anatomical range
      const range = REASONABLE_RANGES[f.key];
      if (range && (cur < range[0] || cur > range[1])) {
        warnings.push({ key: f.key, label: f.label, current: cur, previous: 0, pctChange: 100 });
        continue;
      }
      // Check deviation from last entry
      if (prev) {
        const prevVal = prev.measurements[f.key];
        if (prevVal && prevVal > 0) {
          const pctChange = Math.abs((cur - prevVal) / prevVal) * 100;
          if (pctChange > 15) {
            warnings.push({ key: f.key, label: f.label, current: Math.round(cur * 10) / 10, previous: Math.round(prevVal * 10) / 10, pctChange: Math.round(pctChange) });
          }
        }
      }
    }
    return warnings;
  }, [vals, entries]);

  const doSave = useCallback(() => {
    if (composite === null) return;
    const entry: BFEntry = {
      id: Date.now().toString(36),
      date: new Date().toISOString().slice(0, 10),
      measurements: { ...vals },
      heightIn,
      weightLbs,
      navy: navyResult && navyResult > 0 ? Math.round(navyResult * 10) / 10 : null,
      ymca: ymcaResult && ymcaResult > 0 ? Math.round(ymcaResult * 10) / 10 : null,
      covertBailey: cbResult && cbResult > 0 ? Math.round(cbResult * 10) / 10 : null,
      composite: Math.round(composite * 10) / 10,
      method: "tape",
      photos: photos.length > 0 ? photos : undefined,
    };
    const next = [entry, ...entries].slice(0, 20);
    setEntries(next);
    saveEntries(next);
    setShowOutlierWarning(false);
    setOutlierWarnings([]);
  }, [composite, vals, heightIn, weightLbs, navyResult, ymcaResult, cbResult, photos, entries]);

  const handleSave = useCallback(() => {
    if (composite === null) return;
    const warnings = checkOutliers();
    if (warnings.length > 0) {
      setOutlierWarnings(warnings);
      setShowOutlierWarning(true);
    } else {
      doSave();
    }
  }, [composite, checkOutliers, doSave]);

  const handleDelete = useCallback((id: string) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }, [entries]);

  const handleReset = useCallback(() => {
    setMeasurements({ neck: "", chest: "", bicep: "", forearm: "", waist: "", hip: "", thigh: "", wrist: "" });
    setWeightInput("");
    setPhotos([]);
  }, []);

  // Latest entry for header badge
  const latest = entries[0];

  return (
    <section className="container py-6">
      {!embedded && (
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground font-mono flex items-center gap-3 font-semibold">
          <span className="text-xl">📐</span> Body Fat Estimator
        </h2>
        <div className="flex items-center gap-3">
          {latest && (
            <span className={`text-xs font-mono font-bold ${getCategory(latest.composite).color}`}>
              {latest.composite}% · {getCategory(latest.composite).label}
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-[var(--primary)] transition-colors" />
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
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 border border-border bg-card p-4 space-y-6">


              {/* Height + Unit toggle */}
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Height</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={heightFt}
                      onChange={e => setHeightFt(e.target.value)}
                      onFocus={e => { const v = e.target.value; e.target.value = ''; e.target.value = v; }}
                      className="w-14 bg-background border border-border text-foreground text-sm font-mono px-2 py-1.5 text-center focus:outline-none focus:border-[var(--primary)] transition-colors"
                      placeholder={uu.isMetric ? "cm" : "ft"}
                    />
                    <span className="text-xs font-mono text-muted-foreground">{uu.isMetric ? "cm" : "ft"}</span>
                    {!uu.isMetric && (<>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={heightInR}
                      onChange={e => setHeightInR(e.target.value)}
                      onFocus={e => { const v = e.target.value; e.target.value = ''; e.target.value = v; }}
                      className="w-14 bg-background border border-border text-foreground text-sm font-mono px-2 py-1.5 text-center focus:outline-none focus:border-[var(--primary)] transition-colors"
                      placeholder="in"
                    />
                    <span className="text-xs font-mono text-muted-foreground">in</span>
                    </>)}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Tape Unit</label>
                  <div className="flex border border-border">
                    {(["in", "cm"] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => {
                          if (u !== unit) {
                            setMeasurements(prev => {
                              const converted: Record<FieldKey, string> = {} as any;
                              for (const key of Object.keys(prev) as FieldKey[]) {
                                const v = parseFloat(prev[key]);
                                if (!v) { converted[key] = prev[key]; continue; }
                                converted[key] = u === "cm"
                                  ? (Math.round(v * 2.54 * 10) / 10).toString()
                                  : (Math.round((v / 2.54) * 10) / 10).toString();
                              }
                              return converted;
                            });
                            setUnit(u);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                          unit === u
                            ? "bg-[var(--primary)] text-black font-bold"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Weight ({uu.wtUnit})</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    onFocus={e => { const v = e.target.value; e.target.value = ''; e.target.value = v; }}
                    placeholder={String(gaugeWeight)}
                    className="w-20 bg-background border border-border text-foreground text-sm font-mono px-2 py-1.5 text-center focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                  <span className="text-[9px] font-mono text-muted-foreground ml-1">{weightInput ? '' : `(gauge: ${gaugeWeight})` }</span>
                </div>
              </div>

              {/* Measurement inputs */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                  Circumference Measurements ({unit})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FIELDS.map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <button
                        onClick={() => setGuideField(field)}
                        className="shrink-0 w-8 h-8 flex items-center justify-center border border-border bg-background hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors cursor-pointer group/guide"
                        title={`How to measure ${field.label}`}
                      >
                        <Info className="w-3.5 h-3.5 text-muted-foreground group-hover/guide:text-[var(--primary)] transition-colors" />
                      </button>
                      <div className="flex-1 flex items-center border border-border bg-background focus-within:border-[var(--primary)] transition-colors">
                        <span className="text-xs font-mono text-muted-foreground pl-3 pr-2 w-20 shrink-0">
                          {field.label}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.25"
                          value={measurements[field.key]}
                          onChange={e => handleMeasurement(field.key, e.target.value)}
                          onFocus={e => { const v = e.target.value; e.target.value = ''; e.target.value = v; }}
                          className="flex-1 bg-transparent text-foreground text-sm font-mono px-3 py-2 text-center focus:outline-none"
                          placeholder={`0.0 ${unit}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Multi-formula results */}
              {composite !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Composite result */}
                  <div className="border border-border bg-background p-4">
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className={`text-3xl font-mono font-bold ${compositeCat!.color}`}>
                        {composite.toFixed(1)}%
                      </span>
                      <span className={`text-sm font-mono font-semibold ${compositeCat!.color}`}>
                        {compositeCat!.label}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground ml-auto">
                        Composite ({availableFormulas.length} formula{availableFormulas.length > 1 ? "s" : ""})
                      </span>
                    </div>

                    {/* Lean / Fat mass */}
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">Est. Fat Mass</span>
                        <span className="text-sm font-mono text-foreground">
                          ~{uu.wt((composite / 100) * weightLbs, 0)} {uu.wtUnit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">Est. Lean Mass</span>
                        <span className="text-sm font-mono text-[var(--primary)]">
                          ~{uu.wt(weightLbs - (composite / 100) * weightLbs, 0)} {uu.wtUnit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual formula breakdown */}
                  <div className="border border-border bg-background">
                    <div className="px-4 py-2 border-b border-border">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        Formula Breakdown
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {formulas.map(f => {
                        const fCat = f.available ? getCategory(f.bf) : null;
                        return (
                          <div key={f.shortName} className="px-4 py-2.5 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${f.available ? fCat!.barColor : "bg-zinc-700"}`} />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-mono text-foreground font-semibold">{f.name}</span>
                              <span className="text-[9px] font-mono text-muted-foreground ml-2">{f.note}</span>
                            </div>
                            {f.available ? (
                              <span className={`text-sm font-mono font-bold ${fCat!.color} shrink-0`}>
                                {f.bf.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">
                                needs more data
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Current BF% Display — ALWAYS VISIBLE ── */}
              {(() => {
                const displayBf = latest?.composite ?? (composite !== null ? Math.round(composite * 10) / 10 : null);
                const displayCat = displayBf !== null ? getCategory(displayBf) : null;
                const prevEntry = entries[1];
                const delta = latest && prevEntry ? Math.round((latest.composite - prevEntry.composite) * 10) / 10 : null;
                return (
                  <div className="border border-border bg-background">
                    <div className="px-4 py-2 border-b border-border">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        Current Body Fat %
                      </span>
                    </div>
                    <div className="p-4">
                      {displayBf !== null && displayCat !== null ? (
                        <div>
                          {/* Big BF% number + category */}
                          <div className="flex items-baseline gap-3 mb-4">
                            <span className={`text-5xl font-mono font-bold ${displayCat.color} leading-none`}>
                              {displayBf.toFixed(1)}
                              <span className="text-2xl">%</span>
                            </span>
                            <div className="flex flex-col">
                              <span className={`text-sm font-mono font-semibold ${displayCat.color}`}>
                                {displayCat.label}
                              </span>
                              {delta !== null && (
                                <span className={`text-xs font-mono ${
                                  delta < 0 ? "text-green-400" : delta > 0 ? "text-red-400" : "text-muted-foreground"
                                }`}>
                                  {delta > 0 ? "+" : ""}{delta}% from last
                                </span>
                              )}
                              {latest && (
                                <span className="text-[9px] font-mono text-muted-foreground/60">
                                  measured {latest.date}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Category spectrum bar */}
                          <div className="space-y-1.5">
                            <div className="flex gap-0.5 h-3 rounded-sm overflow-hidden">
                              {CATEGORIES.map(cat => (
                                <div
                                  key={cat.label}
                                  className={`flex-1 relative ${cat.barColor} ${
                                    displayCat.label === cat.label ? "opacity-100" : "opacity-30"
                                  } transition-opacity`}
                                >
                                  {displayCat.label === cat.label && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between">
                              {CATEGORIES.map(cat => (
                                <span
                                  key={cat.label}
                                  className={`text-[8px] font-mono flex-1 text-center ${
                                    displayCat.label === cat.label ? cat.color + " font-bold" : "text-muted-foreground/50"
                                  }`}
                                >
                                  {cat.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-3xl font-mono text-muted-foreground/30 block mb-2">—%</span>
                          <span className="text-xs font-mono text-muted-foreground">
                            Enter measurements above and save to see your BF%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Weight → BF% Projection Table — ALWAYS VISIBLE ── */}
              {(() => {
                // Use composite if available, otherwise default visual estimate of 22%
                const activeBf = composite ?? 22;
                const leanMass = weightLbs - (activeBf / 100) * weightLbs;
                const muscleRetention = retentionPct / 100;
                const projections: { weight: number; bf: number; leanEst: number; fatEst: number; isCurrent: boolean; isGoal: boolean }[] = [];

                // First row: actual current weight (not rounded)
                const calcRow = (w: number) => {
                  const totalLost = weightLbs - w;
                  const muscleLost = totalLost * (1 - muscleRetention);
                  const adjLean = leanMass - muscleLost;
                  const adjFat = w - adjLean;
                  const bf = (adjFat / w) * 100;
                  return { weight: w, bf, leanEst: adjLean, fatEst: adjFat };
                };

                // Row 1: exact current weight
                const currentRow = calcRow(weightLbs);
                if (currentRow.bf > 0) {
                  projections.push({ ...currentRow, isCurrent: true, isGoal: weightLbs === 205 });
                }

                // Subsequent rows: nearest multiple of 5 below current weight, stepping down by 5
                let start5 = Math.floor(weightLbs / 5) * 5;
                if (start5 >= weightLbs) start5 -= 5;
                for (let w = start5; w >= 195; w -= 5) {
                  const row = calcRow(w);
                  if (row.bf > 0) {
                    projections.push({ ...row, isCurrent: false, isGoal: w === 205 });
                  }
                }

                return (
                  <div className="border border-border bg-background">
                    <div className="px-4 py-2 border-b border-border">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        Weight → BF% Projection
                      </span>
                      {composite === null && (
                        <span className="text-[9px] font-mono text-muted-foreground/60 ml-2">
                          (using visual estimate ~22% — enter measurements for precision)
                        </span>
                      )}
                    </div>
                    <div className="px-4 py-2 border-b border-border flex items-center gap-3">
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0">Muscle Retention</span>
                      <input
                        type="range"
                        min={50}
                        max={95}
                        step={5}
                        value={retentionPct}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setRetentionPct(val);
                          localStorage.setItem("tmb-bf-retention", String(val));
                        }}
                        className="flex-1 h-1 accent-[var(--primary)] cursor-pointer"
                      />
                      <span className="text-xs font-mono text-[var(--primary)] font-bold w-10 text-right">{retentionPct}%</span>
                      <span className="text-[9px] font-mono text-muted-foreground/60 hidden sm:inline">
                        ({100 - retentionPct}% muscle loss)
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {projections.map(p => {
                        const pCat = getCategory(p.bf);
                        return (
                          <div
                            key={p.weight}
                            className={`px-4 py-2.5 grid grid-cols-[4.5rem_3.5rem_5rem_3.5rem] items-center text-xs font-mono tabular-nums ${
                              p.isCurrent
                                ? "bg-[var(--primary)]/5 border-l-2 border-l-[var(--primary)]"
                                : p.isGoal
                                ? "bg-green-500/5 border-l-2 border-l-green-400"
                                : "border-l-2 border-l-border"
                            }`}
                          >
                            <span className={`font-bold text-foreground`}>
                              {p.isCurrent ? uu.wt(p.weight, 1) : uu.wt(p.weight, 0)} {uu.wtUnit}
                            </span>
                            <span className={`text-right font-bold ${pCat.color}`}>
                              {p.bf.toFixed(1)}%
                            </span>
                            <span className="text-right text-cyan-400 font-semibold">
                              {Math.round(p.leanEst)} lean
                            </span>
                            <span className="text-right text-muted-foreground">
                              {Math.round(p.fatEst)} fat
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-4 py-2 border-t border-border">
                      <p className="text-[9px] font-mono text-muted-foreground/60">
                        Projections update automatically as you log new measurements and weight. Strength training during a cut can improve retention to 85–90%.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Photo section */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-2">
                  Reference Photos (optional — for visual comparison)
                </label>
                <div className="flex flex-wrap gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 border border-border bg-background overflow-hidden group/photo">
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 4 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-20 h-20 border border-dashed border-border bg-background hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[9px] font-mono text-muted-foreground">Add</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhoto}
                  className="hidden"
                />
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-1.5">
                  Front & side photos help track visual changes over time. Photos stay on your device only.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={composite === null}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] font-bold transition-colors cursor-pointer ${
                    composite !== null
                      ? "bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Save Entry
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* History */}
              {entries.length > 0 && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-2">
                    History
                  </label>
                  <div className="space-y-1">
                    {entries.map(entry => {
                      const ec = getCategory(entry.composite);
                      const methods = [
                        entry.navy !== null ? `Navy: ${entry.navy}%` : null,
                        entry.ymca !== null ? `YMCA: ${entry.ymca}%` : null,
                        entry.covertBailey !== null ? `CB: ${entry.covertBailey}%` : null,
                      ].filter(Boolean);
                      const isExpanded = expandedEntryId === entry.id;
                      const m = entry.measurements;
                      return (
                        <div key={entry.id} className="border border-border bg-background">
                          <button
                            onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                            className="w-full flex items-center gap-3 py-2 px-2 hover:bg-white/[0.02] transition-colors cursor-pointer"
                          >
                            <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{entry.date}</span>
                            <span className={`text-sm font-mono font-bold ${ec.color}`}>{entry.composite}%</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{ec.label}</span>
                            <span className="text-[9px] font-mono text-muted-foreground/70 ml-auto hidden sm:inline">
                              {methods.join(" · ")}
                            </span>
                            {entry.photos && entry.photos.length > 0 && (
                              <Camera className="w-3 h-3 text-muted-foreground" />
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
                                  {/* Formula Results */}
                                  <div>
                                    <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/70 block mb-1">Formula Results</span>
                                    <div className="grid grid-cols-3 gap-2">
                                      {entry.navy !== null && (
                                        <div className="text-center py-1.5 bg-card border border-border">
                                          <div className="text-[9px] font-mono text-muted-foreground">Navy</div>
                                          <div className={`text-sm font-mono font-bold ${getCategory(entry.navy).color}`}>{entry.navy}%</div>
                                        </div>
                                      )}
                                      {entry.ymca !== null && (
                                        <div className="text-center py-1.5 bg-card border border-border">
                                          <div className="text-[9px] font-mono text-muted-foreground">YMCA</div>
                                          <div className={`text-sm font-mono font-bold ${getCategory(entry.ymca).color}`}>{entry.ymca}%</div>
                                        </div>
                                      )}
                                      {entry.covertBailey !== null && (
                                        <div className="text-center py-1.5 bg-card border border-border">
                                          <div className="text-[9px] font-mono text-muted-foreground">C. Bailey</div>
                                          <div className={`text-sm font-mono font-bold ${getCategory(entry.covertBailey).color}`}>{entry.covertBailey}%</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {/* Measurements */}
                                  <div>
                                    <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/70 block mb-1">Measurements</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                                      {(["neck", "chest", "bicep", "forearm", "waist", "hip", "thigh"] as const).map(k => {
                                        const v = m[k];
                                        if (!v || v <= 0) return null;
                                        const display = uu.isMetric ? (v * 2.54).toFixed(1) : (Math.round(v * 10) / 10).toString();
                                        const suffix = uu.isMetric ? " cm" : '"';
                                        return (
                                          <div key={k} className="flex justify-between text-xs font-mono">
                                            <span className="text-muted-foreground">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                                            <span className="text-foreground">{display}{suffix}</span>
                                          </div>
                                        );
                                      })}
                                      {(m as any).wrist > 0 && (
                                        <div className="flex justify-between text-xs font-mono">
                                          <span className="text-muted-foreground">Wrist</span>
                                          <span className="text-foreground">{uu.isMetric ? ((m as any).wrist * 2.54).toFixed(1) + " cm" : (Math.round((m as any).wrist * 10) / 10) + '"'}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {/* Weight + Body Comp */}
                                  <div className="flex items-center gap-4 text-xs font-mono">
                                    <span className="text-muted-foreground">Weight: <span className="text-foreground font-bold">{uu.wt(entry.weightLbs, 1)} {uu.wtUnit}</span></span>
                                    <span className="text-muted-foreground">Fat: <span className="text-red-400 font-bold">~{Math.round((entry.composite / 100) * entry.weightLbs)} {uu.wtUnit}</span></span>
                                    <span className="text-muted-foreground">Lean: <span className="text-cyan-400 font-bold">~{Math.round(entry.weightLbs - (entry.composite / 100) * entry.weightLbs)} {uu.wtUnit}</span></span>
                                  </div>
                                  {/* Delete button */}
                                  <div className="flex justify-end">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(entry.id); }}
                                      className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <ConfirmDeleteDialog
        open={!!confirmDeleteId}
        title="Delete Entry?"
        description="This measurement entry will be permanently removed. This cannot be undone."
        onConfirm={() => { if (confirmDeleteId) { handleDelete(confirmDeleteId); setConfirmDeleteId(null); } }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Outlier warning modal */}
      <AnimatePresence>
        {showOutlierWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => { setShowOutlierWarning(false); setOutlierWarnings([]); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-card border border-yellow-500/40 max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-yellow-500/30 bg-yellow-500/5">
                <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-yellow-400 font-semibold flex items-center gap-2">
                  <span className="text-lg">⚠</span> Measurement Check
                </h3>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  {outlierWarnings.length === 1 ? "1 measurement looks" : `${outlierWarnings.length} measurements look`} unusual compared to your last entry.
                </p>
              </div>
              <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                {outlierWarnings.map(w => (
                  <div key={w.key} className="flex items-center justify-between text-xs font-mono border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                    <span className="text-yellow-400 font-semibold">{w.label}</span>
                    <div className="text-right">
                      {w.previous > 0 ? (
                        <>
                          <span className="text-muted-foreground">{w.previous}"</span>
                          <span className="text-yellow-400 mx-1">→</span>
                          <span className="text-foreground font-bold">{w.current}"</span>
                          <span className="text-yellow-400 ml-2">({w.pctChange > 0 ? "+" : ""}{w.pctChange}%)</span>
                        </>
                      ) : (
                        <span className="text-yellow-400">Out of range: {w.current}"</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <button
                  onClick={() => { setShowOutlierWarning(false); setOutlierWarnings([]); }}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  onClick={doSave}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors cursor-pointer"
                >
                  Save Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide modal */}
      <AnimatePresence>
        {guideField && <GuideModal field={guideField} onClose={() => setGuideField(null)} />}
      </AnimatePresence>
    </section>
  );
}
