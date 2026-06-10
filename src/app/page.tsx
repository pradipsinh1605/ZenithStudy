"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  Cloud,
  FileText,
  Github,
  Instagram,
  Linkedin,
  Mail,
  Menu,
  MessageCircle,
  Play,
  Shield,
  Send,
  Sparkles,
  Timer,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

const features = [
  { icon: BookOpen, title: "AI Smart Notes", desc: "Turn lectures, ideas, and messy study material into clean summaries and action points.", tone: "from-sky-400 to-cyan-300" },
  { icon: CalendarDays, title: "Timetable Planner", desc: "Build flexible schedules that adapt to exams, deadlines, streaks, and real life.", tone: "from-violet-400 to-fuchsia-400" },
  { icon: Brain, title: "AI Doubt Solver", desc: "Ask questions in natural language and get guided explanations with study context.", tone: "from-blue-400 to-violet-400" },
  { icon: Zap, title: "Quiz Generator", desc: "Create revision quizzes from notes, PDFs, chapters, or your own weak topics.", tone: "from-amber-300 to-orange-400" },
  { icon: Trophy, title: "XP & Streak System", desc: "Keep momentum with daily goals, achievements, XP rewards, and streak recovery.", tone: "from-emerald-300 to-teal-400" },
  { icon: BarChart3, title: "Progress Analytics", desc: "See your focus hours, quiz accuracy, subject balance, and study consistency.", tone: "from-indigo-300 to-sky-400" },
  { icon: Upload, title: "PDF Upload", desc: "Upload study PDFs and transform them into notes, flashcards, and practice questions.", tone: "from-rose-300 to-pink-400" },
  { icon: Cloud, title: "Cloud Sync", desc: "Keep notes, reminders, plans, and progress available across your devices.", tone: "from-cyan-300 to-blue-400" },
  { icon: Bell, title: "Study Reminders", desc: "Set reminders for revision, assignments, exams, and deep work sessions.", tone: "from-lime-300 to-emerald-400" },
  { icon: Sparkles, title: "Personal AI Assistant", desc: "A focused study copilot that helps you choose what to do next.", tone: "from-purple-300 to-blue-400" },
];

const previewTiles = [
  { label: "Focus Score", value: "94%", icon: Timer },
  { label: "Streak", value: "21 days", icon: Trophy },
  { label: "Today", value: "5 tasks", icon: Check },
];

const reasons = [
  "All-in-one study platform",
  "AI-powered productivity",
  "Personalized learning",
  "Gamified motivation",
  "Modern clean experience",
  "Faster studying",
  "Better focus",
];

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    desc: "Start building better study habits.",
    features: ["Basic notes", "Timetable", "Limited AI usage", "Daily streak tracking"],
  },
  {
    name: "Pro",
    monthly: 9,
    yearly: 69,
    desc: "For students who want serious momentum.",
    popular: true,
    features: ["Unlimited AI tools", "Advanced analytics", "Unlimited uploads", "Smart recommendations", "Priority reminders"],
  },
  {
    name: "Premium+",
    monthly: 19,
    yearly: 149,
    desc: "The complete AI study command center.",
    features: ["Full AI assistant", "Cloud sync", "Priority features", "Future premium tools", "Early beta access"],
  },
];

const testimonials = [
  { name: "Aarav Mehta", role: "Engineering student", quote: "StudyBuddy turns my late lecture notes into clean revision blocks before lab days. The quiz flow is the reason I revise consistently now." },
  { name: "Nisha Rao", role: "Medical aspirant", quote: "I use it after biology lectures to summarize diagrams and make quick MCQs. It saves me from drowning in scattered notes." },
  { name: "Kabir Singh", role: "UPSC learner", quote: "The planner keeps polity, history, and current affairs balanced. It feels like a disciplined study mentor without the pressure." },
  { name: "Meera Iyer", role: "College topper", quote: "The dashboard made my weekly study pattern obvious. I started fixing weak subjects before tests instead of after them." },
  { name: "Rohan Patel", role: "Late-night learner", quote: "The dark interface is calm at 1 AM, and the AI tutor explains concepts without making me leave my workflow." },
  { name: "Sara Khan", role: "Productivity-focused student", quote: "Tasks, streaks, and focus sessions finally live in one place. It feels premium but still simple enough to use daily." },
  { name: "Devansh Shah", role: "Computer science student", quote: "I generate flashcards from coding notes and revise on the bus. The AI answers are fast, but the verification reminder is useful." },
  { name: "Ananya Das", role: "NEET student", quote: "The spaced revision rhythm helps me stay calm. I can see what needs attention instead of guessing every morning." },
  { name: "Vikram Joshi", role: "Exam comeback student", quote: "I had messy habits before finals. StudyBuddy made my backlog visible and gave me a plan I could actually follow." },
];

