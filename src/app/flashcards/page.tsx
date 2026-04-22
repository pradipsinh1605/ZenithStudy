"use client";
import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, X, Trash2, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function FlashcardsPage() {
  const supabase = createClient();
  const [cards,    setCards]    = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [idx,      setIdx]      = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const [mode,     setMode]     = useState<"browse"|"quiz">("browse");
  const [score,    setScore]    = useState({ correct:0, incorrect:0 });
  const [showNew,  setShowNew]  = useState(false);
  const [filterSub,setFilterSub]= useState("");
  const [loading,  setLoading]  = useState(true);

  // New card form
  const [newFront,   setNewFront]   = useState("");
  const [newBack,    setNewBack]    = useState("");
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { setLoading(false); return; }
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("flashcards").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("subjects").select("*").eq("user_id", user.id),
      ]);
      setCards(c || []);
      setSubjects(s || []);
      if (s && s.length > 0) setNewSubject(s[0].name);
    } catch (e) {
      console.warn("Flashcards fetch error (safe to ignore):", e);
    } finally {
      setLoading(false);
    }
  };

  const addCard = async () => {
    if (!newFront.trim() || !newBack.trim()) {
      toast.error("Please fill in both sides"); return;
    }
    let user: any = null;
    try {
      const { data: { user: u }, error } = await supabase.auth.getUser();
      if (error || !u) { toast.error("Please refresh and try again"); return; }
      user = u;
    } catch { toast.error("Please refresh and try again"); return; }
    const { data, error } = await supabase.from("flashcards").insert({
      user_id: user.id, front: newFront.trim(),
      back: newBack.trim(), subject: newSubject,
    }).select().single();
    if (error) { toast.error("Failed to add card"); return; }
    setCards(prev => [data, ...prev]);
    setNewFront(""); setNewBack("");
    setShowNew(false);
    setIdx(0); setFlipped(false);
    toast.success("Flashcard added! ⚡");
  };

  const deleteCard = async (id: string) => {
    try { await supabase.from("flashcards").delete().eq("id", id); } catch {}
    setCards(prev => prev.filter(c => c.id !== id));
    setIdx(0); setFlipped(false);
    toast.success("Card deleted");
  };

  const filteredCards = filterSub
    ? cards.filter(c => c.subject === filterSub)
    : cards;

  const card = filteredCards[idx];

  const next = (correct?: boolean) => {
    if (correct !== undefined) {
      setScore(s => correct
        ? { ...s, correct: s.correct+1 }
        : { ...s, incorrect: s.incorrect+1 }
      );
    }
    setFlipped(false);
    setTimeout(() => setIdx(i => (i+1) % Math.max(filteredCards.length,1)), 150);
  };

  const prev = () => {
    setFlipped(false);
    setTimeout(() => setIdx(i => (i-1+filteredCards.length) % Math.max(filteredCards.length,1)), 150);
  };

  const resetQuiz = () => {
    setScore({ correct:0, incorrect:0 });
    setIdx(0); setFlipped(false);
  };

  const subjectColor = (name: string) =>
    subjects.find(s => s.name === name)?.color || "#4F8EF7";

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, color:"var(--muted)" }}>Loading…</div>
  );

  return (
    <div style={{ maxWidth:700, margin:"0 auto" }}>

      {/* Mode + Filter */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", gap:8 }}>
          {[["browse","📖 Browse"],["quiz","🎯 Quiz Mode"]].map(([m,lbl]) => (
            <button key={m} onClick={() => { setMode(m as "browse"|"quiz"); resetQuiz(); }}
              style={{ padding:"8px 18px", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:`1px solid ${mode===m?"#4F8EF7":"var(--border)"}`, background:mode===m?"#4F8EF722":"transparent", color:mode===m?"#4F8EF7":"var(--muted)", transition:"all .15s" }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {subjects.length > 0 && (
            <select value={filterSub} onChange={e => { setFilterSub(e.target.value); setIdx(0); setFlipped(false); }}
              style={{ borderRadius:10, padding:"7px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--card)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}>
              <option value="">All subjects</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowNew(!showNew)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:12, border:"none", background:"#4F8EF7", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
            <Plus size={14}/> Add Card
          </button>
        </div>
      </div>

      {/* Add form */}
      {showNew && (
        <div style={{ marginBottom:20, padding:20, borderRadius:16, border:"1px solid #4F8EF744", background:"var(--card)" }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Subject</label>
            <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
              style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit" }}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Question (Front)</label>
              <textarea value={newFront} onChange={e => setNewFront(e.target.value)} rows={3} placeholder="Enter question…"
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit", resize:"none" }}
                onFocus={e => e.target.style.borderColor="#4F8EF7"}
                onBlur={e => e.target.style.borderColor="var(--border)"}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase" as const, marginBottom:6 }}>Answer (Back)</label>
              <textarea value={newBack} onChange={e => setNewBack(e.target.value)} rows={3} placeholder="Enter answer…"
                style={{ width:"100%", borderRadius:10, padding:"9px 12px", fontSize:13, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", outline:"none", fontFamily:"inherit", resize:"none" }}
                onFocus={e => e.target.style.borderColor="#4F8EF7"}
                onBlur={e => e.target.style.borderColor="var(--border)"}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addCard}
              style={{ padding:"9px 20px", borderRadius:10, border:"none", background:"#4F8EF7", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
              Add Flashcard
            </button>
            <button onClick={() => setShowNew(false)}
              style={{ padding:"9px 16px", borderRadius:10, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* No cards */}
      {filteredCards.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>
          <Layers size={48} style={{ margin:"0 auto 14px", opacity:.2 }}/>
          <p style={{ fontSize:15, fontWeight:600 }}>No flashcards yet</p>
          <p style={{ fontSize:13, marginTop:6 }}>Click &quot;Add Card&quot; to create your first one!</p>
        </div>
      ) : (
        <>
          {/* Counter + Quiz Score */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ fontSize:13, color:"var(--muted)" }}>
              Card {idx+1} of {filteredCards.length}
            </span>
            {mode==="quiz" && (
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700, background:"#34D39922", color:"#34D399" }}>✓ {score.correct}</span>
                <span style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700, background:"#F8717122", color:"#F87171" }}>✗ {score.incorrect}</span>
                <button onClick={resetQuiz}
                  style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", cursor:"pointer", fontFamily:"inherit" }}>
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Card */}
          <div onClick={() => setFlipped(!flipped)} className="hv-card"
            style={{ borderRadius:24, minHeight:260, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:"40px 48px", textAlign:"center", transition:"all .3s ease", position:"relative", marginBottom:24, background:flipped ? `linear-gradient(135deg,${subjectColor(card?.subject)},${subjectColor(card?.subject)}cc)` : "var(--card)", border:`2px solid ${flipped?subjectColor(card?.subject):"var(--border)"}`, boxShadow:flipped?`0 0 40px ${subjectColor(card?.subject)}44`:"none" }}>
            {/* Subject badge */}
            {card?.subject && (
              <span style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)", fontSize:11, padding:"3px 12px", borderRadius:20, fontWeight:600, background:flipped?"rgba(255,255,255,.25)":"var(--bg)", color:flipped?"#fff":subjectColor(card.subject) }}>
                {card.subject}
              </span>
            )}
            <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:".1em", marginBottom:16, color:flipped?"rgba(255,255,255,.7)":"var(--muted)" }}>
              {flipped ? "ANSWER" : "QUESTION"}
            </div>
            <p style={{ fontFamily:"var(--font-lora),serif", fontSize:22, lineHeight:1.6, color:flipped?"#fff":"var(--text)" }}>
              {flipped ? card?.back : card?.front}
            </p>
            <div style={{ position:"absolute", bottom:16, fontSize:11, color:flipped?"rgba(255,255,255,.5)":"var(--muted)" }}>
              {flipped ? "Click to hide answer" : "Click to reveal answer"}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
            <button onClick={prev}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)", color:"var(--text)", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
              <ChevronLeft size={18}/> Prev
            </button>

            {mode==="quiz" && flipped ? (
              <>
                <button onClick={() => next(true)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 22px", borderRadius:12, border:"none", background:"#34D399", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>
                  <Check size={15}/> Know it!
                </button>
                <button onClick={() => next(false)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 22px", borderRadius:12, border:"none", background:"#F87171", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>
                  <X size={15}/> Missed
                </button>
              </>
            ) : (
              <button onClick={() => next()}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)", color:"var(--text)", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
                Next <ChevronRight size={18}/>
              </button>
            )}

            <button onClick={() => deleteCard(card?.id)}
              style={{ padding:"10px 14px", borderRadius:12, border:"1px solid #F8717144", background:"#F8717111", color:"#F87171", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13, fontFamily:"inherit" }}>
              <Trash2 size={15}/>
            </button>
          </div>

          {/* Card list */}
          <div style={{ marginTop:24, padding:16, borderRadius:16, border:"1px solid var(--border)", background:"var(--card)" }}>
            <h4 style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>All Cards ({filteredCards.length})</h4>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filteredCards.map((c, i) => (
                <div key={c.id} onClick={() => { setIdx(i); setFlipped(false); }}
                  className="hv-lift" style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:10, cursor:"pointer", background:i===idx?"#4F8EF722":"var(--bg)", border:`1px solid ${i===idx?"#4F8EF7":"var(--border)"}`, transition:"all .15s" }}>
                  <span style={{ width:22, height:22, borderRadius:"50%", background:i===idx?"#4F8EF7":"var(--border)", color:i===idx?"#fff":"var(--muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                  <span style={{ flex:1, fontSize:13, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.front}</span>
                  {c.subject && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:`${subjectColor(c.subject)}22`, color:subjectColor(c.subject), fontWeight:600, flexShrink:0 }}>{c.subject}</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
