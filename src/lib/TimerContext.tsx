"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { addXP } from "@/lib/xp-utils";
import toast from "react-hot-toast";
import { TIMER_MODES as MODES, TimerModeKey as ModeKey, PersistedTimerState as TimerState, usePersistedTimer } from "@/hooks/usePersistedTimer";


interface TimerContextType extends TimerState {
  setMode: (m: ModeKey) => void;
  setCustom: (n: number) => void;
  setSelSub: (s: string) => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

const STORAGE_KEY = "sb-timer-state";

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout>();
  const [userId, setUserId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);

  const [state, setState] = usePersistedTimer();

  // Fetch user on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (!user) return;
      setUserId(user.id);
      const { data: s } = await supabase.from("subjects").select("*").eq("user_id", user.id);
      setSubjects(s || []);
      // Load today's sessions
      const today = new Date().toISOString().slice(0, 10);
      const { data: sess } = await supabase.from("study_sessions").select("duration_mins").eq("user_id", user.id).gte("created_at", today);
      if (sess) {
        setState(prev => ({
          ...prev,
          sessions: sess.length,
          totalMins: sess.reduce((a, s) => a + (s.duration_mins || 0), 0),
        }));
      }
    })();
  }, []);

  // Sync custom → timeLeft when not running
  useEffect(() => {
    if (!state.running && state.mode === "work") {
      setState(prev => ({ ...prev, timeLeft: prev.custom * 60 }));
    }
  }, [state.custom]);

  // Timer tick
  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(intervalRef.current);
            handleComplete(prev);
            return { ...prev, timeLeft: 0, running: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [state.running]);

  const handleComplete = async (prev: TimerState) => {
    if (prev.mode !== "work") {
      toast.success("Break over! Time to focus 💪");
      return;
    }
    const mins = prev.custom;
    const xpGain = Math.round(mins * 2);
    if (userId) {
      await supabase.from("study_sessions").insert({
        user_id: userId, subject: prev.selSub, duration_mins: mins,
      });
      await addXP(supabase, userId, xpGain);
    }
    setState(p => ({
      ...p,
      sessions: p.sessions + 1,
      totalMins: p.totalMins + mins,
      xpEarned: p.xpEarned + xpGain,
    }));
    toast.success(`Session complete! +${xpGain} XP 🎉`);
    // Browser notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Learnixio AI 🍅", { body: `Focus session complete! +${xpGain} XP earned!` });
    }
  };

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, running: !prev.running }));
    // Request notification permission
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setState(prev => ({
      ...prev,
      running: false,
      timeLeft: prev.mode === "work" ? prev.custom * 60 : MODES[prev.mode].duration,
    }));
  }, []);

  const skip = useCallback(() => {
    clearInterval(intervalRef.current);
    const next: ModeKey = state.mode === "work" ? (state.sessions % 4 === 3 ? "long" : "short") : "work";
    setState(prev => ({
      ...prev,
      running: false,
      mode: next,
      timeLeft: next === "work" ? prev.custom * 60 : MODES[next].duration,
    }));
  }, [state.mode, state.sessions]);

  const setMode = useCallback((m: ModeKey) => {
    clearInterval(intervalRef.current);
    setState(prev => ({
      ...prev,
      mode: m,
      running: false,
      timeLeft: m === "work" ? prev.custom * 60 : MODES[m].duration,
    }));
  }, []);

  const setCustom = useCallback((n: number) => {
    setState(prev => ({ ...prev, custom: n }));
  }, []);

  const setSelSub = useCallback((s: string) => {
    setState(prev => ({ ...prev, selSub: s }));
  }, []);

  return (
    <TimerContext.Provider value={{ ...state, setMode, setCustom, setSelSub, toggle, reset, skip }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export { MODES };
