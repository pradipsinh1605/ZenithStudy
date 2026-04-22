"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Check, CheckSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const XP_EVENT = "studybuddy:xp-updated";
function fireXPUpdate() { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(XP_EVENT)); }

const PRIOS: Record<string,{label:string;color:string;glow:string}> = {
  high:   { label:"High",   color:"#F87171", glow:"rgba(248,113,113,.4)" },
  medium: { label:"Medium", color:"#F5A623", glow:"rgba(245,166,35,.4)"  },
  low:    { label:"Low",    color:"#34D399", glow:"rgba(52,211,153,.4)"  },
};

export default function PlannerPage() {
  const supabase = createClient();
  const [tasks,    setTasks]    = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filter,   setFilter]   = useState<"all"|"pending"|"done">("all");
  const [showForm, setShowForm] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [visible,  setVisible]  = useState(false);
  const [curUser,  setCurUser]  = useState<any>(null);
  const [formTitle,    setFormTitle]    = useState("");
  const [formSubject,  setFormSubject]  = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formPriority, setFormPriority] = useState("medium");

  useEffect(() => { fetchData(); setTimeout(() => setVisible(true), 50); }, []);

  const fetchData = async () => {
    try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) { setLoading(false); return; }
    setCurUser(user);
    const [{ data:t },{ data:s }] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
      supabase.from("subjects").select("*").eq("user_id",user.id),
    ]);
    setTasks(t||[]); setSubjects(s||[]);
    if (s&&s.length>0) setFormSubject(s[0].name);
    setLoading(false);
    } catch(e) { console.warn("Fetch error:", e); setLoading(false); }
  };

  const addTask = async () => {
    if (!formTitle.trim()) { toast.error("Please enter a task title"); return; }
    const { data, error } = await supabase.from("tasks").insert({
      user_id:curUser.id, title:formTitle.trim(),
      subject:formSubject, deadline:formDeadline||null,
      priority:formPriority, done:false,
    }).select().single();
    if (error) { toast.error("Failed to add task"); return; }
    setTasks(prev => [data,...prev]);
    setFormTitle(""); setFormDeadline(""); setShowForm(false);
    toast.success("Task added! 📋");
  };

  const toggleTask = async (task: any) => {
    const newDone = !task.done;
    await supabase.from("tasks").update({ done:newDone }).eq("id",task.id);
    setTasks(prev => prev.map(t => t.id===task.id ? {...t,done:newDone} : t));
    if (newDone) {
      const { data: xpData } = await supabase.from("user_xp").select("total_xp").eq("user_id",curUser.id).single();
      const newXp = (xpData?.total_xp||0)+25;
      await supabase.from("user_xp").update({ total_xp:newXp, level:Math.floor(newXp/500)+1 }).eq("user_id",curUser.id);
      fireXPUpdate();
      toast.success("✅ Task Done! +25 XP 🎉");
    }
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id",id);
    setTasks(prev => prev.filter(t => t.id!==id));
  };

  const subjectColor = (n: string) => subjects.find(s=>s.name===n)?.color||"#4F8EF7";
  const filtered = tasks.filter(t => filter==="all"?true:filter==="pending"?!t.done:t.done);
  const counts   = { all:tasks.length, pending:tasks.filter(t=>!t.done).length, done:tasks.filter(t=>t.done).length };
  const fadeUp   = (d=0) => ({ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(16px)", transition:`opacity .3s ease ${d}ms, transform .3s cubic-bezier(.34,1.3,.64,1) ${d}ms` });

  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:300,color:"var(--muted)" }}>Loading…</div>;

  return (
    <>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        .task-item:hover .del-btn { opacity:1 !important; }
        .task-item:hover { border-color:rgba(79,142,247,.25) !important; }
        .filter-btn:hover { transform:translateY(-1px); }
      `}</style>

      <div style={{ maxWidth:780 }}>
        {/* Header */}
        <div style={{ ...fadeUp(0), display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ display:"flex", gap:8 }}>
            {(["all","pending","done"] as const).map(f => (
              <button key={f} className="filter-btn" onClick={() => setFilter(f)} style={{
                padding:"8px 20px", borderRadius:20, fontSize:13, fontWeight:700,
                cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize",
                border:`1px solid ${filter===f?"#4F8EF7":"var(--border)"}`,
                background:filter===f?"rgba(79,142,247,.15)":"transparent",
                color:filter===f?"#4F8EF7":"var(--muted)",
                boxShadow:filter===f?"0 0 16px rgba(79,142,247,.2)":"none",
                transition:"all .2s",
              }}>
                {f} <span style={{ background:filter===f?"rgba(79,142,247,.3)":"var(--border)", padding:"1px 7px", borderRadius:10, fontSize:11, marginLeft:4 }}>{counts[f]}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            display:"flex", alignItems:"center", gap:7,
            padding:"10px 22px", borderRadius:12, border:"none",
            background:"linear-gradient(135deg,#4F8EF7,#6366F1)",
            color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13,
            fontFamily:"inherit", boxShadow:"0 4px 20px rgba(79,142,247,.4)",
            transition:"all .2s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(79,142,247,.55)"}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(79,142,247,.4)"}}>
            <Plus size={15}/> New Task
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ marginBottom:16, padding:20, borderRadius:18, border:"1px solid rgba(79,142,247,.25)", background:"var(--card)",  boxShadow:"0 8px 32px rgba(0,0,0,.3)", animation:"slideIn .25s ease" }}>
            <input value={formTitle} onChange={e=>setFormTitle(e.target.value)} placeholder="What needs to be done?" autoFocus
              onKeyDown={e=>e.key==="Enter"&&addTask()}
              style={{ width:"100%", borderRadius:12, padding:"11px 16px", fontSize:14, fontFamily:"inherit", outline:"none", border:"1px solid rgba(79,142,247,.25)", background:"var(--bg)", color:"var(--text)", marginBottom:12, transition:"border-color .2s" }}
              onFocus={e=>e.target.style.borderColor="#4F8EF7"} onBlur={e=>e.target.style.borderColor="rgba(79,142,247,.25)"}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                ["Subject", <select value={formSubject} onChange={e=>setFormSubject(e.target.value)} style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit" }}>
                  <option value="">No subject</option>
                  {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                </select>],
                ["Priority", <select value={formPriority} onChange={e=>setFormPriority(e.target.value)} style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit" }}>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>],
                ["Deadline", <input type="date" value={formDeadline} onChange={e=>setFormDeadline(e.target.value)} style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit" }}/>],
              ].map(([lbl, inp]) => (
                <div key={lbl as string}>
                  <label style={{ display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5 }}>{lbl}</label>
                  {inp}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={addTask} style={{ padding:"10px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#4F8EF7,#6366F1)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",boxShadow:"0 4px 16px rgba(79,142,247,.4)" }}>Add Task</button>
              <button onClick={()=>setShowForm(false)} style={{ padding:"10px 18px",borderRadius:12,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Tasks */}
        {filtered.length === 0 ? (
          <div style={{ ...fadeUp(100), textAlign:"center", padding:70, color:"var(--muted)", border:"1px dashed var(--border)", borderRadius:20 }}>
            <CheckSquare size={48} style={{ margin:"0 auto 14px", opacity:.15 }}/>
            <p style={{ fontSize:15, fontWeight:600 }}>{filter==="done"?"No completed tasks":"No tasks here!"}</p>
            <p style={{ fontSize:13, marginTop:6, opacity:.6 }}>{filter!=="done"?"Click \"+ New Task\" to add one":""}</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((task, i) => {
              const p = PRIOS[task.priority]||PRIOS.medium;
              return (
                <div key={task.id} className="task-item" style={{
                  display:"flex", alignItems:"center", gap:14,
                  padding:"14px 18px", borderRadius:16,
                  background:"var(--card)",
                  border:"1px solid var(--border)",
                  borderLeft:`3px solid ${p.color}`,
                  
                  transition:"all .2s",
                  opacity:task.done?.7:1,
                  position:"relative",
                  animation:`popIn .3s ease ${Math.min(i,8)*40}ms both`,
                }}>
                  {/* Checkbox */}
                  <button onClick={() => toggleTask(task)} style={{
                    width:26, height:26, borderRadius:"50%",
                    border:`2px solid ${task.done?"#34D399":p.color}`,
                    background:task.done?"#34D399":"transparent",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0, outline:"none", transition:"all .2s",
                    boxShadow:task.done?`0 0 12px #34D39966`:p.glow?"0 0 8px "+p.glow:"none",
                  }}>
                    {task.done && <Check size={13} color="#fff"/>}
                  </button>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:"var(--text)", textDecoration:task.done?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", opacity:task.done?.6:1 }}>
                      {task.title}
                    </p>
                    <div style={{ display:"flex", gap:8, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
                      {task.subject && <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, fontWeight:700, background:`${subjectColor(task.subject)}22`, color:subjectColor(task.subject) }}>{task.subject}</span>}
                      {task.deadline && <span style={{ fontSize:11, color:"var(--muted)" }}>📅 {task.deadline}</span>}
                      <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, fontWeight:700, background:`${p.color}18`, color:p.color }}>{p.label}</span>
                      {task.done && <span style={{ fontSize:11, color:"#34D399", fontWeight:700 }}>+25 XP ⚡</span>}
                    </div>
                  </div>

                  {/* Delete */}
                  <button className="del-btn" onClick={() => deleteTask(task.id)} style={{
                    background:"none", border:"none", cursor:"pointer", color:"#F87171",
                    display:"flex", opacity:0, padding:6, transition:"opacity .2s, transform .2s", borderRadius:8,
                  }}
                    onMouseEnter={e=>{(e.currentTarget.style.transform="scale(1.2)")}}
                    onMouseLeave={e=>{(e.currentTarget.style.transform="scale(1)")}}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div style={{ ...fadeUp(200), marginTop:24, padding:"16px 20px", borderRadius:16, background:"var(--card)", border:"1px solid var(--border)", backdropFilter:"blur(8px)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Overall Progress</span>
              <span style={{ fontSize:13, color:"var(--muted)" }}>{counts.done}/{counts.all} · {counts.done*25} XP</span>
            </div>
            <div style={{ height:8, borderRadius:4, overflow:"hidden", background:"var(--bg)" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#4F8EF7,#A78BFA,#34D399)", backgroundSize:"200%", width:`${counts.all>0?(counts.done/counts.all)*100:0}%`, borderRadius:4, transition:"width .6s cubic-bezier(.4,0,.2,1)", animation:"shimmer 2s linear infinite" }}/>
            </div>
            <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
          </div>
        )}
      </div>
    </>
  );
}
