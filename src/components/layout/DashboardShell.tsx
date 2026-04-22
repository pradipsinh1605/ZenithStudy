"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Calendar, CheckSquare, FileText, Layers, Timer,
  BarChart2, Brain, Trophy, User, Settings, LogOut,
  BookOpen, Menu, X, Moon, Sun, Bell, CheckCircle2,
  AlertCircle, Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { onXPUpdate } from "@/lib/xp-utils";
import PageTransition from "@/components/ui/PageTransition";

const NAV = [
  { href:"/dashboard",    icon:Home,        label:"Dashboard"    },
  { href:"/timetable",    icon:Calendar,    label:"Timetable"    },
  { href:"/planner",      icon:CheckSquare, label:"Planner"      },
  { href:"/notes",        icon:FileText,    label:"Notes"        },
  { href:"/flashcards",   icon:Layers,      label:"Flashcards"   },
  { href:"/timer",        icon:Timer,       label:"Focus Timer"  },
  { href:"/progress",     icon:BarChart2,   label:"Progress"     },
  { href:"/ai",           icon:Brain,       label:"AI Tutor"     },
  { href:"/achievements", icon:Trophy,      label:"Achievements" },
  { href:"/profile",      icon:User,        label:"My Profile"   },
  { href:"/settings",     icon:Settings,    label:"Settings"     },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const bellRef  = useRef<HTMLDivElement>(null);

  const [open,    setOpen]    = useState(true);
  const [mounted, setMounted] = useState(false);
  const [name,    setName]    = useState("Student");
  const [xp,      setXp]      = useState(0);
  const [streak,  setStreak]  = useState(0);
  const [eduLevel,setEduLevel]= useState("");
  const [tasks,   setTasks]   = useState<any[]>([]);
  const [tt,      setTt]      = useState<any[]>([]);
  const [bellOpen,setBellOpen]= useState(false);
  const [uid,     setUid]     = useState("");
  const [navLoading, setNavLoading] = useState(false);
  const [navPct,     setNavPct]     = useState(0);

  useEffect(() => {
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  // Nav progress bar
  useEffect(() => {
    setNavLoading(true);
    setNavPct(30);
    const t1 = setTimeout(() => setNavPct(70),  80);
    const t2 = setTimeout(() => setNavPct(100), 200);
    const t3 = setTimeout(() => { setNavLoading(false); setNavPct(0); }, 380);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    fetchUser();
    const fn = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!uid) return;
    return onXPUpdate(() =>
      supabase.from("user_xp").select("total_xp,streak").eq("user_id",uid).single()
        .then(({ data }) => { if(data){ setXp(data.total_xp||0); setStreak(data.streak||0); } })
    );
  }, [uid]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUid(user.id);
      const [{ data:p },{ data:x },{ data:t },{ data:tbl }] = await Promise.all([
        supabase.from("profiles").select("name,edu_level").eq("user_id",user.id).single(),
        supabase.from("user_xp").select("total_xp,streak").eq("user_id",user.id).single(),
        supabase.from("tasks").select("*").eq("user_id",user.id).eq("done",false),
        supabase.from("timetable").select("*").eq("user_id",user.id),
      ]);
      setName(p?.name||user.email?.split("@")[0]||"Student");
      setEduLevel(p?.edu_level||"");
      setXp(x?.total_xp||0); setStreak(x?.streak||0);
      setTasks(t||[]); setTt(tbl||[]);
    } catch(e) { console.error(e); }
  };

  const level    = Math.floor(xp/500)+1;
  const xpInLv   = xp%500;
  const avatar   = name?.[0]?.toUpperCase()??"S";
  const title    = NAV.find(n => pathname===n.href||(n.href!=="/dashboard"&&pathname.startsWith(n.href)))?.label??"Dashboard";
  const today    = new Date().toISOString().slice(0,10);
  const todayDay = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const dueTasks = tasks.filter(t => t.deadline===today);
  const upcoming = tasks.filter(t => t.deadline&&t.deadline>today).slice(0,3);
  const classes  = tt.filter(e => e.day===todayDay);
  const unread   = dueTasks.length+classes.length;
  const logout   = async () => { await supabase.auth.signOut(); window.location.href="/auth/login"; };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes nprogress { 0%{width:0%;opacity:1} 80%{width:90%;opacity:1} 100%{width:100%;opacity:0} }
        .nprogress-bar { position:fixed;top:0;left:0;height:3px;z-index:9999;background:linear-gradient(90deg,#4F8EF7,#A78BFA,#34D399);animation:nprogress .6s ease-out forwards;border-radius:0 2px 2px 0; }
        @keyframes badgePop { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }

        /* Sidebar nav hover */
        .sb-nav:hover {
          background: var(--sidebar-hover) !important;
          color: var(--primary) !important;
        }
        /* Logout hover */
        .sb-logout:hover {
          background: rgba(220,38,38,.08) !important;
          color: var(--danger) !important;
        }
        /* Top icon buttons hover */
        .sb-top-btn:hover {
          background: rgba(79,142,247,.1) !important;
          color: var(--primary) !important;
          transform: scale(1.08) !important;
        }
        /* Theme button extra spin */
        .sb-theme:hover { transform: rotate(22deg) scale(1.1) !important; }

        /* Universal hover card (all pages) */
        .hv-card {
          transition: transform .22s cubic-bezier(.34,1.4,.64,1),
                      box-shadow .22s ease, border-color .22s ease !important;
          will-change: transform;
        }
        .hv-card:hover {
          transform: translateY(-5px) scale(1.02) !important;
          box-shadow: 0 16px 48px rgba(79,142,247,.14), 0 4px 16px rgba(0,0,0,.08) !important;
          border-color: var(--primary) !important;
          opacity: 0.99 !important;
        }
        .hv-lift { transition: transform .2s cubic-bezier(.34,1.4,.64,1) !important; }
        .hv-lift:hover { transform: translateY(-3px) !important; }
      `}</style>

      <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"var(--font-sora),sans-serif", background:"var(--bg)", color:"var(--text)" }}>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SIDEBAR — fully theme-aware
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <aside style={{
          width: open ? 240 : 68,
          display:"flex", flexDirection:"column", flexShrink:0,
          background: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
          transition: "width .3s cubic-bezier(.4,0,.2,1)",
          overflow:"hidden", height:"100vh", position:"sticky", top:0,
        }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:open?"20px 20px 16px":"20px 14px 16px", borderBottom:"1px solid var(--sidebar-border)" }}>
            <div style={{
              width:36, height:36, borderRadius:10, flexShrink:0,
              background:"linear-gradient(135deg,#4F8EF7,#A78BFA)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 0 14px rgba(79,142,247,.3)",
              transition:"transform .35s cubic-bezier(.34,1.56,.64,1)", cursor:"pointer",
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="rotate(12deg) scale(1.12)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="rotate(0) scale(1)"}}>
              <BookOpen size={18} color="#fff"/>
            </div>
            {open && (
              <span style={{ fontWeight:800, fontSize:17, whiteSpace:"nowrap", color:"var(--sidebar-text)" }}>
                StudyBuddy AI
              </span>
            )}
          </div>

          {/* User card */}
          {open && (
            <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--sidebar-border)", background:"var(--sidebar-active)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%", flexShrink:0,
                  background:"linear-gradient(135deg,#4F8EF7,#6366F1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#fff", fontWeight:700, fontSize:14,
                  transition:"transform .2s", cursor:"default",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1)"}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
                  {avatar}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"var(--sidebar-text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
                  <div style={{ fontSize:11, color:"var(--sidebar-muted)" }}>{eduLevel||"Student"} · Lv {level}</div>
                </div>
              </div>
              {/* Animated XP bar */}
              <div style={{ height:6, borderRadius:3, overflow:"hidden", background:"var(--xp-bar)" }}>
                <div style={{
                  height:"100%", borderRadius:3,
                  background:"linear-gradient(90deg,#4F8EF7,#A78BFA,#34D399)",
                  backgroundSize:"200%",
                  width:`${(xpInLv/500)*100}%`,
                  transition:"width .8s cubic-bezier(.4,0,.2,1)",
                  animation:"shimmer 2.5s linear infinite",
                }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ fontSize:10, color:"var(--sidebar-muted)" }}>{xp} XP · {xpInLv}/500</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#F5A623" }}>🔥 {streak}</span>
              </div>
            </div>
          )}

          {/* Nav items */}
          <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
            {NAV.map(({ href, icon:Icon, label }) => {
              const active = pathname===href||(href!=="/dashboard"&&pathname.startsWith(href));
              return (
                <Link key={href} href={href} title={!open?label:""} className="sb-nav"
                  style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding: open ? "10px 12px" : "10px 0",
                    justifyContent: open ? "flex-start" : "center",
                    background: active ? "var(--sidebar-active)" : "transparent",
                    borderRadius:10,
                    color: active ? "var(--primary)" : "var(--sidebar-muted)",
                    fontWeight: active ? 700 : 500,
                    fontSize:13, marginBottom:2,
                    transition:"all .2s", whiteSpace:"nowrap", textDecoration:"none",
                    boxShadow: active ? "0 0 12px rgba(79,142,247,.15)" : "none",
                  }}>
                  <Icon size={18}/>
                  {open && label}
                  {active && open && (
                    <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"var(--primary)", boxShadow:"0 0 8px var(--primary)" }}/>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding:"12px 8px", borderTop:"1px solid var(--sidebar-border)" }}>
            <button onClick={logout} className="sb-logout" style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding: open ? "10px 12px" : "10px 0",
              justifyContent: open ? "flex-start" : "center",
              background:"transparent", border:"none", borderRadius:10,
              color:"var(--sidebar-muted)", cursor:"pointer",
              fontSize:13, whiteSpace:"nowrap", fontFamily:"inherit", transition:"all .2s",
            }}>
              <LogOut size={18}/>{open && "Sign Out"}
            </button>
          </div>
        </aside>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MAIN CONTENT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Header */}
          {/* ─ Nav progress bar ─ */}
          <div style={{ position:"fixed", top:0, left:0, right:0, height:3, zIndex:9999, pointerEvents:"none" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,#4F8EF7,#A78BFA,#34D399)", width:navPct+"%", transition:navLoading?"width .15s ease":"width .3s ease", borderRadius:"0 2px 2px 0", opacity:navLoading?1:0, boxShadow:"0 0 10px rgba(79,142,247,.5)" }}/>
          </div>
          <header style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"16px 24px",
            borderBottom:"1px solid var(--border)",
            background:"var(--surface)",
            position:"sticky", top:0, zIndex:10,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <button onClick={()=>setOpen(!open)} className="sb-top-btn" style={{
                padding:8, borderRadius:10, cursor:"pointer",
                border:"1px solid var(--border)", background:"transparent",
                color:"var(--muted)", display:"flex", transition:"all .2s",
              }}>
                {open ? <X size={18}/> : <Menu size={18}/>}
              </button>
              <div>
                <h1 style={{ fontFamily:"var(--font-lora),serif", fontSize:22, fontWeight:700, color:"var(--text)" }}>
                  {title}
                </h1>
                <p style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>
                  {new Date().toLocaleDateString("en-IN",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}
                </p>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>

              {/* Bell */}
              <div ref={bellRef} style={{ position:"relative" }}>
                <button onClick={()=>setBellOpen(!bellOpen)} className="sb-top-btn" style={{
                  padding:8, borderRadius:10, cursor:"pointer",
                  border:`1px solid ${bellOpen?"var(--primary)":"var(--border)"}`,
                  background:bellOpen?"rgba(79,142,247,.1)":"transparent",
                  color:bellOpen?"var(--primary)":"var(--muted)",
                  display:"flex", position:"relative", transition:"all .2s",
                }}>
                  <Bell size={18}/>
                  {unread > 0 && (
                    <span style={{
                      position:"absolute", top:-5, right:-5,
                      width:18, height:18, borderRadius:"50%",
                      background:"var(--danger)", fontSize:9, color:"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:700, border:"2px solid var(--surface)",
                    }}>{unread > 9 ? "9+" : unread}</span>
                  )}
                </button>

                {bellOpen && (
                  <div style={{
                    position:"absolute", top:50, right:0, width:320,
                    background:"var(--card)", border:"1px solid var(--border)",
                    borderRadius:16, boxShadow:"0 16px 48px rgba(0,0,0,.15)",
                    zIndex:500, overflow:"hidden",
                  }}>
                    <div style={{ padding:"14px 18px 10px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
                      <h4 style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>🔔 Notifications</h4>
                      <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:unread>0?"rgba(220,38,38,.1)":"var(--bg)", color:unread>0?"var(--danger)":"var(--muted)", fontWeight:600 }}>
                        {unread > 0 ? `${unread} new` : "All clear"}
                      </span>
                    </div>

                    <div style={{ maxHeight:340, overflowY:"auto" }}>
                      {classes.length===0&&dueTasks.length===0&&upcoming.length===0 ? (
                        <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>
                          <CheckCircle2 size={36} style={{ margin:"0 auto 10px", opacity:.25 }}/>
                          <p style={{ fontSize:13 }}>All clear! 🎉</p>
                        </div>
                      ) : (
                        <div style={{ padding:"8px 12px" }}>
                          {classes.map((c:any) => (
                            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--bg)", borderRadius:10, marginBottom:6, border:"1px solid var(--border)" }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--primary)" }}/>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{c.subject}</div>
                                <div style={{ fontSize:11, color:"var(--muted)" }}>{c.start_time}–{c.end_time}{c.room?` · ${c.room}`:""}</div>
                              </div>
                            </div>
                          ))}
                          {dueTasks.map((t:any) => (
                            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"rgba(220,38,38,.06)", borderRadius:10, marginBottom:6, border:"1px solid rgba(220,38,38,.15)" }}>
                              <AlertCircle size={14} color="var(--danger)"/>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                                <div style={{ fontSize:11, color:"var(--danger)" }}>Due today · {t.subject||""}</div>
                              </div>
                            </div>
                          ))}
                          {upcoming.map((t:any) => (
                            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--bg)", borderRadius:10, marginBottom:6, border:"1px solid var(--border)" }}>
                              <Clock size={14} color="#F5A623"/>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                                <div style={{ fontSize:11, color:"var(--muted)" }}>📅 {t.deadline}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding:"10px 16px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
                      <Link href="/planner"   onClick={()=>setBellOpen(false)} style={{ fontSize:12, color:"var(--primary)", fontWeight:700, textDecoration:"none" }}>Tasks →</Link>
                      <Link href="/timetable" onClick={()=>setBellOpen(false)} style={{ fontSize:12, color:"var(--primary)", fontWeight:700, textDecoration:"none" }}>Timetable →</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme toggle */}
              {mounted && (
                <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="sb-top-btn sb-theme" style={{
                  padding:8, borderRadius:10, cursor:"pointer",
                  border:"1px solid var(--border)", background:"transparent",
                  color:"var(--muted)", display:"flex", transition:"all .3s",
                }}>
                  {theme==="dark" ? <Sun size={18}/> : <Moon size={18}/>}
                </button>
              )}
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)", color:"var(--text)" }}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </>
  );
}
