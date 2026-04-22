"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, FileText, Flame, Zap, Check, ArrowRight } from "lucide-react";
import { onXPUpdate } from "@/lib/xp-utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const weeklyData = [
  { day:"Mon", hours:3.5 }, { day:"Tue", hours:2 },
  { day:"Wed", hours:4.5 }, { day:"Thu", hours:1.5 },
  { day:"Fri", hours:5   }, { day:"Sat", hours:3 },
  { day:"Sun", hours:2.5 },
];

// ── Fast count-up hook ──
function useCountUp(target: number, duration = 600) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 2);
      setVal(Math.round(from + (target - from) * ease));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [profile,  setProfile]  = useState<any>(null);
  const [tasks,    setTasks]    = useState<any[]>([]);
  const [notes,    setNotes]    = useState<any[]>([]);
  const [xp,       setXp]       = useState(0);
  const [streak,   setStreak]   = useState(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState("");
  const [visible,  setVisible]  = useState(false);

  const animXp     = useCountUp(xp,     500);
  const animStreak = useCountUp(streak, 400);

  useEffect(() => {
    fetchData();
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    if (!userId) return;
    return onXPUpdate(async () => {
      const { data } = await supabase.from("user_xp").select("total_xp,streak").eq("user_id", userId).single();
      if (data) { setXp(data.total_xp || 0); setStreak(data.streak || 0); }
    });
  }, [userId]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data:p },{ data:t },{ data:n },{ data:x },{ data:s }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("user_xp").select("*").eq("user_id", user.id).single(),
        supabase.from("subjects").select("*").eq("user_id", user.id),
      ]);
      setProfile(p); setTasks(t||[]); setNotes(n||[]);
      setXp(x?.total_xp||0); setStreak(x?.streak||0); setSubjects(s||[]);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const h = new Date().getHours();
  const greeting = h<12 ? "Good morning" : h<17 ? "Good afternoon" : "Good evening";
  const level   = Math.floor(xp/500)+1;
  const xpInLv  = xp%500;
  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t =>  t.done);
  const name    = profile?.name || "Student";
  const subjectColor = (n: string) => subjects.find(s=>s.name===n)?.color||"#4F8EF7";
  const pieData = subjects.slice(0,6).map(s=>({ name:s.name, value:Math.round(100/Math.max(subjects.length,1)), color:s.color }));

  const fadeUp = (delay = 0) => ({
    opacity:   visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity .35s ease ${delay}ms, transform .35s cubic-bezier(.34,1.3,.64,1) ${delay}ms`,
  });

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, animation:"spin .6s linear infinite" }}>⚡</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:"var(--muted)", marginTop:12, fontSize:14 }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes popIn   { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes streakPulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,166,35,.5)} 50%{box-shadow:0 0 0 12px rgba(245,166,35,0)} }
        .stat-card:hover { transform:translateY(-6px) scale(1.02) !important; }
        .task-row:hover  { background:rgba(79,142,247,.08) !important; border-color:rgba(79,142,247,.3) !important; }
        .note-card:hover { transform:translateY(-3px) !important; border-color:rgba(79,142,247,.4) !important; }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── Hero Banner ── */}
        <div style={{ ...fadeUp(0), borderRadius:22, padding:"28px 32px", position:"relative", overflow:"hidden",
          background:"var(--hero-bg, linear-gradient(135deg,var(--card) 0%,var(--surface) 100%))",
          border:"1px solid rgba(79,142,247,.15)",
          boxShadow:"0 4px 24px rgba(0,0,0,.12)"
        }}>
          {/* Glow orbs */}
          <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(79,142,247,.18) 0%,transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-40, left:100, width:150, height:150, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.1) 0%,transparent 70%)", pointerEvents:"none" }}/>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", position:"relative" }}>
            <div>
              <p style={{ color:"var(--muted)", fontSize:13, marginBottom:6 }}>{greeting} 👋</p>
              <h2 style={{ fontFamily:"var(--font-lora),serif", fontSize:36, color:"#fff", marginBottom:8, fontWeight:700, textShadow:"0 2px 20px rgba(79,142,247,.3)" }}>
                {name}
              </h2>
              {profile?.institution && (
                <p style={{ color:"var(--muted)", fontSize:13, marginBottom:8 }}>🏫 {profile.institution}</p>
              )}
              <p style={{ color:"var(--muted)", fontSize:14 }}>
                You have <strong style={{ color:"#F5A623", textShadow:"0 0 12px rgba(245,166,35,.5)" }}>{pending.length} tasks</strong> pending today!
              </p>
            </div>

            {/* Streak badge */}
            <div style={{ textAlign:"center", background:"rgba(245,166,35,.1)", borderRadius:18, padding:"16px 22px", border:"1px solid rgba(245,166,35,.25)", animation:"streakPulse 3s infinite" }}>
              <div style={{ fontSize:40, lineHeight:1 }}>🔥</div>
              <div style={{ color:"#F5A623", fontWeight:900, fontSize:28, lineHeight:1.1, textShadow:"0 0 20px rgba(245,166,35,.6)" }}>{animStreak}</div>
              <div style={{ color:"var(--muted)", fontSize:11, marginTop:4, fontWeight:600 }}>day streak</div>
            </div>
          </div>

          {/* XP + badges row */}
          <div style={{ display:"flex", gap:10, marginTop:20, flexWrap:"wrap" }}>
            {[
              ["⚡", `${animXp} XP`, "#F5A623"],
              ["🎯", `Level ${level}`, "#4F8EF7"],
              ["✅", `${done.length} done`, "#34D399"],
              ["📝", `${notes.length} notes`, "#A78BFA"],
            ].map(([ico, lbl, color]) => (
              <div key={lbl as string}
                style={{ background:"rgba(255,255,255,.07)", backdropFilter:"blur(8px)", borderRadius:12, padding:"8px 16px", display:"flex", alignItems:"center", gap:7, border:"1px solid var(--border)", transition:"all .2s", cursor:"default" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <span style={{ fontSize:16 }}>{ico}</span>
                <span style={{ color: color as string, fontWeight:800, fontSize:13 }}>{lbl}</span>
              </div>
            ))}
          </div>

          {/* Animated XP progress bar */}
          <div style={{ marginTop:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontWeight:600 }}>Level {level}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>{xpInLv}/500 XP to Level {level+1}</span>
            </div>
            <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,.08)", overflow:"hidden" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#4F8EF7,#A78BFA,#34D399)", backgroundSize:"200% 100%", borderRadius:3, width:`${(xpInLv/500)*100}%`, transition:"width .8s cubic-bezier(.4,0,.2,1)", animation:"shimmer 2s linear infinite" }}/>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {[
            { icon:CheckSquare, label:"Pending",  value:pending.length, sub:"Due this week", color:"#4F8EF7", delay:80  },
            { icon:FileText,    label:"Notes",    value:notes.length,   sub:"Total created", color:"#A78BFA", delay:140 },
            { icon:Flame,       label:"Streak",   value:streak,         sub:"Keep going!",   color:"#F5A623", delay:200 },
            { icon:Zap,         label:"Total XP", value:xp,             sub:`Level ${level}`,color:"#34D399", delay:260 },
          ].map(({ icon:Icon, label, value, sub, color, delay }) => (
            <div key={label} className="stat-card hv-card" style={{
              ...fadeUp(delay),
              borderRadius:18, padding:"20px 18px",
              background:"var(--card)",
              border:`1px solid ${color}22`,
              boxShadow:"0 4px 16px rgba(0,0,0,.08)",
              backdropFilter:"blur(10px)",
              transition:"transform .2s cubic-bezier(.34,1.3,.64,1), box-shadow .2s",
              cursor:"default",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <p style={{ fontSize:10, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>{label}</p>
                  <p style={{ fontSize:30, fontWeight:900, color, textShadow:`0 0 20px ${color}66` }}>
                    {value.toLocaleString()}
                  </p>
                  <p style={{ fontSize:11, color:"var(--muted)", marginTop:5 }}>{sub}</p>
                </div>
                <div style={{ padding:10, borderRadius:12, background:`${color}18`, border:`1px solid ${color}22` }}>
                  <Icon size={20} style={{ color }}/>
                </div>
              </div>
              {/* Bottom accent line */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color},transparent)`, borderRadius:"0 0 18px 18px", opacity:.5 }}/>
            </div>
          ))}
        </div>

        {/* ── Chart + Tasks ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16 }}>
          <div style={{
            ...fadeUp(320),
            borderRadius:20, padding:22,
            background:"var(--card)",
            border:"1px solid rgba(79,142,247,.12)",
            backdropFilter:"blur(12px)",
            boxShadow:"0 4px 30px rgba(0,0,0,.3)",
          }}>
            <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)", marginBottom:20 }}>
              Weekly Study Hours
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4F8EF7" stopOpacity={.4}/>
                    <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,142,247,.08)"/>
                <XAxis dataKey="day" stroke="#5A7A9E" tick={{ fontSize:11 }}/>
                <YAxis stroke="#5A7A9E" tick={{ fontSize:11 }}/>
                <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, fontSize:12, backdropFilter:"blur(10px)" }}/>
                <Area type="monotone" dataKey="hours" stroke="#4F8EF7" strokeWidth={2.5} fill="url(#g1)" dot={{ fill:"#4F8EF7", r:4, strokeWidth:0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            ...fadeUp(380),
            borderRadius:20, padding:20,
            background:"var(--card)",
            border:"1px solid rgba(79,142,247,.12)",
            backdropFilter:"blur(12px)",
            boxShadow:"0 4px 30px rgba(0,0,0,.3)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)" }}>Today&apos;s Tasks</h3>
              <a href="/planner" style={{ color:"#4F8EF7", fontSize:12, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
                All <ArrowRight size={12}/>
              </a>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {pending.slice(0,5).map((task, i) => (
                <div key={task.id} className="task-row hv-lift" style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"9px 12px", borderRadius:12,
                  background:"var(--bg)",
                  border:"1px solid var(--border)",
                  transition:"all .15s",
                  animation:`popIn .3s ease ${i*60}ms both`,
                }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid rgba(79,142,247,.4)`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {task.done && <Check size={9} color="#34D399"/>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.title}</p>
                    {task.subject && <p style={{ fontSize:10, color:subjectColor(task.subject), marginTop:1 }}>{task.subject}</p>}
                  </div>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:task.priority==="high"?"#F87171":task.priority==="medium"?"#F5A623":"#34D399", flexShrink:0, boxShadow:`0 0 6px ${task.priority==="high"?"#F87171":task.priority==="medium"?"#F5A623":"#34D399"}` }}/>
                </div>
              ))}
              {pending.length === 0 && (
                <div style={{ textAlign:"center", padding:28, color:"var(--muted)" }}>
                  <p style={{ fontSize:22, marginBottom:8 }}>🎉</p>
                  <p style={{ fontSize:13 }}>All tasks done!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Subjects + Notes ── */}
        <div style={{ display:"grid", gridTemplateColumns:subjects.length>0?"220px 1fr":"1fr", gap:16 }}>
          {subjects.length > 0 && (
            <div style={{
              ...fadeUp(440),
              borderRadius:20, padding:20,
              background:"var(--card)",
              border:"1px solid rgba(79,142,247,.12)",
              backdropFilter:"blur(12px)",
            }}>
              <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:16, color:"var(--text)", marginBottom:14 }}>Subjects</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>[`${v}%`]} contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:8 }}>
                {pieData.slice(0,4).map(s => (
                  <div key={s.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:s.color, boxShadow:`0 0 6px ${s.color}` }}/>
                      <span style={{ fontSize:11, color:"var(--muted)" }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:s.color }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            ...fadeUp(500),
            borderRadius:20, padding:20,
            background:"var(--card)",
            border:"1px solid rgba(79,142,247,.12)",
            backdropFilter:"blur(12px)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)" }}>Recent Notes</h3>
              <a href="/notes" style={{ color:"#4F8EF7", fontSize:12, fontWeight:700, textDecoration:"none" }}>View all →</a>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {notes.slice(0,4).map((note, i) => (
                <div key={note.id} className="note-card hv-card" style={{
                  padding:14, borderRadius:14,
                  background:"var(--bg)",
                  border:`1px solid rgba(255,255,255,.06)`,
                  borderLeft:`3px solid ${subjectColor(note.subject)}`,
                  transition:"all .2s cubic-bezier(.34,1.3,.64,1)",
                  animation:`popIn .3s ease ${i*70}ms both`,
                  cursor:"pointer",
                }}>
                  {note.subject && (
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:`${subjectColor(note.subject)}22`, color:subjectColor(note.subject), display:"inline-block", marginBottom:7 }}>
                      {note.subject}
                    </span>
                  )}
                  <h4 style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:4 }}>{note.title}</h4>
                  <p style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>
                    {note.content || "Empty note"}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <div style={{ gridColumn:"1/-1", textAlign:"center", padding:30, color:"var(--muted)" }}>
                  <p>No notes yet. <a href="/notes" style={{ color:"#4F8EF7" }}>Create one!</a></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
