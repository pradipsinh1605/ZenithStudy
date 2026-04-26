"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login"|"signup"|"forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Google Login
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Google login failed");
    }
    setGoogleLoading(false);
  };

  // Email Login
  const handleLogin = async () => {
    if (!email || !password) { toast.error("Fill all fields!"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else { toast.success("Welcome back! 🎉"); router.refresh(); router.push("/dashboard"); }
    setLoading(false);
  };

  // Signup
  const handleSignup = async () => {
    if (!email || !password || !name) { toast.error("Fill all fields!"); return; }
    if (password.length < 6) { toast.error("Password min 6 characters!"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({ user_id: data.user.id, name, edu_level: "Student" });
      await supabase.from("user_xp").upsert({ user_id: data.user.id, total_xp: 0, level: 1, streak: 0 });
      toast.success("Account created! Welcome! 🎉");
      router.refresh();
      router.push("/dashboard");
    }
    setLoading(false);
  };

  // Forgot Password
  const handleForgot = async () => {
    if (!email) { toast.error("Enter your email!"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/reset-password",
    });
    if (error) toast.error(error.message);
    else { setForgotSent(true); toast.success("Reset link sent! Check email 📧"); }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", borderRadius: 12, padding: "12px 16px",
    border: "1px solid rgba(79,142,247,.25)",
    background: "rgba(255,255,255,.05)",
    color: "var(--text)", fontSize: 14,
    fontFamily: "var(--font-sora),sans-serif",
    outline: "none", transition: "border-color .2s",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060D1B", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"var(--font-sora),sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .login-card { animation: fadeUp .4s ease; }
        input:focus { border-color: #4F8EF7 !important; box-shadow: 0 0 0 3px rgba(79,142,247,.1); }
        .g-btn:hover { background: rgba(255,255,255,.12) !important; transform: translateY(-1px); }
        .submit-btn:hover { transform: translateY(-2px) !important; filter: brightness(1.1); }
        .tab:hover { color: #4F8EF7 !important; }
      `}</style>

      <div className="login-card" style={{ width:"100%", maxWidth:420, background:"linear-gradient(145deg,rgba(14,22,48,.95),rgba(8,14,32,.95))", borderRadius:24, padding:36, border:"1px solid rgba(79,142,247,.2)", boxShadow:"0 24px 80px rgba(0,0,0,.5)" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <img src="/icon-192.png" alt="logo" style={{ width:64, height:64, borderRadius:16, marginBottom:12, boxShadow:"0 8px 24px rgba(79,142,247,.3)" }}/>
          <h1 style={{ fontFamily:"var(--font-lora),serif", fontSize:24, color:"#fff", fontWeight:700, marginBottom:4 }}>StudyBuddy AI</h1>
          <p style={{ fontSize:13, color:"rgba(232,240,254,.4)" }}>Smarter Study. Better You.</p>
        </div>

        {/* Tabs — only for login/signup */}
        {mode !== "forgot" && (
          <div style={{ display:"flex", background:"rgba(255,255,255,.05)", borderRadius:12, padding:4, marginBottom:24 }}>
            {(["login","signup"] as const).map(m => (
              <button key={m} className="tab" onClick={() => setMode(m)} style={{
                flex:1, padding:"9px", borderRadius:10, border:"none", cursor:"pointer",
                fontFamily:"var(--font-sora),sans-serif", fontSize:13, fontWeight:700,
                background: mode===m ? "linear-gradient(135deg,#4F8EF7,#6366F1)" : "transparent",
                color: mode===m ? "#fff" : "rgba(232,240,254,.4)",
                boxShadow: mode===m ? "0 4px 12px rgba(79,142,247,.3)" : "none",
                transition: "all .2s",
                textTransform: "capitalize",
              }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
        )}

        {/* Forgot Password Mode */}
        {mode === "forgot" && (
          <div>
            <button onClick={() => { setMode("login"); setForgotSent(false); }} style={{ background:"none", border:"none", color:"#4F8EF7", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", marginBottom:16, display:"flex", alignItems:"center", gap:5 }}>
              ← Back to Sign In
            </button>
            <h2 style={{ fontFamily:"var(--font-lora),serif", fontSize:20, color:"#fff", fontWeight:700, marginBottom:8 }}>Reset Password</h2>
            <p style={{ fontSize:13, color:"rgba(232,240,254,.4)", marginBottom:20 }}>Enter your email and we'll send a reset link</p>

            {forgotSent ? (
              <div style={{ textAlign:"center", padding:24 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📧</div>
                <h3 style={{ color:"#34D399", fontWeight:700, marginBottom:8 }}>Email Sent!</h3>
                <p style={{ fontSize:13, color:"rgba(232,240,254,.4)", lineHeight:1.7 }}>Check your inbox and click the reset link</p>
                <button onClick={() => { setMode("login"); setForgotSent(false); }} style={{ marginTop:20, padding:"10px 24px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <input type="email" placeholder="Your email address" value={email} onChange={e=>setEmail(e.target.value)}
                  style={inputStyle} onFocus={e=>{e.target.style.borderColor="#4F8EF7"}} onBlur={e=>{e.target.style.borderColor="rgba(79,142,247,.25)"}}/>
                <button className="submit-btn" onClick={handleForgot} disabled={loading}
                  style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", fontWeight:700, fontSize:14, transition:"all .2s", opacity:loading?.7:1 }}>
                  {loading ? "Sending..." : "📧 Send Reset Link"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login / Signup Form */}
        {mode !== "forgot" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Google Button */}
            <button className="g-btn" onClick={handleGoogle} disabled={googleLoading}
              style={{ width:"100%", padding:"12px", borderRadius:12, border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.05)", color:"#E2EAF8", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
              </svg>
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,.1)" }}/>
              <span style={{ fontSize:12, color:"rgba(232,240,254,.3)" }}>or</span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,.1)" }}/>
            </div>

            {/* Name field (signup only) */}
            {mode === "signup" && (
              <input type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)}
                style={inputStyle} onFocus={e=>{e.target.style.borderColor="#4F8EF7"}} onBlur={e=>{e.target.style.borderColor="rgba(79,142,247,.25)"}}/>
            )}

            <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}
              style={inputStyle} onFocus={e=>{e.target.style.borderColor="#4F8EF7"}} onBlur={e=>{e.target.style.borderColor="rgba(79,142,247,.25)"}}/>

            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") mode==="login"?handleLogin():handleSignup(); }}
              style={inputStyle} onFocus={e=>{e.target.style.borderColor="#4F8EF7"}} onBlur={e=>{e.target.style.borderColor="rgba(79,142,247,.25)"}}/>

            {/* Forgot Password link */}
            {mode === "login" && (
              <button onClick={() => setMode("forgot")} style={{ background:"none", border:"none", color:"#4F8EF7", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", textAlign:"right", padding:0 }}>
                Forgot Password?
              </button>
            )}

            {/* Submit */}
            <button className="submit-btn" onClick={mode==="login"?handleLogin:handleSignup} disabled={loading}
              style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", fontWeight:700, fontSize:14, transition:"all .2s", opacity:loading?.7:1, marginTop:4, boxShadow:"0 4px 16px rgba(79,142,247,.35)" }}>
              {loading ? "Please wait..." : mode==="login" ? "Sign In →" : "Create Account →"}
            </button>

            {mode === "signup" && (
              <p style={{ fontSize:11, color:"rgba(232,240,254,.25)", textAlign:"center" }}>
                By signing up, you agree to our Terms & Privacy Policy
              </p>
            )}
          </div>
        )}

        {/* Back to home */}
        <div style={{ textAlign:"center", marginTop:20 }}>
          <button onClick={() => router.push("/")} style={{ background:"none", border:"none", color:"rgba(232,240,254,.3)", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
