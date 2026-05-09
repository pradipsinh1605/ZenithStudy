"use client";
import { useEffect, useState } from "react";

export const TIMER_MODES = {
  work:  { label:"Focus",       duration:25*60, color:"#4F8EF7" },
  short: { label:"Short Break", duration:5*60,  color:"#34D399" },
  long:  { label:"Long Break",  duration:15*60, color:"#A78BFA" },
};

export type TimerModeKey = keyof typeof TIMER_MODES;

export interface PersistedTimerState {
  mode: TimerModeKey;
  timeLeft: number;
  running: boolean;
  sessions: number;
  totalMins: number;
  xpEarned: number;
  custom: number;
  selSub: string;
}

const STORAGE_KEY = "sb-timer-state";

const DEFAULT_STATE: PersistedTimerState = {
  mode: "work",
  timeLeft: TIMER_MODES.work.duration,
  running: false,
  sessions: 0,
  totalMins: 0,
  xpEarned: 0,
  custom: 25,
  selSub: "",
};

function readPersistedState(): PersistedTimerState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_STATE;

    const parsed = JSON.parse(saved);
    if (parsed.running && parsed.savedAt) {
      const elapsed = Math.floor((Date.now() - parsed.savedAt) / 1000);
      const timeLeft = Math.max(0, Number(parsed.timeLeft || 0) - elapsed);
      return { ...DEFAULT_STATE, ...parsed, timeLeft, running: timeLeft > 0 };
    }

    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function usePersistedTimer() {
  const [state, setState] = useState<PersistedTimerState>(readPersistedState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
    } catch {}
  }, [state]);

  return [state, setState] as const;
}