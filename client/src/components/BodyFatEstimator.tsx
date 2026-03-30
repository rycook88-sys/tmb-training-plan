// ============================================================
// Body Fat Estimator — Navy/DoD Method + Photo Reference
// Design: Alpine Command Center / Topographic Brutalism
// ============================================================
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info, X, Camera, Trash2, RotateCcw } from "lucide-react";

// ── Guide images (CDN) ──────────────────────────────────────
const GUIDE_IMAGES = {
  neck: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-neck-dU4hoeM9RNsTid6yU45zP4.webp",
  waist: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-waist-5vVK8eK8GgnLzRhm93wTh8.webp",
  hip: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/measure-hip-ihFs99LzAw8JaiCMEYEMB8.webp",
};

// ── Measurement fields ──────────────────────────────────────
interface MeasurementField {
  key: "neck" | "waist" | "hip";
  label: string;
  hint: string;
  guideImage: string;
}

const FIELDS: MeasurementField[] = [
  { key: "neck", label: "Neck", hint: "Measure at the narrowest point, just below the Adam's apple", guideImage: GUIDE_IMAGES.neck },
  { key: "waist", label: "Waist", hint: "Measure at navel level, relaxed (don't suck in)", guideImage: GUIDE_IMAGES.waist },
  { key: "hip", label: "Hip", hint: "Measure at the widest point of the buttocks", guideImage: GUIDE_IMAGES.hip },
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
  { label: "Essential", range: "2–5%", min: 2, max: 5, color: "text-red-400", barColor: "bg-red-500" },
  { label: "Athletic", range: "6–13%", min: 6, max: 13, color: "text-[var(--primary)]", barColor: "bg-[var(--primary)]" },
  { label: "Fitness", range: "14–17%", min: 14, max: 17, color: "text-green-400", barColor: "bg-green-500" },
  { label: "Average", range: "18–24%", min: 18, max: 24, color: "text-yellow-400", barColor: "bg-yellow-500" },
  { label: "Above Avg", range: "25%+", min: 25, max: 40, color: "text-zinc-400", barColor: "bg-zinc-500" },
];

function getCategory(bf: number): BFCategory {
  return CATEGORIES.find(c => bf >= c.min && bf <= c.max) || CATEGORIES[CATEGORIES.length - 1];
}

// ── Navy method formula (male) ──────────────────────────────
function navyBodyFat(neck: number, waist: number, hip: number, heightIn: number): number {
  // US Navy / DoD formula for males (inches)
  // BF% = 86.010 × log10(waist − neck) − 70.041 × log10(height) + 36.76
  const diff = waist - neck;
  if (diff <= 0 || heightIn <= 0) return 0;
  return 86.010 * Math.log10(diff) - 70.041 * Math.log10(heightIn) + 36.76;
}

// ── Persistence ─────────────────────────────────────────────
const STORAGE_KEY = "tmb-bodyfat-entries";

interface BFEntry {
  id: string;
  date: string;
  neck: number;
  waist: number;
  hip: number;
  heightIn: number;
  bf: number;
  method: "tape";
  photos?: string[]; // base64 data URLs
}

