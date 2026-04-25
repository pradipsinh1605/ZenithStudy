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

  // ✅ FIXED Google Login
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://study-buddy-ai-lake.vercel.app/dashboard",
        },
      });

      if (error) {
        console.error(error);
        toast.error(error.message);
      }
    } catch (err) {
      console.error(err);
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
    else { toast.success("Welcome back! 🎉"); router.push("/dashboard"); }
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
      {/* UI SAME */}
    </div>
  );
}