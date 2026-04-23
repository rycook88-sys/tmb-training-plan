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
};

// Keys that are simple values (not JSON arrays/objects)
const SIMPLE_VALUE_KEYS = new Set(["tmb-bf-retention", "tmb-macro-targets"]);

export type SyncStatus = "idle" | "syncing" | "synced" | "restored" | "error";

/**
 * Centralized cloud sync hook.
 * - On login with empty localStorage: restores all data from server
 * - On login with existing data: immediately backs up everything to server
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
    staleTime: 30000, // Don't refetch within 30s
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

  // Handle initial sync: restore if empty, backup if has data
  useEffect(() => {
    if (!isAuthenticated || !restoreQuery.data || initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;

    const backups = restoreQuery.data.backups;
    let restoredCount = 0;
    let localHasData = false;

    // Phase 1: Restore any missing data from server
    for (const [lsKey, serverKey] of Object.entries(SYNC_KEYS)) {
      const serverData = backups[serverKey];
      const localData = localStorage.getItem(lsKey);
      const localIsEmpty = !localData || localData === "[]" || localData === "{}" || localData === "null";

      if (localIsEmpty && serverData) {
        try {
          if (!SIMPLE_VALUE_KEYS.has(lsKey)) {
            const parsed = JSON.parse(serverData);
            if (Array.isArray(parsed) && parsed.length === 0) continue;
            if (typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length === 0) continue;
          }
          localStorage.setItem(lsKey, serverData);
          restoredCount++;
        } catch {
          console.warn(`[CloudSync] Failed to restore ${serverKey}`);
        }
      } else if (!localIsEmpty) {
        localHasData = true;
      }
    }

    if (restoredCount > 0) {
      setStatus("restored");
      console.log(`[CloudSync] Restored ${restoredCount} data types from server`);
      window.dispatchEvent(new CustomEvent("cloud-sync-restored", { detail: { count: restoredCount } }));
    }

    // Phase 2: Backup all existing local data to server (ensures server has latest)
    if (localHasData) {
      for (const lsKey of Object.keys(SYNC_KEYS)) {
        const value = localStorage.getItem(lsKey);
        if (value && value !== "[]" && value !== "{}" && value !== "null") {
          pendingKeysRef.current.add(lsKey);
        }
      }
      // Small delay to let React settle, then backup
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
