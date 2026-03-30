import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Play,
  ArrowDown,
  ArrowUp,
  Mountain,
  Map,
} from "lucide-react";

/* ── types ── */
interface Video {
  title: string;
  id: string;
  duration?: string;
  description: string;
}

interface Category {
  name: string;
  icon: typeof ArrowDown;
  color: string;
  videos: Video[];
}

/* ── data ── */
const CATEGORIES: Category[] = [
  {
    name: "Descent Technique",
    icon: ArrowDown,
    color: "text-red-400",
    videos: [
      {
        title: "Hiking Downhill? Use this technique!",
        id: "pSeRET7sXcM",
        description: "Core downhill technique — foot placement, body position, and pole use for steep descents.",
      },
      {
        title: "STOP Knee PAIN When HIKING Downhill",
        id: "Aa4cw0uPrtw",
        description: "How to condition your knees for downhill and avoid the pain that ruins multi-day treks.",
      },
      {
        title: "Trekking Poles to Save Your Knees & Hike Faster",
        id: "l7tE1NPqoqw",
        description: "Complete guide to trekking pole technique — grip, length adjustment, and rhythm.",
      },
      {
        title: "Knee Pain Hiking Downhill? Technique to Save Your Knees",
        id: "FL8j_x5B4Nc",
        description: "Specific technique to reduce knee stress on long descents — essential for 4000ft+ descent days.",
      },
      {
        title: "Protect Your Knees on the Trail (and hike longer)",
        id: "JVa63tVW7tI",
        description: "How to hike safely down steep grades, reducing impact on joints.",
      },
    ],
  },
  {
    name: "Scree & Rocky Terrain",
    icon: Mountain,
    color: "text-amber-400",
    videos: [
      {
        title: "Beginners Guide to Descending Steep Scree",
        id: "y6VOlNMGTD8",
        description: "3 simple steps to learn how to descend steep scree safely. Learned from porters in the mountains.",
      },
    ],
  },
  {
    name: "Uphill Technique",
    icon: ArrowUp,
    color: "text-green-400",
    videos: [
      {
        title: "Walk Up Hills Without Getting Tired",
        id: "kohoA918qGg",
        description: "How to climb with less effort using proper pacing, breathing, and body mechanics.",
      },
      {
        title: "How to Hike Uphill More Efficiently",
        id: "HYdYCeBAkK8",
        description: "General principles for more effective hiking on flat and uphill terrain.",
      },
      {
        title: "How To Hike Uphill | 6 Hints & Tips",
        id: "sjPr-fcUxzQ",
        description: "Six practical tips to make walking uphill more manageable on long days.",
      },
      {
        title: "Top 4 Hacks To Hike Uphill More Comfortably",
        id: "WIi2IDNqmkU",
        description: "Four ways to make steep climbs easier during backpacking trips.",
      },
    ],
  },
  {
    name: "TMB-Specific Tips",
    icon: Map,
    color: "text-purple-400",
    videos: [
      {
        title: "Tour du Mont Blanc - 4 Essential Tips From an Expert Guide",
        id: "mRKRp_TPeVE",
        description: "International Mountain Guide Emma Jack shares essential TMB tips from years of guiding.",
      },
      {
        title: "Tour du Mont Blanc Planning Guide: Everything You Need",
        id: "XVV2lL5qhwY",
        description: "Comprehensive overview of essentials for walking the TMB.",
      },
      {
        title: "How to Train for the Tour Du Mont Blanc",
        id: "q7lgFJnFEdg",
        description: "Training program to reduce injury risk, build durability, and feel ready for the TMB.",
      },
      {
        title: "How to Hike or Run the Tour du Mont Blanc – 5 Ways",
        id: "FOGmLS7CfFw",
        description: "Five different approaches to completing the TMB with pros and cons of each.",
      },
    ],
  },
];

/* ── component ── */
export default function TechniqueVideos() {
  const [open, setOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const totalVideos = CATEGORIES.reduce((sum, c) => sum + c.videos.length, 0);

  return (
    <section className="container py-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground font-mono flex items-center gap-3 font-semibold">
          <span className="text-xl">🎬</span> Technique Video Library
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">{totalVideos} videos · {CATEGORIES.length} categories</span>
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
            <div className="mt-4 space-y-2">
              {CATEGORIES.map((cat) => {
                const isExpanded = expandedCat === cat.name;
                const CatIcon = cat.icon;
                return (
                  <div key={cat.name} className="border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--secondary)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                        <span className="font-mono text-xs font-bold text-foreground">{cat.name}</span>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{cat.videos.length} videos</span>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            {cat.videos.map((video) => {
                              const isPlaying = playingVideo === video.id;
                              return (
                                <div key={video.id} className="space-y-2">
                                  <button
                                    onClick={() => setPlayingVideo(isPlaying ? null : video.id)}
                                    className="w-full flex items-start gap-3 p-3 bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 transition-colors text-left"
                                  >
                                    <div className="relative w-24 h-16 shrink-0 overflow-hidden bg-[var(--secondary)]">
                                      <img
                                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                                          <Play className="w-4 h-4 text-white fill-white" />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-mono text-xs font-medium text-foreground leading-tight">{video.title}</p>
                                      <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{video.description}</p>
                                    </div>
                                  </button>

                                  {isPlaying && (
                                    <div className="aspect-video w-full overflow-hidden">
                                      <iframe
                                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                                        title={video.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
