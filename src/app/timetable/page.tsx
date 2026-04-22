"use client";
import { useState, useEffect } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const TYPES = ["class","lab","study","exam"];
const TYPE_COLORS: Record<string,string> = {
  class: "#4F8EF7", lab: "#34D399", study: "#A78BFA", exam: "#F87171"
};

export default function TimetablePage() {
  const supabase = createClient();
  const [entries,  setEntries]  = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [form, setForm] = useState({
    subject: "", day: "Mon", start_time: "09:00",
    end_time: "10:30", room: "", type: "class",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) { setLoading(false); return; }
    const [{ data: e }, { data: s }] = await Promise.all([
      supabase.from("timetable").select("*").eq("user_id", user.id).order("start_time"),
      supabase.from("subjects").select("*").eq("user_id", user.id),
    ]);
    setEntries(e || []);
    setSubjects(s || []);
    if (s && s.length > 0) setForm(f => ({ ...f, subject: s[0].name }));
    setLoading(false);
    } catch(e) { console.warn("Fetch error:", e); setLoading(false); }
  };

  const addEntry = async () => {
    if (!form.subject) { toast.error("Please select a subject"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("timetable")
      .insert({ user_id: user.id, ...form })
      .select().single();
    if (error) { toast.error("Failed to add"); return; }
    setEntries(prev => [...prev, data]);
    setShowForm(false);
    setForm(f => ({ ...f, room: "" }));
    toast.success(`${form.subject} added to ${form.day}! 📅`);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("timetable").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success("Removed from timetable");
  };

  const subjectColor = (name: string) =>
    subjects.find(s => s.name === name)?.color || "#4F8EF7";

  // Today highlight
  const todayIndex = new Date().getDay();
  const todayName  = DAYS[todayIndex === 0 ? 6 : todayIndex - 1];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, color:"var(--muted)" }}>Loading…</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <p style={{ color:"var(--muted)", fontSize:14 }}>
          Your weekly class schedule · Today is <strong style={{ color:"#4F8EF7" }}>{todayName}</strong>
        </p>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:12, border:"none", background:"#4F8EF7", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
          <Plus size={15}/> Add Class
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ marginBottom:20, padding:20, borderRadius:16, border:"1px solid #4F8EF744", background:"var(--card)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:12 }}>
            {/* Subject */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Subject</label>
              <select value={form.subject} onChange={e => setForm({...form, subject:e.target.value})}
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            {/* Day */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Day</label>
              <select value={form.day} onChange={e => setForm({...form, day:e.target.value})}
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* Type */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            {/* Start */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time:e.target.value})}
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}/>
            </div>
            {/* End */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time:e.target.value})}
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}/>
            </div>
            {/* Room */}
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Room (Optional)</label>
              <input type="text" value={form.room} onChange={e => setForm({...form, room:e.target.value})} placeholder="e.g. Room 201"
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={addEntry}
              style={{ padding:"9px 20px", borderRadius:10, border:"none", background:"#4F8EF7", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
              Add to Timetable
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding:"9px 20px", borderRadius:10, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Weekly Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
        {DAYS.map(day => {
          const isToday = day === todayName;
          const dayEntries = entries.filter(e => e.day === day);
          return (
            <div key={day}>
              {/* Day header */}
              <div style={{
                textAlign:"center", fontSize:12, fontWeight:700,
                textTransform:"uppercase" as const, letterSpacing:".08em",
                padding:"10px 4px", marginBottom:10, borderRadius:12,
                border: isToday ? "2px solid #4F8EF7" : "1px solid var(--border)",
                background: isToday ? "#4F8EF722" : "var(--card)",
                color: isToday ? "#4F8EF7" : "var(--muted)",
              }}>
                {day}
                {isToday && <div style={{ fontSize:9, marginTop:2, color:"#4F8EF7" }}>TODAY</div>}
              </div>

              {/* Entries */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, minHeight:160 }}>
                {dayEntries.map(entry => {
                  const col = subjectColor(entry.subject);
                  const typeCol = TYPE_COLORS[entry.type] || "#4F8EF7";
                  return (
                    <div key={entry.id} style={{
                      borderRadius:12, padding:"10px 10px 8px", transition:"all .2s cubic-bezier(.34,1.4,.64,1)",
                      background: `${col}18`,
                      border: `1px solid ${col}33`,
                      borderLeft: `3px solid ${col}`,
                      position:"relative",
                    }}>
                      <div style={{ fontSize:12, fontWeight:700, color:col, marginBottom:3 }}>
                        {entry.subject}
                      </div>
                      <div style={{ fontSize:10, color:"var(--muted)" }}>
                        {entry.start_time} – {entry.end_time}
                      </div>
                      {entry.room && (
                        <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>
                          📍 {entry.room}
                        </div>
                      )}
                      <span style={{
                        display:"inline-block", marginTop:6, fontSize:9, padding:"2px 7px",
                        borderRadius:20, fontWeight:700, textTransform:"uppercase" as const,
                        background:`${typeCol}22`, color:typeCol,
                      }}>
                        {entry.type}
                      </span>
                      <button onClick={() => deleteEntry(entry.id)}
                        style={{ position:"absolute", top:6, right:6, background:"none", border:"none", cursor:"pointer", color:"var(--muted)", opacity:.5, display:"flex", padding:2 }}>
                        <X size={11}/>
                      </button>
                    </div>
                  );
                })}
                {dayEntries.length === 0 && (
                  <div style={{ textAlign:"center", padding:"20px 4px", border:"1px dashed var(--border)", borderRadius:12, color:"var(--muted)", fontSize:10 }}>
                    Free
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      {entries.length > 0 && (
        <div style={{ marginTop:20, padding:"14px 20px", borderRadius:14, border:"1px solid var(--border)", background:"var(--card)", display:"flex", gap:20, flexWrap:"wrap" }}>
          <div style={{ fontSize:13, color:"var(--muted)" }}>
            📊 Total: <strong style={{ color:"var(--text)" }}>{entries.length} classes/week</strong>
          </div>
          {DAYS.map(d => {
            const count = entries.filter(e => e.day === d).length;
            if (count === 0) return null;
            return (
              <div key={d} style={{ fontSize:13, color:"var(--muted)" }}>
                {d}: <strong style={{ color:d===todayName?"#4F8EF7":"var(--text)" }}>{count}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
