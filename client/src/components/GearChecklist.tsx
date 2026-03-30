import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Package, AlertTriangle, Minus, Plus, RotateCcw, Trash2, PlusCircle, X, ExternalLink } from "lucide-react";

/* ── Types ─────────────────────────────────────────── */
interface GearItem {
  id: string;
  name: string;
  category: string;
  weightOz: number;
  packed: boolean;
  worn: boolean;
  maybe: boolean;
  buyLink?: string;
}

const CATEGORIES = ["Pack", "Clothing", "Sleep", "Water", "Navigation", "Safety", "Electronics", "Money", "Toiletries", "Worn"];

const INITIAL_GEAR: GearItem[] = [
  { id: "pack", name: "Osprey Talon 34", category: "Pack", weightOz: 38, packed: true, worn: false, maybe: false },
  { id: "thermal", name: "Medium Wool Thermal Top", category: "Clothing", weightOz: 8, packed: true, worn: false, maybe: false },
  { id: "puffy", name: "Puffy Jacket", category: "Clothing", weightOz: 14, packed: true, worn: false, maybe: false },
  { id: "rain-coat", name: "Rain Coat", category: "Clothing", weightOz: 10, packed: true, worn: false, maybe: false },
  { id: "rain-pants", name: "Rain Pants", category: "Clothing", weightOz: 7, packed: true, worn: false, maybe: false },
  { id: "running-shorts", name: "Running Shorts", category: "Clothing", weightOz: 5, packed: true, worn: false, maybe: false },
  { id: "beanie", name: "Beanie", category: "Clothing", weightOz: 2, packed: true, worn: false, maybe: false },
  { id: "socks-1", name: "Backup Socks (pair 1)", category: "Clothing", weightOz: 3, packed: true, worn: false, maybe: false },
  { id: "socks-2", name: "Backup Socks (pair 2)", category: "Clothing", weightOz: 3, packed: true, worn: false, maybe: false },
  { id: "sleep-liner", name: "Sleep Liner", category: "Sleep", weightOz: 8, packed: true, worn: false, maybe: false },
  { id: "water-1", name: "Smart Water Bottle #1", category: "Water", weightOz: 1.5, packed: true, worn: false, maybe: false },
  { id: "water-2", name: "Smart Water Bottle #2", category: "Water", weightOz: 1.5, packed: true, worn: false, maybe: false },
  { id: "map", name: "Map", category: "Navigation", weightOz: 3, packed: true, worn: false, maybe: false },
  { id: "first-aid", name: "First Aid Kit", category: "Safety", weightOz: 6, packed: true, worn: false, maybe: false },
  { id: "electronics", name: "Electronics Bag", category: "Electronics", weightOz: 12, packed: true, worn: false, maybe: false },
  { id: "money", name: "Euros & Francs", category: "Money", weightOz: 2, packed: true, worn: false, maybe: false },
  { id: "toiletries", name: "Toiletries", category: "Toiletries", weightOz: 6, packed: true, worn: false, maybe: false },
  { id: "water-filter", name: "Water Filter", category: "Water", weightOz: 5, packed: false, worn: false, maybe: true },
  { id: "dirty-girls", name: "Dirty Girl Gaiters", category: "Clothing", weightOz: 2, packed: false, worn: false, maybe: false },
  { id: "knee-bands", name: "Patellar Tendon Bands (x2)", category: "Safety", weightOz: 3, packed: false, worn: false, maybe: false },
  { id: "buff", name: "Merino Buff / Bandana", category: "Clothing", weightOz: 2, packed: false, worn: false, maybe: false },
  { id: "insoles", name: "Superfeet Hike Support Insoles", category: "Worn", weightOz: 4, packed: false, worn: true, maybe: false },
  { id: "merino-tee", name: "Merino Wool T-Shirt (2nd shirt)", category: "Clothing", weightOz: 5, packed: false, worn: false, maybe: false },
  { id: "merino-boxers", name: "Merino Boxer Briefs (x2)", category: "Clothing", weightOz: 6, packed: false, worn: false, maybe: false, buyLink: "https://www.smartwool.com/shop/mens-active-boxer-brief-sw0168" },
  { id: "hiking-shoes", name: "Hiking Shoes", category: "Worn", weightOz: 44, packed: true, worn: true, maybe: false },
  { id: "zip-pants", name: "Zip-Off Pants", category: "Worn", weightOz: 14, packed: true, worn: true, maybe: false },
  { id: "compression", name: "Compression Shorts", category: "Worn", weightOz: 4, packed: true, worn: true, maybe: false },
  { id: "sun-hoodie", name: "Sun Hoodie", category: "Worn", weightOz: 8, packed: true, worn: true, maybe: false },
  { id: "socks-worn", name: "Socks (worn pair)", category: "Worn", weightOz: 3, packed: true, worn: true, maybe: false },
  { id: "bucket-hat", name: "Bucket Hat", category: "Worn", weightOz: 3, packed: true, worn: true, maybe: false },
  { id: "sunglasses", name: "Sunglasses", category: "Worn", weightOz: 1, packed: true, worn: true, maybe: false },
  { id: "poles", name: "Hiking Poles", category: "Worn", weightOz: 18, packed: true, worn: true, maybe: false },
];

