// ============================================================
// Theme Switcher — 10 fun app-wide themes
// ============================================================
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";

export interface ThemeDef {
  id: string;
  name: string;
  emoji: string;
  vars: Record<string, string>;
}

export const THEMES: ThemeDef[] = [
  {
    id: "alpine-dawn",
    name: "Alpine Dawn",
    emoji: "🏔️",
    vars: {
      "--background": "oklch(0.13 0.01 250)",
      "--foreground": "oklch(0.92 0.01 65)",
      "--card": "oklch(0.16 0.01 250)",
      "--card-foreground": "oklch(0.92 0.01 65)",
      "--popover": "oklch(0.16 0.01 250)",
      "--popover-foreground": "oklch(0.92 0.01 65)",
      "--primary": "oklch(0.7 0.19 45)",
      "--primary-foreground": "oklch(0.13 0.01 250)",
      "--secondary": "oklch(0.2 0.01 250)",
      "--secondary-foreground": "oklch(0.75 0.02 65)",
      "--muted": "oklch(0.2 0.01 250)",
      "--muted-foreground": "oklch(0.55 0.02 65)",
      "--accent": "oklch(0.2 0.01 250)",
      "--accent-foreground": "oklch(0.92 0.01 65)",
      "--border": "oklch(0.25 0.01 250)",
      "--input": "oklch(0.25 0.01 250)",
      "--ring": "oklch(0.7 0.19 45)",
    },
  },
  {
    id: "glacier-ice",
    name: "Glacier Ice",
    emoji: "🧊",
    vars: {
      "--background": "oklch(0.12 0.02 230)",
      "--foreground": "oklch(0.93 0.01 220)",
      "--card": "oklch(0.15 0.02 230)",
      "--card-foreground": "oklch(0.93 0.01 220)",
      "--popover": "oklch(0.15 0.02 230)",
      "--popover-foreground": "oklch(0.93 0.01 220)",
      "--primary": "oklch(0.7 0.14 220)",
      "--primary-foreground": "oklch(0.12 0.02 230)",
      "--secondary": "oklch(0.19 0.02 230)",
      "--secondary-foreground": "oklch(0.75 0.03 220)",
      "--muted": "oklch(0.19 0.02 230)",
      "--muted-foreground": "oklch(0.55 0.03 220)",
      "--accent": "oklch(0.22 0.03 230)",
      "--accent-foreground": "oklch(0.93 0.01 220)",
      "--border": "oklch(0.24 0.03 230)",
      "--input": "oklch(0.24 0.03 230)",
      "--ring": "oklch(0.7 0.14 220)",
    },
  },
  {
    id: "midnight-summit",
    name: "Midnight Summit",
    emoji: "🌌",
    vars: {
      "--background": "oklch(0.1 0.03 290)",
      "--foreground": "oklch(0.92 0.02 290)",
      "--card": "oklch(0.14 0.04 290)",
      "--card-foreground": "oklch(0.92 0.02 290)",
      "--popover": "oklch(0.14 0.04 290)",
      "--popover-foreground": "oklch(0.92 0.02 290)",
      "--primary": "oklch(0.7 0.2 300)",
      "--primary-foreground": "oklch(0.1 0.03 290)",
      "--secondary": "oklch(0.18 0.04 290)",
      "--secondary-foreground": "oklch(0.75 0.03 290)",
      "--muted": "oklch(0.18 0.04 290)",
      "--muted-foreground": "oklch(0.55 0.04 290)",
      "--accent": "oklch(0.22 0.06 290)",
      "--accent-foreground": "oklch(0.92 0.02 290)",
      "--border": "oklch(0.23 0.05 290)",
      "--input": "oklch(0.23 0.05 290)",
      "--ring": "oklch(0.7 0.2 300)",
    },
  },
  {
    id: "forest-floor",
    name: "Forest Floor",
    emoji: "🌿",
    vars: {
      "--background": "oklch(0.12 0.02 145)",
      "--foreground": "oklch(0.9 0.02 130)",
      "--card": "oklch(0.15 0.03 145)",
      "--card-foreground": "oklch(0.9 0.02 130)",
      "--popover": "oklch(0.15 0.03 145)",
      "--popover-foreground": "oklch(0.9 0.02 130)",
      "--primary": "oklch(0.65 0.18 145)",
      "--primary-foreground": "oklch(0.12 0.02 145)",
      "--secondary": "oklch(0.19 0.03 145)",
      "--secondary-foreground": "oklch(0.72 0.04 130)",
      "--muted": "oklch(0.19 0.03 145)",
      "--muted-foreground": "oklch(0.52 0.04 130)",
      "--accent": "oklch(0.22 0.04 145)",
      "--accent-foreground": "oklch(0.9 0.02 130)",
      "--border": "oklch(0.24 0.04 145)",
      "--input": "oklch(0.24 0.04 145)",
      "--ring": "oklch(0.65 0.18 145)",
    },
  },
  {
    id: "volcanic",
    name: "Volcanic",
    emoji: "🌋",
    vars: {
      "--background": "oklch(0.1 0.01 15)",
      "--foreground": "oklch(0.9 0.02 40)",
      "--card": "oklch(0.14 0.02 15)",
      "--card-foreground": "oklch(0.9 0.02 40)",
      "--popover": "oklch(0.14 0.02 15)",
      "--popover-foreground": "oklch(0.9 0.02 40)",
      "--primary": "oklch(0.6 0.24 25)",
      "--primary-foreground": "oklch(0.98 0.0 0)",
      "--secondary": "oklch(0.17 0.02 15)",
      "--secondary-foreground": "oklch(0.72 0.03 40)",
      "--muted": "oklch(0.17 0.02 15)",
      "--muted-foreground": "oklch(0.5 0.03 40)",
      "--accent": "oklch(0.2 0.04 15)",
      "--accent-foreground": "oklch(0.9 0.02 40)",
      "--border": "oklch(0.22 0.03 15)",
      "--input": "oklch(0.22 0.03 15)",
      "--ring": "oklch(0.6 0.24 25)",
    },
  },
  {
    id: "bluebird-day",
    name: "Bluebird Day",
    emoji: "☀️",
    vars: {
      "--background": "oklch(0.13 0.03 240)",
      "--foreground": "oklch(0.95 0.01 220)",
      "--card": "oklch(0.16 0.03 240)",
      "--card-foreground": "oklch(0.95 0.01 220)",
      "--popover": "oklch(0.16 0.03 240)",
      "--popover-foreground": "oklch(0.95 0.01 220)",
      "--primary": "oklch(0.72 0.16 240)",
      "--primary-foreground": "oklch(0.13 0.03 240)",
      "--secondary": "oklch(0.2 0.03 240)",
      "--secondary-foreground": "oklch(0.78 0.03 220)",
      "--muted": "oklch(0.2 0.03 240)",
      "--muted-foreground": "oklch(0.56 0.03 220)",
      "--accent": "oklch(0.22 0.04 240)",
      "--accent-foreground": "oklch(0.95 0.01 220)",
      "--border": "oklch(0.25 0.04 240)",
      "--input": "oklch(0.25 0.04 240)",
      "--ring": "oklch(0.72 0.16 240)",
    },
  },
  {
    id: "wildflower",
    name: "Wildflower",
    emoji: "🌸",
    vars: {
      "--background": "oklch(0.12 0.03 330)",
      "--foreground": "oklch(0.93 0.02 330)",
      "--card": "oklch(0.15 0.04 330)",
      "--card-foreground": "oklch(0.93 0.02 330)",
      "--popover": "oklch(0.15 0.04 330)",
      "--popover-foreground": "oklch(0.93 0.02 330)",
      "--primary": "oklch(0.68 0.2 340)",
      "--primary-foreground": "oklch(0.12 0.03 330)",
      "--secondary": "oklch(0.19 0.04 330)",
      "--secondary-foreground": "oklch(0.75 0.04 330)",
      "--muted": "oklch(0.19 0.04 330)",
      "--muted-foreground": "oklch(0.55 0.05 330)",
      "--accent": "oklch(0.22 0.06 330)",
      "--accent-foreground": "oklch(0.93 0.02 330)",
      "--border": "oklch(0.24 0.05 330)",
      "--input": "oklch(0.24 0.05 330)",
      "--ring": "oklch(0.68 0.2 340)",
    },
  },
  {
    id: "storm-warning",
    name: "Storm Warning",
    emoji: "⚡",
    vars: {
      "--background": "oklch(0.13 0.0 0)",
      "--foreground": "oklch(0.9 0.0 0)",
      "--card": "oklch(0.16 0.0 0)",
      "--card-foreground": "oklch(0.9 0.0 0)",
      "--popover": "oklch(0.16 0.0 0)",
      "--popover-foreground": "oklch(0.9 0.0 0)",
      "--primary": "oklch(0.85 0.2 95)",
      "--primary-foreground": "oklch(0.13 0.0 0)",
      "--secondary": "oklch(0.2 0.0 0)",
      "--secondary-foreground": "oklch(0.7 0.0 0)",
      "--muted": "oklch(0.2 0.0 0)",
      "--muted-foreground": "oklch(0.5 0.0 0)",
      "--accent": "oklch(0.22 0.0 0)",
      "--accent-foreground": "oklch(0.9 0.0 0)",
      "--border": "oklch(0.25 0.0 0)",
      "--input": "oklch(0.25 0.0 0)",
      "--ring": "oklch(0.85 0.2 95)",
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    emoji: "🌅",
    vars: {
      "--background": "oklch(0.13 0.02 60)",
      "--foreground": "oklch(0.92 0.02 70)",
      "--card": "oklch(0.16 0.02 60)",
      "--card-foreground": "oklch(0.92 0.02 70)",
      "--popover": "oklch(0.16 0.02 60)",
      "--popover-foreground": "oklch(0.92 0.02 70)",
      "--primary": "oklch(0.75 0.16 70)",
      "--primary-foreground": "oklch(0.13 0.02 60)",
      "--secondary": "oklch(0.2 0.02 60)",
      "--secondary-foreground": "oklch(0.75 0.03 70)",
      "--muted": "oklch(0.2 0.02 60)",
      "--muted-foreground": "oklch(0.55 0.03 70)",
      "--accent": "oklch(0.22 0.03 60)",
      "--accent-foreground": "oklch(0.92 0.02 70)",
      "--border": "oklch(0.25 0.03 60)",
      "--input": "oklch(0.25 0.03 60)",
      "--ring": "oklch(0.75 0.16 70)",
    },
  },
  {
    id: "snowblind",
    name: "Snowblind",
    emoji: "❄️",
    vars: {
      "--background": "oklch(0.97 0.005 240)",
      "--foreground": "oklch(0.2 0.02 240)",
      "--card": "oklch(0.99 0.003 240)",
      "--card-foreground": "oklch(0.2 0.02 240)",
      "--popover": "oklch(0.99 0.003 240)",
      "--popover-foreground": "oklch(0.2 0.02 240)",
      "--primary": "oklch(0.5 0.15 240)",
      "--primary-foreground": "oklch(0.98 0.005 240)",
      "--secondary": "oklch(0.92 0.01 240)",
      "--secondary-foreground": "oklch(0.35 0.02 240)",
      "--muted": "oklch(0.92 0.01 240)",
      "--muted-foreground": "oklch(0.5 0.02 240)",
      "--accent": "oklch(0.9 0.015 240)",
      "--accent-foreground": "oklch(0.2 0.02 240)",
      "--border": "oklch(0.85 0.01 240)",
      "--input": "oklch(0.85 0.01 240)",
      "--ring": "oklch(0.5 0.15 240)",
    },
  },
];

const THEME_KEY = "tmb-theme";

function getStoredTheme(): string {
  try { return localStorage.getItem(THEME_KEY) || "alpine-dawn"; }
  catch { return "alpine-dawn"; }
}

export function applyTheme(themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  try { localStorage.setItem(THEME_KEY, themeId); } catch {}
}

// Apply stored theme on load
export function initTheme() {
  applyTheme(getStoredTheme());
}

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(getStoredTheme);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (id: string) => {
    setActive(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[7px] font-mono uppercase tracking-wider border border-border/60 px-1.5 py-0.5 rounded bg-background/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors leading-none"
        title="Change theme"
      >
        <Palette className="w-2.5 h-2.5" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-72 bg-card border border-border p-3 shadow-2xl"
          >
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2.5">Choose Your Vibe</div>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => {
                const isActive = active === theme.id;
                const bg = theme.vars["--background"];
                const fg = theme.vars["--foreground"];
                const primary = theme.vars["--primary"];
                const card = theme.vars["--card"];
                const border = theme.vars["--border"];
                const muted = theme.vars["--muted-foreground"];

                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelect(theme.id)}
                    className={`relative overflow-hidden rounded-sm transition-all duration-200 ${
                      isActive ? "ring-2 ring-offset-1 ring-offset-background" : "hover:scale-[1.03]"
                    }`}
                    style={{
                      ...(isActive ? { "--tw-ring-color": primary } as React.CSSProperties : {}),
                    }}
                  >
                    {/* Mini theme preview card */}
                    <div
                      className="p-2.5 text-left"
                      style={{ backgroundColor: bg, borderWidth: "1px", borderColor: border, borderStyle: "solid" }}
                    >
                      {/* Top bar preview */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs">{theme.emoji}</span>
                        <span className="text-[9px] font-mono font-bold tracking-wide" style={{ color: fg }}>
                          {theme.name}
                        </span>
                      </div>
                      {/* Color swatches row */}
                      <div className="flex gap-1">
                        <div className="w-5 h-2 rounded-[1px]" style={{ backgroundColor: primary }} />
                        <div className="w-5 h-2 rounded-[1px]" style={{ backgroundColor: card }} />
                        <div className="w-5 h-2 rounded-[1px]" style={{ backgroundColor: muted }} />
                        <div className="flex-1 h-2 rounded-[1px]" style={{ backgroundColor: border }} />
                      </div>
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
