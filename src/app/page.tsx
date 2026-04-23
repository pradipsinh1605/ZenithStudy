"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push("/dashboard");
    })();
  }, []);

  const f = (d = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(24px)",
    transition: ,
  });

  const FEATURES = [
    { icon:"📝", title:"Smart Notes",     desc:"Rich notes with AI summaries",           color:"#4F8EF7" },
    { icon:"🤖", title:"AI Tutor",        desc:"24/7 AI with visual diagrams",           color:"#A78BFA" },
    { icon:"⏱️", title:"Focus Timer",     desc:"Pomodoro with XP rewards",              color:"#34D399" },
    { icon:"📅", title:"Timetable",       desc:"Smart weekly class schedule",           color:"#F5A623" },
    { icon:"⚡", title:"Flashcards",      desc:"Quiz mode with flip cards",             color:"#F87171" },
    { icon:"🏆", title:"Achievements",    desc:"XP, streaks and badges",               color:"#22D3EE" },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(79,142,247,.4)} 50%{box-shadow:0 0 0 16px rgba(79,142,247,0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .feat-card:hover   { transform:translateY(-8px) scale(1.02)!important; border-color:rgba(79,142,247,.4)!important; }
        .cta-btn:hover     { transform:translateY(-4px) scale(1.03)!important; box-shadow:0 20px 60px rgba(79,142,247,.6)!important; }
        .sign-btn:hover    { background:rgba(255,255,255,.12)!important; transform:translateY(-2px)!important; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#060D1B", color:"#E2EAF8", fontFamily:"var(--font-sora),sans-serif", overflowX:"hidden" }}>

        {/* Nav */}
        <nav style={{ position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 40px", background:"rgba(6,13,27,.85)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(79,142,247,.1)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/icon-192.png" alt="logo" style={{ width:36, height:36, borderRadius:10 }}/>
            <span style={{ fontWeight:800, fontSize:18, color:"#fff" }}>StudyBuddy AI</span>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="sign-btn" onClick={()=>router.push("/auth/login")}
              style={{ padding:"9px 22px", borderRadius:12, border:"1px solid rgba(255,255,255,.15)", background:"transparent", color:"#E2EAF8", cursor:"pointer", fontFamily:"var(--font-sora),sans-serif", fontWeight:600, fontSize:13, transition:"all .2s" }}>
              Sign In
            </button>
            <button className="cta-btn" onClick={()=>router.push("/auth/login")}
              style={{ padding:"9px 22px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:"pointer", fontFamily:"var(--font-sora),sans-serif", fontWeight:700, fontSize:13, boxShadow:"0 4px 16px rgba(79,142,247,.35)", transition:"all .2s" }}>
              Get Started Free →
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth:1000, margin:"0 auto", padding:"80px 24px 60px", textAlign:"center" }}>

          {/* Badge */}
          <div style={{ ...f(0), display:"inline-flex", alignItems:"center", gap:8, padding:"7px 20px", borderRadius:30, background:"rgba(79,142,247,.1)", border:"1px solid rgba(79,142,247,.25)", fontSize:12, fontWeight:700, color:"#7FB3FF", marginBottom:32 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#34D399", display:"inline-block", animation:"pulse 2s infinite" }}/>
            AI-Powered · Free to Start · No Credit Card
          </div>

          {/* Logo */}
          <div style={{ ...f(100), marginBottom:28 }}>
            <img src="/icon-192.png" alt="StudyBuddy AI" style={{ width:100, height:100, borderRadius:24, boxShadow:"0 16px 48px rgba(79,142,247,.4)", animation:"float 4s ease-in-out infinite" }}/>
          </div>

          {/* Heading */}
          <h1 style={{ ...f(200), fontFamily:"var(--font-lora),serif", fontSize:"clamp(36px,6vw,68px)", lineHeight:1.1, fontWeight:700, marginBottom:22, color:"#fff" }}>
            Study Smarter with<br/>
            <span style={{ background:"linear-gradient(135deg,#4F8EF7,#A78BFA,#34D399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200%", animation:"shimmer 4s linear infinite" }}>
              AI by Your Side
            </span>
          </h1>

          <p style={{ ...f(300), fontSize:17, color:"rgba(232,240,254,.5)", maxWidth:480, margin:"0 auto 44px", lineHeight:1.9, fontWeight:300 }}>
            Notes · Planner · Flashcards · Focus Timer · AI Tutor with Visual Diagrams · XP & Achievements
          </p>

          {/* CTA Buttons */}
          <div style={{ ...f(400), display:"flex", gap:14, justifyContent:"center", marginBottom:60, flexWrap:"wrap" }}>
            <button className="cta-btn" onClick={()=>router.push("/auth/login")}
              style={{ padding:"16px 44px", borderRadius:16, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:"pointer", fontFamily:"var(--font-sora),sans-serif", fontWeight:800, fontSize:16, boxShadow:"0 8px 32px rgba(79,142,247,.4)", transition:"all .3s", animation:"pulse 3s infinite" }}>
              🚀 Start for Free
            </button>
            <button className="sign-btn" onClick={()=>router.push("/auth/login")}
              style={{ padding:"16px 36px", borderRadius:16, border:"1px solid rgba(255,255,255,.12)", background:"rgba(255,255,255,.05)", color:"#E2EAF8", cursor:"pointer", fontFamily:"var(--font-sora),sans-serif", fontWeight:600, fontSize:16, transition:"all .2s" }}>
              Sign In →
            </button>
          </div>

          {/* Stats */}
          <div style={{ ...f(500), display:"flex", gap:32, justifyContent:"center", marginBottom:72, flexWrap:"wrap" }}>
            {[["10,000+","Students","#4F8EF7"],["50,000+","Tasks Done","#34D399"],["99%","Satisfaction","#F5A623"]].map(([n,l,c])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:900, color:c as string, textShadow: }}>{n}</div>
                <div style={{ fontSize:12, color:"rgba(232,240,254,.4)", marginTop:3, fontWeight:600 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(79,142,247,.4),rgba(167,139,250,.4),transparent)", marginBottom:72 }}/>

          {/* Features */}
          <h2 style={{ ...f(0), fontFamily:"var(--font-lora),serif", fontSize:"clamp(24px,4vw,40px)", fontWeight:700, marginBottom:14, color:"#fff" }}>
            Everything you need to excel
          </h2>
          <p style={{ ...f(100), fontSize:14, color:"rgba(232,240,254,.4)", marginBottom:40 }}>
            One platform for all your academic needs
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:72 }}>
            {FEATURES.map(({ icon, title, desc, color }, i) => (
              <div key={title} className="feat-card" style={{
                ...f(i*80),
                padding:"24px 22px", borderRadius:20,
                background:"linear-gradient(145deg,rgba(14,22,48,.9),rgba(8,14,32,.9))",
                border:,
                transition:"all .3s cubic-bezier(.34,1.3,.64,1)",
                cursor:"default", textAlign:"left",
              }}>
                <div style={{ width:52, height:52, borderRadius:14, background:, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:14, transition:"transform .3s" }}>
                  {icon}
                </div>
                <h3 style={{ fontWeight:700, fontSize:16, color:"#fff", marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:"rgba(232,240,254,.4)", lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA bottom */}
          <div style={{ padding:"60px 24px", background:"rgba(79,142,247,.05)", borderRadius:24, border:"1px solid rgba(79,142,247,.15)", marginBottom:48 }}>
            <h2 style={{ fontFamily:"var(--font-lora),serif", fontSize:"clamp(24px,4vw,40px)", fontWeight:700, marginBottom:14, color:"#fff" }}>
              Ready to transform your studies?
            </h2>
            <p style={{ fontSize:14, color:"rgba(232,240,254,.4)", marginBottom:32 }}>
              Join thousands of students achieving more with StudyBuddy AI
            </p>
            <button className="cta-btn" onClick={()=>router.push("/auth/login")}
              style={{ padding:"18px 56px", borderRadius:18, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1,#A78BFA)", color:"#fff", cursor:"pointer", fontFamily:"var(--font-sora),sans-serif", fontWeight:800, fontSize:18, boxShadow:"0 8px 40px rgba(79,142,247,.5)", transition:"all .3s", animation:"pulse 3s infinite" }}>
              🎓 Start Free — No Credit Card
            </button>
            <p style={{ fontSize:12, color:"rgba(232,240,254,.25)", marginTop:14 }}>
              2 minute setup · Cancel anytime
            </p>
          </div>

          {/* Footer */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, paddingTop:24, borderTop:"1px solid rgba(79,142,247,.08)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src="/icon-192.png" alt="logo" style={{ width:28, height:28, borderRadius:8 }}/>
              <span style={{ fontWeight:700, fontSize:14, color:"rgba(232,240,254,.6)" }}>StudyBuddy AI</span>
            </div>
            <p style={{ fontSize:12, color:"rgba(232,240,254,.2)" }}>© 2026 StudyBuddy AI · Made with ❤️</p>
            <p style={{ fontSize:12, color:"rgba(232,240,254,.2)" }}>Smarter Study. Better You.</p>
          </div>
        </div>
      </div>
    </>
  );
}