function loadEntries(): BFEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
  const [heightInR, setHeightInR] = useState("1");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [unit, setUnit] = useState<"in" | "cm">("in");

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // History
  const [entries, setEntries] = useState<BFEntry[]>([]);
  useEffect(() => { setEntries(loadEntries()); }, []);

  // Computed
  const heightIn = (parseInt(heightFt) || 0) * 12 + (parseInt(heightInR) || 0);
  const toIn = (v: string) => {
    const n = parseFloat(v) || 0;
    return unit === "cm" ? n / 2.54 : n;
  };
  const neckIn = toIn(neck);
  const waistIn = toIn(waist);
  const hipIn = toIn(hip);
  const canCalc = neckIn > 0 && waistIn > 0 && heightIn > 0 && waistIn > neckIn;
  const bf = canCalc ? Math.max(0, navyBodyFat(neckIn, waistIn, hipIn, heightIn)) : null;
  const cat = bf !== null ? getCategory(bf) : null;

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
    if (bf === null) return;
    const entry: BFEntry = {
      id: Date.now().toString(36),
      date: new Date().toISOString().slice(0, 10),
      neck: neckIn,
      waist: waistIn,
      hip: hipIn,
      heightIn,
      bf: Math.round(bf * 10) / 10,
      method: "tape",
      photos: photos.length > 0 ? photos : undefined,
    };
    const next = [entry, ...entries].slice(0, 20);
    setEntries(next);
    saveEntries(next);
  }, [bf, neckIn, waistIn, hipIn, heightIn, photos, entries]);

  const handleDelete = useCallback((id: string) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }, [entries]);

  const handleReset = useCallback(() => {
    setNeck("");
    setWaist("");
    setHip("");
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
            <span className={`text-xs font-mono font-bold ${getCategory(latest.bf).color}`}>
              {latest.bf}% · {getCategory(latest.bf).label}
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
                  <span className="text-foreground font-semibold">Note for muscular athletes:</span> The Navy tape method can overestimate body fat by 3–5% if you carry significant muscle mass, since it relies on circumference ratios. Use this as a <span className="text-[var(--primary)]">trend tracker</span> rather than an absolute number. Photo comparisons alongside measurements give a more complete picture.
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
              </div>

              {/* Measurement inputs */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                  Circumference Measurements ({unit})
                </label>
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
                      <span className="text-xs font-mono text-muted-foreground pl-3 pr-2 w-16 shrink-0">{field.label}</span>
                      <input
                        type="number"
                        step="0.25"
                        value={field.key === "neck" ? neck : field.key === "waist" ? waist : hip}
                        onChange={e => {
                          const v = e.target.value;
                          if (field.key === "neck") setNeck(v);
                          else if (field.key === "waist") setWaist(v);
                          else setHip(v);
                        }}
                        className="flex-1 bg-transparent text-foreground text-sm font-mono px-2 py-2 focus:outline-none"
                        placeholder={`0.0 ${unit}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Result */}
              {bf !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border bg-background p-4"
                >
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className={`text-3xl font-mono font-bold ${cat!.color}`}>
                      {bf.toFixed(1)}%
                    </span>
                    <span className={`text-sm font-mono font-semibold ${cat!.color}`}>
                      {cat!.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground ml-auto">
                      Navy / DoD Method
                    </span>
                  </div>

                  {/* Category bar */}
                  <div className="flex h-2 w-full gap-0.5 mb-2">
                    {CATEGORIES.map(c => (
                      <div
                        key={c.label}
                        className={`flex-1 ${c.barColor} ${
                          cat!.label === c.label ? "opacity-100" : "opacity-20"
                        } transition-opacity`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                    {CATEGORIES.map(c => (
                      <span key={c.label} className={cat!.label === c.label ? "text-foreground font-bold" : ""}>
                        {c.range}
                      </span>
                    ))}
                  </div>

                  {/* Lean mass estimate */}
                  {entries.length > 0 && entries[0].bf && (
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">Est. Fat Mass</span>
                        <span className="text-sm font-mono text-foreground">
                          ~{((bf / 100) * (parseInt(heightFt) > 0 ? 226 : 0)).toFixed(0)} lbs
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">Est. Lean Mass</span>
                        <span className="text-sm font-mono text-[var(--primary)]">
                          ~{(226 - (bf / 100) * 226).toFixed(0)} lbs
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

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
                  disabled={bf === null}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-[0.15em] font-bold transition-colors cursor-pointer ${
                    bf !== null
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
                      const ec = getCategory(entry.bf);
                      return (
                        <div key={entry.id} className="flex items-center gap-3 py-1.5 px-2 border border-border bg-background group/entry">
                          <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{entry.date}</span>
                          <span className={`text-sm font-mono font-bold ${ec.color}`}>{entry.bf}%</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{ec.label}</span>
                          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                            N:{entry.neck.toFixed(1)}" W:{entry.waist.toFixed(1)}"
                          </span>
                          {entry.photos && entry.photos.length > 0 && (
                            <Camera className="w-3 h-3 text-muted-foreground" />
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="opacity-0 group-hover/entry:opacity-100 text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
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

      {/* Guide modal */}
      <AnimatePresence>
        {guideField && <GuideModal field={guideField} onClose={() => setGuideField(null)} />}
      </AnimatePresence>
    </section>
  );
}
