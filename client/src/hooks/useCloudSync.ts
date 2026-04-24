import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * All localStorage keys that should be synced to the server.
 * Maps localStorage key → server dataType identifier.
 */
const SYNC_KEYS: Record<string, string> = {
  "tmb-weight-log": "weightLog",
  "tmb-bodyfat-entries": "bodyfatEntries",
  "tmb-workout-sessions": "workoutSessions",
  "tmb-nutrition-log": "foodLog",
  "tmb-saved-meal-plans": "savedMealPlans",
  "tmb-nutrition-presets": "presets",
  "tmb-nutrition-common": "commonItems",
  "tmb-nutrition-feedback": "nutritionFeedback",
  "tmb-gear-list": "gearList",
  "tmb-macro-targets": "macroTargets",
  "tmb-bf-retention": "bfRetention",
  "tmb-prehike-checklist": "prehikeChecklist",
  "tmb-bf-goal-weight": "bfGoalWeight",
};

// Keys that are simple values (not JSON arrays/objects)
const SIMPLE_VALUE_KEYS = new Set(["tmb-bf-retention", "tmb-macro-targets", "tmb-bf-goal-weight"]);

export type SyncStatus = "idle" | "syncing" | "synced" | "restored" | "error";

/**
 * Count the "richness" of a JSON string — number of array items, object keys, or string length.
 * Used to decide which version (local vs server) has more data.
 */
function dataRichness(jsonStr: string | null | undefined): number {
  if (!jsonStr || jsonStr === "null" || jsonStr === "[]" || jsonStr === "{}") return 0;
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed.length;
    if (typeof parsed === "object" && parsed !== null) return Object.keys(parsed).length;
    if (typeof parsed === "string") return parsed.length;
    return 1; // number, boolean, etc.
  } catch {
    return jsonStr.length; // raw string
  }
}

/**
 * Centralized cloud sync hook.
 * - On login: restores data from server when server has MORE data than local
 * - On login with existing data: backs up everything to server
 * - On data change: debounced backup of changed keys to server
 * - Runs at app level so all components benefit
 */
export function useCloudSync() {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const backupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingKeysRef = useRef<Set<string>>(new Set());
  const initialSyncDoneRef = useRef(false);
  const backupMutationRef = useRef<ReturnType<typeof trpc.nutrition.backup.useMutation> | null>(null);

  const backupMutation = trpc.nutrition.backup.useMutation();
  backupMutationRef.current = backupMutation;

  // Restore from server on login
  const restoreQuery = trpc.nutrition.restore.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Core backup function using ref to avoid stale closures
  const doBackupNow = () => {
    const mutation = backupMutationRef.current;
    if (!mutation) return;

    const keys = Array.from(pendingKeysRef.current);
    if (keys.length === 0) return;

    const data: { dataType: string; jsonData: string }[] = [];
    for (const lsKey of keys) {
      const serverKey = SYNC_KEYS[lsKey];
      const value = localStorage.getItem(lsKey);
      if (serverKey && value) {
        data.push({ dataType: serverKey, jsonData: value });
      }
    }

    if (data.length === 0) return;

    setStatus("syncing");
    pendingKeysRef.current.clear();

    mutation.mutate(
      { data },
      {
        onSuccess: () => {
          setStatus("synced");
          setLastSynced(new Date().toISOString());
          console.log(`[CloudSync] Backed up ${data.length} data types to server`);
        },
        onError: () => {
          setStatus("error");
          // Re-add failed keys so they retry next time
          for (const lsKey of keys) pendingKeysRef.current.add(lsKey);
          console.warn("[CloudSync] Backup failed, will retry on next change");
        },
      }
    );
  };

  // Handle initial sync: smart merge — server wins if it has more data
  useEffect(() => {
    if (!isAuthenticated || !restoreQuery.data || initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;

    const backups = restoreQuery.data.backups;
    let restoredCount = 0;
    const keysToBackup: string[] = [];

    for (const [lsKey, serverKey] of Object.entries(SYNC_KEYS)) {
      const serverData = backups[serverKey];
      const localData = localStorage.getItem(lsKey);

      const serverRichness = dataRichness(serverData);
      const localRichness = dataRichness(localData);

      if (serverRichness > 0 && serverRichness > localRichness) {
        // Server has more data — restore it to localStorage
        try {
          localStorage.setItem(lsKey, serverData!);
          restoredCount++;
          console.log(`[CloudSync] Restored ${serverKey}: server(${serverRichness}) > local(${localRichness})`);
        } catch {
          console.warn(`[CloudSync] Failed to restore ${serverKey}`);
        }
      } else if (localRichness > 0 && localRichness > serverRichness) {
        // Local has more data — queue it for backup
        keysToBackup.push(lsKey);
        console.log(`[CloudSync] Will backup ${serverKey}: local(${localRichness}) > server(${serverRichness})`);
      } else if (localRichness > 0 && localRichness === serverRichness) {
        // Same richness — backup local to ensure server is up to date
        keysToBackup.push(lsKey);
      }
    }

    if (restoredCount > 0) {
      setStatus("restored");
      console.log(`[CloudSync] Restored ${restoredCount} data types from server`);
      window.dispatchEvent(new CustomEvent("cloud-sync-restored", { detail: { count: restoredCount } }));
    }

    // Backup local data that's richer than server
    if (keysToBackup.length > 0) {
      for (const lsKey of keysToBackup) {
        pendingKeysRef.current.add(lsKey);
      }
      setTimeout(doBackupNow, 2000);
    }
  }, [isAuthenticated, restoreQuery.data]);

  // Listen for localStorage changes from any component
  useEffect(() => {
    if (!isAuthenticated) return;

    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key: string, value: string) {
      originalSetItem(key, value);
      if (SYNC_KEYS[key]) {
        pendingKeysRef.current.add(key);
        // Debounce backup by 3 seconds
        if (backupTimerRef.current) clearTimeout(backupTimerRef.current);
        backupTimerRef.current = setTimeout(doBackupNow, 3000);
      }
    };

    return () => {
      localStorage.setItem = originalSetItem;
      if (backupTimerRef.current) clearTimeout(backupTimerRef.current);
    };
  }, [isAuthenticated]);

  return { status, lastSynced };
}
