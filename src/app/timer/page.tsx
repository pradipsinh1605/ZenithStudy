"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addXP } from "@/lib/xp-utils";
import toast from "react-hot-toast";

const MODES = {
  work:  { label:"Focus",       duration:25*60, color:"#4F8EF7" },
  short: { label:"Short Break", duration:5*60,  color:"#34D399" },
  long:  { label:"Long Break",  duration:15*60, color:"#A78BFA" },
};

export default function TimerPage() {
  const supabase   = createClient();
  const [mode,     setMode]     = useState<keyof typeof MODES>("work");
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [running,  setRunning]  = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalMins,setTotalMins]= useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [custom,   setCustom]   = useState(25);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selSub,   setSelSub]   = useState("");
  const [userId,   setUserId]   = useState("");
  const intervalRef = useRef<NodeJS.Timeout>();
  const current = MODES[mode];

  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser().catch(()=>({data:{user:null},error:new Error("auth")}));
      if (error || !user) return;
      setUserId(user.id);
      const { data: s } = await supabase.from("subjects").select("*").eq("user_id", user.id);
      setSubjects(s || []);

      // Load today's session count
      const today = new Date().toISOString().slice(0, 10);
      const { data: sess } = await supabase
        .from("study_sessions")
        .select("duration_mins")
        .eq("user_id", user.id)
        .gte("created_at", today);
      if (sess) {
        setSessions(sess.length);
        setTotalMins(sess.reduce((a, s) => a + (s.duration_mins || 0), 0));
      }
    })();
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "work") handleSessionComplete();
            else toast.success("Break over! Time to focus! 💪");
            return 0;
          }
          // 5-minute warning
          if (t === 5 * 60) toast("⏰ 5 minutes left!", { icon: "⏰" });
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const handleSessionComplete = async () => {
    if (!userId) return;
    const mins = custom;

    // ✅ Save session to Supabase
    await supabase.from("study_sessions").insert({
      user_id:      userId,
      subject:      selSub || null,
      duration_mins: mins,
      type:         "pomodoro",
      completed:    true,
    });

    // ✅ Award +50 XP
    const newXp = await addXP(supabase, userId, 50);

    setSessions(s => s + 1);
    setTotalMins(m => m + mins);
    setXpEarned(x => x + 50);

    toast.success(`🍅 Session Complete! +50 XP earned! 🎉`, { duration: 4000 });
  };

  const switchMode = (m: keyof typeof MODES) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setMode(m);
    setTimeLeft(m === "work" ? custom * 60 : MODES[m].duration);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTimeLeft(mode === "work" ? custom * 60 : current.duration);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const r    = 110;
  const circ = 2 * Math.PI * r;
  const prog = 1 - timeLeft / (mode === "work" ? custom * 60 : current.duration);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>

      {/* Mode switcher */}
      <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:32 }}>
        {(Object.entries(MODES) as [keyof typeof MODES, typeof MODES.work][]).map(([key,val]) => (
          <button key={key} onClick={() => switchMode(key)}
            style={{ padding:"8px 20px", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:`1px solid ${mode===key?val.color:"var(--border)"}`, background:mode===key?`${val.color}22`:"transparent", color:mode===key?val.color:"var(--muted)", transition:"all .15s" }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Subject selector */}
      {subjects.length > 0 && (
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <select value={selSub} onChange={e => setSelSub(e.target.value)}
            style={{ borderRadius:12, padding:"8px 16px", fontSize:13, border:"1px solid var(--border)", background:"var(--card)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}>
            <option value="">No subject</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* SVG Circle Timer */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
        <div style={{ position:"relative", width:280, height:280 }}>
          <svg width={280} height={280} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={140} cy={140} r={r} fill="none" stroke="var(--border)" strokeWidth={10}/>
            <circle cx={140} cy={140} r={r} fill="none" stroke={current.color} strokeWidth={10}
              strokeLinecap="round" strokeDasharray={circ}
              strokeDashoffset={circ * (1 - prog)}
              style={{ transition:"stroke-dashoffset .5s ease" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:".1em", color:"var(--muted)", marginBottom:4 }}>
              {current.label}
            </div>
            <div style={{ fontSize:54, fontWeight:800, color:"var(--text)", letterSpacing:"-.02em", fontFamily:"var(--font-sora),sans-serif" }}>
              {mins}:{secs}
            </div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
              Session #{sessions + 1}
            </div>
            {selSub && (
              <div style={{ fontSize:11, marginTop:6, padding:"3px 10px", borderRadius:20, background:`${current.color}22`, color:current.color, fontWeight:600 }}>
                {selSub}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16, marginBottom:32 }}>
        <button onClick={reset}
          style={{ width:50, height:50, borderRadius:"50%", border:"1px solid var(--border)", background:"var(--card)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)" }}>
          <RotateCcw size={20}/>
        </button>
        <button onClick={() => setRunning(!running)}
          style={{ width:76, height:76, borderRadius:"50%", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", background:current.color, boxShadow:`0 0 32px ${current.color}66`, transition:"all .2s" }}>
          {running ? <Pause size={30}/> : <Play size={30} style={{ marginLeft:3 }}/>}
        </button>
        <button onClick={() => switchMode(mode==="work"?"short":"work")}
          style={{ width:50, height:50, borderRadius:"50%", border:"1px solid var(--border)", background:"var(--card)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)" }}>
          <SkipForward size={20}/>
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
        {[
          ["🍅","Sessions Today", sessions],
          ["⏱️","Minutes Studied",totalMins],
          ["⚡","XP Earned",      xpEarned],
        ].map(([ico,lbl,val]) => (
          <div key={lbl as string} style={{ borderRadius:16, padding:"16px", textAlign:"center", border:"1px solid var(--border)", background:"var(--card)" }}>
            <div style={{ fontSize:26, marginBottom:6 }}>{ico}</div>
            <div style={{ fontSize:22, fontWeight:800, color:"var(--text)" }}>{val}</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Custom duration */}
      <div style={{ borderRadius:16, padding:20, border:"1px solid var(--border)", background:"var(--card)" }}>
        <p style={{ fontSize:13, fontWeight:600, color:"var(--muted)", marginBottom:12 }}>
          ⚙️ Custom Focus Duration
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => { const v=Math.max(5,custom-5); setCustom(v); if(!running) setTimeLeft(v*60); }}
            style={{ width:38, height:38, borderRadius:10, border:"1px solid var(--border)", background:"var(--bg)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text)" }}>
            <Minus size={16}/>
          </button>
          <div style={{ flex:1, textAlign:"center", fontSize:20, fontWeight:800, color:"var(--text)" }}>
            {custom} min
          </div>
          <button onClick={() => { const v=Math.min(90,custom+5); setCustom(v); if(!running) setTimeLeft(v*60); }}
            style={{ width:38, height:38, borderRadius:10, border:"1px solid var(--border)", background:"var(--bg)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text)" }}>
            <Plus size={16}/>
          </button>
          <button onClick={() => { switchMode("work"); setTimeLeft(custom*60); }}
            style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#4F8EF7", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
            Set
          </button>
        </div>
      </div>

      {/* Tips */}
      <div style={{ marginTop:16, padding:"12px 16px", borderRadius:12, background:"var(--card)", border:"1px solid var(--border)", fontSize:12, color:"var(--muted)", lineHeight:1.7 }}>
        💡 <strong style={{ color:"var(--text)" }}>Pomodoro Tips:</strong> Work 25 min → Short break 5 min → After 4 sessions → Long break 15 min. Each completed session earns <strong style={{ color:"#F5A623" }}>+50 XP!</strong>
      </div>
    </div>
  );
}
