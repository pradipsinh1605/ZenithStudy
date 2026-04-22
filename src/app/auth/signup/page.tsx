"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [form,    setForm]    = useState({ name:"", email:"", password:"" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all fields"); return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { name: form.name } },
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Account created! Please check your email to verify. 🎉");
      router.push("/auth/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#060D1B] p-4 font-sora">
      <div className="w-full max-w-md bg-white dark:bg-[#0B1628] rounded-2xl border border-gray-200 dark:border-[#1A2E4A] p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,#4F8EF7,#A78BFA)" }}>
            <BookOpen size={20} color="#fff"/>
          </div>
          <span className="font-extrabold text-lg text-gray-900 dark:text-[#E2EAF8]">StudyBuddy AI</span>
        </div>

        <h2 className="font-lora text-3xl mb-2 text-gray-900 dark:text-[#E2EAF8]">Create account</h2>
        <p className="text-gray-500 dark:text-[#5A7A9E] text-sm mb-8">Start your academic journey today — free!</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {[
            { label:"Full Name",  key:"name",     type:"text",     placeholder:"Your name" },
            { label:"Email",      key:"email",    type:"email",    placeholder:"you@email.com" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-gray-500 dark:text-[#5A7A9E]">{label}</label>
              <input type={type} value={form[key as keyof typeof form]}
                onChange={e => setForm({...form, [key]: e.target.value})}
                placeholder={placeholder} required
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all
                  bg-gray-50 dark:bg-[#060D1B] border-gray-200 dark:border-[#1A2E4A]
                  text-gray-900 dark:text-[#E2EAF8] placeholder-gray-400
                  focus:border-[#4F8EF7] focus:ring-2 focus:ring-[#4F8EF7]/20"/>
            </div>
          ))}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-gray-500 dark:text-[#5A7A9E]">Password</label>
            <input type={showPw ? "text" : "password"} value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Min 6 characters" required minLength={6}
              className="w-full rounded-xl px-4 py-3 pr-12 text-sm border outline-none transition-all
                bg-gray-50 dark:bg-[#060D1B] border-gray-200 dark:border-[#1A2E4A]
                text-gray-900 dark:text-[#E2EAF8] placeholder-gray-400
                focus:border-[#4F8EF7] focus:ring-2 focus:ring-[#4F8EF7]/20"/>
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-[38px] text-gray-400">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all
              disabled:opacity-70 hover:opacity-90 active:scale-[.98]"
            style={{ background:"linear-gradient(135deg,#4F8EF7,#6366F1)" }}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <p className="text-center text-gray-500 dark:text-[#5A7A9E] text-sm mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#4F8EF7] font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
