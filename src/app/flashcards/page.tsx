"use client";
import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, X, Trash2, Layers, Sparkles, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { z, ZodError } from "zod";
import Loader from "@/components/ui/Loader";

type CardType = "flashcard" | "quiz";
const mcqResponseSchema = z.array(
  z.object({
    front: z.string().trim().min(1),
    back: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).length(4),
  }).refine((card) => card.options.includes(card.back), {
    message: "Correct answer must exactly match one option",
    path: ["back"],
  }),
).min(1);

type ValidMCQCard = z.infer<typeof mcqResponseSchema>[number];

class AIQuizValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(error: ZodError) {
    super("Malformed quiz response");
    this.name = "AIQuizValidationError";
    this.issues = error.issues;
  }
}

function validateMCQResponse(value: unknown): ValidMCQCard[] {
  const result = mcqResponseSchema.safeParse(value);
  if (!result.success) throw new AIQuizValidationError(result.error);
  return result.data;
}

export default function FlashcardsPage() {
  const supabase = createClient();
  const [allCards,   setAllCards]   = useState<any[]>([]);
  const [subjects,   setSubjects]   = useState<any[]>([]);
  const [userId,     setUserId]     = useState("");
  const [activeTab,  setActiveTab]  = useState<CardType>("flashcard");
  const [idx,        setIdx]        = useState(0);
  const [flipped,    setFlipped]    = useState(false);
  const [filterSub,  setFilterSub]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [score,      setScore]      = useState({ correct:0, incorrect:0 });
  const [quizMode,   setQuizMode]   = useState(false);

  // Quiz answer state
  const [selectedOpt,  setSelectedOpt]  = useState<number|null>(null);
  const [answerShown,  setAnswerShown]  = useState(false);

  // Manual add form
  const [showNew,    setShowNew]    = useState(false);
  const [newFront,   setNewFront]   = useState("");
  const [newBack,    setNewBack]    = useState("");
  const [newSubject, setNewSubject] = useState("");

  // AI Generate
  const [showAI,    setShowAI]    = useState(false);
  const [aiPrompt,  setAiPrompt]  = useState("");
  const [aiSubject, setAiSubject] = useState("");
  const [aiType,    setAiType]    = useState<CardType>("flashcard");
  const [aiCount,   setAiCount]   = useState(10);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(()=>{ fetchData(); },[]);

  // Reset when filter/tab changes
  useEffect(()=>{ setIdx(0); setFlipped(false); setSelectedOpt(null); setAnswerShown(false); setScore({correct:0,incorrect:0}); },[filterSub, activeTab]);

  const fetchData = async () => {
    try {
      const {data:{user},error} = await supabase.auth.getUser();
      if(error||!user){setLoading(false);return;}
      setUserId(user.id);
      const [{data:c},{data:s}] = await Promise.all([
        supabase.from("flashcards").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(300),
        supabase.from("subjects").select("*").eq("user_id",user.id),
      ]);
      setAllCards(c||[]);
      setSubjects(s||[]);
      if(s&&s.length>0) setNewSubject(s[0].name);
    }catch{}finally{setLoading(false);}
  };

  // Filter cards by active tab type
  const filtered = allCards.filter(c => {
    const matchType = activeTab==="flashcard" ? (c.card_type==="flashcard"||!c.card_type) : c.card_type==="quiz";
    const matchSub  = filterSub ? c.subject===filterSub : true;
    return matchType && matchSub;
  });

  const card = filtered[idx];
  const subColor = (n:string) => subjects.find(s=>s.name===n)?.color||"#4F8EF7";

  const addCard = async () => {
    if(!newFront.trim()||!newBack.trim()){toast.error("Both sides fill karo!");return;}
    const {data:{user}} = await supabase.auth.getUser();
    if(!user) return;
    const {data,error} = await supabase.from("flashcards").insert({
      user_id:user.id, front:newFront.trim(), back:newBack.trim(),
      subject:newSubject, card_type:"flashcard",
    }).select().single();
    if(error){toast.error("Add failed");return;}
    setAllCards(p=>[data,...p]);
    setNewFront(""); setNewBack(""); setShowNew(false); setIdx(0);
    toast.success("Flashcard added! ⚡");
  };

  const deleteCard = async (id:string) => {
    await supabase.from("flashcards").delete().eq("id",id).eq("user_id",userId);
    setAllCards(p=>p.filter(c=>c.id!==id));
    setIdx(0); setFlipped(false); setSelectedOpt(null); setAnswerShown(false);
    toast.success("Deleted");
  };

  // AI Generate
  const generateAI = async () => {
    if(!aiPrompt.trim()){toast.error("Topic prompt enter karo!");return;}
    if(aiPrompt.trim().length < 20){toast.error("Please provide at least 20 characters of context for the AI to generate accurate questions.");return;}
    setAiLoading(true);
    try{
      const isQuiz = aiType==="quiz";
      const systemPrompt = isQuiz
        ? `Generate exactly ${aiCount} multiple choice quiz questions for studying. Return ONLY a valid JSON array. No markdown, no explanation. Format: [{"front":"Question?","back":"Correct Answer text","options":["Option A","Option B","Option C","Option D"]}]. Make sure "back" exactly matches one of the options.`
        : `Generate exactly ${aiCount} flashcards for studying. Return ONLY a valid JSON array. No markdown, no explanation. Format: [{"front":"Term or Question","back":"Definition or Answer"}]`;

      const res = await fetch("/api/ai/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          messages:[{role:"user",content:`Generate ${aiCount} ${isQuiz?"MCQ quiz questions":"flashcards"} about: ${aiPrompt}`}],
          system: systemPrompt,
          type:"json",
        }),
      });
      if(!res.ok){ const e=await res.json(); throw new Error(e?.error?.message||e?.error||"API error"); }
      const data = await res.json();
      let text = data.text||"";
      text = text.replace(/```json/gi,"").replace(/```/g,"").trim();
      // Extract JSON array
      const start = text.indexOf("[");
      const end   = text.lastIndexOf("]");
      if(start===-1||end===-1) throw new Error("No JSON array found");
      const parsed = JSON.parse(text.slice(start, end+1));
      if(!Array.isArray(parsed)) throw new Error("Not array");
      const validatedCards = isQuiz ? validateMCQResponse(parsed) : parsed;

      const {data:{user}} = await supabase.auth.getUser();
      if(!user) return;
      const toInsert = validatedCards.slice(0,aiCount).map((c:any)=>({
        user_id: user.id,
        front:   c.front||"",
        back:    c.back||"",
        subject: aiSubject||aiPrompt.slice(0,30),
        ai_generated: true,
        card_type: isQuiz?"quiz":"flashcard",
        options: isQuiz ? c.options : null,
      }));
      const {data:inserted,error} = await supabase.from("flashcards").insert(toInsert).select();
      if(error){toast.error("Save failed: "+error.message);setAiLoading(false);return;}
      setAllCards(p=>[...(inserted||[]),...p]);
      setActiveTab(aiType);
      setIdx(0); setFlipped(false); setSelectedOpt(null); setAnswerShown(false);
      setShowAI(false); setAiPrompt(""); setAiLoading(false);
      toast.success(`${inserted?.length} ${isQuiz?"quiz questions":"flashcards"} generated! 🤖`);
    }catch(e:any){
      console.error(e);
      if(e instanceof AIQuizValidationError){
        toast.error("AI returned malformed quiz data. Nothing was saved.");
      }else{
        toast.error("AI generation failed. Try again!");
      }
      setAiLoading(false);
    }
  };

  // Navigation
  const goNext = (correct?:boolean) => {
    if(correct!==undefined) setScore(s=>correct?{...s,correct:s.correct+1}:{...s,incorrect:s.incorrect+1});
    setFlipped(false); setSelectedOpt(null); setAnswerShown(false);
    setTimeout(()=>setIdx(i=>(i+1)%Math.max(filtered.length,1)),150);
  };
  const goPrev = () => {
    setFlipped(false); setSelectedOpt(null); setAnswerShown(false);
    setTimeout(()=>setIdx(i=>(i-1+filtered.length)%Math.max(filtered.length,1)),150);
  };
  const resetScore = () => { setScore({correct:0,incorrect:0}); setIdx(0); setFlipped(false); setSelectedOpt(null); setAnswerShown(false); };

  const reportQuizError = (quiz:any) => {
    const report = {
      id: quiz?.id,
      front: quiz?.front,
      back: quiz?.back,
      options: quiz?.options,
      reportedAt: new Date().toISOString(),
    };
    try{
      const existing = JSON.parse(localStorage.getItem("sb-quiz-error-reports")||"[]");
      localStorage.setItem("sb-quiz-error-reports", JSON.stringify([report,...existing].slice(0,50)));
    }catch{}
    toast.success("Quiz error reported. Verify before exams.");
  };

  // Quiz option click handler
  const handleOptionClick = (optIdx: number, options: string[], correctAnswer: string) => {
    if(answerShown) return; // Already answered
    setSelectedOpt(optIdx);
    setAnswerShown(true);
    const isCorrect = options[optIdx] === correctAnswer;
    setScore(s => isCorrect ? {...s,correct:s.correct+1} : {...s,incorrect:s.incorrect+1});
  };

  const getOptionStyle = (optIdx: number, options: string[], correctAnswer: string) => {
    const base: React.CSSProperties = {
      padding:"14px 16px", borderRadius:12, fontSize:14, cursor: answerShown?"default":"pointer",
      fontFamily:"inherit", textAlign:"left" as const, transition:"all .2s", width:"100%",
      display:"flex", alignItems:"center", gap:10, fontWeight:600, minHeight: 44,
    };
    if(!answerShown) {
      return { ...base, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)" };
    }
    const isSelected = selectedOpt===optIdx;
    const isCorrect  = options[optIdx]===correctAnswer;
    if(isCorrect) {
      // Always green for correct answer
      return { ...base, border:"2px solid #34D399", background:"rgba(52,211,153,.15)", color:"#34D399" };
    }
    if(isSelected && !isCorrect) {
      // Red for wrong selected
      return { ...base, border:"2px solid #F87171", background:"rgba(248,113,113,.15)", color:"#F87171" };
    }
    return { ...base, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--muted)", opacity:.5 };
  };

  if(loading) return <Loader />;

  return (
    <div style={{maxWidth:720,margin:"0 auto"}}>

      {/* AI Generate Modal */}
      {showAI&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}>
          <div style={{background:"var(--card)",borderRadius:24,padding:28,width:"100%",maxWidth:480,border:"1px solid rgba(167,139,250,.3)",boxShadow:"0 24px 60px rgba(0,0,0,.5)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#A78BFA,#6366F1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Brain size={20} color="#fff"/>
                </div>
                <h3 style={{color:"var(--text)",fontSize:17,fontWeight:700}}>AI Generate</h3>
              </div>
              <button onClick={()=>setShowAI(false)} style={{width: 44, height: 44, display:"flex", alignItems:"center", justifyContent:"center", marginRight:-12, background:"none",border:"none",cursor:"pointer",color:"var(--muted)"}}><X size={20}/></button>
            </div>

            {/* Type Toggle */}
            <div style={{display:"flex",gap:8,marginBottom:16,background:"var(--bg)",borderRadius:12,padding:4}}>
              {(["flashcard","quiz"] as const).map(t=>(
                <button key={t} onClick={()=>setAiType(t)}
                  style={{flex:1,padding:"8px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,
                    background:aiType===t?"linear-gradient(135deg,#A78BFA,#6366F1)":"transparent",
                    color:aiType===t?"#fff":"var(--muted)",transition:"all .2s"}}>
                  {t==="flashcard"?"⚡ Flashcards":"🎯 Quiz MCQ"}
                </button>
              ))}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6}}>Topic / Prompt</label>
                <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} rows={3}
                  placeholder={aiType==="flashcard"?"e.g. Python loops and functions":"e.g. 10 quiz questions on Python loops"}
                  style={{width:"100%",borderRadius:10,padding:"10px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",resize:"none",boxSizing:"border-box" as const}}/>
              </div>
              <div className="grid-2col">
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6}}>Subject</label>
                  <select value={aiSubject} onChange={e=>setAiSubject(e.target.value)}
                    style={{width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit"}}>
                    <option value="">Auto detect</option>
                    {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase" as const,marginBottom:6}}>Count</label>
                  <select value={aiCount} onChange={e=>setAiCount(Number(e.target.value))}
                    style={{width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit"}}>
                    {[5,10,15,20,25,30].map(n=><option key={n} value={n}>{n} cards</option>)}
                  </select>
                </div>
              </div>

              <div style={{padding:"10px 14px",borderRadius:10,background:"rgba(167,139,250,.08)",border:"1px solid rgba(167,139,250,.2)",fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                🤖 AI will generate <strong style={{color:"#A78BFA"}}>{aiCount} {aiType==="flashcard"?"flashcards":"quiz MCQ questions"}</strong> for <strong style={{color:"#A78BFA"}}>&quot;{aiPrompt||"your topic"}&quot;</strong>.
                {aiType==="quiz"&&" Each Q has 4 options — click to answer!"}
              </div>

              <div style={{display:"flex",gap:10}}>
                <button onClick={generateAI} disabled={aiLoading}
                  style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#A78BFA,#6366F1)",color:"#fff",cursor:aiLoading?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,opacity:aiLoading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {aiLoading?<><div style={{width:16,height:16,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .6s linear infinite"}}/> Generating...</>:<><Sparkles size={16}/> Generate</>}
                </button>
                <button onClick={()=>setShowAI(false)} style={{padding:"11px 16px",borderRadius:12,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}} 
        .opt-btn:hover{opacity:.85!important}
        .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        @media (max-width: 600px) {
          .grid-2col { grid-template-columns: 1fr; }
          .grid-options { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Tab switcher — Flashcards vs Quiz */}
      <div style={{display:"flex",gap:0,background:"var(--card)",borderRadius:16,padding:5,border:"1px solid var(--border)",marginBottom:20}}>
        {(["flashcard","quiz"] as const).map(t=>{
          const count = allCards.filter(c=>t==="flashcard"?(c.card_type==="flashcard"||!c.card_type):c.card_type==="quiz").length;
          return (
            <button key={t} onClick={()=>{ setActiveTab(t); setQuizMode(t==="quiz"); }}
              style={{flex:1,padding:"10px 16px", minHeight: 44, borderRadius:12,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,
                background:activeTab===t?"linear-gradient(135deg,#4F8EF7,#6366F1)":"transparent",
                color:activeTab===t?"#fff":"var(--muted)",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {t==="flashcard"?"⚡ Flashcards":"🎯 Quiz MCQ"}
              <span style={{fontSize:11,padding:"1px 7px",borderRadius:20,background:activeTab===t?"rgba(255,255,255,.2)":"var(--border)",color:activeTab===t?"#fff":"var(--muted)"}}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Controls row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {subjects.length>0&&(
            <select value={filterSub} onChange={e=>setFilterSub(e.target.value)}
              style={{borderRadius:10,padding:"7px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",outline:"none",fontFamily:"inherit"}}>
              <option value="">All subjects</option>
              {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
          {filtered.length>0&&(
            <div style={{display:"flex",gap:8}}>
              <span style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,background:"#34D39922",color:"#34D399"}}>✓ {score.correct}</span>
              <span style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,background:"#F8717122",color:"#F87171"}}>✗ {score.incorrect}</span>
              <button onClick={resetScore} style={{padding:"5px 10px",borderRadius:20,fontSize:11,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontFamily:"inherit"}}>Reset</button>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowAI(true)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:12,border:"1px solid rgba(167,139,250,.4)",background:"rgba(167,139,250,.1)",color:"#A78BFA",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
            <Sparkles size={14}/> AI Generate
          </button>
          {activeTab==="flashcard"&&(
            <button onClick={()=>setShowNew(!showNew)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:12,border:"none",background:"#4F8EF7",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>
              <Plus size={14}/> Add Card
            </button>
          )}
        </div>
      </div>

      {/* Manual Add form (flashcard only) */}
      {showNew&&activeTab==="flashcard"&&(
        <div style={{marginBottom:20,padding:20,borderRadius:16,border:"1px solid #4F8EF744",background:"var(--card)"}}>
          <div style={{marginBottom:12}}>
            <select value={newSubject} onChange={e=>setNewSubject(e.target.value)}
              style={{width:"100%",borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit"}}>
              <option value="">No subject</option>
              {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid-2col" style={{marginBottom:12}}>
            <textarea value={newFront} onChange={e=>setNewFront(e.target.value)} rows={3} placeholder="Question (Front)"
              style={{borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",resize:"none"}}/>
            <textarea value={newBack} onChange={e=>setNewBack(e.target.value)} rows={3} placeholder="Answer (Back)"
              style={{borderRadius:10,padding:"9px 12px",fontSize:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",outline:"none",fontFamily:"inherit",resize:"none"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addCard} style={{padding:"9px 20px",borderRadius:10,border:"none",background:"#4F8EF7",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>Add Flashcard</button>
            <button onClick={()=>setShowNew(false)} style={{padding:"9px 16px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length===0?(
        <div style={{textAlign:"center",padding:60,color:"var(--muted)"}}>
          <Layers size={48} style={{margin:"0 auto 14px",opacity:.2}}/>
          <p style={{fontSize:15,fontWeight:600}}>No {activeTab==="flashcard"?"flashcards":"quiz questions"} yet</p>
          <p style={{fontSize:13,marginTop:6}}>Click &quot;AI Generate&quot; to create with AI 🤖</p>
        </div>
      ):(
        <>
          {/* Counter */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,color:"var(--muted)"}}>
              {activeTab==="flashcard"?"Card":"Question"} {idx+1} of {filtered.length}
            </span>
            <div style={{display:"flex",gap:6}}>
              {card?.ai_generated&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(167,139,250,.15)",color:"#A78BFA",fontWeight:700}}>🤖 AI</span>}
              {card?.subject&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:`${subColor(card.subject)}22`,color:subColor(card.subject),fontWeight:700}}>{card.subject}</span>}
            </div>
          </div>

          {/* ── FLASHCARD MODE ── */}
          {activeTab==="flashcard"&&(
            <>
              <div onClick={()=>setFlipped(!flipped)}
                style={{borderRadius:24,minHeight:240,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:"40px 48px",textAlign:"center",transition:"all .3s",position:"relative",marginBottom:20,
                  background:flipped?`linear-gradient(135deg,${subColor(card?.subject)},${subColor(card?.subject)}cc)`:"var(--card)",
                  border:`2px solid ${flipped?subColor(card?.subject):"var(--border)"}`,
                  boxShadow:flipped?`0 0 40px ${subColor(card?.subject)}44`:"none"}}>
                <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:".1em",marginBottom:16,color:flipped?"rgba(255,255,255,.7)":"var(--muted)"}}>
                  {flipped?"ANSWER":"QUESTION"}
                </div>
                <p style={{fontFamily:"var(--font-lora),serif",fontSize:20,lineHeight:1.7,color:flipped?"#fff":"var(--text)"}}>
                  {flipped?card?.back:card?.front}
                </p>
                <div style={{position:"absolute",bottom:16,fontSize:11,color:flipped?"rgba(255,255,255,.5)":"var(--muted)"}}>
                  {flipped?"Click to hide":"Click to reveal answer"}
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
                <button onClick={goPrev} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px", minHeight:44, borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>
                  <ChevronLeft size={18}/> Prev
                </button>
                {flipped?(
                  <>
                    <button onClick={()=>goNext(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:12,border:"none",background:"#34D399",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
                      <Check size={15}/> Know it!
                    </button>
                    <button onClick={()=>goNext(false)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:12,border:"none",background:"#F87171",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
                      <X size={15}/> Missed
                    </button>
                  </>
                ):(
                  <button onClick={()=>goNext()} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>
                    Next <ChevronRight size={18}/>
                  </button>
                )}
                <button onClick={()=>deleteCard(card?.id)} style={{padding:"10px 14px", minHeight:44, borderRadius:12,border:"1px solid #F8717144",background:"#F8717111",color:"#F87171",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontFamily:"inherit"}}>
                  <Trash2 size={18}/>
                </button>
              </div>
            </>
          )}

          {/* ── QUIZ MCQ MODE ── */}
          {activeTab==="quiz"&&(
            <>
              {/* Question */}
              <div style={{borderRadius:20,padding:"28px 32px",background:"var(--card)",border:"1px solid var(--border)",marginBottom:16,textAlign:"center"}}>
                <p style={{fontFamily:"var(--font-lora),serif",fontSize:20,lineHeight:1.7,color:"var(--text)",fontWeight:600}}>
                  {card?.front}
                </p>
              </div>

              {/* Options */}
              {card?.options&&Array.isArray(card.options)&&card.options.length===4?(
                <div className="grid-options">
                  {card.options.map((opt:string,i:number)=>{
                    const labels=["A","B","C","D"];
                    const style = getOptionStyle(i, card.options, card.back);
                    const isCorrect = card.options[i]===card.back;
                    const isSelected = selectedOpt===i;
                    return(
                      <button key={i} className="opt-btn"
                        onClick={()=>handleOptionClick(i, card.options, card.back)}
                        style={style}>
                        <span style={{
                          width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,
                          background: answerShown?(isCorrect?"#34D399":isSelected?"#F87171":"var(--border)"):`rgba(79,142,247,.15)`,
                          color: answerShown?(isCorrect||isSelected?"#fff":"var(--muted)"):"#4F8EF7",
                        }}>
                          {answerShown&&isCorrect?"✓":answerShown&&isSelected&&!isCorrect?"✗":labels[i]}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ):(
                // Fallback: no options — show answer on click
                <div onClick={()=>{if(!answerShown){setAnswerShown(true);setScore(s=>({...s,correct:s.correct+1}));}}}
                  style={{borderRadius:16,padding:"20px 24px",background:answerShown?"rgba(52,211,153,.1)":"var(--card)",border:`1px solid ${answerShown?"#34D399":"var(--border)"}`,cursor:"pointer",textAlign:"center",marginBottom:20}}>
                  {answerShown?(
                    <p style={{fontSize:16,fontWeight:700,color:"#34D399"}}>{card?.back}</p>
                  ):(
                    <p style={{fontSize:13,color:"var(--muted)"}}>Click to reveal answer</p>
                  )}
                </div>
              )}

              {/* After answer — Next/result */}
              {answerShown&&(
                <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20,animation:"fadeIn .3s ease"}}>
                  <div style={{padding:"10px 16px",borderRadius:12,background:"var(--card)",border:"1px solid var(--border)",fontSize:13,color:"var(--muted)"}}>
                    Correct: <strong style={{color:"#34D399"}}>{card?.back}</strong>
                  </div>
                </div>
              )}

              <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20}}>
                <button onClick={goPrev} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px", minHeight:44, borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>
                  <ChevronLeft size={18}/> Prev
                </button>
                <button onClick={()=>goNext()} disabled={!answerShown}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"10px 22px", minHeight:44, borderRadius:12,border:"none",background:answerShown?"#4F8EF7":"var(--border)",color:answerShown?"#fff":"var(--muted)",cursor:answerShown?"pointer":"not-allowed",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
                  Next Question <ChevronRight size={18}/>
                </button>
                <button onClick={()=>reportQuizError(card)} style={{padding:"10px 14px", minHeight:44, borderRadius:12,border:"1px solid rgba(245,166,35,.35)",background:"rgba(245,166,35,.08)",color:"#F5A623",cursor:"pointer",display:"flex",alignItems:"center",fontSize:13,fontFamily:"inherit",fontWeight:700}}>
                  Report error
                </button>
                <button onClick={()=>deleteCard(card?.id)} style={{padding:"10px 14px", minHeight:44, borderRadius:12,border:"1px solid #F8717144",background:"#F8717111",color:"#F87171",cursor:"pointer",display:"flex",alignItems:"center",fontSize:13,fontFamily:"inherit"}}>
                  <Trash2 size={15}/>
                </button>
              </div>

              {/* Score summary when all done */}
              {idx===filtered.length-1&&answerShown&&(
                <div style={{padding:"16px 20px",borderRadius:16,border:"1px solid rgba(52,211,153,.3)",background:"rgba(52,211,153,.06)",textAlign:"center"}}>
                  <p style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>Quiz Complete! 🎉</p>
                  <p style={{fontSize:14,color:"var(--muted)",marginTop:4}}>
                    Score: <strong style={{color:"#34D399"}}>{score.correct}</strong> / {filtered.length} correct
                    {" "}({Math.round((score.correct/filtered.length)*100)}%)
                  </p>
                  <button onClick={resetScore} style={{marginTop:12,padding:"8px 20px",borderRadius:10,border:"none",background:"#4F8EF7",color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:13}}>
                    Try Again 🔄
                  </button>
                </div>
              )}
            </>
          )}

          {/* Card list */}
          <div style={{marginTop:16,padding:16,borderRadius:16,border:"1px solid var(--border)",background:"var(--card)"}}>
            <h4 style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12}}>
              {activeTab==="flashcard"?"📚":"🎯"} All {activeTab==="flashcard"?"Flashcards":"Quiz Questions"} ({filtered.length})
            </h4>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
              {filtered.map((c,i)=>(
                <div key={c.id} onClick={()=>{ setIdx(i); setFlipped(false); setSelectedOpt(null); setAnswerShown(false); }}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,cursor:"pointer",background:i===idx?"#4F8EF722":"var(--bg)",border:`1px solid ${i===idx?"#4F8EF7":"var(--border)"}`,transition:"all .15s"}}>
                  <span style={{width:22,height:22,borderRadius:"50%",background:i===idx?"#4F8EF7":"var(--border)",color:i===idx?"#fff":"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</span>
                  <span style={{flex:1,fontSize:13,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.front}</span>
                  {c.subject&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:`${subColor(c.subject)}22`,color:subColor(c.subject),fontWeight:600,flexShrink:0}}>{c.subject}</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
