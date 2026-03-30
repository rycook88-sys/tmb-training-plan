import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Play,
  ArrowDown,
  ArrowUp,
  Mountain,
  Footprints,
  Map,
} from "lucide-react";

/* ── types ── */
interface Video {
  title: string;
  id: string; // YouTube video ID
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
    <section className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-xl px-5 py-4 hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Play className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white text-lg">Technique Video Library</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{totalVideos} videos in {CATEGORIES.length} categories</span>
          {open ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {CATEGORIES.map((cat) => {
            const isExpanded = expandedCat === cat.name;
            const CatIcon = cat.icon;
            return (
              <div key={cat.name} className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CatIcon className={`w-4 h-4 ${cat.color}`} />
                    <span className="font-medium text-white">{cat.name}</span>
                    <span className="text-xs text-zinc-500">{cat.videos.length} videos</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {cat.videos.map((video) => {
                      const isPlaying = playingVideo === video.id;
                      return (
                        <div key={video.id} className="space-y-2">
                          <button
                            onClick={() => setPlayingVideo(isPlaying ? null : video.id)}
                            className="w-full flex items-start gap-3 p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors text-left"
                          >
                            <div className="relative w-24 h-16 shrink-0 rounded overflow-hidden bg-zinc-700">
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
                              <p className="font-medium text-white text-sm leading-tight">{video.title}</p>
                              <p className="text-xs text-zinc-400 mt-1">{video.description}</p>
                            </div>
                          </button>

                          {isPlaying && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden">
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
