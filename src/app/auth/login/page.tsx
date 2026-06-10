"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validate } from "@/lib/validation";
import toast from "react-hot-toast";

const phrase = "Your AI Study Partner";

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [typed, setTyped] = useState("");

  const particles = useMemo(
    () => Array.from({ length: 34 }, (_, index) => ({
      left: (index * 29) % 100,
      top: (index * 47) % 100,
      delay: (index % 8) * 0.35,
      size: 2 + (index % 4),
    })),
    [],
  );

  useEffect(() => {
    if (reduceMotion) {
      setTyped(phrase);
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % (phrase.length + 8);
      setTyped(phrase.slice(0, Math.min(index, phrase.length)));
    }, 85);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const handleSignup = async () => {
    if (loading) return;
    const nameErr = validate.name(name);
    const emailErr = validate.email(email);
    const passErr = validate.password(password);
    if (nameErr) { toast.error(nameErr); return; }
    if (emailErr) { toast.error(emailErr); return; }
    if (passErr) { toast.error(passErr); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from("profiles").upsert({ user_id: data.user.id, name, edu_level: "Student" });
        await supabase.from("user_xp").upsert({ user_id: data.user.id, total_xp: 0, level: 1, streak: 0 });
      }
      toast.success("✅ Account created successfully! Please sign in.");
      setPassword("");
      setName("");
      setMode("login");
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    const emailErr = validate.email(email);
    if (emailErr) { toast.error(emailErr); return; }
    if (!password) { toast.error("Password is required"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "Invalid email or password." : error.message);
        setLoading(false);
        return;
      }
      toast.success("Welcome back.");
      setTimeout(() => window.location.replace("/dashboard"), 300);
    } catch (err) {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleForgot = async () => {
    if (loading) return;
    const emailErr = validate.email(email);
    if (emailErr) { toast.error(emailErr); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) toast.error(error.message);
      else { setForgotSent(true); toast.success("Reset link sent. Check your email."); }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setEmail("");
    setPassword("");
    setName("");
    setForgotSent(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030711] px-4 py-8 text-white sm:px-6 lg:px-8">
      <style jsx global>{`
        @keyframes authParticle {
          0%, 100% { transform: translate3d(0,0,0); opacity: .35; }
          50% { transform: translate3d(18px,-30px,0); opacity: .9; }
        }
        @keyframes neuralPulse {
          0%, 100% { transform: scale(1); opacity: .75; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,.26),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,.24),transparent_30%),linear-gradient(180deg,#030711_0%,#071527_48%,#030711_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:68px_68px] opacity-20" />
        <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
        {particles.map((particle) => (
          <span
            key={`${particle.left}-${particle.top}`}
            className="absolute rounded-full bg-cyan-100/60 shadow-[0_0_18px_rgba(103,232,249,.8)]"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              animation: reduceMotion ? undefined : `authParticle 8s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <button onClick={() => router.push("/")} className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 backdrop-blur-xl transition hover:bg-white/15">
        <ArrowLeft size={16} /> Home
      </button>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_440px]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="hidden lg:block">
          <div className="relative mb-8 grid h-28 w-28 place-items-center rounded-[2rem] border border-cyan-200/20 bg-white/10 shadow-[0_0_80px_rgba(56,189,248,.28)] backdrop-blur-2xl">
            <div className="absolute inset-3 rounded-[1.5rem] border border-cyan-200/20" style={{ animation: reduceMotion ? undefined : "neuralPulse 3.8s ease-in-out infinite" }} />
            <Brain size={42} className="text-cyan-100" />
          </div>
          <p className="mb-4 inline-flex rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase text-cyan-100">
            StudyBuddy AI
          </p>
          <h1 className="font-lora text-6xl font-bold leading-tight text-white">
            {typed}<span className="text-cyan-200">|</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
            Notes, planning, focus sessions, quizzes, progress, and AI tutoring in a calm premium workspace built for serious students.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {["AI tutor", "Smart plans", "Focus streaks"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                <Check className="mb-3 text-cyan-200" size={18} />
                <p className="text-sm font-black text-white">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .55 }} className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-8 rounded-[2rem] bg-[conic-gradient(from_180deg,rgba(56,189,248,.22),rgba(168,85,247,.2),rgba(16,185,129,.12),rgba(56,189,248,.22))] blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_28px_110px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200/20 bg-white/10 shadow-[0_0_40px_rgba(56,189,248,.22)]">
                <img src="/icon-192.png" alt="StudyBuddy AI" className="h-10 w-10 rounded-xl" />
              </div>
              <h2 className="font-lora text-2xl font-bold text-white">StudyBuddy AI</h2>
              <p className="mt-2 text-sm font-semibold text-slate-400">Smarter Study. Better You.</p>
            </div>

            {mode !== "forgot" && (
              <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.06] p-1">
                {(["login", "signup"] as const).map((item) => (
                  <button key={item} onClick={() => switchMode(item)} className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === item ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"}`}>
                    {item === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === "forgot" ? (
                <motion.div key="forgot" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                  <button onClick={() => { setMode("login"); setForgotSent(false); }} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-100">
                    <ArrowLeft size={15} /> Back to sign in
                  </button>
                  <h3 className="text-xl font-black text-white">Reset password</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Enter your email and we will send a secure reset link.</p>
                  {forgotSent ? (
                    <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-5 text-center">
                      <Mail className="mx-auto mb-3 text-emerald-200" />
                      <p className="font-black text-emerald-100">Email sent</p>
                      <p className="mt-2 text-sm text-slate-300">Check your inbox for the reset link.</p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      <Field icon={<Mail size={17} />} value={email} onChange={setEmail} type="email" placeholder="Email address" onEnter={handleForgot} />
                      <PrimaryButton loading={loading} loadingText="Sending reset email..." onClick={handleForgot}>Send reset link</PrimaryButton>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key={mode} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} className="space-y-4">
                  <button onClick={handleGoogle} disabled={googleLoading} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.11] disabled:opacity-60">
                    {googleLoading ? <Loader2 size={17} className="animate-spin" /> : <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-slate-950">G</span>}
                    Continue with Google
                  </button>
                  <div className="flex items-center gap-3 text-xs font-bold uppercase text-slate-500"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
                  {mode === "signup" && <Field icon={<User size={17} />} value={name} onChange={setName} placeholder="Full name" />}
                  <Field icon={<Mail size={17} />} value={email} onChange={setEmail} type="email" placeholder="Email address" />
                  <Field icon={<Lock size={17} />} value={password} onChange={setPassword} type={showPassword ? "text" : "password"} placeholder="Password" onEnter={mode === "login" ? handleLogin : handleSignup} right={
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-500 hover:text-white" aria-label="Toggle password visibility">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  } />
                  {mode === "login" && <button type="button" onClick={() => setMode("forgot")} className="ml-auto block text-sm font-bold text-cyan-100 hover:text-white">Forgot password?</button>}
                  <PrimaryButton loading={loading} loadingText={mode === "login" ? "Signing in..." : "Creating account..."} onClick={mode === "login" ? handleLogin : handleSignup}>
                    {mode === "login" ? "Enter dashboard" : "Create account"}
                  </PrimaryButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

function Field({ icon, value, onChange, placeholder, type = "text", right, onEnter }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; placeholder: string; type?: string; right?: React.ReactNode; onEnter?: () => void }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-400 transition focus-within:border-cyan-200/50 focus-within:shadow-[0_0_0_4px_rgba(56,189,248,.08)]">
      {icon}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && onEnter) onEnter(); }}
        type={type}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
      />
      {right}
    </label>
  );
}

function PrimaryButton({ children, loading, loadingText, onClick }: { children: React.ReactNode; loading: boolean; loadingText?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 px-5 py-3.5 text-sm font-black text-white shadow-[0_0_42px_rgba(79,142,247,.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
      <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-white/25 blur-xl transition group-hover:translate-x-[320%]" />
      {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
      <span className="relative">{loading ? (loadingText || "Please wait...") : children}</span>
      {!loading && <ArrowRight size={16} className="relative" />}
    </button>
  );
}