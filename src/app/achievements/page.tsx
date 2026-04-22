"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { calculateBadges, updateStreak, onXPUpdate } from "@/lib/xp-utils";
import toast from "react-hot-toast";

const CATS = ["All","Tasks","Notes","Streak","XP","Focus","Flashcards"];

function useCountUp(target: number, dur = 500) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current, s = performance.now();
    const t = (n: number) => {
      const p = Math.min((n-s)/dur,1), e = 1-Math.pow(1-p,2);
      setV(Math.round(from+(target-from)*e));
      if(p<1) requestAnimationFrame(t); else prev.current=target;
    };
    requestAnimationFrame(t);
  }, [target]);
  return v;
}

export default function AchievementsPage() {
  const supabase = createClient();
  const [xp,         setXp]         = useState(0);
  const [streak,     setStreak]      = useState(0);
  const [tasksDone,  setTasksDone]   = useState(0);
  const [notesCount, setNotesCount]  = useState(0);
  const [sessions,   setSessions]    = useState(0);
  const [flashcards, setFlashcards]  = useState(0);
  const [loading,    setLoading]     = useState(true);
  const [catFilter,  setCatFilter]   = useState("All");
  const [userId,     setUserId]      = useState("");
  const [visible,    setVisible]     = useState(false);

  const animXp     = useCountUp(xp,     600);
  const animStreak = useCountUp(streak, 500);

  useEffect(() => { fetchData(); setTimeout(() => setVisible(true), 60); }, []);

  useEffect(() => {
    if (!userId) return;
    return onXPUpdate(() => {
      supabase.from("user_xp").select("total_xp,streak").eq("user_id",userId).single()
        .then(({ data }) => { if(data){ setXp(data.total_xp||0); setStreak(data.streak||0); } });
    });
  }, [userId]);

  const fetchData = async () => {
    let user: any = null;
    try {
      const { data: { user: u }, error: ae } = await supabase.auth.getUser();
      if (ae || !u) { setLoading(false); return; }
      user = u;
    } catch(e){ setLoading(false); return; }
    setUserId(user.id);
    const { streak:newStreak, isNew, milestone } = await updateStreak(supabase, user.id);
    if (isNew && newStreak > 1) toast.success(`🔥 ${newStreak} day streak!`);
    if (milestone) toast.success(`🎉 ${milestone}-day streak! Bonus XP!`, { duration:4000 });
    const [{ data:x },{ data:t },{ data:n },{ data:s },{ data:f }] = await Promise.all([
      supabase.from("user_xp").select("*").eq("user_id",user.id).single(),
      supabase.from("tasks").select("id").eq("user_id",user.id).eq("done",true),
      supabase.from("notes").select("id").eq("user_id",user.id),
      supabase.from("study_sessions").select("id").eq("user_id",user.id),
      supabase.from("flashcards").select("id").eq("user_id",user.id),
    ]);
    setXp(x?.total_xp||0); setStreak(newStreak);
    setTasksDone(t?.length||0); setNotesCount(n?.length||0);
    setSessions(s?.length||0); setFlashcards(f?.length||0);
    setLoading(false);
  };

  const level     = Math.floor(xp/500)+1;
  const xpInLevel = xp%500;
  const badges    = calculateBadges({ xp, streak, tasksDone, notesCount, sessions, level, flashcards });
  const filtered  = catFilter==="All" ? badges : badges.filter(b=>b.category===catFilter);
  const earned    = badges.filter(b=>b.earned).length;
  const fadeUp = (d=0) => ({ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(16px)", transition:`opacity .3s ease ${d}ms, transform .3s cubic-bezier(.34,1.3,.64,1) ${d}ms` });

  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:300,color:"var(--muted)" }}>Loading…</div>;

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes popIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
        @keyframes badgeEarn{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
        .badge-card:hover{transform:translateY(-5px) scale(1.02) !important;border-color:rgba(79,142,247,.4) !important;}
        .cat-btn:hover{transform:translateY(-1px);}
      `}</style>

      <div style={{ maxWidth:900 }}>

        {/* ── Level Hero ── */}
        <div style={{ ...fadeUp(0), borderRadius:22, padding:28, marginBottom:22, position:"relative", overflow:"hidden",
          background:"var(--card)",
          border:"1px solid var(--border)",
          boxShadow:"0 4px 20px rgba(0,0,0,.12)"
        }}>
          <div style={{ position:"absolute",right:-40,top:-40,width:240,height:240,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,166,35,.12) 0%,transparent 70%)",pointerEvents:"none" }}/>
          <div style={{ position:"absolute",left:80,bottom:-60,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(79,142,247,.08) 0%,transparent 70%)",pointerEvents:"none" }}/>

          <div style={{ display:"flex",alignItems:"center",gap:22,position:"relative",marginBottom:20 }}>
            <div style={{ width:80,height:80,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,background:"linear-gradient(135deg,#F5A623,#F87171)",boxShadow:"0 8px 28px rgba(245,166,35,.4)",flexShrink:0 }}>
              ⭐
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4 }}>Current Level</div>
              <div style={{ fontFamily:"var(--font-lora),serif",fontSize:42,color:"#fff",fontWeight:700,lineHeight:1,textShadow:"0 0 30px rgba(245,166,35,.3)" }}>
                Level {level}
              </div>
              <div style={{ color:"var(--muted)",fontSize:14,marginTop:6 }}>
                {animXp} XP total · {500-xpInLevel} XP to Level {level+1}
              </div>
            </div>
            {/* Streak */}
            <div style={{ textAlign:"center",background:"rgba(245,166,35,.1)",borderRadius:18,padding:"16px 22px",border:"1px solid rgba(245,166,35,.2)",flexShrink:0 }}>
              <div style={{ fontSize:36 }}>🔥</div>
              <div style={{ color:"#F5A623",fontWeight:900,fontSize:28,textShadow:"0 0 16px rgba(245,166,35,.6)" }}>{animStreak}</div>
              <div style={{ color:"var(--muted)",fontSize:11,marginTop:3,fontWeight:600 }}>day streak</div>
            </div>
          </div>

          {/* XP bar */}
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:11,color:"var(--muted)",fontWeight:600 }}>
              <span>Level {level}</span>
              <span>{xpInLevel}/500 XP</span>
              <span>Level {level+1}</span>
            </div>
            <div style={{ background:"var(--bg)",borderRadius:8,height:12,overflow:"hidden" }}>
              <div style={{ height:"100%",background:"linear-gradient(90deg,#F5A623,#F87171,#A78BFA)",backgroundSize:"200%",borderRadius:8,width:`${(xpInLevel/500)*100}%`,transition:"width 1s cubic-bezier(.4,0,.2,1)",animation:"shimmer 2s linear infinite",boxShadow:"0 0 12px rgba(245,166,35,.4)" }}/>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
          {[
            ["🔥","Streak",    `${animStreak}d`, "#F5A623", 80 ],
            ["⚡","Total XP",  animXp,           "#4F8EF7", 130],
            ["🎯","Level",     level,            "#A78BFA", 180],
            ["🏅","Badges",    `${earned}/${badges.length}`,"#34D399",230],
          ].map(([ico,lbl,val,color,delay]) => (
            <div key={lbl as string} style={{ ...fadeUp(delay as number),
              borderRadius:18,padding:18,textAlign:"center",
              background:"var(--card)",
              border:`1px solid ${(color as string)}22`,
              
              boxShadow:`0 4px 20px rgba(0,0,0,.3), 0 0 40px ${(color as string)}11`,
              transition:"transform .2s cubic-bezier(.34,1.3,.64,1)",
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-5px) scale(1.02)"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0) scale(1)"}}>
              <div style={{ fontSize:28,marginBottom:8 }}>{ico}</div>
              <div style={{ fontSize:24,fontWeight:900,color:color as string,textShadow:`0 0 16px ${color}66` }}>{val}</div>
              <div style={{ fontSize:12,color:"var(--muted)",marginTop:5,fontWeight:600 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Streak Milestones ── */}
        <div style={{ ...fadeUp(280), borderRadius:18,padding:20,marginBottom:22,border:"1px solid rgba(245,166,35,.15)",background:"var(--card)",backdropFilter:"blur(8px)" }}>
          <h3 style={{ fontFamily:"var(--font-lora),serif",fontSize:17,color:"var(--text)",marginBottom:16 }}>🔥 Streak Milestones</h3>
          <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            {[[3,"3 Days","50 XP"],[7,"7 Days","100 XP"],[14,"14 Days","200 XP"],[30,"30 Days","500 XP"]].map(([days,lbl,reward]) => {
              const done = streak >= Number(days);
              return (
                <div key={days as number} style={{ flex:1,minWidth:110,padding:"14px 16px",borderRadius:14,textAlign:"center",
                  border:`2px solid ${done?"#F5A623":"var(--border)"}`,
                  background:done?"rgba(245,166,35,.1)":"var(--bg)",
                  boxShadow:done?"0 0 20px rgba(245,166,35,.2)":"none",
                  transition:"all .3s",
                  animation:done?`popIn .4s ease both`:"none",
                }}>
                  <div style={{ fontSize:22,marginBottom:6 }}>{done?"🔥":"🔒"}</div>
                  <div style={{ fontWeight:800,fontSize:14,color:done?"#F5A623":"var(--muted)" }}>{lbl}</div>
                  <div style={{ fontSize:12,color:done?"#34D399":"var(--muted)",marginTop:3,fontWeight:600 }}>{reward}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Category Filter ── */}
        <div style={{ ...fadeUp(320), display:"flex",gap:7,marginBottom:18,flexWrap:"wrap" }}>
          {CATS.map(cat => (
            <button key={cat} className="cat-btn" onClick={() => setCatFilter(cat)} style={{
              padding:"7px 16px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
              border:`1px solid ${catFilter===cat?"#4F8EF7":"var(--border)"}`,
              background:catFilter===cat?"rgba(79,142,247,.15)":"transparent",
              color:catFilter===cat?"#4F8EF7":"var(--muted)",
              boxShadow:catFilter===cat?"0 0 12px rgba(79,142,247,.3)":"none",
              transition:"all .2s",
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── Badges Grid ── */}
        <h3 style={{ ...fadeUp(350), fontFamily:"var(--font-lora),serif",fontSize:20,color:"var(--text)",marginBottom:16 }}>
          Badges — {earned}/{badges.length} earned
        </h3>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16 }}>
          {filtered.map((badge, i) => (
            <div key={badge.id} className="badge-card" style={{
              borderRadius:18,padding:22,
              border:`1px solid ${badge.earned?"rgba(79,142,247,.25)":"var(--border)"}`,
              background:badge.earned
                ?"var(--card)"
                :"var(--bg)",
              
              opacity:badge.earned?1:.5,
              position:"relative",
              transition:"all .25s cubic-bezier(.34,1.3,.64,1)",
              boxShadow:badge.earned?"0 4px 24px rgba(0,0,0,.3)":"none",
              animation:`popIn .3s ease ${Math.min(i,11)*40}ms both`,
            }}>
              {badge.earned && (
                <div style={{ position:"absolute",top:12,right:12,width:22,height:22,borderRadius:"50%",background:"#34D399",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(52,211,153,.5)" }}>
                  <Check size={13} color="#fff"/>
                </div>
              )}
              {/* Category tag */}
              <div style={{ position:"absolute",top:12,left:12,fontSize:9,padding:"2px 8px",borderRadius:20,background:"rgba(79,142,247,.15)",color:"#4F8EF7",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em" }}>
                {badge.category}
              </div>

              <div style={{ fontSize:38,marginBottom:10,marginTop:18 }}>{badge.icon}</div>
              <h4 style={{ fontWeight:800,fontSize:15,color:"var(--text)",marginBottom:5 }}>{badge.name}</h4>
              <p style={{ fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5 }}>{badge.desc}</p>

              {/* Progress bar */}
              <div style={{ background:"var(--bg)",borderRadius:4,height:5,overflow:"hidden",marginBottom:8 }}>
                <div style={{ height:"100%",background:badge.earned?"linear-gradient(90deg,#34D399,#10B981)":"linear-gradient(90deg,#4F8EF7,#6366F1)",borderRadius:4,width:badge.earned?"100%":"35%",transition:"width .8s ease",boxShadow:badge.earned?"0 0 8px rgba(52,211,153,.5)":"none" }}/>
              </div>

              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:11,color:badge.earned?"#34D399":"var(--muted)",fontWeight:700 }}>
                  {badge.earned?"✅ Earned!":"🔒 "+badge.progress}
                </span>
                {badge.xpReward > 0 && (
                  <span style={{ fontSize:11,padding:"2px 9px",borderRadius:20,background:"rgba(245,166,35,.15)",color:"#F5A623",fontWeight:700 }}>
                    +{badge.xpReward} XP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
