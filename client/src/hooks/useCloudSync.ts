import { useEffect, useRef, useCallback, useState } from "react";
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
  "tmb-gear-list": "gearList",
  "tmb-macro-targets": "macroTargets",
  "tmb-bf-retention": "bfRetention",
  "tmb-prehike-checklist": "prehikeChecklist",
};

// Keys that are simple values (not JSON arrays/objects)
const SIMPLE_VALUE_KEYS = new Set(["tmb-bf-retention", "tmb-macro-targets"]);

export type SyncStatus = "idle" | "syncing" | "synced" | "restoring" | "restored" | "error";

/**
 * Centralized cloud sync hook.
 * - On login: restores all data from server if localStorage is empty
 * - On data change: debounced backup of changed keys to server
 * - Runs at app level so all components benefit
 */
export function useCloudSync() {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const backupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingKeysRef = useRef<Set<string>>(new Set());
  const restoredRef = useRef(false);
  const backupMutation = trpc.nutrition.backup.useMutation();

  // Restore from server on login if localStorage data is missing
  const restoreQuery = trpc.nutrition.restore.useQuery(undefined, {
    enabled: isAuthenticated && !restoredRef.current,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!restoreQuery.data || restoredRef.current) return;
    restoredRef.current = true;

    const backups = restoreQuery.data.backups;
    let restoredCount = 0;

    for (const [lsKey, serverKey] of Object.entries(SYNC_KEYS)) {
      const serverData = backups[serverKey];
      if (!serverData) continue;

      const localData = localStorage.getItem(lsKey);

      // Only restore if localStorage is empty or has less data
      if (!localData || localData === "[]" || localData === "{}" || localData === "null") {
        try {
          // Validate the server data is parseable (for non-simple keys)
          if (!SIMPLE_VALUE_KEYS.has(lsKey)) {
            const parsed = JSON.parse(serverData);
            // Only restore if server actually has data
            if (Array.isArray(parsed) && parsed.length === 0) continue;
            if (typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length === 0) continue;
          }
          localStorage.setItem(lsKey, serverData);
          restoredCount++;
        } catch {
          console.warn(`[CloudSync] Failed to restore ${serverKey}`);
        }
      }
    }

    if (restoredCount > 0) {
      setStatus("restored");
      console.log(`[CloudSync] Restored ${restoredCount} data types from server`);
      // Dispatch a custom event so components can re-read localStorage
      window.dispatchEvent(new CustomEvent("cloud-sync-restored", { detail: { count: restoredCount } }));
    }
  }, [restoreQuery.data]);

  // Backup function — sends all pending changed keys to server
  const doBackup = useCallback(() => {
    if (!isAuthenticated) return;
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

    backupMutation.mutate(
      { data },
      {
        onSuccess: () => {
          setStatus("synced");
          setLastSynced(new Date().toISOString());
          console.log(`[CloudSync] Backed up ${data.length} data types`);
        },
        onError: () => {
          setStatus("error");
          // Re-add failed keys so they retry next time
          for (const lsKey of keys) pendingKeysRef.current.add(lsKey);
          console.warn("[CloudSync] Backup failed, will retry");
        },
      }
    );
  }, [isAuthenticated, backupMutation]);

  // Listen for localStorage changes from any component
  useEffect(() => {
    if (!isAuthenticated) return;

    // Intercept localStorage.setItem to detect changes
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key: string, value: string) {
      originalSetItem(key, value);
      if (SYNC_KEYS[key]) {
        pendingKeysRef.current.add(key);
        // Debounce backup by 3 seconds
        if (backupTimerRef.current) clearTimeout(backupTimerRef.current);
        backupTimerRef.current = setTimeout(doBackup, 3000);
      }
    };

    return () => {
      localStorage.setItem = originalSetItem;
      if (backupTimerRef.current) clearTimeout(backupTimerRef.current);
    };
  }, [isAuthenticated, doBackup]);

  // Also do a full backup on mount (catches any data that changed while offline)
  useEffect(() => {
    if (!isAuthenticated || !restoredRef.current) return;

    // Wait a bit for restore to finish, then backup everything
    const timer = setTimeout(() => {
      for (const lsKey of Object.keys(SYNC_KEYS)) {
        if (localStorage.getItem(lsKey)) {
          pendingKeysRef.current.add(lsKey);
        }
      }
      doBackup();
    }, 10000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, doBackup]);

  return { status, lastSynced };
}