const STORAGE_KEY = "tmb-gear-list";
const TARGET_MIN = 12;
const TARGET_MAX = 16;

function loadGear(): GearItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return INITIAL_GEAR;
}

function saveGear(items: GearItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* ── Add Item Form ─────────────────────────────────── */
function AddItemForm({ onAdd, onCancel }: { onAdd: (item: GearItem) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [weightOz, setWeightOz] = useState("");
  const [isWorn, setIsWorn] = useState(false);
  const [isMaybe, setIsMaybe] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  // Auto-set worn when category is "Worn"
  useEffect(() => { setIsWorn(category === "Worn"); }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    onAdd({
      id,
      name: name.trim(),
      category,
      weightOz: parseFloat(weightOz) || 0,
      packed: true,
      worn: isWorn,
      maybe: isMaybe,
    });
  };

  return (
    <motion.form
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="overflow-hidden border border-[var(--primary)]/30 bg-card"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] font-mono font-bold">
            Add New Item
          </span>
          <button type="button" onClick={onCancel} className="text-[var(--muted-foreground)] hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
          {/* Name */}
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="bg-[var(--secondary)] border border-border px-3 py-2 text-xs font-mono text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50"
          />

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[var(--secondary)] border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-[var(--primary)]/50 appearance-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Weight */}
          <input
            type="number"
            value={weightOz}
            onChange={(e) => setWeightOz(e.target.value)}
            placeholder="oz"
            step="0.5"
            min="0"
            className="bg-[var(--secondary)] border border-border px-3 py-2 text-xs font-mono text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50 w-20"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)] cursor-pointer">
            <input
              type="checkbox"
              checked={isMaybe}
              onChange={(e) => setIsMaybe(e.target.checked)}
              className="accent-yellow-500"
            />
            Maybe
          </label>

          <div className="flex-1" />

          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add Item
          </button>
        </div>
      </div>
    </motion.form>
  );
}

