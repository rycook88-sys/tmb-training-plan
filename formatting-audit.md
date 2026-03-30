# Collapsible Section Formatting Audit

## Established Pattern (GearChecklist, FootMobility, Training Protocol)
- **Wrapper**: `<section className="container py-8">` (inside Home.tsx) or self-contained component
- **Header button**: `w-full flex items-center justify-between group cursor-pointer`
- **Title**: `text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2`
- **Icon**: `w-3.5 h-3.5 text-[var(--primary)]` (small, primary-colored)
- **Chevron**: `w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]` with rotation animation
- **Content wrapper**: `border border-border bg-card p-4` blocks inside
- **Subtitle/metadata**: `text-[10px] font-mono text-[var(--muted-foreground)]`

## Inconsistent Sections (DailyBudget, WeatherForecast, TechniqueVideos)
- **Wrapper**: `<section className="mb-6">` (no container, no py-8)
- **Header button**: `bg-zinc-900/80 border border-zinc-800 rounded-xl px-5 py-4 hover:bg-zinc-800/80`
- **Title**: `font-semibold text-white text-lg` (large, bold, white)
- **Icon**: `w-5 h-5 text-emerald-400/orange-400/purple-400` (larger, custom colors)
- **Chevron**: `w-5 h-5 text-zinc-400` with ChevronUp/ChevronDown swap (no rotation)
- **Content wrapper**: `bg-zinc-900/60 border border-zinc-800 rounded-lg` (zinc-based, rounded)
- **Subtitle/metadata**: `text-sm text-zinc-400` (larger, zinc-colored)

## Also Slightly Different (TMBRouteMap, ElevationProfile)
- TMBRouteMap: `py-4 px-1`, `text-lg font-bold text-slate-100`, 10x10 icon box with bg
- ElevationProfile: `px-6 py-5 bg-zinc-900/60 border border-zinc-800/50`, `text-sm font-bold tracking-[0.2em]`, JetBrains Mono explicit

## Target Standardized Pattern
All collapsible sections should use:
- **Wrapper**: `<section className="container py-6">` 
- **Header button**: `w-full flex items-center justify-between group cursor-pointer`
- **Title**: `text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2`
- **Icon**: `w-3.5 h-3.5 text-[var(--primary)]` 
- **Chevron**: motion rotate with `w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]`
- **Content**: AnimatePresence with motion.div, `border border-border bg-card` blocks
- **Inner cards**: `border border-border bg-card p-4` or `bg-[var(--secondary)]` for sub-cards
- **Text colors**: Use CSS variables (--muted-foreground, --primary, foreground) not zinc/slate hardcodes
- **Subtitle inline**: `text-xs font-mono text-[var(--muted-foreground)]` next to chevron
