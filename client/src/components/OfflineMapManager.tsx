// Offline Map Manager — download TMB area tiles for offline use
import { useState, useEffect, useRef } from "react";
import { Download, Check, Trash2, Loader2, WifiOff, Wifi } from "lucide-react";
import {
  getTileCount,
  isCached,
  getCachedCount,
  downloadTiles,
  clearTileCache,
  estimateSizeMB,
} from "@/lib/offline-tiles";

export function OfflineMapManager() {
  const [status, setStatus] = useState<"checking" | "not-cached" | "cached" | "downloading" | "error">("checking");
  const [progress, setProgress] = useState({ downloaded: 0, total: 0 });
  const [cachedCount, setCachedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const abortRef = useRef<AbortController | null>(null);

  const totalTiles = getTileCount();
  const estimatedMB = estimateSizeMB();

  useEffect(() => {
    checkCache();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function checkCache() {
    setStatus("checking");
    const cached = await isCached();
    const count = await getCachedCount();
    setCachedCount(count);
    setStatus(cached ? "cached" : "not-cached");
  }

  async function handleDownload() {
    if (!navigator.onLine) return;
    setStatus("downloading");
    setProgress({ downloaded: 0, total: totalTiles });

    abortRef.current = new AbortController();

    try {
      await downloadTiles(
        (downloaded, total) => setProgress({ downloaded, total }),
        abortRef.current.signal
      );
      setStatus("cached");
      const count = await getCachedCount();
      setCachedCount(count);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setStatus("not-cached");
      } else {
        setStatus("error");
      }
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  async function handleClear() {
    await clearTileCache();
    setCachedCount(0);
    setStatus("not-cached");
  }

  const pct = progress.total > 0 ? Math.round((progress.downloaded / progress.total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "checking" && (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <Loader2 className="w-3 h-3 animate-spin" /> Checking cache...
        </span>
      )}

      {status === "not-cached" && (
        <button
          onClick={handleDownload}
          disabled={!isOnline}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono transition-colors ${
            isOnline
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed"
          }`}
          title={isOnline ? `Download ~${estimatedMB} MB of map tiles for offline use` : "Need WiFi to download"}
        >
          {isOnline ? <Download className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? `OFFLINE MAPS (~${estimatedMB} MB)` : "NEED WIFI"}
        </button>
      )}

      {status === "downloading" && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-[10px] font-mono text-emerald-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{pct}%</span>
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-slate-500">{progress.downloaded}/{progress.total}</span>
          </div>
          <button
            onClick={handleCancel}
            className="px-2 py-1 rounded-md border border-red-500/40 text-red-400 text-[10px] font-mono hover:bg-red-500/15"
          >
            CANCEL
          </button>
        </div>
      )}

      {status === "cached" && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-[10px] font-mono text-emerald-400">
            <Check className="w-3 h-3" />
            MAPS SAVED ({cachedCount} tiles)
          </span>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-slate-700 text-slate-500 text-[10px] font-mono hover:text-red-400 hover:border-red-500/40"
            title="Clear cached map tiles"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-500/40 bg-red-500/10 text-[10px] font-mono text-red-400">
            Download failed
          </span>
          <button
            onClick={handleDownload}
            className="px-2 py-1 rounded-md border border-emerald-500/40 text-emerald-400 text-[10px] font-mono hover:bg-emerald-500/15"
          >
            RETRY
          </button>
        </div>
      )}
    </div>
  );
}