const studentTypes = ["Engineering", "Medical", "UPSC", "Productivity", "Late-night learner", "College topper", "Other"];
const testimonialLoop = [...testimonials, ...testimonials];

const faqs = [
  { q: "Is StudyBuddy AI free?", a: "Yes. You can start with the free plan, then upgrade when you need unlimited AI tools, uploads, and advanced analytics." },
  { q: "Can I upload PDFs?", a: "Yes. PDF upload is designed for converting study material into notes, quizzes, flashcards, and revision flows." },
  { q: "Does it work on mobile?", a: "Yes. The interface is responsive and built to work smoothly on mobile, tablet, and desktop screens." },
  { q: "Is my data secure?", a: "StudyBuddy AI is built with authenticated access and privacy-first product patterns so your study data stays protected." },
  { q: "How does AI help studying?", a: "AI helps summarize content, solve doubts, generate quizzes, recommend study actions, and keep learning personalized." },
];

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55 }}
      className="mx-auto mb-12 max-w-3xl text-center"
    >
      <p className="mb-3 text-xs font-bold uppercase text-cyan-200">{eyebrow}</p>
      <h2 className="font-lora text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{desc}</p>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [openFaq, setOpenFaq] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: -200, y: -200 });

  const particles = useMemo(
    () =>
      Array.from({ length: 38 }, (_, index) => ({
        left: (index * 37) % 100,
        top: (index * 53) % 100,
        delay: (index % 9) * 0.35,
        size: 2 + (index % 3),
      })),
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) router.push("/dashboard");
      } catch {
        // Landing page remains available if auth probing fails.
      }
    })();
  }, [router, supabase]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => setCursor({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const goLogin = () => router.push("/auth/login");

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setContactLoading(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        message: String(form.get("message") || "").trim(),
      });
      if (error) throw error;
      event.currentTarget.reset();
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error?.message || "Feedback could not be saved.");
    } finally {
      setContactLoading(false);
    }
  };

  const submitTestimonial = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setTestimonialLoading(true);
    try {
      const { error } = await supabase.from("testimonial_submissions").insert({
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        student_type: String(form.get("student_type") || "Other"),
        message: String(form.get("message") || "").trim(),
        rating: Number(form.get("rating") || 5),
        status: "pending",
      });
      if (error) throw error;
      event.currentTarget.reset();
      setTestimonialSubmitted(true);
    } catch (error: any) {
      toast.error(error?.message || "Testimonial could not be saved.");
    } finally {
      setTestimonialLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#030711] text-white selection:bg-cyan-300/30">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-50 hidden h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-3xl lg:block"
        style={{ left: cursor.x, top: cursor.y }}
      />

      <div aria-hidden="true" className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,142,247,0.25),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(168,85,247,0.22),transparent_32%),linear-gradient(180deg,#030711_0%,#07111f_44%,#030711_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[conic-gradient(from_90deg_at_50%_50%,rgba(56,189,248,0.18),rgba(168,85,247,0.22),rgba(16,185,129,0.10),rgba(56,189,248,0.18))] blur-3xl" />
        {particles.map((particle) => (
          <span
            key={`${particle.left}-${particle.top}`}
            className="absolute rounded-full bg-cyan-200/50 shadow-[0_0_18px_rgba(103,232,249,0.75)]"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              animation: reduceMotion ? undefined : `particleFloat 9s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes particleFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.35;
          }
          50% {
            transform: translate3d(18px, -28px, 0);
            opacity: 0.9;
          }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes testimonialMarquee {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(-50%,0,0); }
        }
        .testimonial-track { animation: testimonialMarquee 42s linear infinite; will-change: transform; }
        .testimonial-track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .testimonial-track { animation: none; } }
      `}</style>

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#030711]/65 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => router.push("/")} className="group flex items-center gap-3" aria-label="StudyBuddy AI home">
            <img src="/icon-192.png" alt="StudyBuddy AI Logo" className="h-9 w-9 rounded-xl shadow-[0_0_24px_rgba(79,142,247,0.25)]" />
            <span className="text-sm font-extrabold tracking-normal text-white sm:text-base">StudyBuddy AI</span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-semibold text-slate-300 transition hover:text-white">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button onClick={goLogin} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white">
              Login
            </button>
            <button
              onClick={goLogin}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_0_34px_rgba(79,142,247,0.34)] transition hover:-translate-y-0.5"
            >
              <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-white/25 blur-xl transition group-hover:translate-x-[320%]" />
              Get Started
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-white md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#030711]/95 px-4 py-4 backdrop-blur-2xl md:hidden">
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  {link.label}
                </a>
              ))}
              <button onClick={goLogin} className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-950">
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-70px)] max-w-7xl flex-col items-center px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-xs font-bold text-cyan-100 shadow-[0_0_40px_rgba(56,189,248,0.16)] backdrop-blur-xl"
        >
          <Sparkles size={15} />
          AI notes, timetable, quizzes, doubts, reminders and progress in one platform
        </motion.div>

        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center lg:text-left"
          >
            <h1 className="font-lora text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Study Smarter with{" "}
              <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg lg:mx-0">
              AI-powered notes, timetable planning, quizzes, doubt solving, productivity tracking and gamified studying - all in one intelligent platform.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <button
                onClick={goLogin}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 px-7 py-4 text-sm font-extrabold text-white shadow-[0_0_44px_rgba(79,142,247,0.42)] transition hover:-translate-y-1"
              >
                <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <span className="absolute inset-y-0 left-0 w-1/3 bg-white/20 blur-xl" style={{ animation: reduceMotion ? undefined : "shimmerLine 1.2s ease forwards" }} />
                </span>
                <span className="relative inline-flex items-center justify-center gap-2">
                  Get Started Free <ArrowRight size={17} />
                </span>
              </button>
              <button
                onClick={goLogin}
                className="group rounded-xl border border-white/15 bg-white/10 px-7 py-4 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/15"
              >
                <span className="inline-flex items-center justify-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-slate-950">G</span>
                  Continue with Google
                </span>
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 sm:max-w-xl">
              {previewTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <motion.div
                    key={tile.label}
                    whileHover={{ y: -5 }}
                    className="rounded-xl border border-white/10 bg-white/[0.07] p-4 text-left backdrop-blur-xl"
                  >
                    <Icon className="mb-4 text-cyan-200" size={18} />
                    <p className="text-lg font-extrabold text-white">{tile.value}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{tile.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-10 bg-[conic-gradient(from_180deg,rgba(56,189,248,0.18),rgba(168,85,247,0.2),rgba(14,165,233,0.14),rgba(56,189,248,0.18))] blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-[0_28px_120px_rgba(15,23,42,0.8)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-3 pb-3">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-300" />
                </div>
                <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold text-cyan-100">Live AI Dashboard</span>
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-[1fr_0.68fr]">
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Today Plan</p>
                      <h3 className="mt-1 text-xl font-extrabold text-white">Physics Revision</h3>
                    </div>
                    <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-200">On track</span>
                  </div>
                  <div className="space-y-4">
                    {["AI notes from chapter 4", "Generate 15 MCQs", "Deep focus session", "Revise weak formulas"].map((task, index) => (
                      <motion.div
                        key={task}
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.1 }}
                        className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-3"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                          <Check size={16} />
                        </span>
                        <span className="text-sm font-semibold text-slate-200">{task}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/10 p-4">
                    <p className="text-xs font-bold uppercase text-slate-300">AI Assistant</p>
                    <div className="mt-4 space-y-3">
                      <p className="rounded-xl bg-white/10 p-3 text-xs leading-5 text-slate-200">Explain Newton's laws with a simple exam answer.</p>
                      <p className="rounded-xl bg-cyan-300/15 p-3 text-xs leading-5 text-cyan-100">Here is a short answer, diagram idea, and 3 revision questions.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-slate-400">Analytics</p>
                      <BarChart3 size={18} className="text-violet-200" />
                    </div>
                    <div className="flex h-24 items-end gap-2">
                      {[38, 54, 44, 72, 62, 86, 78].map((height, index) => (
                        <motion.span
                          key={height + index}
                          initial={{ height: 8 }}
                          animate={{ height }}
                          transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
                          className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-3 hidden w-44 rounded-2xl border border-white/15 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-xl sm:block"
            >
              <div className="mx-auto h-52 rounded-xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-3">
                <div className="mb-4 h-2 w-16 rounded-full bg-white/20" />
                <div className="rounded-lg bg-cyan-300/15 p-3">
                  <p className="text-[10px] font-bold text-cyan-100">Next reminder</p>
                  <p className="mt-1 text-sm font-extrabold">Math quiz at 7 PM</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 12 }, (_, index) => (
                    <span key={index} className={`h-6 rounded-md ${index === 8 ? "bg-violet-400" : "bg-white/10"}`} />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>


      <section id="features" className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Every study tool, redesigned around AI"
          desc="Premium workflows for notes, planning, revision, doubt solving, motivation, and performance tracking."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                onClick={goLogin}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter") goLogin(); }}
                className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.065] p-5 backdrop-blur-xl transition hover:border-cyan-200/30 hover:bg-white/[0.09] hover:shadow-[0_0_42px_rgba(56,189,248,0.12)]"
              >
                <div className={`mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${feature.tone} text-slate-950 shadow-[0_0_30px_rgba(79,142,247,0.2)] transition group-hover:scale-105`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-extrabold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Preview"
          title="A futuristic study workspace that feels calm"
          desc="Dashboard, AI chat, analytics, mobile reminders, and study plans are designed to work together without clutter."
        />
        <div className="grid items-center gap-5 lg:grid-cols-[0.72fr_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/15 bg-slate-950/80 p-4 shadow-[0_32px_100px_rgba(0,0,0,0.45)]"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-[#071120] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">Good evening</p>
                  <p className="text-xl font-black text-white">Ready to focus?</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-400/15 text-blue-100">
                  <Bell size={20} />
                </span>
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 p-5">
                <p className="text-xs font-bold uppercase text-white/70">Deep work</p>
                <p className="mt-2 text-3xl font-black">45:00</p>
                <div className="mt-5 h-2 rounded-full bg-white/25">
                  <div className="h-2 w-3/4 rounded-full bg-white" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {["Notes", "Quiz", "PDF", "Streak"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-sm font-bold text-white">{item}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">Synced</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid gap-5">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/10 bg-white/[0.065] p-6 backdrop-blur-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white">AI Chat Interface</h3>
                <MessageCircle className="text-cyan-200" />
              </div>
              <div className="space-y-3">
                <p className="max-w-xl rounded-2xl bg-white/10 p-4 text-sm leading-7 text-slate-200">Create a 7-day plan for chemistry revision and generate a quiz from my weak chapters.</p>
                <p className="ml-auto max-w-xl rounded-2xl bg-cyan-300/15 p-4 text-sm leading-7 text-cyan-50">Done. I grouped your chapters by difficulty, added reminders, and created 30 adaptive questions.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="grid gap-5 sm:grid-cols-2"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.065] p-6 backdrop-blur-xl">
                <FileText className="mb-5 text-violet-200" />
                <h3 className="text-lg font-black text-white">Smart Notes Engine</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">Clean summaries, key points, flashcards, and quiz material from one upload.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.065] p-6 backdrop-blur-xl">
                <BarChart3 className="mb-5 text-emerald-200" />
                <h3 className="text-lg font-black text-white">Analytics Preview</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">Track accuracy, focus time, progress, and weak areas at a glance.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why StudyBuddy AI"
          title="Built for students who want focus, speed, and clarity"
          desc="StudyBuddy AI combines the intelligence of AI tools with the discipline of a productivity system."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.035] p-5 backdrop-blur-xl"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/15 text-cyan-100">
                <Check size={18} />
              </span>
              <p className="font-bold text-slate-100">{reason}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free, upgrade when your ambition grows"
          desc="Simple premium plans for students who want faster studying, deeper AI help, and better organization."
        />
        <div className="mb-10 flex justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-1 backdrop-blur-xl">
            {(["monthly", "yearly"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setBilling(option)}
                className={`rounded-xl px-5 py-2 text-sm font-extrabold transition ${
                  billing === option ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
                }`}
              >
                {option === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.article
              key={plan.name}
              whileHover={{ y: -10, scale: 1.015 }}
              className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition hover:shadow-[0_0_55px_rgba(79,142,247,0.14)] ${
                plan.popular
                  ? "border-cyan-200/35 bg-cyan-200/[0.08] shadow-[0_0_70px_rgba(56,189,248,0.16)]"
                  : "border-white/10 bg-white/[0.06]"
              }`}
            >
              {billing === "yearly" && plan.monthly > 0 && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute left-5 top-5 rounded-full border border-emerald-200/30 bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">
                  Save {Math.round((1 - plan.yearly / (plan.monthly * 12)) * 100)}%
                </motion.span>
              )}
              {plan.popular && (
                <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-cyan-300 to-violet-300 px-3 py-1 text-xs font-black text-slate-950 max-sm:top-10">
                  Most Popular
                </span>
              )}
              <h3 className="pt-8 text-2xl font-black text-white">{plan.name}</h3>
              <p className="mt-3 min-h-14 text-sm leading-7 text-slate-400">{plan.desc}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-black text-white">${billing === "yearly" ? plan.yearly : plan.monthly}</span>
                <span className="pb-2 text-sm font-bold text-slate-400">/{billing === "yearly" ? "year" : "month"}</span>
              </div>
              <button
                onClick={goLogin}
                className={`mt-7 w-full rounded-xl px-5 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 ${
                  plan.popular ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white" : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                Choose {plan.name}
              </button>
              <div className="mt-7 space-y-3">
                {plan.features.map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                    <Check size={16} className="text-cyan-200" />
                    {item}
                  </p>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-0 py-20 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <SectionHeading
            eyebrow="Student stories"
            title="Built with feedback from ambitious learners"
            desc="From engineering labs to medical prep and UPSC revision, students use StudyBuddy AI to stay clear, consistent, and calm."
          />
          <div className="mb-8 flex justify-center">
            <button onClick={() => setFeedbackModalOpen(true)} className="rounded-full border border-cyan-200/20 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-[0_0_35px_rgba(56,189,248,.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15">
              Add Feedback
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="testimonial-track flex w-max gap-4 px-4 sm:gap-5">
            {testimonialLoop.map((item, index) => (
              <article
                key={item.name + "-" + index}
                className="w-[82vw] max-w-[360px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.065] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-200/25 hover:bg-white/[0.085] sm:w-[360px]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/30 to-violet-300/20 text-sm font-black text-white">
                    {item.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-extrabold text-white">{item.name}</p>
                    <p className="text-xs font-bold text-cyan-100/70">{item.role}</p>
                  </div>
                </div>
                <p className="text-sm leading-7 text-slate-300">{item.quote}</p>
              </article>
            ))}
          </div>
        </div>

        {feedbackModalOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4 backdrop-blur-xl" onClick={() => setFeedbackModalOpen(false)}>
            <motion.form
              onSubmit={submitTestimonial}
              initial={{ opacity: 0, y: 24, scale: .96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/90 p-5 shadow-[0_30px_120px_rgba(0,0,0,.65)] sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-cyan-100">Submit your feedback</p>
                  <h3 className="mt-1 text-xl font-black text-white">Help shape StudyBuddy AI</h3>
                </div>
                <button type="button" onClick={() => setFeedbackModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white"><X size={18} /></button>
              </div>
              {testimonialSubmitted && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">
                  Sent for moderation
                </motion.div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="name" required className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none" placeholder="Your name" />
                <input name="email" required type="email" className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none" placeholder="you@example.com" />
                <select name="student_type" className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none">
                  {studentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select name="rating" className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none" defaultValue="5">
                  {[5, 4, 3].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                </select>
              </div>
              <textarea name="message" required rows={4} className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none" placeholder="What improved in your study workflow?" />
              <button disabled={testimonialLoading} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                {testimonialLoading ? "Submitting..." : "Submit feedback"} <Send size={16} />
              </button>
            </motion.form>
          </div>
        )}
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions students ask before starting"
          desc="A quick look at access, uploads, mobile support, security, and AI study help."
        />
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl">
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-extrabold text-white">{faq.q}</span>
                  <ChevronDown className={`shrink-0 text-cyan-200 transition ${isOpen ? "rotate-180" : ""}`} size={18} />
                </button>
                {isOpen && <p className="px-5 pb-5 text-sm leading-7 text-slate-400">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section id="contact" className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Contact"
          title="Share feedback, ideas, or partnership notes"
          desc="StudyBuddy AI is built around student workflows, so feedback directly shapes the product."
        />
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { icon: Mail, label: "Email", value: "support@studybuddy.ai" },
              { icon: Instagram, label: "Instagram", value: "@studybuddy.ai" },
              { icon: Github, label: "GitHub", value: "StudyBuddy-AI" },
              { icon: Linkedin, label: "LinkedIn", value: "StudyBuddy AI" },
            ].map((contact) => {
              const Icon = contact.icon;
              return (
                <div key={contact.label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.065] p-5 backdrop-blur-xl">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/15 text-cyan-100">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">{contact.label}</p>
                    <p className="mt-1 font-bold text-white">{contact.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={submitContact}
            className="rounded-2xl border border-white/10 bg-white/[0.065] p-6 backdrop-blur-xl"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-300">
                Name
                <input name="name" required className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-200/50" placeholder="Your name" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-300">
                Email
                <input name="email" required type="email" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-200/50" placeholder="you@example.com" />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-300">
              Feedback
              <textarea name="message" required rows={5} className="resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-200/50" placeholder="Tell us what you want StudyBuddy AI to improve next." />
            </label>
            <button disabled={contactLoading} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
              {contactLoading ? "Sending..." : "Send Feedback"} <ArrowRight size={16} />
            </button>
            {submitted && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-sm font-bold text-emerald-200">
                Thank you. Your feedback is saved and ready for review.
              </motion.p>
            )}
          </form>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/15 via-violet-500/15 to-cyan-400/15 p-8 text-center backdrop-blur-xl sm:p-12">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-950">
            <Play size={24} fill="currentColor" />
          </div>
          <h2 className="font-lora text-3xl font-bold text-white sm:text-5xl">Turn your next study session into progress.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Build notes, solve doubts, plan revision, track focus, and stay motivated with one intelligent platform.
          </p>
          <button
            onClick={goLogin}
            className="mt-8 rounded-xl bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-[0_0_50px_rgba(255,255,255,0.18)] transition hover:-translate-y-1"
          >
            Start Studying Free
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-[#030711]/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="StudyBuddy AI logo" className="h-10 w-10 rounded-xl" />
              <p className="text-base font-black text-white">StudyBuddy AI</p>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
              AI-powered student productivity for notes, planning, quizzes, doubts, reminders, analytics, and focused study.
            </p>
          </div>
          <div className="grid gap-3 text-sm font-bold text-slate-400 sm:grid-cols-2 md:text-right">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/terms" className="hover:text-white">Terms & Conditions</a>
            <button onClick={goLogin} className="text-left hover:text-white md:text-right">Login</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-4 py-5 text-xs font-semibold text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Copyright 2026 StudyBuddy AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Github size={17} />
            <Instagram size={17} />
            <Linkedin size={17} />
            <Shield size={17} />
          </div>
        </div>
      </footer>
    </main>
  );
}
