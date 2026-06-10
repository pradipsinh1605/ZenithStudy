"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, TrendingUp, Clock } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function ProgressPage() {
  const supabase  = createClient();
  const [tasks,    setTasks]    = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: t }, { data: s }, { data: ss }] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("subjects").select("*").eq("user_id", user.id),
        supabase.from("study_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);
      setTasks(t || []);
      setSubjects(s || []);
      setSessions(ss || []);
      setLoading(false);
    })();
  }, []);

  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const rate  = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalMins  = sessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0);
  const totalHours = (totalMins / 60).toFixed(1);

  // ── Build real weekly chart data from sessions ──
  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weeklyMap: Record<string, { hours: number; tasks: number }> = {};
  DAYS.forEach(d => { weeklyMap[d] = { hours: 0, tasks: 0 }; });

  // Last 7 days sessions
  const now = new Date();
  sessions.forEach(s => {
    const d = new Date(s.created_at);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
      weeklyMap[dayName].hours += (s.duration_mins || 0) / 60;
    }
  });

  // Last 7 days tasks
  tasks.filter(t => t.done).forEach(t => {
    const d = new Date(t.created_at);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
      weeklyMap[dayName].tasks += 1;
    }
  });

  const weeklyData = DAYS.map(d => ({
    day: d,
    hours: parseFloat(weeklyMap[d].hours.toFixed(1)),
    tasks: weeklyMap[d].tasks,
  }));

  // ── Subject breakdown from sessions ──
  const subjectMap: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.subject) {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + (s.duration_mins || 0);
    }
  });
  const subjectData = Object.entries(subjectMap).map(([name, mins]) => ({
    name,
    hours: parseFloat((mins / 60).toFixed(1)),
    color: subjects.find(s => s.name === name)?.color || "#4F8EF7",
  })).sort((a, b) => b.hours - a.hours);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, color:"var(--muted)" }}>Loading...</div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      <style>{`
        .grid-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .grid-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) {
          .grid-stats { grid-template-columns: 1fr; }
          .grid-charts { grid-template-columns: 1fr; }
        }
      `}</style>
      {/* Stats */}
      <div className="grid-stats">
        {[
          { icon:CheckSquare, label:"Tasks Done",       value:done,             sub:`of ${total} total`,  color:"#34D399" },
          { icon:TrendingUp,  label:"Completion Rate",  value:`${rate}%`,       sub:"Overall progress",   color:"#4F8EF7" },
          { icon:Clock,       label:"Total Study Time", value:`${totalHours}h`, sub:`${sessions.length} sessions`, color:"#F5A623" },
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
      <div className="grid-charts">
        <div style={{ borderRadius:20, padding:20, border:"1px solid var(--border)", background:"var(--card)" }}>
          <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)", marginBottom:4 }}>Daily Study Hours</h3>
          <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>Last 7 days · Real data</p>
          {sessions.length === 0 ? (
            <div style={{ height:220, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:13 }}>
              No study sessions yet. Start the Focus Timer! 🍅
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize:11 }}/>
                <YAxis stroke="var(--muted)" tick={{ fontSize:11 }}/>
                <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, fontSize:12 }} formatter={(v:any) => [`${v}h`, "Hours"]}/>
                <Bar dataKey="hours" fill="#4F8EF7" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ borderRadius:20, padding:20, border:"1px solid var(--border)", background:"var(--card)" }}>
          <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)", marginBottom:4 }}>Tasks Completed</h3>
          <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>Last 7 days · Real data</p>
          {tasks.length === 0 ? (
            <div style={{ height:220, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:13 }}>
              No tasks yet. Add tasks in Planner! 📋
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize:11 }}/>
                <YAxis stroke="var(--muted)" tick={{ fontSize:11 }}/>
                <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, fontSize:12 }} formatter={(v:any) => [v, "Tasks"]}/>
                <Area type="monotone" dataKey="tasks" stroke="#34D399" fill="#34D39922"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subject Breakdown */}
      {subjectData.length > 0 && (
        <div style={{ borderRadius:20, padding:20, border:"1px solid var(--border)", background:"var(--card)" }}>
          <h3 style={{ fontFamily:"var(--font-lora),serif", fontSize:18, color:"var(--text)", marginBottom:16 }}>Time by Subject</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {subjectData.map(s => (
              <div key={s.name} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--text)", minWidth:100 }}>{s.name}</span>
                <div style={{ flex:1, height:8, borderRadius:4, background:"var(--border)", overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:4, background:s.color,
                    width:`${Math.min((s.hours / parseFloat(totalHours)) * 100, 100)}%`,
                    transition:"width .5s ease"
                  }}/>
                </div>
                <span style={{ fontSize:12, color:"var(--muted)", minWidth:40, textAlign:"right" }}>{s.hours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && tasks.length === 0 && (
        <div style={{ borderRadius:20, padding:40, border:"1px dashed var(--border)", background:"var(--card)", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
          <h3 style={{ color:"var(--text)", fontWeight:700, marginBottom:8 }}>No Data Yet</h3>
          <p style={{ color:"var(--muted)", fontSize:14 }}>Start using Focus Timer and Planner to see your real progress here!</p>
        </div>
      )}
    </div>
  );
}
