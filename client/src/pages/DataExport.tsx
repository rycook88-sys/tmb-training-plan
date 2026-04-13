import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const KEYS = [
  "tmb-bodyfat-entries",
  "tmb-weight-log",
  "tmb-workout-sessions",
  "tmb-bf-retention",
];

export default function DataExport() {
  const { isAuthenticated } = useAuth();
  const [exported, setExported] = useState<string>("");
  const [synced, setSynced] = useState(false);

  const backupMutation = trpc.nutrition.backup.useMutation();

  useEffect(() => {
    // Build export string from localStorage
    const data: Record<string, any> = {};
    for (const key of KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    }
    setExported(JSON.stringify(data, null, 2));
  }, []);

  const handleSync = () => {
    if (!isAuthenticated) {
      toast.error("You need to be logged in to sync data");
      return;
    }

    const payload: { dataType: string; jsonData: string }[] = [];
    for (const key of KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        // Map localStorage keys to backup dataType names
        const dtMap: Record<string, string> = {
          "tmb-bodyfat-entries": "bodyfatEntries",
          "tmb-weight-log": "weightLog",
          "tmb-workout-sessions": "workoutSessions",
          "tmb-bf-retention": "bfRetention",
        };
        payload.push({ dataType: dtMap[key] || key, jsonData: raw });
      }
    }

    backupMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          setSynced(true);
          toast.success("Data synced to server!");
        },
        onError: () => {
          toast.error("Sync failed — try again");
        },
      }
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      toast.success("Copied to clipboard!");
    } catch {
      // Fallback: select all text in the textarea
      const el = document.getElementById("export-text") as HTMLTextAreaElement;
      if (el) {
        el.select();
        document.execCommand("copy");
        toast.success("Copied!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-lg font-mono uppercase tracking-[0.15em] text-[var(--primary)]">
          Data Export
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          This page exports your body fat entries, weight log, and workout sessions from localStorage.
        </p>

        {/* One-tap sync button */}
        <button
          onClick={handleSync}
          disabled={backupMutation.isPending || synced}
          className="w-full py-3 px-4 bg-[var(--primary)] text-black font-mono font-bold uppercase tracking-wider text-sm disabled:opacity-50 cursor-pointer"
        >
          {backupMutation.isPending
            ? "Syncing..."
            : synced
            ? "Synced to Server ✓"
            : "Sync Data to Server"}
        </button>

        {synced && (
          <p className="text-xs font-mono text-green-400">
            Data synced successfully. Your analysis is being prepared.
          </p>
        )}

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="w-full py-2 px-4 border border-border text-foreground font-mono text-sm hover:bg-white/5 cursor-pointer"
        >
          Copy Data to Clipboard
        </button>

        {/* Raw data display */}
        <textarea
          id="export-text"
          readOnly
          value={exported}
          className="w-full h-64 bg-card border border-border text-xs font-mono text-muted-foreground p-3 resize-y"
        />

        <a href="/" className="block text-center text-xs font-mono text-muted-foreground hover:text-foreground underline">
          ← Back to Command Center
        </a>
      </div>
    </div>
  );
}
