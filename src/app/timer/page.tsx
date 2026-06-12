"use client";
import { useTimer, MODES } from "@/lib/TimerContext";
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus } from "lucide-react";
import { useEffect } from "react";

function fmt(s: number) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

export default function TimerPage() {
  const {
    mode, timeLeft, running, sessions, totalMins, xpEarned,
    custom, selSub, setMode, setCustom, setSelSub, toggle, reset, skip
  } = useTimer();

  const current = MODES[mode];
  const progress = mode === "work"
    ? (timeLeft / (custom * 60)) * 100
    : (timeLeft / MODES[mode].duration) * 100;

  const radius = 120;
  const circ   = 2 * Math.PI * radius;

  // Update page title with timer
  useEffect(() => {
    document.title = running ? `${fmt(timeLeft)} — ZenithStudy` : "Focus Timer — ZenithStudy";
    return () => { document.title = "ZenithStudy"; };
  }, [timeLeft, running]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Mode Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, background: "var(--card)", borderRadius: 16, padding: 6, border: "1px solid var(--border)" }}>
        {(Object.keys(MODES) as (keyof typeof MODES)[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{
              flex: 1, padding: "9px 12px", borderRadius: 11,
              background: mode === m ? `${MODES[m].color}22` : "transparent",
              color: mode === m ? MODES[m].color : "var(--muted)",
              fontWeight: mode === m ? 700 : 500,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              border: mode === m ? `1px solid ${MODES[m].color}44` : "1px solid transparent",
              transition: "all .2s",
            }}>
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 280, height: 280 }}>
          <svg width="280" height="280" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="140" cy="140" r={radius} fill="none" stroke="var(--border)" strokeWidth="10"/>
            <circle cx="140" cy="140" r={radius} fill="none"
              stroke={current.color} strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress / 100)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset .5s ease, stroke .3s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: "var(--text)", fontFamily: "monospace", letterSpacing: -2 }}>
              {fmt(timeLeft)}
            </div>
            <div style={{ fontSize: 14, color: current.color, fontWeight: 700, marginTop: 4 }}>
              {current.label}
            </div>
            {running && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                ● Live
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={reset}
            style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--card)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#F87171"; e.currentTarget.style.color = "#F87171"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
            <RotateCcw size={18}/>
          </button>

          <button onClick={toggle}
            style={{
              width: 72, height: 72, borderRadius: "50%", border: "none",
              background: `linear-gradient(135deg,${current.color},${current.color}cc)`,
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: `0 8px 28px ${current.color}55`,
              transition: "all .2s", transform: "scale(1)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
            {running ? <Pause size={28}/> : <Play size={28} style={{ marginLeft: 3 }}/>}
          </button>

          <button onClick={skip}
            style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--card)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = current.color; e.currentTarget.style.color = current.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
            <SkipForward size={18}/>
          </button>
        </div>

        {/* Custom Duration (work mode only) */}
        {mode === "work" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)" }}>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Duration</span>
            <button onClick={() => setCustom(Math.max(5, custom - 5))} disabled={running}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg)", cursor: running ? "not-allowed" : "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", opacity: running ? .5 : 1 }}>
              <Minus size={16}/>
            </button>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", minWidth: 48, textAlign: "center" }}>{custom}m</span>
            <button onClick={() => setCustom(Math.min(120, custom + 5))} disabled={running}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg)", cursor: running ? "not-allowed" : "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", opacity: running ? .5 : 1 }}>
              <Plus size={16}/>
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        {[
          { label:"Sessions Today", value: sessions, color:"#4F8EF7", icon:"🍅" },
          { label:"Minutes Studied", value: totalMins, color:"#34D399", icon:"⏱️" },
          { label:"XP Earned", value: xpEarned, color:"#F5A623", icon:"⚡" },
        ].map(s => (
          <div key={s.label} style={{ padding: "14px 16px", borderRadius: 16, border: `1px solid ${s.color}33`, background: `${s.color}0a`, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: "4px 0" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13, color: "var(--muted)", textAlign: "center", lineHeight: 1.7 }}>
        💡 Timer runs globally — you can navigate to other pages and come back!<br/>
        <span style={{ fontSize: 11 }}>🔔 Allow notifications to get alerts when session ends</span>
      </div>
    </div>
  );
}
