"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Brain, Sparkles, X, Loader, Copy, Check, Download, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Message {
  id:string; role:"user"|"assistant"; content:string;
  mermaid?:string; diagLoading?:boolean; loading?:boolean; timestamp:number;
}

function md(t:string):string {
  return t
    .replace(/^### (.+)$/gm,'<h3 style="font-family:var(--font-lora),serif;font-size:17px;font-weight:700;color:var(--text);margin:16px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm,'<h2 style="font-family:var(--font-lora),serif;font-size:20px;font-weight:700;color:var(--text);margin:18px 0 10px">$1</h2>')
    .replace(/^# (.+)$/gm,'<h1 style="font-family:var(--font-lora),serif;font-size:24px;font-weight:700;color:var(--text);margin:20px 0 12px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong style="font-weight:700;color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g,'<em style="font-style:italic;color:var(--muted)">$1</em>')
    .replace(/`([^`]+)`/g,'<code style="background:rgba(79,142,247,.12);color:#4F8EF7;padding:2px 7px;border-radius:5px;font-size:13px;font-family:monospace">$1</code>')
    .replace(/^---$/gm,'<hr style="border:none;border-top:1px solid var(--border);margin:14px 0"/>')
    .replace(/^- (.+)$/gm,'<div style="display:flex;gap:8px;margin:5px 0"><span style="color:#4F8EF7;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm,'<div style="display:flex;gap:8px;margin:5px 0"><span style="color:#F5A623;font-weight:700;flex-shrink:0;min-width:18px">▶</span><span>$1</span></div>')
    .replace(/\n\n/g,'<br/><br/>').replace(/\n/g,'<br/>');
}

const MERMAID_P=(q:string,a:string)=>
`Create a Mermaid diagram for: "${q}"
Summary: ${a.slice(0,400)}
RULES: Output ONLY Mermaid syntax. No backticks, no explanation.
Choose: flowchart TD/LR, mindmap, timeline, sequenceDiagram, pie
Keep max 12 nodes. Use clear labels.
Example:
flowchart TD
    A[Sunlight] --> B[Chlorophyll]
    B --> C[Glucose + O2]
Output Mermaid code only:`;

const SYS=(s:string)=>
`You are StudyBuddy AI — expert educational tutor.
${s?`Student studies: ${s}.`:""}
Format every answer:
1. 📌 One-line summary
2. ## Main sections with emojis
3. **bold** key terms
4. Numbered steps for processes
5. - bullets for lists
6. \`code\` for formulas
7. --- between sections
8. ## 💡 Key Takeaway at end
Be thorough, clear, use real examples. Explain like teaching a 16-year-old.`;

const CK="sb-ai-v3";

export default function AITutorPage() {
  const supabase=createClient();
  const [msgs,setMsgs]=useState<Message[]>([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [autoVis,setAutoVis]=useState(true);
  const [subjects,setSubjects]=useState<any[]>([]);
  const [sub,setSub]=useState("");
  const [fullDiag,setFullDiag]=useState<string|null>(null);
  const [copied,setCopied]=useState<string|null>(null);
  const [showHist,setShowHist]=useState(false);
  const [history,setHistory]=useState<any[]>([]);
  const [mLoaded,setMLoaded]=useState(false);
  const bottom=useRef<HTMLDivElement>(null);
  const dRefs=useRef<Record<string,HTMLDivElement|null>>({});

  useEffect(()=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
    s.onload=()=>{
      (window as any).mermaid?.initialize({
        startOnLoad:false,theme:"dark",
        themeVariables:{
          primaryColor:"#4F8EF7",primaryTextColor:"#E2EAF8",
          primaryBorderColor:"#1A2E4A",lineColor:"#5A7A9E",
          secondaryColor:"#0E1E38",tertiaryColor:"#0B1628",
          background:"#0B1628",mainBkg:"#0E1E38",
          nodeBorder:"#4F8EF7",titleColor:"#E2EAF8",
          fontFamily:"Arial,sans-serif",
        },
        flowchart:{curve:"basis",padding:20},
      });
      setMLoaded(true);
    };
    document.head.appendChild(s);
    return ()=>{ try{document.head.removeChild(s);}catch{} };
  },[]);

  useEffect(()=>{
    (async()=>{
      try{
        const {data:{user}}=await supabase.auth.getUser();
        if(!user) return;
        const {data:s}=await supabase.from("subjects").select("*").eq("user_id",user.id);
        setSubjects(s||[]);
      }catch{}
      try{
        const m=localStorage.getItem(CK); if(m) setMsgs(JSON.parse(m));
        const h=localStorage.getItem(CK+"-h"); if(h) setHistory(JSON.parse(h));
      }catch{}
    })();
  },[]);

  useEffect(()=>{ if(msgs.length) try{localStorage.setItem(CK,JSON.stringify(msgs));}catch{} },[msgs]);
  useEffect(()=>{ bottom.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const render=async(id:string,code:string)=>{
    const el=dRefs.current[id];
    if(!el||(window as any).mermaid==null) return;
    try{
      el.innerHTML="";
      const numId = parseInt(id.slice(-6)) || Math.floor(Math.random()*99999); const {svg}=await (window as any).mermaid.render(`maid${numId}`,code);
      el.innerHTML=svg;
    }catch{
      el.innerHTML=`<p style="color:#F87171;padding:12px;font-size:12px">⚠️ Diagram render failed</p>`;
    }
  };

  const callAPI=async(messages:any[],system?:string,type="chat")=>{
    const r=await fetch("/api/ai",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages,system,type}),
    });
    if(!r.ok){const e=await r.json();throw new Error(e.error||`${r.status}`);}
    return (await r.json()).text||"";
  };

  const genDiag=async(q:string,a:string,id:string)=>{
    setMsgs(p=>p.map(m=>m.id===id?{...m,diagLoading:true}:m));
    try{
      const raw=await callAPI([{role:"user",content:MERMAID_P(q,a)}],undefined,"diagram");
      const code=raw.replace(/```mermaid/gi,"").replace(/```/g,"").trim();
      setMsgs(p=>p.map(m=>m.id===id?{...m,mermaid:code,diagLoading:false}:m));
      setTimeout(()=>render(id,code),150);
    }catch{
      setMsgs(p=>p.map(m=>m.id===id?{...m,diagLoading:false}:m));
    }
  };

  const send=async()=>{
    if(!input.trim()||loading) return;
    const q=input.trim(); setInput(""); setLoading(true);
    const uid=Date.now().toString(), aid=(Date.now()+1).toString(), ts=Date.now();
    setMsgs(p=>[...p,
      {id:uid,role:"user",content:q,timestamp:ts},
      {id:aid,role:"assistant",content:"",loading:true,timestamp:ts},
    ]);
    try{
      const hist=msgs.slice(-8).map(m=>({role:m.role,content:m.content}));
      const ans=await callAPI([...hist,{role:"user",content:q}],SYS(sub));
      setMsgs(p=>p.map(m=>m.id===aid?{...m,content:ans,loading:false}:m));
      if(autoVis&&ans.length>80) genDiag(q,ans,aid);
    }catch(e:any){
      const msg=e.message.includes("401")||e.message.includes("403")
        ?"❌ Invalid GROQ_API_KEY. Check .env.local!"
        :`❌ Error: ${e.message}`;
      setMsgs(p=>p.map(m=>m.id===aid?{...m,content:msg,loading:false}:m));
      toast.error("Check GROQ_API_KEY in .env.local");
    }
    setLoading(false);
  };

  const saveChat=()=>{
    if(!msgs.length){toast.error("Nothing to save!");return;}
    const nc={id:Date.now(),title:msgs.find(m=>m.role==="user")?.content.slice(0,45)||"Chat",messages:msgs,date:new Date().toLocaleDateString("en-IN"),subject:sub};
    const up=[nc,...history.slice(0,9)];
    setHistory(up);
    try{localStorage.setItem(CK+"-h",JSON.stringify(up));}catch{}
    toast.success("Chat saved! 💾");
  };

  const loadChat=(c:any)=>{
    setMsgs(c.messages);setSub(c.subject||"");setShowHist(false);
    toast.success("Loaded!");
    setTimeout(()=>c.messages.forEach((m:Message)=>{if(m.mermaid)render(m.id,m.mermaid);}),200);
  };

  const clearChat=()=>{setMsgs([]);try{localStorage.removeItem(CK);}catch{}toast.success("Cleared!");};

  const dlPNG=(id:string)=>{
    const el=dRefs.current[id];if(!el)return;
    const svg=el.querySelector("svg");if(!svg)return;
    svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
    const str=new XMLSerializer().serializeToString(svg);
    const c=document.createElement("canvas");c.width=1200;c.height=700;
    const ctx=c.getContext("2d")!;ctx.fillStyle="#0B1628";ctx.fillRect(0,0,1200,700);
    const img=new Image();
    img.onload=()=>{ctx.drawImage(img,0,0,1200,700);const a=document.createElement("a");a.download="diagram.png";a.href=c.toDataURL("image/png");a.click();toast.success("PNG downloaded!");};
    img.src="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(str)));
  };

  const cp=(t:string,id:string)=>{navigator.clipboard.writeText(t);setCopied(id);toast.success("Copied!");setTimeout(()=>setCopied(null),2000);};
  const sc=(n:string)=>subjects.find(s=>s.name===n)?.color||"#4F8EF7";
  const tf=(ts:number)=>new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

  const SUGG=[
    {icon:"🫀",text:"How does the human heart work?"},
    {icon:"🌿",text:"Explain photosynthesis with steps"},
    {icon:"⚡",text:"Newton's 3rd law with diagram"},
    {icon:"💧",text:"Explain the water cycle visually"},
    {icon:"🧮",text:"Quadratic equations explained"},
    {icon:"🧬",text:"Parts and functions of a cell"},
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes diagPop{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        .mi{animation:fadeUp .28s cubic-bezier(.34,1.3,.64,1) both}
        .sb:hover{transform:scale(1.1)!important;box-shadow:0 6px 24px rgba(79,142,247,.5)!important}
        .sb:active{transform:scale(.95)!important}
        .sg:hover{border-color:#4F8EF7!important;background:rgba(79,142,247,.06)!important;transform:translateY(-2px)}
        .mw svg{max-width:100%!important;font-family:Arial,sans-serif!important}
      `}</style>
      <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 120px)"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#4F8EF7,#A78BFA)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(79,142,247,.4)"}}>
              <Brain size={24} color="#fff"/>
            </div>
            <div>
              <h2 style={{fontFamily:"var(--font-lora),serif",fontSize:20,fontWeight:700,color:"var(--text)"}}>AI Study Tutor</h2>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#34D399",animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:11,color:"var(--muted)"}}>Groq (Llama 3.3) · Mermaid Diagrams · 100% Free ✅</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {subjects.length>0&&(
              <select value={sub} onChange={e=>setSub(e.target.value)}
                style={{borderRadius:10,padding:"7px 12px",fontSize:12,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",outline:"none",fontFamily:"inherit"}}>
                <option value="">All subjects</option>
                {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            )}
            <button onClick={()=>setShowHist(!showHist)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:"var(--muted)",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .2s"}}>
              <BookOpen size={13}/> History{history.length>0?` (${history.length})`:""}
              {showHist?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
            </button>
            {msgs.length>0&&(
              <button onClick={saveChat}
                style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:10,border:"1px solid rgba(52,211,153,.3)",background:"rgba(52,211,153,.08)",color:"#34D399",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,.18)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(52,211,153,.08)"}}>
                💾 Save
              </button>
            )}
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 13px",borderRadius:10,border:`1px solid ${autoVis?"rgba(167,139,250,.4)":"var(--border)"}`,background:autoVis?"rgba(167,139,250,.08)":"var(--card)",cursor:"pointer",transition:"all .2s"}}
              onClick={()=>setAutoVis(!autoVis)}>
              <Sparkles size={13} color={autoVis?"#A78BFA":"var(--muted)"}/>
              <span style={{fontSize:12,fontWeight:700,color:autoVis?"#A78BFA":"var(--muted)"}}>Diagrams {autoVis?"ON":"OFF"}</span>
              <div style={{width:34,height:19,borderRadius:10,background:autoVis?"#A78BFA":"var(--border)",position:"relative",transition:"background .25s",flexShrink:0}}>
                <div style={{width:15,height:15,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:autoVis?17:2,transition:"left .25s"}}/>
              </div>
            </div>
            {msgs.length>0&&(
              <button onClick={clearChat}
                style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:10,border:"1px solid rgba(248,113,113,.25)",background:"rgba(248,113,113,.07)",color:"#F87171",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(248,113,113,.15)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(248,113,113,.07)"}}>
                <Trash2 size={13}/> Clear
              </button>
            )}
          </div>
        </div>

        {/* History */}
        {showHist&&(
          <div style={{marginBottom:12,padding:16,borderRadius:16,border:"1px solid var(--border)",background:"var(--card)",maxHeight:220,overflowY:"auto"}}>
            <h4 style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12}}>📚 Saved Chats</h4>
            {history.length===0?(
              <p style={{fontSize:13,color:"var(--muted)",textAlign:"center",padding:16}}>No saved chats. Click 💾 Save!</p>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {history.map(c=>(
                  <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:"var(--bg)",border:"1px solid var(--border)",cursor:"pointer",transition:"all .15s"}}
                    onClick={()=>loadChat(c)}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#4F8EF7"}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--border)"}}>
                    <span style={{fontSize:16}}>💬</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}...</div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{c.date}{c.subject?` · ${c.subject}`:""} · {c.messages.length} msgs</div>
                    </div>
                    <span style={{fontSize:11,color:"#4F8EF7",fontWeight:600,flexShrink:0}}>Load →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat */}
        <div style={{flex:1,overflowY:"auto",borderRadius:20,border:"1px solid var(--border)",background:"var(--card)",padding:20,display:"flex",flexDirection:"column",gap:20}}>
          {msgs.length===0&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 0"}}>
              <div style={{width:80,height:80,borderRadius:22,background:"linear-gradient(135deg,#4F8EF7,#A78BFA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,marginBottom:18,boxShadow:"0 10px 32px rgba(79,142,247,.35)"}}>🤖</div>
              <h3 style={{fontFamily:"var(--font-lora),serif",fontSize:22,color:"var(--text)",marginBottom:8,fontWeight:700}}>Ask me anything!</h3>
              <p style={{fontSize:14,color:"var(--muted)",textAlign:"center",maxWidth:460,lineHeight:1.8,marginBottom:12}}>
                Complete formatted answers + <strong style={{color:"#A78BFA"}}>Mermaid diagrams</strong> — 100% Free! ✨
              </p>
              <div style={{display:"flex",gap:7,marginBottom:24,flexWrap:"wrap",justifyContent:"center"}}>
                {["🔄 Flowcharts","🗺️ Mind Maps","⏱️ Timelines","📊 Sequences","🔁 Cycles"].map(t=>(
                  <span key={t} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"rgba(167,139,250,.12)",color:"#A78BFA",fontWeight:600}}>{t}</span>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",maxWidth:560}}>
                {SUGG.map(s=>(
                  <button key={s.text} className="sg" onClick={()=>setInput(s.text)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:13,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--muted)",cursor:"pointer",fontSize:13,fontFamily:"inherit",textAlign:"left",transition:"all .2s",lineHeight:1.4}}>
                    <span style={{fontSize:20,flexShrink:0}}>{s.icon}</span><span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((msg,i)=>(
            <div key={msg.id} className="mi" style={{animationDelay:`${Math.min(i,6)*25}ms`,display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:10}}>
              {msg.role==="user"&&(
                <div style={{maxWidth:"72%",padding:"12px 18px",borderRadius:"18px 18px 4px 18px",background:"linear-gradient(135deg,#4F8EF7,#6366F1)",color:"#fff",fontSize:14,lineHeight:1.7,boxShadow:"0 4px 18px rgba(79,142,247,.35)"}}>
                  {msg.content}
                  <div style={{fontSize:10,opacity:.6,marginTop:4}}>{tf(msg.timestamp)}</div>
                </div>
              )}
              {msg.role==="assistant"&&(
                <div style={{width:"100%",maxWidth:"95%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <div style={{width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#4F8EF7,#A78BFA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🤖</div>
                    <span style={{fontSize:12,fontWeight:700,color:"var(--primary)"}}>AI Tutor</span>
                    {sub&&<span style={{fontSize:10,padding:"2px 9px",borderRadius:20,background:`${sc(sub)}18`,color:sc(sub),fontWeight:700}}>{sub}</span>}
                    <span style={{fontSize:10,color:"var(--muted)"}}>{tf(msg.timestamp)}</span>
                    {!msg.loading&&msg.content&&(
                      <button onClick={()=>cp(msg.content,msg.id)}
                        style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontSize:11,fontFamily:"inherit",transition:"all .15s"}}>
                        {copied===msg.id?<Check size={11}/>:<Copy size={11}/>}
                        {copied===msg.id?"Copied!":"Copy"}
                      </button>
                    )}
                  </div>
                  <div style={{padding:"16px 20px",borderRadius:"4px 18px 18px 18px",background:"var(--bg)",border:"1px solid var(--border)",fontSize:14,lineHeight:1.85,color:"var(--text)"}}>
                    {msg.loading?(
                      <div style={{display:"flex",alignItems:"center",gap:10,color:"var(--muted)"}}>
                        <div style={{width:18,height:18,border:"2.5px solid #4F8EF7",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .55s linear infinite"}}/>
                        <span style={{fontSize:13}}>Thinking...</span>
                      </div>
                    ):<div dangerouslySetInnerHTML={{__html:md(msg.content)}}/>}
                  </div>
                  {!msg.loading&&(
                    <>
                      {msg.diagLoading&&(
                        <div style={{marginTop:10,display:"flex",alignItems:"center",gap:9,padding:"10px 16px",borderRadius:12,background:"var(--bg)",border:"1px solid var(--border)",width:"fit-content"}}>
                          <Sparkles size={14} color="#A78BFA" style={{animation:"spin 1.5s linear infinite"}}/>
                          <span style={{fontSize:12,color:"#A78BFA",fontWeight:600}}>Generating diagram...</span>
                          <div style={{width:90,height:3,borderRadius:2,background:"var(--border)",overflow:"hidden"}}>
                            <div style={{height:"100%",background:"linear-gradient(90deg,#4F8EF7,#A78BFA)",backgroundSize:"200%",animation:"shimmer 1s linear infinite",borderRadius:2}}/>
                          </div>
                        </div>
                      )}
                      {msg.mermaid&&(
                        <div style={{marginTop:12,animation:"diagPop .35s cubic-bezier(.34,1.3,.64,1) both"}}>
                          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,flexWrap:"wrap"}}>
                            <div style={{width:22,height:22,borderRadius:7,background:"linear-gradient(135deg,#A78BFA,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✨</div>
                            <span style={{fontSize:12,fontWeight:700,color:"#A78BFA"}}>Visual Diagram</span>
                            <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(167,139,250,.1)",color:"#A78BFA"}}>Mermaid.js</span>
                            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                              <button onClick={()=>setFullDiag(msg.mermaid!)}
                                style={{fontSize:11,padding:"4px 11px",borderRadius:20,border:"1px solid rgba(167,139,250,.3)",background:"rgba(167,139,250,.1)",color:"#A78BFA",cursor:"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .2s"}}
                                onMouseEnter={e=>{e.currentTarget.style.background="rgba(167,139,250,.22)"}}
                                onMouseLeave={e=>{e.currentTarget.style.background="rgba(167,139,250,.1)"}}>
                                🔍 Full
                              </button>
                              <button onClick={()=>dlPNG(msg.id)}
                                style={{fontSize:11,padding:"4px 11px",borderRadius:20,border:"1px solid rgba(52,211,153,.3)",background:"rgba(52,211,153,.08)",color:"#34D399",cursor:"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .2s"}}
                                onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,.18)"}}
                                onMouseLeave={e=>{e.currentTarget.style.background="rgba(52,211,153,.08)"}}>
                                <Download size={11}/> PNG
                              </button>
                            </div>
                          </div>
                          <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(167,139,250,.2)",background:"#0B1628",padding:16,cursor:"pointer",transition:"box-shadow .2s"}}
                            onClick={()=>setFullDiag(msg.mermaid!)}
                            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 8px 40px rgba(167,139,250,.2)"}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="none"}}>
                            <div className="mw" ref={el=>{dRefs.current[msg.id]=el;if(el&&mLoaded&&msg.mermaid)render(msg.id,msg.mermaid);}}/>
                          </div>
                          <p style={{fontSize:11,color:"var(--muted)",marginTop:5,textAlign:"center"}}>Click to expand · ⬇ PNG</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottom}/>
        </div>

        {/* Input */}
        <div style={{marginTop:12,display:"flex",gap:10,alignItems:"flex-end"}}>
          <div style={{flex:1,borderRadius:16,border:`1px solid ${loading?"rgba(79,142,247,.5)":"var(--border)"}`,background:"var(--card)",padding:"12px 16px",display:"flex",alignItems:"flex-end",gap:10,transition:"border-color .25s,box-shadow .25s",boxShadow:loading?"0 0 20px rgba(79,142,247,.15)":"none"}}>
            <textarea value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Ask any question... (Shift+Enter for new line)"
              rows={1}
              style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontFamily:"inherit",resize:"none",lineHeight:1.65,maxHeight:130,overflowY:"auto"}}
              onInput={e=>{const t=e.target as HTMLTextAreaElement;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,130)+"px";}}/>
          </div>
          <button className="sb" onClick={send} disabled={loading||!input.trim()}
            style={{width:52,height:52,borderRadius:15,border:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:loading||!input.trim()?"not-allowed":"pointer",background:loading||!input.trim()?"var(--border)":"linear-gradient(135deg,#4F8EF7,#6366F1)",color:loading||!input.trim()?"var(--muted)":"#fff",transition:"all .2s",boxShadow:!loading&&input.trim()?"0 4px 20px rgba(79,142,247,.4)":"none"}}>
            {loading?<Loader size={20} style={{animation:"spin .55s linear infinite"}}/>:<Send size={20}/>}
          </button>
        </div>
        <p style={{fontSize:11,color:"var(--muted)",textAlign:"center",marginTop:7}}>Enter ↵ send · Shift+Enter new line · 💾 Save · ⬇ Download diagrams</p>
      </div>

      {/* Full Screen */}
      {fullDiag&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(8px)"}}
          onClick={()=>setFullDiag(null)}>
          <div style={{background:"var(--card)",borderRadius:22,padding:28,maxWidth:900,width:"100%",maxHeight:"90vh",overflow:"auto",position:"relative",border:"1px solid rgba(167,139,250,.3)",boxShadow:"0 32px 100px rgba(0,0,0,.7)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Sparkles size={18} color="#A78BFA"/>
                <h3 style={{fontFamily:"var(--font-lora),serif",fontSize:20,color:"var(--text)",fontWeight:700}}>Visual Diagram</h3>
              </div>
              <button onClick={()=>setFullDiag(null)}
                style={{width:34,height:34,borderRadius:"50%",background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#F87171"}}>
                <X size={16}/>
              </button>
            </div>
            <div style={{borderRadius:14,overflow:"hidden",background:"#0B1628",padding:24,border:"1px solid rgba(167,139,250,.15)"}}>
              <div className="mw" ref={el=>{
                if(el&&mLoaded&&fullDiag){
                  (window as any).mermaid?.render("fullscreen99",fullDiag)
                    .then(({svg}:{svg:string})=>{el.innerHTML=svg;})
                    .catch(()=>{el.innerHTML="<p style='color:#F87171;padding:12px'>Render error</p>";});
                }
              }}/>
            </div>
            <p style={{textAlign:"center",fontSize:12,color:"var(--muted)",marginTop:12}}>Click outside to close</p>
          </div>
        </div>
      )}
    </>
  );
}
