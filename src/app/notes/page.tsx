"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Star, Edit3, Save, Search, FileText, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addXP } from "@/lib/xp-utils";
import toast from "react-hot-toast";

export default function NotesPage() {
  const supabase = createClient();
  const [notes,     setNotes]     = useState<any[]>([]);
  const [subjects,  setSubjects]  = useState<any[]>([]);
  const [selected,  setSelected]  = useState<any>(null);
  const [editing,   setEditing]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [filterSub, setFilterSub] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState("");
  const [visible,   setVisible]   = useState(false);
  const [newTitle,    setNewTitle]    = useState("");
  const [newSubject,  setNewSubject]  = useState("");
  const [newContent,  setNewContent]  = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => { fetchData(); setTimeout(() => setVisible(true), 50); }, []);

  const fetchData = async () => {
    try {
    const { data: { user }, error: ae } = await supabase.auth.getUser();
    if (ae || !user) { setLoading(false); return; }
    setUserId(user.id);
    const [{ data:n },{ data:s }] = await Promise.all([
      supabase.from("notes").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
      supabase.from("subjects").select("*").eq("user_id",user.id),
    ]);
    setNotes(n||[]); setSubjects(s||[]);
    if (s&&s.length>0) setNewSubject(s[0].name);
    setLoading(false);
    } catch(e){ console.warn(e); setLoading(false); }
  };

  const saveNew = async () => {
    if (!newTitle.trim()) { toast.error("Please enter a title"); return; }
    const { data, error } = await supabase.from("notes").insert({
      user_id:userId, title:newTitle.trim(), subject:newSubject, content:newContent, starred:false,
    }).select().single();
    if (error) { toast.error("Failed to save"); return; }
    setNotes(prev => [data,...prev]);
    setSelected(data); setNewTitle(""); setNewContent(""); setShowNew(false);
    await addXP(supabase, userId, 10);
    toast.success("Note saved! +10 XP 📝");
  };

  const saveEdit = async () => {
    if (!selected) return;
    await supabase.from("notes").update({ content:editContent, updated_at:new Date().toISOString() }).eq("id",selected.id);
    const updated = { ...selected, content:editContent };
    setNotes(prev => prev.map(n => n.id===selected.id?updated:n));
    setSelected(updated); setEditing(false);
    toast.success("Saved! ✅");
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id",id);
    setNotes(prev => prev.filter(n => n.id!==id));
    if (selected?.id===id) setSelected(null);
    toast.success("Deleted");
  };

  const toggleStar = async (note: any) => {
    await supabase.from("notes").update({ starred:!note.starred }).eq("id",note.id);
    const updated = {...note,starred:!note.starred};
    setNotes(prev => prev.map(n => n.id===note.id?updated:n));
    if (selected?.id===note.id) setSelected(updated);
  };

  const subjectColor = (n: string) => subjects.find(s=>s.name===n)?.color||"#4F8EF7";
  const filtered = notes.filter(n => {
    const ms = n.title.toLowerCase().includes(search.toLowerCase())||n.content?.toLowerCase().includes(search.toLowerCase());
    const mf = filterSub ? n.subject===filterSub : true;
    return ms&&mf;
  });

  const fadeUp = (d=0) => ({ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(14px)", transition:`opacity .3s ease ${d}ms, transform .3s cubic-bezier(.34,1.3,.64,1) ${d}ms` });

  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:300,color:"var(--muted)" }}>Loading…</div>;

  return (
    <>
      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
        .note-list-item:hover { border-color:rgba(79,142,247,.3) !important; background:rgba(79,142,247,.06) !important; transform:translateX(3px); }
        .note-list-item { transition:all .18s !important; }
      `}</style>

      <div style={{ display:"flex", gap:18, height:"calc(100vh - 130px)" }}>

        {/* ── Left Panel ── */}
        <div style={{ ...fadeUp(0), width:290, display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>

          {/* Search + Add */}
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, borderRadius:12, border:"1px solid var(--border)", background:"var(--bg)", padding:"8px 12px", backdropFilter:"blur(8px)", transition:"border-color .2s" }}
              onFocus={()=>{}} onBlur={()=>{}}>
              <Search size={14} color="var(--muted)"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…"
                style={{ background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:13,fontFamily:"inherit",width:"100%" }}/>
            </div>
            <button onClick={()=>setShowNew(!showNew)} style={{
              width:40,height:40,borderRadius:12,border:"none",
              background:"linear-gradient(135deg,#4F8EF7,#6366F1)",
              color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              flexShrink:0,boxShadow:"0 4px 16px rgba(79,142,247,.4)",
              transition:"all .2s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1) rotate(8deg)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1) rotate(0)"}}>
              <Plus size={17}/>
            </button>
          </div>

          {/* Subject filter */}
          {subjects.length > 0 && (
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              <button onClick={()=>setFilterSub("")} style={{ padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit", border:`1px solid ${!filterSub?"#4F8EF7":"rgba(255,255,255,.08)"}`, background:!filterSub?"rgba(79,142,247,.15)":"transparent", color:!filterSub?"#4F8EF7":"var(--muted)", transition:"all .15s" }}>
                All
              </button>
              {subjects.map(s => (
                <button key={s.id} onClick={()=>setFilterSub(filterSub===s.name?"":s.name)} style={{ padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit", border:`1px solid ${filterSub===s.name?s.color+"66":"rgba(255,255,255,.08)"}`, background:filterSub===s.name?s.color+"18":"transparent", color:filterSub===s.name?s.color:"var(--muted)", transition:"all .15s" }}>
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* New note form */}
          {showNew && (
            <div style={{ padding:14,borderRadius:16,border:"1px solid rgba(79,142,247,.3)",background:"var(--card)",boxShadow:"0 4px 16px rgba(0,0,0,.08)", animation:"popIn .25s ease" }}>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Note title…" autoFocus
                style={{ width:"100%",borderRadius:10,padding:"8px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",marginBottom:8, transition:"border-color .2s" }}
                onFocus={e=>e.target.style.borderColor="#4F8EF7"} onBlur={e=>e.target.style.borderColor="rgba(79,142,247,.2)"}/>
              <select value={newSubject} onChange={e=>setNewSubject(e.target.value)} style={{ width:"100%",borderRadius:10,padding:"8px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",marginBottom:8 }}>
                <option value="">No subject</option>
                {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <textarea value={newContent} onChange={e=>setNewContent(e.target.value)} rows={3} placeholder="Start writing…"
                style={{ width:"100%",borderRadius:10,padding:"8px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",resize:"none",marginBottom:8, transition:"border-color .2s" }}
                onFocus={e=>e.target.style.borderColor="#4F8EF7"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.08)"}/>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={saveNew} style={{ flex:1,padding:"8px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4F8EF7,#6366F1)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",boxShadow:"0 4px 14px rgba(79,142,247,.4)" }}>
                  Save +10 XP ⚡
                </button>
                <button onClick={()=>setShowNew(false)} style={{ padding:"8px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>✕</button>
              </div>
            </div>
          )}

          {/* Notes list */}
          <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:7 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign:"center",padding:40,color:"var(--muted)" }}>
                <FileText size={36} style={{ margin:"0 auto 10px",opacity:.15 }}/>
                <p style={{ fontSize:13 }}>{search?"No results":"No notes yet"}</p>
              </div>
            )}
            {filtered.map((note, i) => (
              <div key={note.id} className="note-list-item" onClick={()=>{setSelected(note);setEditContent(note.content||"");setEditing(false);}}
                style={{ padding:"11px 14px",borderRadius:14, border:`1px solid ${selected?.id===note.id?"rgba(79,142,247,.4)":"rgba(255,255,255,.06)"}`, background:selected?.id===note.id?"rgba(79,142,247,.1)":"var(--bg)", cursor:"pointer", borderLeft:`3px solid ${subjectColor(note.subject)}`, animation:`popIn .25s ease ${i*30}ms both` }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                  {note.subject && <span style={{ fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:700,background:`${subjectColor(note.subject)}22`,color:subjectColor(note.subject) }}>{note.subject}</span>}
                  {note.starred && <Star size={12} color="#F5A623" fill="#F5A623"/>}
                </div>
                <h4 style={{ fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:3 }}>{note.title}</h4>
                <p style={{ fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{note.content||"Empty note"}</p>
                <p style={{ fontSize:10,color:"var(--muted)",marginTop:4,opacity:.6 }}>{new Date(note.created_at).toLocaleDateString("en-IN")}</p>
              </div>
            ))}
          </div>

          <div style={{ fontSize:11,color:"var(--muted)",textAlign:"center",padding:"6px 0",borderTop:"1px solid rgba(255,255,255,.06)" }}>
            📝 {notes.length} notes · +10 XP each
          </div>
        </div>

        {/* ── Viewer ── */}
        <div style={{ ...fadeUp(80), flex:1, borderRadius:20, border:"1px solid rgba(79,142,247,.12)", background:"var(--card)", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 4px 30px rgba(0,0,0,.3)" }}>
          {selected ? (
            <>
              <div style={{ padding:"18px 22px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"flex-start", background:"rgba(79,142,247,.04)" }}>
                <div>
                  {selected.subject && <span style={{ fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:700,background:`${subjectColor(selected.subject)}22`,color:subjectColor(selected.subject),display:"inline-block",marginBottom:8 }}>{selected.subject}</span>}
                  <h2 style={{ fontFamily:"var(--font-lora),serif",fontSize:24,color:"var(--text)",fontWeight:700 }}>{selected.title}</h2>
                  <p style={{ fontSize:12,color:"var(--muted)",marginTop:4 }}>{new Date(selected.created_at).toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                </div>
                <div style={{ display:"flex",gap:8,flexShrink:0 }}>
                  <button onClick={()=>toggleStar(selected)} style={{padding:8,borderRadius:10,border:"1px solid rgba(245,166,35,.3)",background:"rgba(245,166,35,.15)",color:"var(--text)",cursor:"pointer",display:"flex",transition:"all .18s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1)"}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
                    <Star size={16} color="#F5A623" fill={selected.starred?"#F5A623":"none"}/>
                  </button>
                  {editing ? (
                    <button onClick={saveEdit} style={{padding:8,borderRadius:10,border:"1px solid rgba(52,211,153,.3)",background:"rgba(52,211,153,.15)",color:"var(--text)",cursor:"pointer",display:"flex",transition:"all .18s"}}>
                      <Save size={16}/>
                    </button>
                  ) : (
                    <button onClick={()=>{setEditContent(selected.content||"");setEditing(true);}} style={{padding:8,borderRadius:10,border:"1px solid rgba(79,142,247,.3)",background:"rgba(79,142,247,.15)",color:"var(--text)",cursor:"pointer",display:"flex",transition:"all .18s"}}>
                      <Edit3 size={16}/>
                    </button>
                  )}
                  {editing && (
                    <button onClick={()=>setEditing(false)} style={{padding:8,borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"var(--text)",cursor:"pointer",display:"flex",transition:"all .18s"}}>
                      <X size={16}/>
                    </button>
                  )}
                  <button onClick={()=>deleteNote(selected.id)} style={{padding:8,borderRadius:10,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.12)",color:"var(--text)",cursor:"pointer",display:"flex",transition:"all .18s"}}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
              <div style={{ flex:1,padding:24,overflowY:"auto" }}>
                {editing ? (
                  <textarea value={editContent} onChange={e=>setEditContent(e.target.value)} autoFocus
                    style={{ width:"100%",height:"100%",background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:15,fontFamily:"inherit",resize:"none",lineHeight:1.9 }}
                    placeholder="Write your note here…"/>
                ) : (
                  <p style={{ fontSize:15,color:"var(--text)",lineHeight:1.9,whiteSpace:"pre-wrap" }}>
                    {selected.content || <span style={{ color:"var(--muted)",fontStyle:"italic" }}>Empty note. Click ✏️ to write.</span>}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--muted)" }}>
              <FileText size={64} style={{ opacity:.08,marginBottom:16 }}/>
              <p style={{ fontSize:15,fontWeight:700 }}>Select a note to view</p>
              <p style={{ fontSize:13,marginTop:6,opacity:.6 }}>or click + to create one (+10 XP!)</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
