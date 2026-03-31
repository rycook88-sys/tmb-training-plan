// ============================================================
// Body Fat Estimator — Multi-Formula (Navy, YMCA, Covert Bailey)
// Design: Alpine Command Center / Topographic Brutalism
// ============================================================
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info, X, Camera, Trash2, RotateCcw } from "lucide-react";

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
export default function BodyFatEstimator() {
  const [open, setOpen] = useState(false);
  const [guideField, setGuideField] = useState<MeasurementField | null>(null);

  // Inputs
  const [heightFt, setHeightFt] = useState("6");
  const [heightInR, setHeightInR] = useState("2");
  const [measurements, setMeasurements] = useState<Record<FieldKey, string>>({
    neck: "", chest: "", bicep: "", forearm: "", waist: "", hip: "", thigh: "", wrist: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [unit, setUnit] = useState<"in" | "cm">("in");
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
  useEffect(() => {
    const loaded = loadEntries();
    setEntries(loaded);
    // Pre-populate from last saved entry
    if (loaded.length > 0 && !prefilled) {
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

  // Computed
  const heightIn = (parseInt(heightFt) || 0) * 12 + (parseInt(heightInR) || 0);
  const toIn = (v: string) => {
    const n = parseFloat(v) || 0;
    return unit === "cm" ? n / 2.54 : n;
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
      note: `Uses waist, weight (${weightLbs} lb)`,
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

  const handleSave = useCallback(() => {
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
  }, [composite, vals, heightIn, weightLbs, navyResult, ymcaResult, cbResult, photos, entries]);

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

              {/* Muscle caveat */}
              <div className="flex items-start gap-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-3">
                <Info className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">Multi-formula approach:</span> We run 3 different formulas and average the results for a more reliable estimate. Individual formulas can vary by 3–5% — the composite narrows the range. For muscular builds, treat this as a <span className="text-[var(--primary)]">trend tracker</span> rather than an absolute number.
                </p>
              </div>

              {/* Height + Unit toggle */}
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Height</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={heightFt}
                      onChange={e => setHeightFt(e.target.value)}
                      className="w-14 bg-background border border-border text-foreground text-sm font-mono px-2 py-1.5 text-center focus:outline-none focus:border-[var(--primary)] transition-colors"
                      placeholder="ft"
                    />
                    <span className="text-xs font-mono text-muted-foreground">ft</span>
                    <input
                      type="number"
                      value={heightInR}
                      onChange={e => setHeightInR(e.target.value)}
                      className="w-14 bg-background border border-border text-foreground text-sm font-mono px-2 py-1.5 text-center focus:outline-none focus:border-[var(--primary)] transition-colors"
                      placeholder="in"
                    />
                    <span className="text-xs font-mono text-muted-foreground">in</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Tape Unit</label>
                  <div className="flex border border-border">
                    {(["in", "cm"] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
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
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Weight (lb)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
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
                          {field.required && <span className="text-[var(--primary)] ml-0.5">*</span>}
                        </span>
                        <input
                          type="number"
                          step="0.25"
                          value={measurements[field.key]}
                          onChange={e => handleMeasurement(field.key, e.target.value)}
                          className="flex-1 bg-transparent text-foreground text-sm font-mono px-2 py-2 focus:outline-none"
                          placeholder={`0.0 ${unit}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-muted-foreground/60 mt-1">
                  <span className="text-[var(--primary)]">*</span> Required for Navy formula. More measurements = more formulas = better accuracy.
                </p>
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
                          ~{((composite / 100) * weightLbs).toFixed(0)} lbs
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">Est. Lean Mass</span>
                        <span className="text-sm font-mono text-[var(--primary)]">
                          ~{(weightLbs - (composite / 100) * weightLbs).toFixed(0)} lbs
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

              {/* ── Visual BF% Reference Strip — ALWAYS VISIBLE ── */}
              <div className="border border-border bg-background">
                <div className="px-4 py-2 border-b border-border">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    Visual Reference — Similar Build at Different BF%
                  </span>
                </div>
                <div className="p-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {[
                      { pct: 12, label: "12%", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/bf-silhouette-12pct-Sh2eTgfhftWgEmKzevuzAQ.webp" },
                      { pct: 15, label: "15%", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/bf-silhouette-15pct-2FL65UkjtYQ4hhHNkxoxw9.webp" },
                      { pct: 18, label: "18%", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/bf-ref-18pct-v3-SHkY3qWQneC8NK9UrKWzGi.webp" },
                      { pct: 22, label: "22%", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/bf-ref-22pct-v2-TVFGkneCg3g7uh24oRx7Ms.webp" },
                      { pct: 25, label: "25%", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/bf-ref-25pct-v2-AhFBKktUxNKtu6SJ4P4GnK.webp" },
                    ].map(ref => {
                      // Use composite if available, otherwise default visual estimate of 22%
                      const activeBf = composite ?? 22;
                      const isClosest = Math.abs(activeBf - ref.pct) <= 3;

                      return (
                        <div
                          key={ref.pct}
                          className={`shrink-0 w-28 border transition-all ${
                            isClosest
                              ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/30"
                              : "border-border"
                          }`}
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                            <img
                              src={ref.img}
                              alt={`${ref.label} body fat reference`}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className={`px-2 py-1.5 text-center ${
                            isClosest ? "bg-[var(--primary)]/10" : "bg-background"
                          }`}>
                            <span className={`text-sm font-mono font-bold block ${
                              isClosest ? "text-[var(--primary)]" : "text-foreground"
                            }`}>
                              {ref.label}
                            </span>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground/60 mt-2">
                    {composite !== null
                      ? `Your current estimate (${composite.toFixed(1)}%) is highlighted. Illustrations show a similar muscular build at each level.`
                      : "Based on visual estimate (~22%). Enter measurements above for a more precise highlight."
                    }
                  </p>
                </div>
              </div>

              {/* ── Weight → BF% Projection Table — ALWAYS VISIBLE ── */}
              {(() => {
                // Use composite if available, otherwise default visual estimate of 22%
                const activeBf = composite ?? 22;
                const leanMass = weightLbs - (activeBf / 100) * weightLbs;
                // Assume some muscle loss during cut: ~0.25 lb muscle lost per 1 lb total lost
                const muscleRetention = retentionPct / 100;
                const projections: { weight: number; bf: number; leanEst: number; fatEst: number }[] = [];
                for (let w = Math.ceil(weightLbs / 5) * 5; w >= 195; w -= 5) {
                  const totalLost = weightLbs - w;
                  const muscleLost = totalLost * (1 - muscleRetention);
                  const adjLean = leanMass - muscleLost;
                  const adjFat = w - adjLean;
                  const bf = (adjFat / w) * 100;
                  if (bf > 0) projections.push({ weight: w, bf, leanEst: adjLean, fatEst: adjFat });
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
                        const isCurrent = p.weight === Math.ceil(weightLbs / 5) * 5;
                        const isTarget = p.weight === 205;
                        return (
                          <div
                            key={p.weight}
                            className={`px-4 py-2 flex items-center text-xs font-mono ${
                              isCurrent ? "bg-[var(--primary)]/5" : isTarget ? "bg-green-500/5" : ""
                            }`}
                          >
                            <span className={`w-16 shrink-0 font-bold ${
                              isCurrent ? "text-[var(--primary)]" : isTarget ? "text-green-400" : "text-foreground"
                            }`}>
                              {p.weight} lb
                            </span>
                            <span className={`w-14 text-right font-bold ${pCat.color}`}>
                              {p.bf.toFixed(1)}%
                            </span>
                            <span className="w-20 text-right text-cyan-400 font-semibold">
                              {p.leanEst.toFixed(0)} lean
                            </span>
                            <span className="w-16 text-right text-muted-foreground">
                              {p.fatEst.toFixed(0)} fat
                            </span>
                            <span className="flex-1 text-right">
                              {isCurrent && (
                                <span className="text-[9px] text-[var(--primary)] font-bold">NOW</span>
                              )}
                              {isTarget && !isCurrent && (
                                <span className="text-[9px] text-green-400 font-bold">GOAL</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-4 py-2 border-t border-border">
                      <p className="text-[9px] font-mono text-muted-foreground/60">
                        Projections update automatically as you log new measurements and weight. Muscle loss ratio is conservative — strength training during a cut can improve retention to 85–90%.
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
                        entry.navy !== null ? `Navy:${entry.navy}%` : null,
                        entry.ymca !== null ? `YMCA:${entry.ymca}%` : null,
                        entry.covertBailey !== null ? `CB:${entry.covertBailey}%` : null,
                      ].filter(Boolean);
                      return (
                        <div key={entry.id} className="flex items-center gap-3 py-1.5 px-2 border border-border bg-background group/entry">
                          <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{entry.date}</span>
                          <span className={`text-sm font-mono font-bold ${ec.color}`}>{entry.composite}%</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{ec.label}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/70 ml-auto hidden sm:inline">
                            {methods.join(" · ")}
                          </span>
                          {entry.photos && entry.photos.length > 0 && (
                            <Camera className="w-3 h-3 text-muted-foreground" />
                          )}
                          <button
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className="text-muted-foreground/50 hover:text-red-400 transition-all cursor-pointer ml-1"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border p-6 max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-foreground font-semibold mb-2">Delete Entry?</h3>
              <p className="text-xs font-mono text-muted-foreground mb-4">This measurement entry will be permanently removed. This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                  className="flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer font-bold"
                >
                  Delete
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
