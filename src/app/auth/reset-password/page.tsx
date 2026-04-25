"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) { toast.error("Fill all fields!"); return; }
    if (password !== confirm) { toast.error("Passwords don't match!"); return; }
    if (password.length < 6) { toast.error("Min 6 characters!"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { setDone(true); toast.success("Password updated! 🎉"); setTimeout(() => router.push("/auth/login"), 2000); }
    setLoading(false);
  };

  const inputStyle = {
    width:"100%", borderRadius:12, padding:"12px 16px",
    border:"1px solid rgba(79,142,247,.25)",
    background:"rgba(255,255,255,.05)",
    color:"var(--text)", fontSize:14,
    fontFamily:"var(--font-sora),sans-serif", outline:"none",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060D1B", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"var(--font-sora),sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400, background:"linear-gradient(145deg,rgba(14,22,48,.95),rgba(8,14,32,.95))", borderRadius:24, padding:36, border:"1px solid rgba(79,142,247,.2)", boxShadow:"0 24px 80px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <img src="/icon-192.png" alt="logo" style={{ width:60, height:60, borderRadius:14, marginBottom:12 }}/>
          <h2 style={{ fontFamily:"var(--font-lora),serif", fontSize:22, color:"#fff", fontWeight:700 }}>Set New Password</h2>
        </div>
        {done ? (
          <div style={{ textAlign:"center", padding:20 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <h3 style={{ color:"#34D399", fontWeight:700, marginBottom:8 }}>Password Updated!</h3>
            <p style={{ fontSize:13, color:"rgba(232,240,254,.4)" }}>Redirecting to login...</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input type="password" placeholder="New Password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/>
            <input type="password" placeholder="Confirm Password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleReset(); }} style={inputStyle}/>
            <button onClick={handleReset} disabled={loading}
              style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", fontWeight:700, fontSize:14, boxShadow:"0 4px 16px rgba(79,142,247,.35)" }}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
