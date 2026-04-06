import { useState, useEffect, useCallback } from "react";
import { ATHLETE, WORKOUT_PLAN, getWeightProgress } from "./data";
import type { WorkoutDay } from "./data";

export interface ExerciseLog {
  name: string;
  weight: string;
  reps: string;
  done: boolean;
}

export interface WorkoutSession {
  date: string;
  dayId: string;
  dayTitle: string;
  exercises: ExerciseLog[];
}

export function useWeightTracker() {
  const [entries, setEntries] = useState<{ date: string; weight: number }[]>(() => {
    try {
      const saved = localStorage.getItem("tmb-weight-log");
      return saved ? JSON.parse(saved) : [{ date: "2026-03-14", weight: 232 }, { date: "2026-03-28", weight: 226 }];
    } catch {
      return [{ date: "2026-03-14", weight: 232 }, { date: "2026-03-28", weight: 226 }];
    }
  });

  useEffect(() => {
    localStorage.setItem("tmb-weight-log", JSON.stringify(entries));
  }, [entries]);

  const addEntry = (weight: number) => {
    const today = new Date().toISOString().split("T")[0];
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== today);
      return [...filtered, { date: today, weight }].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weight : ATHLETE.currentWeight;
  const progress = getWeightProgress(currentWeight);

  return { entries, addEntry, currentWeight, progress };
}

export function useWorkoutLog() {
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    try {
      const saved = localStorage.getItem("tmb-workout-sessions");
      let parsed: WorkoutSession[] = saved ? JSON.parse(saved) : [];
      // One-time migration: move Day C on 2026-03-31 to 2026-03-30
      const migKey = "tmb-migrate-c-date-done";
      if (!localStorage.getItem(migKey)) {
        parsed = parsed.map((s) =>
          s.date === "2026-03-31" && s.dayId === "day-c"
            ? { ...s, date: "2026-03-30" }
            : s
        );
        localStorage.setItem("tmb-workout-sessions", JSON.stringify(parsed));
        localStorage.setItem(migKey, "1");
      }
      return parsed;
    } catch {
      return [];
    }
  });

  const [activeSession, setActiveSession] = useState<{
    dayId: string;
    exercises: ExerciseLog[];
  } | null>(null);

  useEffect(() => {
    localStorage.setItem("tmb-workout-sessions", JSON.stringify(sessions));
  }, [sessions]);

  const startSession = (day: WorkoutDay) => {
    // Auto-fill from most recent session of this day type
    const prevSessions = [...sessions].reverse();
    const lastSame = prevSessions.find((s) => s.dayId === day.id);

    setActiveSession({
      dayId: day.id,
      exercises: day.exercises.map((ex) => {
        const lastLog = lastSame?.exercises.find((e) => e.name === ex.name && e.done);
        return {
          name: ex.name,
          weight: lastLog?.weight || "",
          reps: lastLog?.reps || "",
          done: false,
        };
      }),
    });
  };

  const updateExercise = (index: number, field: keyof ExerciseLog, value: string | boolean) => {
    if (!activeSession) return;
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = [...prev.exercises];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, exercises: updated };
    });
  };

  const toggleDone = (index: number) => {
    if (!activeSession) return;
    const day = WORKOUT_PLAN.find((d) => d.id === activeSession.dayId);
    const isPickOne = day?.pickOne === true;
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = [...prev.exercises];
      if (isPickOne) {
        // Radio behavior: toggling one off just toggles it, toggling one on deselects others
        const wasOn = updated[index].done;
        if (!wasOn) {
          // Turn all off, then turn this one on
          for (let j = 0; j < updated.length; j++) {
            updated[j] = { ...updated[j], done: j === index };
          }
        } else {
          // Just toggle off
          updated[index] = { ...updated[index], done: false };
        }
      } else {
        updated[index] = { ...updated[index], done: !updated[index].done };
      }
      return { ...prev, exercises: updated };
    });
  };

  const saveSession = (): WorkoutSession | undefined => {
    if (!activeSession) return undefined;
    const day = WORKOUT_PLAN.find((d) => d.id === activeSession.dayId);
    const today = new Date().toISOString().split("T")[0];
    const session: WorkoutSession = {
      date: today,
      dayId: activeSession.dayId,
      dayTitle: day ? `${day.title} - ${day.subtitle}` : activeSession.dayId,
      exercises: activeSession.exercises,
    };
    setSessions((prev) => [...prev, session]);
    setActiveSession(null);
    return session;
  };

  const cancelSession = () => setActiveSession(null);

  const updateSession = (date: string, dayId: string, sessionIndex: number, updatedSession: WorkoutSession) => {
    setSessions((prev) => {
      let matchCount = 0;
      return prev.map((s) => {
        if (s.date === date && s.dayId === dayId) {
          const isTarget = matchCount === sessionIndex;
          matchCount++;
          return isTarget ? updatedSession : s;
        }
        return s;
      });
    });
  };

  const deleteSession = (date: string, dayId: string, sessionIndex: number) => {
    setSessions((prev) => {
      // Find all sessions matching this date+dayId, then remove the one at sessionIndex
      let matchCount = 0;
      return prev.filter((s) => {
        if (s.date === date && s.dayId === dayId) {
          const isTarget = matchCount === sessionIndex;
          matchCount++;
          return !isTarget;
        }
        return true;
      });
    });
  };

  const hasHitGoal = (exerciseName: string, goalValue?: number, unit?: string): boolean => {
    if (!goalValue || !unit) return false;
    for (const session of sessions) {
      for (const ex of session.exercises) {
        if (ex.name === exerciseName && ex.done && ex.weight) {
          const val = parseFloat(ex.weight);
          if (unit === "assist") {
            if (val <= goalValue) return true;
          } else {
            if (val >= goalValue) return true;
          }
        }
      }
    }
    return false;
  };

  /**
   * Get the best logged performance for a given exercise.
   * For "assist" exercises (like pull-ups), lower is better.
   * For everything else, higher is better.
   * Returns { weight, reps } or null if never logged.
   */
  const getBestPerformance = useCallback(
    (exerciseName: string, unit?: string): { weight: string; reps: string } | null => {
      let best: { weight: string; reps: string; val: number } | null = null;

      for (const session of sessions) {
        for (const ex of session.exercises) {
          if (ex.name === exerciseName && ex.done && ex.weight) {
            const val = parseFloat(ex.weight);
            if (isNaN(val)) continue;

            if (!best) {
              best = { weight: ex.weight, reps: ex.reps, val };
            } else if (unit === "assist") {
              // Lower assist weight = stronger
              if (val < best.val) {
                best = { weight: ex.weight, reps: ex.reps, val };
              }
            } else {
              // Higher weight = stronger
              if (val > best.val) {
                best = { weight: ex.weight, reps: ex.reps, val };
              }
            }
          }
        }
      }

      return best ? { weight: best.weight, reps: best.reps } : null;
    },
    [sessions]
  );

  return {
    sessions,
    activeSession,
    startSession,
    updateExercise,
    toggleDone,
    saveSession,
    cancelSession,
    deleteSession,
    updateSession,
    hasHitGoal,
    getBestPerformance,
  };
}

