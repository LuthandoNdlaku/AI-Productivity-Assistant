import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, hydrated]);

  const reset = useCallback(() => setValue(initial), [initial]);
  return { value, setValue, hydrated, reset } as const;
}

export type Task = {
  id: string;
  title: string;
  subject: string;
  due?: string;
  done: boolean;
  createdAt: number;
};

export type Stats = {
  studyMinutes: number;
  notesSummarized: number;
  resourcesGenerated: number;
  tasksCompleted: number;
  streakDays: number;
  lastActive?: string;
  subjectMinutes: Record<string, number>;
  weekly: { day: string; minutes: number }[];
};

export const DEFAULT_STATS: Stats = {
  studyMinutes: 0,
  notesSummarized: 0,
  resourcesGenerated: 0,
  tasksCompleted: 0,
  streakDays: 0,
  subjectMinutes: {},
  weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, minutes: 0 })),
};

export function bumpStat(patch: Partial<Stats> | ((s: Stats) => Partial<Stats>)) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("studysphere.stats");
    const current = (raw ? (JSON.parse(raw) as Stats) : DEFAULT_STATS) ?? DEFAULT_STATS;
    const delta = typeof patch === "function" ? patch(current) : patch;
    const next: Stats = { ...current, ...delta };
    if (delta.studyMinutes !== undefined) {
      next.studyMinutes = (current.studyMinutes || 0) + (delta.studyMinutes || 0);
      const today = new Date();
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];
      next.weekly = current.weekly.map((d) =>
        d.day === dayName ? { ...d, minutes: d.minutes + (delta.studyMinutes || 0) } : d,
      );
    }
    if (delta.notesSummarized) next.notesSummarized = (current.notesSummarized || 0) + delta.notesSummarized;
    if (delta.resourcesGenerated)
      next.resourcesGenerated = (current.resourcesGenerated || 0) + delta.resourcesGenerated;
    if (delta.tasksCompleted) next.tasksCompleted = (current.tasksCompleted || 0) + delta.tasksCompleted;
    const todayKey = new Date().toISOString().slice(0, 10);
    if (current.lastActive !== todayKey) {
      next.streakDays = (current.streakDays || 0) + 1;
      next.lastActive = todayKey;
    }
    window.localStorage.setItem("studysphere.stats", JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
