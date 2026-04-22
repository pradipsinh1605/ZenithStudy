"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted,  setMounted]  = useState(false);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        toast.success("Welcome back! 👋");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "var(--font-sora), sans-serif",
    }}>
      {/* Left Hero */}
      <div style={{
        flex: 1,
        background: "linear-gradient(145deg,#0A1628 0%,#0E2448 50%,#152C5A 100%)",
        padding: 48, display: "flex", flexDirection: "column",
        justifyContent: "space-between", position: "relative",
        overflow: "hidden",
      }}
        className="hidden lg:flex">
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(79,142,247,.15) 0%,transparent 70%)",
        }}/>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:60 }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background:"linear-gradient(135deg,#4F8EF7,#A78BFA)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <BookOpen size={22} color="#fff"/>
            </div>
            <span style={{ color:"#fff", fontSize:22, fontWeight:800 }}>
              StudyBuddy AI
            </span>
          </div>
          <h1 style={{
            fontFamily:"var(--font-lora),serif",
            fontSize:42, color:"#fff", lineHeight:1.2, marginBottom:20,
          }}>
            Your Academic<br/>
            <em style={{ color:"#4F8EF7", fontStyle:"normal" }}>Success Hub</em>
          </h1>
          <p style={{ color:"rgba(255,255,255,.6)", fontSize:15, lineHeight:1.7, maxWidth:380 }}>
            AI-powered study platform. Organize, track, collaborate and get 24/7 AI tutoring.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[
            ["📚","Smart Notes","Rich editor + AI summaries"],
            ["⏱️","Focus Timer","Pomodoro & tracking"],
            ["📊","Progress","Visual analytics"],
            ["🤖","AI Tutor","Dify-powered 24/7"],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{
              background:"rgba(255,255,255,.06)", borderRadius:14,
              padding:16, border:"1px solid rgba(255,255,255,.1)",
            }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ color:"#fff", fontWeight:600, fontSize:13, marginBottom:4 }}>
                {title}
              </div>
              <div style={{ color:"rgba(255,255,255,.5)", fontSize:11 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form */}
      <div style={{
        width: "100%", maxWidth: 460,
        background: "var(--surface)",
        padding: "48px 40px",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:40 }}>
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 12px", borderRadius:10, cursor:"pointer",
                border:"1px solid var(--border)", background:"var(--border)",
                color:"var(--muted)", fontSize:13, fontFamily:"inherit",
              }}>
              {theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          )}
        </div>

        <div>
          {/* Mobile logo */}
          <div style={{
            display:"flex", alignItems:"center", gap:10, marginBottom:24,
          }}
            className="lg:hidden">
            <div style={{
              width:36, height:36, borderRadius:10,
              background:"linear-gradient(135deg,#4F8EF7,#A78BFA)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <BookOpen size={18} color="#fff"/>
            </div>
            <span style={{ fontWeight:800, fontSize:18, color:"var(--text)" }}>
              StudyBuddy AI
            </span>
          </div>

          <h2 style={{
            fontFamily:"var(--font-lora),serif",
            fontSize:30, marginBottom:8, color:"var(--text)",
          }}>
            Welcome back!
          </h2>
          <p style={{ color:"var(--muted)", fontSize:14, marginBottom:32 }}>
            Sign in to continue your journey
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom:16 }}>
              <label style={{
                display:"block", fontSize:12, fontWeight:600,
                textTransform:"uppercase", letterSpacing:".05em",
                color:"var(--muted)", marginBottom:6,
              }}>Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" required
                style={{
                  width:"100%", borderRadius:12, padding:"11px 14px",
                  fontSize:14, fontFamily:"inherit", outline:"none",
                  border:"1px solid var(--border)",
                  background:"var(--bg)", color:"var(--text)",
                }}/>
            </div>

            {/* Password */}
            <div style={{ marginBottom:8, position:"relative" }}>
              <label style={{
                display:"block", fontSize:12, fontWeight:600,
                textTransform:"uppercase", letterSpacing:".05em",
                color:"var(--muted)", marginBottom:6,
              }}>Password</label>
              <input
                type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width:"100%", borderRadius:12, padding:"11px 44px 11px 14px",
                  fontSize:14, fontFamily:"inherit", outline:"none",
                  border:"1px solid var(--border)",
                  background:"var(--bg)", color:"var(--text)",
                }}/>
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position:"absolute", right:12, top:38,
                  background:"none", border:"none", cursor:"pointer",
                  color:"var(--muted)", display:"flex",
                }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            <div style={{ textAlign:"right", marginBottom:24 }}>
              <span style={{ color:"#4F8EF7", fontSize:13, cursor:"pointer", fontWeight:600 }}>
                Forgot password?
              </span>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width:"100%", padding:"13px 0", borderRadius:12,
                border:"none", cursor: loading ? "not-allowed" : "pointer",
                background:"linear-gradient(135deg,#4F8EF7,#6366F1)",
                color:"#fff", fontWeight:700, fontSize:15,
                fontFamily:"inherit", opacity: loading ? .8 : 1,
                marginBottom:16, transition:"all .2s",
              }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div style={{ position:"relative", textAlign:"center", marginBottom:16 }}>
            <div style={{ height:1, background:"var(--border)" }}/>
            <span style={{
              position:"absolute", top:-9, left:"50%",
              transform:"translateX(-50%)",
              background:"var(--surface)", padding:"0 12px",
              color:"var(--muted)", fontSize:12,
            }}>or</span>
          </div>

          <button onClick={handleGoogle}
            style={{
              width:"100%", padding:"11px 0", borderRadius:12,
              border:"1px solid var(--border)", cursor:"pointer",
              background:"var(--bg)", color:"var(--text)",
              fontWeight:600, fontSize:14, fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center",
              gap:8, marginBottom:28,
            }}>
            <span style={{ fontSize:18 }}>G</span> Continue with Google
          </button>

          <p style={{ textAlign:"center", color:"var(--muted)", fontSize:14 }}>
            No account?{" "}
            <Link href="/auth/signup"
              style={{ color:"#4F8EF7", fontWeight:700, textDecoration:"none" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