export function generateSummary(session: WorkoutSession, allSessions: WorkoutSession[]): string {
  const planDay = WORKOUT_PLAN.find((d) => d.id === session.dayId);
  const isPickOne = planDay?.pickOne === true;
  const completed = session.exercises.filter((e) => e.done).length;
  const total = session.exercises.length;
  const pct = isPickOne
    ? (completed >= 1 ? 100 : 0)
    : Math.round((completed / total) * 100);

  const dayType = session.dayId;
  const prevSame = allSessions.filter((s) => s.dayId === dayType && s.date !== session.date);
  const sessionCount = prevSame.length + 1;

  let summary = "";

  if (isPickOne && completed >= 1) {
    const chosenEx = session.exercises.find((e) => e.done);
    summary += `Cardio complete — ${chosenEx?.name || "activity"} logged. One solid session is all it takes. `;
  } else if (pct === 100) {
    summary += "Full session completed. That is the standard. ";
  } else if (pct >= 70) {
    summary += `${completed}/${total} exercises done (${pct}%). Acceptable, but the skipped ones matter. `;
  } else if (isPickOne && completed === 0) {
    summary += "No activity selected. Pick one and get it done next time. ";
  } else {
    summary += `${completed}/${total} exercises done (${pct}%). Not enough volume. If you are too fatigued, check sleep and nutrition. `;
  }

  summary += `This is session #${sessionCount} of ${session.dayTitle}. `;

  const goalsHit = session.exercises.filter((ex) => {
    const planDay = WORKOUT_PLAN.find((d) => d.id === session.dayId);
    const planEx = planDay?.exercises.find((e) => e.name === ex.name);
    if (!planEx?.goalValue || !ex.weight || !ex.done) return false;
    const val = parseFloat(ex.weight);
    return planEx.unit === "assist" ? val <= planEx.goalValue : val >= planEx.goalValue;
  });

  if (goalsHit.length > 0) {
    summary += `GOAL WEIGHT HIT on: ${goalsHit.map((e) => e.name).join(", ")}. `;
  }

  // Comparison context
  if (dayType === "day-a" || dayType === "day-b") {
    summary += "\n\nFor reference: The average recreational hiker does zero structured strength training. ";
    summary += "TMB finishers who train typically do 2-3 sessions per week. ";
    summary += "You are doing targeted descent-specific and pack-endurance work. That puts you ahead of most people on the trail. ";
    summary += "But ahead of most is not the goal. The goal is pain-free descents at 205 lbs.";
  } else if (dayType === "day-c") {
    summary += "\n\nFor reference: Most TMB hikers average 8-10 hours of walking per day. ";
    summary += "Your stairmill sessions are building the cardiac base for that. ";
    summary += "The average person cannot hold Zone 2 on a stairmill for 60 minutes. You can. ";
    summary += "But the TMB demands 90+ minutes of sustained climbing. Keep pushing duration.";
  } else if (dayType === "day-d") {
    summary += "\n\nMobility is not optional. Your high transverse arch and quad-dominant pattern ";
    summary += "are the two biggest risk factors for knee pain on descent days. ";
    summary += "Every mobility session is an investment in pain-free hiking on Days 5-9.";
  }

  return summary;
}