/* ── Main Component ────────────────────────────────── */
export default function GearChecklist() {
  const [open, setOpen] = useState(false);
  const [gear, setGear] = useState<GearItem[]>(loadGear);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { saveGear(gear); }, [gear]);

  const togglePacked = (id: string) => {
    setGear((prev) => prev.map((g) => g.id === id ? { ...g, packed: !g.packed } : g));
  };

  const updateWeight = (id: string, oz: number) => {
    setGear((prev) => prev.map((g) => g.id === id ? { ...g, weightOz: Math.max(0, oz) } : g));
  };

  const addItem = (item: GearItem) => {
    setGear((prev) => [...prev, item]);
    setShowAddForm(false);
  };

  const deleteItem = (id: string) => {
    setGear((prev) => prev.filter((g) => g.id !== id));
    setConfirmDelete(null);
  };

  const resetAll = () => {
    setGear(INITIAL_GEAR);
    setConfirmDelete(null);
    setShowAddForm(false);
  };

  // Computed stats
  const stats = useMemo(() => {
    const packed = gear.filter((g) => g.packed && !g.worn);
    const totalOz = packed.reduce((sum, g) => sum + g.weightOz, 0);
    const totalLbs = totalOz / 16;
    const packedCount = packed.length;
    const totalPackable = gear.filter((g) => !g.worn).length;
    const wornItems = gear.filter((g) => g.worn && g.packed);
    const wornOz = wornItems.reduce((sum, g) => sum + g.weightOz, 0);
    return { totalOz, totalLbs, packedCount, totalPackable, wornOz, wornLbs: wornOz / 16 };
  }, [gear]);

  // Group by category
  const categories = useMemo(() => {
    const cats: Record<string, GearItem[]> = {};
    for (const g of gear) {
      const cat = g.worn ? "Worn (not counted)" : g.category;
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(g);
    }
    const order = ["Pack", "Clothing", "Sleep", "Water", "Navigation", "Safety", "Electronics", "Money", "Toiletries", "Worn (not counted)"];
    const sorted: [string, GearItem[]][] = [];
    for (const key of order) {
      if (cats[key]) sorted.push([key, cats[key]]);
    }
    for (const [key, items] of Object.entries(cats)) {
      if (!order.includes(key)) sorted.push([key, items]);
    }
    return sorted;
  }, [gear]);

  const weightColor = stats.totalLbs <= TARGET_MAX ? (stats.totalLbs <= TARGET_MIN ? "#22c55e" : "#f59e0b") : "#ef4444";
  const weightPct = Math.min((stats.totalLbs / TARGET_MAX) * 100, 120);

  return (
    <section className="container py-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-[var(--primary)]" /> Gear Checklist — Pack Weight Target: {TARGET_MIN}–{TARGET_MAX} lbs
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold" style={{ color: weightColor }}>
            {stats.totalLbs.toFixed(1)} lbs
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
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
            <div className="mt-4 space-y-4">
              {/* Weight Summary Bar */}
              <div className="border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] font-mono font-bold">
                    Pack Weight
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                      {stats.packedCount}/{stats.totalPackable} items packed
                    </span>
                    <button
                      onClick={resetAll}
                      className="text-[10px] font-mono text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>

                <div className="relative h-6 bg-[var(--secondary)] overflow-hidden mb-2">
                  <motion.div
                    className="absolute inset-y-0 left-0"
                    style={{ backgroundColor: weightColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(weightPct, 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <div
                    className="absolute inset-y-0 border-l border-dashed border-green-400/50"
                    style={{ left: `${(TARGET_MIN / TARGET_MAX) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 border-l border-dashed border-red-400/50"
                    style={{ left: "100%" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-foreground drop-shadow-md">
                      {stats.totalLbs.toFixed(1)} lbs ({stats.totalOz.toFixed(0)} oz)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)]">
                  <span>0 lbs</span>
                  <span className="text-green-400">{TARGET_MIN} lbs</span>
                  <span className="text-red-400">{TARGET_MAX} lbs</span>
                </div>

                {stats.totalLbs > TARGET_MAX && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    {(stats.totalLbs - TARGET_MAX).toFixed(1)} lbs over target — consider removing items
                  </div>
                )}
              </div>

              {/* Gear Categories */}
              {categories.map(([category, items]) => {
                const isWorn = category === "Worn (not counted)";
                const catOz = items.filter((g) => g.packed).reduce((s, g) => s + g.weightOz, 0);
                return (
                  <div key={category} className="border border-border bg-card">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                      <span className="text-[10px] uppercase tracking-[0.3em] font-mono font-bold text-foreground">
                        {category}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                        {isWorn ? `${(catOz / 16).toFixed(1)} lbs (on body)` : `${(catOz / 16).toFixed(1)} lbs`}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors group/item ${
                            !item.packed ? "opacity-40" : ""
                          } ${item.maybe ? "border-l-2 border-l-yellow-500/50" : ""}`}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => togglePacked(item.id)}
                            className={`w-5 h-5 flex-shrink-0 border flex items-center justify-center transition-colors ${
                              item.packed
                                ? "bg-[var(--primary)] border-[var(--primary)]"
                                : "border-border hover:border-[var(--primary)]/50"
                            }`}
                          >
                            {item.packed && <Check className="w-3 h-3 text-[var(--primary-foreground)]" />}
                          </button>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-mono ${item.packed ? "text-foreground" : "text-[var(--muted-foreground)] line-through"}`}>
                              {item.name}
                            </span>
                            {item.buyLink && (
                              <a
                                href={item.buyLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 ml-2 text-[9px] font-mono text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" /> Buy
                              </a>
                            )}
                            {item.maybe && (
                              <span className="ml-2 text-[9px] font-mono text-yellow-500 uppercase">maybe</span>
                            )}
                          </div>

                          {/* Weight adjuster */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateWeight(item.id, item.weightOz - 0.5)}
                              className="w-5 h-5 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[11px] font-mono text-[var(--muted-foreground)] w-12 text-center tabular-nums">
                              {item.weightOz % 1 === 0 ? item.weightOz : item.weightOz.toFixed(1)} oz
                            </span>
                            <button
                              onClick={() => updateWeight(item.id, item.weightOz + 0.5)}
                              className="w-5 h-5 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete button */}
                          {confirmDelete === item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="text-[9px] font-mono font-bold text-red-400 hover:text-red-300 px-1.5 py-0.5 border border-red-400/30 transition-colors"
                              >
                                YES
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-[9px] font-mono text-[var(--muted-foreground)] hover:text-foreground px-1.5 py-0.5 border border-border transition-colors"
                              >
                                NO
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(item.id)}
                              className="w-5 h-5 flex items-center justify-center text-transparent group-hover/item:text-[var(--muted-foreground)] hover:!text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Add Item Button / Form */}
              <AnimatePresence mode="wait">
                {showAddForm ? (
                  <AddItemForm key="form" onAdd={addItem} onCancel={() => setShowAddForm(false)} />
                ) : (
                  <motion.button
                    key="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAddForm(true)}
                    className="w-full border border-dashed border-border hover:border-[var(--primary)]/50 p-3 flex items-center justify-center gap-2 text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Item
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
