"use client";
import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, X, Trash2, Layers, Sparkles, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function FlashcardsPage() {
  const supabase = createClient();
  const [cards,     setCards]     = useState<any[]>([]);
  const [subjects,  setSubjects]  = useState<any[]>([]);
  const [userId,    setUserId]    = useState("");
  const [idx,       setIdx]       = useState(0);
  const [flipped,   setFlipped]   = useState(false);
  const [mode,      setMode]      = useState<"browse"|"quiz">("browse");
  const [score,     setScore]     = useState({ correct:0, incorrect:0 });
  const [showNew,   setShowNew]   = useState(false);
  const [filterSub, setFilterSub] = useState("");
  const [loading,   setLoading]   = useState(true);

  // Manual card form
  const [newFront,   setNewFront]   = useState("");
  const [newBack,    setNewBack]    = useState("");
  const [newSubject, setNewSubject] = useState("");

  // AI Generate
  const [showAI,     setShowAI]     = useState(false);
  const [aiPrompt,   setAiPrompt]   = useState("");
  const [aiSubject,  setAiSubject]  = useState("");
  const [aiType,     setAiType]     = useState<"flashcard"|"quiz">("flashcard");
  const [aiCount,    setAiCount]    = useState(10);
  const [aiLoading,  setAiLoading]  = useState(false);

  useEffect(() => { fetchData(); }, []);

  // Reset score + idx when filter changes
  useEffect(() => {
    setScore({ correct:0, incorrect:0 });
    setIdx(0);
    setFlipped(false);
  }, [filterSub]);

  const fetchData = async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { setLoading(false); return; }
      setUserId(user.id);
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("flashcards").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("subjects").select("*").eq("user_id", user.id),
      ]);
      setCards(c || []);
      setSubjects(s || []);
      if (s && s.length > 0) setNewSubject(s[0].name);
    } catch (e) {
    } finally { setLoading(false); }
  };

  const addCard = async () => {
    if (!newFront.trim() || !newBack.trim()) { toast.error("Please fill in both sides"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("flashcards").insert({
      user_id: user.id, front: newFront.trim(), back: newBack.trim(), subject: newSubject,
    }).select().single();
    if (error) { toast.error("Failed to add card"); return; }
    setCards(prev => [data, ...prev]);
    setNewFront(""); setNewBack(""); setShowNew(false); setIdx(0); setFlipped(false);
    toast.success("Flashcard added! ⚡");
  };

  // ── AI Generate Flashcards / Quiz ──
  const generateAI = async () => {
    if (!aiPrompt.trim()) { toast.error("Topic prompt enter karo!"); return; }
    setAiLoading(true);
    try {
      const isQuiz = aiType === "quiz";
      const systemPrompt = isQuiz
        ? `You are a quiz generator. Generate exactly ${aiCount} multiple choice quiz questions. Return ONLY valid JSON array, no explanation, no markdown. Format: [{"front":"Question text?","back":"Correct Answer","options":["Option A","Option B","Option C","Option D"],"subject":"${aiSubject||aiPrompt}"}]`
        : `You are a flashcard generator. Generate exactly ${aiCount} flashcards for studying. Return ONLY valid JSON array, no explanation, no markdown. Format: [{"front":"Question or term","back":"Answer or definition","subject":"${aiSubject||aiPrompt}"}]`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Generate ${aiCount} ${isQuiz?"quiz questions":"flashcards"} for: ${aiPrompt}` }],
          system: systemPrompt,
          type: "json",
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      let text = data.text || "";
      text = text.replace(/```json/gi,"").replace(/```/g,"").trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Invalid format");

      // Save to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const toInsert = parsed.slice(0, aiCount).map((c: any) => ({
        user_id: user.id,
        front: c.front || "",
        back: c.back || "",
        subject: aiSubject || aiPrompt.slice(0,30),
        ai_generated: true,
        card_type: aiType,
        options: c.options || null,
      }));
      const { data: inserted, error } = await supabase.from("flashcards").insert(toInsert).select();
      if (error) { toast.error("Save failed: " + error.message); setAiLoading(false); return; }
      setCards(prev => [...(inserted||[]), ...prev]);
      setIdx(0); setFlipped(false);
      setShowAI(false); setAiPrompt(""); setAiLoading(false);
      toast.success(`${inserted?.length} ${isQuiz?"quiz questions":"flashcards"} generated! 🤖`);
    } catch(e: any) {
      toast.error("AI generation failed. Try again!");
      setAiLoading(false);
    }
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    setCards(prev => prev.filter(c => c.id !== id));
    setIdx(0); setFlipped(false);
    toast.success("Card deleted");
  };

  const filteredCards = filterSub ? cards.filter(c => c.subject === filterSub) : cards;
  const card = filteredCards[idx];

  const next = (correct?: boolean) => {
    if (correct !== undefined) setScore(s => correct ? {...s,correct:s.correct+1} : {...s,incorrect:s.incorrect+1});
    setFlipped(false);
    setTimeout(() => setIdx(i => (i+1) % Math.max(filteredCards.length,1)), 150);
  };
  const prev = () => { setFlipped(false); setTimeout(() => setIdx(i => (i-1+filteredCards.length) % Math.max(filteredCards.length,1)), 150); };
  const resetQuiz = () => { setScore({ correct:0, incorrect:0 }); setIdx(0); setFlipped(false); };
  const subjectColor = (name: string) => subjects.find(s => s.name === name)?.color || "#4F8EF7";

  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:300,color:"var(--muted)" }}>Loading…</div>;

  return (
    <div style={{ maxWidth:700, margin:"0 auto" }}>

      {/* AI Generate Modal */}
      {showAI && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" }}>
          <div style={{ background:"var(--card)",borderRadius:24,padding:28,width:"100%",maxWidth:480,border:"1px solid rgba(167,139,250,.3)",boxShadow:"0 24px 60px rgba(0,0,0,.5)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#A78BFA,#6366F1)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Brain size={20} color="#fff"/>
                </div>
                <h3 style={{ color:"var(--text)",fontSize:17,fontWeight:700 }}>AI Generate Cards</h3>
              </div>
              <button onClick={()=>setShowAI(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)" }}><X size={18}/></button>
            </div>

            {/* Type Toggle */}
            <div style={{ display:"flex",gap:8,marginBottom:16,background:"var(--bg)",borderRadius:12,padding:4 }}>
              {(["flashcard","quiz"] as const).map(t => (
                <button key={t} onClick={()=>setAiType(t)}
                  style={{ flex:1,padding:"8px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,
                    background:aiType===t?"linear-gradient(135deg,#A78BFA,#6366F1)":"transparent",
                    color:aiType===t?"#fff":"var(--muted)",transition:"all .2s" }}>
                  {t === "flashcard" ? "⚡ Flashcards" : "🎯 Quiz QA"}
                </button>
              ))}
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div>
                <label style={{ display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6 }}>Topic / Prompt</label>
                <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} rows={3}
                  placeholder={aiType==="flashcard" ? "e.g. Python loops and conditional statements" : "e.g. 20 quiz QA for Python loop and conditional statement"}
                  style={{ width:"100%",borderRadius:10,padding:"10px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",resize:"none",boxSizing:"border-box" as const }}
                  onFocus={e=>e.target.style.borderColor="#A78BFA"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  <label style={{ display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6 }}>Subject (Optional)</label>
                  <select value={aiSubject} onChange={e=>setAiSubject(e.target.value)}
                    style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit" }}>
                    <option value="">Auto detect</option>
                    {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6 }}>Count</label>
                  <select value={aiCount} onChange={e=>setAiCount(Number(e.target.value))}
                    style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit" }}>
                    {[5,10,15,20,25,30].map(n=><option key={n} value={n}>{n} cards</option>)}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div style={{ padding:"10px 14px",borderRadius:10,background:"rgba(167,139,250,.08)",border:"1px solid rgba(167,139,250,.2)",fontSize:12,color:"var(--muted)",lineHeight:1.6 }}>
                🤖 AI will generate <strong style={{color:"#A78BFA"}}>{aiCount} {aiType==="flashcard"?"flashcards":"quiz questions"}</strong> for <strong style={{color:"#A78BFA"}}>"{aiPrompt||"your topic"}"</strong> and save them automatically.
                {aiType==="quiz" && " Each question will have 4 options with correct answer."}
              </div>

              <div style={{ display:"flex",gap:10 }}>
                <button onClick={generateAI} disabled={aiLoading}
                  style={{ flex:1,padding:"11px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",cursor:aiLoading?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,opacity:aiLoading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                  {aiLoading ? <><div style={{width:16,height:16,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .6s linear infinite"}}/> Generating...</> : <><Sparkles size={16}/> Generate</>}
                </button>
                <button onClick={()=>setShowAI(false)} style={{ padding:"11px 16px",borderRadius:12,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <div style={{ display:"flex",gap:8 }}>
          {[["browse","📖 Browse"],["quiz","🎯 Quiz Mode"]].map(([m,lbl]) => (
            <button key={m} onClick={() => { setMode(m as "browse"|"quiz"); resetQuiz(); }}
              style={{ padding:"8px 18px",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${mode===m?"#4F8EF7":"var(--border)"}`,background:mode===m?"#4F8EF722":"transparent",color:mode===m?"#4F8EF7":"var(--muted)",transition:"all .15s" }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
          {subjects.length > 0 && (
            <select value={filterSub} onChange={e=>{ setFilterSub(e.target.value); setIdx(0); setFlipped(false); }}
              style={{ borderRadius:10,padding:"7px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",outline:"none",fontFamily:"inherit" }}>
              <option value="">All subjects</option>
              {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
          {/* AI Generate Button */}
          <button onClick={()=>setShowAI(true)}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:12,border:"1px solid rgba(167,139,250,.4)",background:"rgba(167,139,250,.1)",color:"#A78BFA",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",transition:"all .2s" }}>
            <Sparkles size={14}/> AI Generate
          </button>
          <button onClick={() => setShowNew(!showNew)}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:12,border:"none",background:"#4F8EF7",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit" }}>
            <Plus size={14}/> Add Card
          </button>
        </div>
      </div>

      {/* Manual Add form */}
      {showNew && (
        <div style={{ marginBottom:20,padding:20,borderRadius:16,border:"1px solid #4F8EF744",background:"var(--card)" }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6 }}>Subject</label>
            <select value={newSubject} onChange={e=>setNewSubject(e.target.value)}
              style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit" }}>
              <option value="">No subject</option>
              {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
            <div>
              <label style={{ display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6 }}>Question (Front)</label>
              <textarea value={newFront} onChange={e=>setNewFront(e.target.value)} rows={3} placeholder="Enter question…"
                style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",resize:"none" }}/>
            </div>
            <div>
              <label style={{ display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6 }}>Answer (Back)</label>
              <textarea value={newBack} onChange={e=>setNewBack(e.target.value)} rows={3} placeholder="Enter answer…"
                style={{ width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",resize:"none" }}/>
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={addCard} style={{ padding:"9px 20px",borderRadius:10,border:"none",background:"#4F8EF7",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit" }}>Add Flashcard</button>
            <button onClick={()=>setShowNew(false)} style={{ padding:"9px 16px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      {filteredCards.length === 0 ? (
        <div style={{ textAlign:"center",padding:60,color:"var(--muted)" }}>
          <Layers size={48} style={{ margin:"0 auto 14px",opacity:.2 }}/>
          <p style={{ fontSize:15,fontWeight:600 }}>No flashcards yet</p>
          <p style={{ fontSize:13,marginTop:6 }}>Click "Add Card" or try "AI Generate" 🤖</p>
        </div>
      ) : (
        <>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:13,color:"var(--muted)" }}>Card {idx+1} of {filteredCards.length}</span>
              {card?.ai_generated && <span style={{ fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(167,139,250,.15)",color:"#A78BFA",fontWeight:700 }}>🤖 AI</span>}
              {card?.card_type==="quiz" && <span style={{ fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(245,166,35,.15)",color:"#F5A623",fontWeight:700 }}>🎯 Quiz</span>}
            </div>
            {mode==="quiz" && (
              <div style={{ display:"flex",gap:10 }}>
                <span style={{ padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700,background:"#34D39922",color:"#34D399" }}>✓ {score.correct}</span>
                <span style={{ padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700,background:"#F8717122",color:"#F87171" }}>✗ {score.incorrect}</span>
                <button onClick={resetQuiz} style={{ padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontFamily:"inherit" }}>Reset</button>
              </div>
            )}
          </div>

          {/* Card */}
          <div onClick={() => setFlipped(!flipped)}
            style={{ borderRadius:24,minHeight:260,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:"40px 48px",textAlign:"center",transition:"all .3s ease",position:"relative",marginBottom:24,background:flipped?`linear-gradient(135deg,${subjectColor(card?.subject)},${subjectColor(card?.subject)}cc)`:"var(--card)",border:`2px solid ${flipped?subjectColor(card?.subject):"var(--border)"}`,boxShadow:flipped?`0 0 40px ${subjectColor(card?.subject)}44`:"none" }}>
            {card?.subject && (
              <span style={{ position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",fontSize:11,padding:"3px 12px",borderRadius:20,fontWeight:600,background:flipped?"rgba(255,255,255,.25)":"var(--bg)",color:flipped?"#fff":subjectColor(card.subject) }}>{card.subject}</span>
            )}
            <div style={{ fontSize:11,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:".1em",marginBottom:16,color:flipped?"rgba(255,255,255,.7)":"var(--muted)" }}>
              {flipped ? "ANSWER" : "QUESTION"}
            </div>
            <p style={{ fontFamily:"var(--font-lora),serif",fontSize:22,lineHeight:1.6,color:flipped?"#fff":"var(--text)" }}>
              {flipped ? card?.back : card?.front}
            </p>
            {/* Quiz options */}
            {!flipped && card?.options && Array.isArray(card.options) && (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:20,width:"100%" }}>
                {card.options.map((opt: string, i: number) => (
                  <div key={i} style={{ padding:"8px 12px",borderRadius:10,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",fontSize:13,color:"var(--text)",textAlign:"left" }}>
                    <strong style={{ color:"#4F8EF7" }}>{["A","B","C","D"][i]}.</strong> {opt}
                  </div>
                ))}
              </div>
            )}
            <div style={{ position:"absolute",bottom:16,fontSize:11,color:flipped?"rgba(255,255,255,.5)":"var(--muted)" }}>
              {flipped ? "Click to hide answer" : "Click to reveal answer"}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap" }}>
            <button onClick={prev} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit" }}>
              <ChevronLeft size={18}/> Prev
            </button>
            {mode==="quiz" && flipped ? (
              <>
                <button onClick={()=>next(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:12,border:"none",background:"#34D399",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit" }}>
                  <Check size={15}/> Know it!
                </button>
                <button onClick={()=>next(false)} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:12,border:"none",background:"#F87171",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit" }}>
                  <X size={15}/> Missed
                </button>
              </>
            ) : (
              <button onClick={()=>next()} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit" }}>
                Next <ChevronRight size={18}/>
              </button>
            )}
            <button onClick={()=>deleteCard(card?.id)} style={{ padding:"10px 14px",borderRadius:12,border:"1px solid #F8717144",background:"#F8717111",color:"#F87171",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,fontFamily:"inherit" }}>
              <Trash2 size={15}/>
            </button>
          </div>

          {/* Card list */}
          <div style={{ marginTop:24,padding:16,borderRadius:16,border:"1px solid var(--border)",background:"var(--card)" }}>
            <h4 style={{ fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12 }}>All Cards ({filteredCards.length})</h4>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {filteredCards.map((c,i) => (
                <div key={c.id} onClick={()=>{ setIdx(i); setFlipped(false); }}
                  style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,cursor:"pointer",background:i===idx?"#4F8EF722":"var(--bg)",border:`1px solid ${i===idx?"#4F8EF7":"var(--border)"}`,transition:"all .15s" }}>
                  <span style={{ width:22,height:22,borderRadius:"50%",background:i===idx?"#4F8EF7":"var(--border)",color:i===idx?"#fff":"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>{i+1}</span>
                  <span style={{ flex:1,fontSize:13,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.front}</span>
                  <div style={{ display:"flex",gap:4,alignItems:"center",flexShrink:0 }}>
                    {c.ai_generated && <span style={{ fontSize:9,padding:"1px 5px",borderRadius:10,background:"rgba(167,139,250,.15)",color:"#A78BFA",fontWeight:700 }}>AI</span>}
                    {c.card_type==="quiz" && <span style={{ fontSize:9,padding:"1px 5px",borderRadius:10,background:"rgba(245,166,35,.15)",color:"#F5A623",fontWeight:700 }}>Q</span>}
                    {c.subject && <span style={{ fontSize:10,padding:"2px 8px",borderRadius:20,background:`${subjectColor(c.subject)}22`,color:subjectColor(c.subject),fontWeight:600 }}>{c.subject}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
