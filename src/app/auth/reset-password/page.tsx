"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validate } from "@/lib/validation";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState<boolean|null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
      if (!session) toast.error("Invalid or expired reset link. Please request a new one.");
    })();
  }, []);

  const handleReset = async () => {
    const passErr = validate.password(password);
    if (passErr) { toast.error(passErr); return; }
    if (password !== confirm) { toast.error("Passwords don't match!"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setDone(true);
    toast.success("Password updated! 🎉");
    setTimeout(() => router.push("/auth/login"), 2000);
    setLoading(false);
  };

  const inputStyle = {
    width:"100%", borderRadius:12, padding:"12px 16px",
    border:"1px solid rgba(79,142,247,.25)",
    background:"rgba(255,255,255,.05)",
    color:"white", fontSize:14, outline:"none",
    fontFamily:"var(--font-sora),sans-serif",
    boxSizing:"border-box" as const,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060D1B", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:400, background:"linear-gradient(145deg,rgba(14,22,48,.95),rgba(8,14,32,.95))", borderRadius:24, padding:36, border:"1px solid rgba(79,142,247,.2)", boxShadow:"0 24px 80px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
          <h1 style={{ fontFamily:"var(--font-lora),serif", fontSize:22, color:"#fff", fontWeight:700 }}>Reset Password</h1>
        </div>

        {validSession === null && (
          <div style={{ textAlign:"center", color:"rgba(232,240,254,.4)", fontSize:14 }}>Verifying link...</div>
        )}

        {validSession === false && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>❌</div>
            <p style={{ color:"#F87171", fontSize:14, marginBottom:20 }}>This reset link is invalid or has expired.</p>
            <button onClick={() => router.push("/auth/login")}
              style={{ padding:"10px 24px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
              Back to Login
            </button>
          </div>
        )}

        {validSession === true && !done && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input type="password" placeholder="New password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/>
            <input type="password" placeholder="Confirm new password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleReset(); }} style={inputStyle}/>
            <button onClick={handleReset} disabled={loading}
              style={{ padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", fontWeight:700, fontSize:14, opacity:loading?.7:1 }}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}

        {done && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <p style={{ color:"#34D399", fontWeight:700, fontSize:16 }}>Password updated!</p>
            <p style={{ color:"rgba(232,240,254,.4)", fontSize:13, marginTop:8 }}>Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}
