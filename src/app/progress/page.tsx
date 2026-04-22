"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, TrendingUp, Clock } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const weeklyData = [
  { day:"Mon", hours:3.5, tasks:4 },
  { day:"Tue", hours:2,   tasks:3 },
  { day:"Wed", hours:4.5, tasks:6 },
  { day:"Thu", hours:1.5, tasks:2 },
  { day:"Fri", hours:5,   tasks:7 },
  { day:"Sat", hours:3,   tasks:4 },
  { day:"Sun", hours:2.5, tasks:3 },
];

export default function ProgressPage() {
  const supabase  = createClient();
  const [tasks,    setTasks]    = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: t }, { data: s }, { data: ss }] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("subjects").select("*").eq("user_id", user.id),
        supabase.from("study_sessions").select("*").eq("user_id", user.id),
      ]);
      setTasks(t || []);
      setSubjects(s || []);
      setSessions(ss || []);
    })();
  }, []);

  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const rate  = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalMins = sessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0);
  const totalHours = (totalMins / 60).toFixed(1);

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {[
          { icon:CheckSquare, label:"Tasks Done",       value:done,         sub:`of ${total} total`,  color:"#34D399" },
          { icon:TrendingUp,  label:"Completion Rate",  value:`${rate}%`,   sub:"Overall progress",   color:"#4F8EF7" },
          { icon:Clock,       label:"Total Study Time", value:`${totalHours}h`, sub:"All sessions",   color:"#F5A623" },
        ].map(({ icon:Icon, label, value, sub, color }) => (
          <div key={label} style={{ borderRadius:20, padding:20, border:"1px solid var(--border)", background:"var(--card)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontSize:12, color:"var(--muted)", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:".05em", marginBottom:8 }}>{label}</p>
                <p style={{ fontSize:30, fontWeight:800, color:"var(--text)" }}>{value}</p>
                <p style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{sub}</p>
              </div>
              <div style={{ padding:10, borderRadius:12, background:`${color}22` }}>
                <Icon size={22} style={{ color }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={{ borderRadius:20, padding:20, border:"1px solid var(--border)", background:"var(--card)" }}>
          <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)", marginBottom:20 }}>Daily Study Hours</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize:11 }}/>
              <YAxis stroke="var(--muted)" tick={{ fontSize:11 }}/>
              <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, fontSize:12 }}/>
              <Bar dataKey="hours" fill="#4F8EF7" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ borderRadius:20, padding:20, border:"1px solid var(--border)", background:"var(--card)" }}>
          <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)", marginBottom:20 }}>Tasks Completed</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34D399" stopOpacity={.3}/>
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize:11 }}/>
              <YAxis stroke="var(--muted)" tick={{ fontSize:11 }}/>
              <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, fontSize:12 }}/>
              <Area type="monotone" dataKey="tasks" stroke="#34D399" fill="url(#tgrad)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject progress bars */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)", marginBottom:20 }}>Subject Progress</h3>
        {subjects.length === 0 ? (
          <p style={{ color:"var(--muted)", textAlign:"center", padding:20 }}>Add subjects in My Profile to track progress</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {subjects.map((s, i) => {
              const pct = Math.round(20 + (i * 13) % 60);
              const subjectTasks = tasks.filter(t => t.subject === s.name);
              const subjectDone  = subjectTasks.filter(t => t.done).length;
              const subjectRate  = subjectTasks.length > 0 ? Math.round((subjectDone / subjectTasks.length) * 100) : pct;
              return (
                <div key={s.id}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:s.color }}/>
                      <span style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize:13, color:"var(--muted)" }}>{subjectRate}%</span>
                  </div>
                  <div style={{ background:"var(--border)", borderRadius:6, height:8, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:`linear-gradient(90deg,${s.color},${s.color}88)`, width:`${subjectRate}%`, borderRadius:6, transition:"width 1s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
