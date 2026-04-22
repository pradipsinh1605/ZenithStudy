"use client";
import { useEffect, useRef, useState } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// StudyBuddy AI — 3D Animated Landing Page
// Frontend only — no backend changes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function LandingPage() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [scrollY,   setScrollY]   = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [mounted,   setMounted]   = useState(false);
  const [counters,  setCounters]  = useState({ students:0, tasks:0, sessions:0, rate:0 });
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // ── Mounted ──
  useEffect(() => { setMounted(true); }, []);

  // ── Scroll listener ──
  useEffect(() => {
    if (!mounted) return;
    const onScroll = () => {
      const el  = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollY(el.scrollTop);
      setScrollPct(Math.min(pct * 100, 100));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  // ── Particle canvas ──
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let raf: number;

    interface P { x:number;y:number;vx:number;vy:number;r:number;alpha:number;color:string }
    const COLORS = ["#4F8EF7","#A78BFA","#34D399","#F5A623","#F87171"];
    const pts: P[] = Array.from({ length: 90 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4,
      r: Math.random()*1.8+.4,
      alpha: Math.random()*.35+.1,
      color: COLORS[Math.floor(Math.random()*COLORS.length)],
    }));

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      // connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i+1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx*dx+dy*dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = "#4F8EF7";
            ctx.globalAlpha = (1 - d/90) * .1;
            ctx.lineWidth   = .5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [mounted]);

  // ── Stats counter animation ──
  useEffect(() => {
    if (!mounted) return;
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !statsVisible) {
        setStatsVisible(true);
        const targets = { students:50000, tasks:2000000, sessions:500000, rate:98 };
        const dur = 2000;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCounters({
            students:  Math.round(targets.students  * ease),
            tasks:     Math.round(targets.tasks     * ease),
            sessions:  Math.round(targets.sessions  * ease),
            rate:      Math.round(targets.rate      * ease),
          });
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [mounted, statsVisible]);

  // ── Reveal on scroll ──
  useEffect(() => {
    if (!mounted) return;
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [mounted]);

  // ── Progress bar animation on scroll ──
  useEffect(() => {
    if (!mounted) return;
    const bars = document.querySelectorAll(".prog-fill");
    const obs  = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          const w  = el.dataset.w || "0";
          setTimeout(() => { el.style.width = w + "%"; }, 100);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach(b => obs.observe(b));
    return () => obs.disconnect();
  }, [mounted]);

  const fmt = (n: number) =>
    n >= 1_000_000 ? (n/1_000_000).toFixed(1)+"M+"
    : n >= 1_000   ? (n/1_000).toFixed(0)+"K+"
    : n+"";

  const FEATURES = [
    { icon:"📝", color:"#4F8EF7", title:"Smart Notes",     desc:"Rich editor with AI summaries, subject tagging and instant search." },
    { icon:"🤖", color:"#A78BFA", title:"AI Tutor",        desc:"Dify-powered bot — upload PDFs, ask questions, get 24/7 answers." },
    { icon:"⏱️", color:"#34D399", title:"Focus Timer",     desc:"Pomodoro sessions with XP rewards, stats and break reminders." },
    { icon:"📅", color:"#F5A623", title:"Smart Timetable", desc:"Weekly schedule with color subjects, rooms and smart reminders." },
    { icon:"⚡", color:"#F87171", title:"Flashcards",      desc:"Spaced repetition flashcards with quiz mode and instant scoring." },
    { icon:"🏆", color:"#22D3EE", title:"Gamification",    desc:"XP, levels, streaks, badges — studying becomes an adventure." },
  ];

  const TESTIMONIALS = [
    { name:"Riya Patel",     role:"B.Tech CSE · SVNIT",       text:"My GPA jumped from 6.8 to 8.9 in one semester. The AI tutor explains concepts better than my professors!", stars:5, color:"#4F8EF7" },
    { name:"Arjun Sharma",   role:"NEET Aspirant",             text:"The timetable and focus timer combo is insane. I'm studying 6 hours a day without burnout!", stars:5, color:"#A78BFA" },
    { name:"Priya Mehta",    role:"CA Student · Mumbai",       text:"Notes + flashcards together saved my exam prep. Earned 2000 XP in my first week!", stars:5, color:"#34D399" },
    { name:"Dev Kothari",    role:"Class 12 · JEE",            text:"StudyBuddy AI is the only app that actually made me consistent. 30-day streak and counting 🔥", stars:5, color:"#F5A623" },
    { name:"Sneha Joshi",    role:"MBA · IIM Ahmedabad",       text:"Organized my entire MBA prep in one place. The AI tutor handles even case study questions!", stars:5, color:"#F87171" },
    { name:"Kiran Patel",    role:"Undergraduate · Gujarat",   text:"Went from failing to top of class. The gamification keeps me motivated every single day.", stars:5, color:"#22D3EE" },
  ];

  const PROGRESS_SUBJECTS = [
    { name:"Mathematics",  pct:78, color:"#4F8EF7" },
    { name:"Physics",      pct:62, color:"#A78BFA" },
    { name:"Chemistry",    pct:91, color:"#34D399" },
    { name:"Biology",      pct:45, color:"#F5A623" },
    { name:"English",      pct:84, color:"#F87171" },
  ];

  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Lora:ital,wght@0,600;0,700;1,500&display=swap');

        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #060D1B;
          color: #E2EAF8;
          font-family: 'Sora', sans-serif;
          overflow-x: hidden;
        }

        /* ── Scroll progress bar ── */
        #scroll-prog {
          position: fixed; top: 0; left: 0; height: 3px; z-index: 9999;
          background: linear-gradient(90deg, #4F8EF7, #A78BFA, #34D399);
          transition: width .08s linear;
          border-radius: 0 2px 2px 0;
        }

        /* ── Glassmorphism ── */
        .glass {
          background: rgba(14,30,56,.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(79,142,247,.2);
        }
        .glass-sm {
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.08);
        }

        /* ── Navbar ── */
        #navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 48px;
          background: rgba(6,13,27,.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(79,142,247,.12);
          transition: all .3s;
        }
        .nav-logo { display:flex; align-items:center; gap:10px; font-weight:800; font-size:18px; }
        .nav-logo-icon {
          width:38px; height:38px; border-radius:11px;
          background: linear-gradient(135deg,#4F8EF7,#A78BFA);
          display:flex; align-items:center; justify-content:center; font-size:18px;
          transition: transform .35s cubic-bezier(.34,1.56,.64,1);
          cursor: pointer;
        }
        .nav-logo-icon:hover { transform: rotate(15deg) scale(1.15); }
        .nav-links { display:flex; gap:32px; list-style:none; }
        .nav-links a {
          color: #5A7A9E; font-size:13px; font-weight:600;
          text-decoration:none; transition: color .2s;
          position: relative; padding-bottom: 4px;
        }
        .nav-links a::after {
          content:''; position:absolute; bottom:0; left:0; right:0;
          height:2px; background:#4F8EF7;
          transform: scaleX(0); transition: transform .25s;
          border-radius: 2px;
        }
        .nav-links a:hover { color: #E2EAF8; }
        .nav-links a:hover::after { transform: scaleX(1); }
        .nav-cta {
          padding: 9px 22px; border-radius:11px;
          background: linear-gradient(135deg,#4F8EF7,#6366F1);
          color: #fff; border:none; font-family:'Sora',sans-serif;
          font-weight:700; font-size:13px; cursor:pointer;
          transition: all .25s;
        }
        .nav-cta:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(79,142,247,.45); }
        .nav-cta:active { transform:scale(.97); }

        /* ── Reveal animations ── */
        .reveal { opacity:0; transform:translateY(36px); transition: opacity .75s cubic-bezier(.4,0,.2,1), transform .75s cubic-bezier(.4,0,.2,1); }
        .reveal.from-left  { transform:translateX(-50px); }
        .reveal.from-right { transform:translateX(50px); }
        .reveal.from-scale { transform:scale(.88); }
        .reveal.from-flip  { transform:perspective(700px) rotateX(-18deg); }
        .reveal.in { opacity:1; transform:none; }
        .delay-1 { transition-delay:.1s; }
        .delay-2 { transition-delay:.2s; }
        .delay-3 { transition-delay:.3s; }
        .delay-4 { transition-delay:.4s; }
        .delay-5 { transition-delay:.5s; }
        .delay-6 { transition-delay:.6s; }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex; align-items:center; justify-content:center;
          text-align:center; padding: 130px 40px 80px;
          position:relative; overflow:hidden;
        }
        .hero-badge {
          display:inline-flex; align-items:center; gap:8px;
          padding:6px 18px; border-radius:24px;
          background: rgba(79,142,247,.1);
          border: 1px solid rgba(79,142,247,.3);
          font-size:12px; color:#4F8EF7; font-weight:700;
          margin-bottom:28px;
          animation: badgePulse 3s ease-in-out infinite;
        }
        @keyframes badgePulse {
          0%,100% { box-shadow:0 0 0 0 rgba(79,142,247,.35); }
          50%      { box-shadow:0 0 0 10px rgba(79,142,247,0); }
        }
        .hero h1 {
          font-family:'Lora',serif;
          font-size:clamp(40px,6.5vw,78px);
          line-height:1.08; margin-bottom:24px; font-weight:700;
        }
        .hero h1 em {
          font-style:italic;
          background:linear-gradient(135deg,#4F8EF7 20%,#A78BFA 60%,#34D399);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .hero-desc { font-size:17px; color:#5A7A9E; max-width:540px; margin:0 auto 44px; line-height:1.85; }
        .hero-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-bottom:72px; }

        /* Primary button */
        .btn-primary {
          padding:14px 36px; border-radius:14px;
          background:linear-gradient(135deg,#4F8EF7,#6366F1);
          color:#fff; border:none; font-family:'Sora',sans-serif;
          font-weight:700; font-size:15px; cursor:pointer;
          position:relative; overflow:hidden; transition:all .3s;
        }
        .btn-primary::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,.22),transparent);
          transform:translateX(-100%); transition:transform .45s;
        }
        .btn-primary:hover::before { transform:translateX(100%); }
        .btn-primary:hover { transform:translateY(-3px); box-shadow:0 18px 48px rgba(79,142,247,.5); }
        .btn-primary:active { transform:scale(.97); }

        /* Ghost button */
        .btn-ghost {
          padding:14px 32px; border-radius:14px;
          background:transparent; color:#E2EAF8;
          border:1px solid #1A2E4A; font-family:'Sora',sans-serif;
          font-weight:600; font-size:15px; cursor:pointer; transition:all .25s;
        }
        .btn-ghost:hover { border-color:#4F8EF7; color:#4F8EF7; box-shadow:0 0 24px rgba(79,142,247,.18); transform:translateY(-2px); }

        /* ── 3D Cube ── */
        .scene { width:120px; height:120px; perspective:600px; margin:0 auto; }
        .cube {
          width:100%; height:100%;
          position:relative; transform-style:preserve-3d;
          animation:rotateCube 14s linear infinite;
        }
        @keyframes rotateCube {
          0%   { transform:rotateX(20deg) rotateY(0deg); }
          100% { transform:rotateX(20deg) rotateY(360deg); }
        }
        .cube-face {
          position:absolute; width:120px; height:120px;
          border:1px solid rgba(79,142,247,.35);
          background:rgba(79,142,247,.05);
          display:flex; align-items:center; justify-content:center;
          font-size:32px; backdrop-filter:blur(4px);
        }
        .cube-face.f  { transform:translateZ(60px); }
        .cube-face.b  { transform:rotateY(180deg)  translateZ(60px); }
        .cube-face.l  { transform:rotateY(-90deg)  translateZ(60px); }
        .cube-face.r  { transform:rotateY(90deg)   translateZ(60px); }
        .cube-face.t  { transform:rotateX(90deg)   translateZ(60px); }
        .cube-face.bo { transform:rotateX(-90deg)  translateZ(60px); }

        /* ── Floating cards ── */
        .float-card {
          position:absolute; padding:11px 16px; border-radius:14px;
          font-size:12px; font-weight:700;
          display:flex; align-items:center; gap:8px;
          pointer-events:none;
          animation:floatAnim 7s ease-in-out infinite;
        }
        @keyframes floatAnim {
          0%,100% { transform:translateY(0)   rotate(-1deg); }
          50%      { transform:translateY(-18px) rotate(1deg); }
        }

        /* ── Section wrapper ── */
        .sec { max-width:1100px; margin:0 auto; padding:100px 48px; }
        .sec-label { font-size:11px; font-weight:700; color:#4F8EF7; text-transform:uppercase; letter-spacing:.12em; margin-bottom:12px; }
        .sec-title { font-family:'Lora',serif; font-size:clamp(28px,3.5vw,46px); line-height:1.18; margin-bottom:18px; }
        .sec-desc { font-size:15px; color:#5A7A9E; line-height:1.85; max-width:560px; }

        /* ── Feature cards ── */
        .feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:56px; }
        .feat-card {
          padding:28px; border-radius:20px;
          border:1px solid #1A2E4A;
          background:rgba(14,30,56,.55);
          backdrop-filter:blur(10px);
          transition:all .35s cubic-bezier(.4,0,.2,1);
          position:relative; overflow:hidden;
        }
        .feat-card::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(79,142,247,.07),rgba(167,139,250,.04));
          opacity:0; transition:opacity .35s;
        }
        .feat-card:hover { transform:translateY(-8px) scale(1.01); border-color:rgba(79,142,247,.38); box-shadow:0 24px 60px rgba(79,142,247,.14); }
        .feat-card:hover::after { opacity:1; }
        .feat-icon {
          width:54px; height:54px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          font-size:26px; margin-bottom:18px;
          transition:transform .35s cubic-bezier(.34,1.56,.64,1);
        }
        .feat-card:hover .feat-icon { transform:scale(1.2) rotate(8deg); }

        /* ── Stats ── */
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; margin-top:56px; }
        .stat-card {
          padding:36px 24px; border-radius:20px; text-align:center;
          border:1px solid #1A2E4A;
          background:rgba(14,30,56,.5);
          backdrop-filter:blur(10px);
          position:relative; overflow:hidden;
          transition:all .3s;
        }
        .stat-card::before {
          content:''; position:absolute; bottom:0; left:0; right:0;
          height:3px; transform:scaleX(0); transition:transform .4s;
        }
        .stat-card:hover::before { transform:scaleX(1); }
        .stat-card:hover { transform:translateY(-5px); box-shadow:0 20px 56px rgba(0,0,0,.28); }
        .stat-num { font-size:48px; font-weight:800; line-height:1; margin-bottom:10px; }
        .stat-lbl { font-size:13px; color:#5A7A9E; font-weight:600; }

        /* ── Testimonials slider ── */
        .testi-outer {
          overflow:hidden; margin-top:56px;
          -webkit-mask:linear-gradient(90deg,transparent 0%,black 10%,black 90%,transparent 100%);
        }
        .testi-track {
          display:flex; gap:20px;
          animation:slideLeft 32s linear infinite;
          width:max-content;
        }
        .testi-track:hover { animation-play-state:paused; }
        @keyframes slideLeft {
          0%   { transform:translateX(0); }
          100% { transform:translateX(-50%); }
        }
        .testi-card {
          width:320px; flex-shrink:0; padding:24px; border-radius:18px;
          border:1px solid #1A2E4A;
          background:rgba(14,30,56,.7);
          backdrop-filter:blur(10px);
          transition:all .3s;
        }
        .testi-card:hover { transform:translateY(-4px); border-color:rgba(79,142,247,.3); }
        .stars { color:#F5A623; font-size:13px; margin-bottom:10px; letter-spacing:2px; }
        .testi-text { font-size:13px; color:#5A7A9E; line-height:1.8; font-style:italic; margin-bottom:16px; }
        .testi-author { display:flex; align-items:center; gap:10px; }
        .testi-avatar {
          width:38px; height:38px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-weight:800; font-size:15px; color:#fff; flex-shrink:0;
        }

        /* ── Progress bars ── */
        .prog-bar { height:8px; border-radius:4px; background:#1A2E4A; overflow:hidden; margin-top:6px; }
        .prog-fill { height:100%; border-radius:4px; width:0; transition:width 1.4s cubic-bezier(.4,0,.2,1); }

        /* ── Pricing ── */
        .price-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:56px; }
        .price-card {
          padding:36px 28px; border-radius:20px;
          border:1px solid #1A2E4A;
          background:rgba(14,30,56,.55);
          transition:all .35s; position:relative; overflow:hidden;
        }
        .price-card.featured {
          border-color:rgba(79,142,247,.45);
          background:linear-gradient(145deg,rgba(79,142,247,.09),rgba(99,102,241,.07));
          box-shadow:0 0 60px rgba(79,142,247,.1);
        }
        .price-card:hover { transform:translateY(-7px); box-shadow:0 28px 70px rgba(0,0,0,.3); }
        .price-badge {
          position:absolute; top:18px; right:18px;
          padding:4px 12px; border-radius:20px;
          background:#4F8EF7; color:#fff;
          font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em;
        }
        .price-name { font-size:11px; font-weight:700; color:#5A7A9E; text-transform:uppercase; letter-spacing:.1em; margin-bottom:10px; }
        .price-amount { font-size:44px; font-weight:800; line-height:1; }
        .price-period { font-size:13px; color:#5A7A9E; margin-left:4px; }
        .price-list { list-style:none; margin:24px 0; display:flex; flex-direction:column; gap:10px; }
        .price-list li { font-size:13px; color:#5A7A9E; display:flex; align-items:center; gap:8px; }
        .price-list li::before { content:'✓'; color:#34D399; font-weight:800; font-size:14px; flex-shrink:0; }
        .price-btn {
          width:100%; padding:13px; border-radius:12px;
          font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer;
          transition:all .25s;
        }
        .price-btn.solid { background:#4F8EF7; color:#fff; border:none; }
        .price-btn.solid:hover { background:#3a7de8; transform:translateY(-2px); box-shadow:0 10px 28px rgba(79,142,247,.4); }
        .price-btn.outline { background:transparent; color:#E2EAF8; border:1px solid #1A2E4A; }
        .price-btn.outline:hover { border-color:#4F8EF7; color:#4F8EF7; transform:translateY(-2px); }

        /* ── CTA ── */
        .cta-btn {
          padding:18px 56px; border-radius:16px;
          background:linear-gradient(135deg,#4F8EF7,#6366F1);
          color:#fff; border:none; font-family:'Sora',sans-serif;
          font-weight:800; font-size:18px; cursor:pointer;
          position:relative; overflow:hidden;
          animation:ctaGlow 3s ease-in-out infinite;
          transition:all .3s;
        }
        @keyframes ctaGlow {
          0%,100% { box-shadow:0 0 24px rgba(79,142,247,.4),0 0 50px rgba(79,142,247,.15); }
          50%      { box-shadow:0 0 48px rgba(79,142,247,.7),0 0 100px rgba(79,142,247,.25); }
        }
        .cta-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,.28),transparent);
          transform:translateX(-100%); transition:transform .5s;
        }
        .cta-btn:hover::before  { transform:translateX(100%); }
        .cta-btn:hover { transform:translateY(-4px) scale(1.03); animation:none; box-shadow:0 24px 72px rgba(79,142,247,.65) !important; }
        .cta-btn:active { transform:scale(.97); }

        /* ── Light mode ── */
        @media (prefers-color-scheme:light) {
          body { background:#F5F3EE; color:#1A1A2E; }
          .glass { background:rgba(255,255,255,.8); border-color:rgba(37,99,235,.15); }
          .glass-sm { background:rgba(0,0,0,.03); border-color:rgba(0,0,0,.08); }
          #navbar { background:rgba(245,243,238,.9); border-color:rgba(37,99,235,.1); }
          .feat-card,.stat-card,.testi-card,.price-card { background:rgba(255,255,255,.9); border-color:#E8E4DD; }
          .hero-desc,.sec-desc,.stat-lbl,.testi-text,.price-period,.price-name { color:#7A7A9E; }
          .nav-links a { color:#7A7A9E; }
          .prog-bar { background:#E8E4DD; }
          .price-list li,.price-btn.outline { color:#1A1A2E; }
          .btn-ghost { color:#1A1A2E; border-color:#E8E4DD; }
        }

        /* ── Mobile responsive ── */
        @media (max-width:768px) {
          #navbar { padding:14px 20px; }
          .nav-links { display:none; }
          .sec { padding:72px 24px; }
          .feat-grid { grid-template-columns:1fr 1fr; }
          .stats-grid { grid-template-columns:1fr 1fr; }
          .price-grid { grid-template-columns:1fr; }
          .hero { padding:110px 24px 60px; }
        }
        @media (max-width:520px) {
          .feat-grid { grid-template-columns:1fr; }
          .stats-grid { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      {/* ── Scroll Progress ── */}
      <div id="scroll-prog" style={{ width: scrollPct + "%" }}/>

      {/* ── Particle Canvas ── */}
      <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}/>

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ── NAVBAR ── */}
        <nav id="navbar">
          <div className="nav-logo">
            <div className="nav-logo-icon">📚</div>
            StudyBuddy AI
          </div>
          <ul className="nav-links">
            {["Features","Stats","Testimonials","Pricing"].map(l => (
              <li key={l}><a href={`#${l.toLowerCase()}`}>{l}</a></li>
            ))}
          </ul>
          <a href="/auth/login">
            <button className="nav-cta">Get Started Free →</button>
          </a>
        </nav>

        {/* ── HERO ── */}
        <div className="hero">
          {/* Floating ambient cards */}
          <div className="float-card glass-sm" style={{ top:"22%", left:"4%", animationDelay:"0s" }}>
            <span>🔥</span><span style={{ color:"#F5A623" }}>7 day streak!</span>
          </div>
          <div className="float-card glass-sm" style={{ top:"30%", right:"4%", animationDelay:"1.2s" }}>
            <span>⚡</span><span style={{ color:"#4F8EF7" }}>+50 XP earned</span>
          </div>
          <div className="float-card glass-sm" style={{ bottom:"28%", left:"6%", animationDelay:"2.4s" }}>
            <span>✅</span><span style={{ color:"#34D399" }}>Task complete!</span>
          </div>
          <div className="float-card glass-sm" style={{ bottom:"22%", right:"6%", animationDelay:"3.6s" }}>
            <span>🎓</span><span style={{ color:"#A78BFA" }}>Level 8 reached!</span>
          </div>

          <div>
            <div className="hero-badge reveal from-scale">
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#34D399", display:"inline-block", animation:"badgePulse 2s infinite" }}/>
              AI-Powered · Free Forever to Start
            </div>
            <h1 className="reveal delay-1">
              Your Academic<br/><em>Success Hub</em>
            </h1>
            <p className="hero-desc reveal delay-2">
              Organize your studies, track progress, get AI tutoring and level up — all in one beautiful, gamified platform.
            </p>
            <div className="hero-btns reveal delay-3">
              <a href="/auth/signup"><button className="btn-primary">🚀 Start for Free</button></a>
              <a href="/auth/login"><button className="btn-ghost">Sign In →</button></a>
            </div>

            {/* 3D Cube */}
            <div className="reveal delay-5">
              <div className="scene">
                <div className="cube">
                  <div className="cube-face f">📚</div>
                  <div className="cube-face b">⚡</div>
                  <div className="cube-face l">🎯</div>
                  <div className="cube-face r">🔥</div>
                  <div className="cube-face t">🏆</div>
                  <div className="cube-face bo">🧠</div>
                </div>
              </div>
              <p style={{ marginTop:16, fontSize:12, color:"#5A7A9E" }}>
                Interactive 3D • Scroll to explore ↓
              </p>
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div id="features" className="sec">
          <div className="reveal from-left">
            <div className="sec-label">Features</div>
            <h2 className="sec-title">Everything you need<br/>to excel academically</h2>
            <p className="sec-desc">From smart notes to AI tutoring — StudyBuddy AI has every tool modern students need.</p>
          </div>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`feat-card reveal from-scale delay-${i+1}`}>
                <div className="feat-icon" style={{ background:`${f.color}18` }}>{f.icon}</div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:13, color:"#5A7A9E", lineHeight:1.75 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="sec" style={{ paddingTop:40 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center" }}>
            <div>
              <div className="sec-label reveal from-left">How it works</div>
              <h2 className="sec-title reveal from-left delay-1">Study smarter,<br/>not harder</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:22, marginTop:32 }}>
                {[
                  ["1️⃣","rgba(79,142,247,.15)",  "Set up your subjects",  "Add subjects with custom colors. Everything organizes itself automatically."],
                  ["2️⃣","rgba(167,139,250,.15)", "Plan your week",        "Add timetable, set task deadlines, and let smart reminders handle the rest."],
                  ["3️⃣","rgba(52,211,153,.15)",  "Study and earn XP",     "Complete tasks, take notes, run Pomodoro sessions — earn XP and level up!"],
                ].map(([ico, bg, title, desc], i) => (
                  <div key={title} className={`reveal from-left delay-${i+2}`} style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                    <div style={{ width:44, height:44, borderRadius:13, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{ico}</div>
                    <div>
                      <div style={{ fontWeight:700, marginBottom:5, fontSize:14 }}>{title}</div>
                      <div style={{ fontSize:13, color:"#5A7A9E", lineHeight:1.7 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress glass card */}
            <div className="reveal from-right delay-2">
              <div className="glass" style={{ padding:28, borderRadius:20 }}>
                <div style={{ fontSize:13, color:"#5A7A9E", marginBottom:20, fontWeight:700 }}>📊 Subject Progress</div>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {PROGRESS_SUBJECTS.map(s => (
                    <div key={s.name}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
                        <span style={{ fontWeight:600 }}>{s.name}</span>
                        <span style={{ color:s.color }}>{s.pct}%</span>
                      </div>
                      <div className="prog-bar">
                        <div className="prog-fill" data-w={s.pct} style={{ background:`linear-gradient(90deg,${s.color},${s.color}99)` }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:24, paddingTop:20, borderTop:"1px solid #1A2E4A" }}>
                  {[["⚡","1,250","Total XP","#F5A623"],["🔥","7","Day Streak","#F87171"],["🎓","3","Level","#A78BFA"]].map(([ico,val,lbl,color]) => (
                    <div key={lbl} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:20 }}>{ico}</div>
                      <div style={{ fontSize:22, fontWeight:800, color: color as string, marginTop:4 }}>{val}</div>
                      <div style={{ fontSize:11, color:"#5A7A9E", marginTop:2 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div id="stats" className="sec">
          <div style={{ textAlign:"center" }}>
            <div className="sec-label reveal from-scale">By the numbers</div>
            <h2 className="sec-title reveal from-scale delay-1">Trusted by students worldwide</h2>
          </div>
          <div className="stats-grid" ref={statsRef}>
            {[
              { val:fmt(counters.students),  label:"Active Students",  color:"#4F8EF7", grad:"linear-gradient(90deg,#4F8EF7,#6366F1)", delay:"delay-1" },
              { val:fmt(counters.tasks),     label:"Tasks Completed",  color:"#34D399", grad:"linear-gradient(90deg,#34D399,#10B981)", delay:"delay-2" },
              { val:fmt(counters.sessions),  label:"Study Sessions",   color:"#F5A623", grad:"linear-gradient(90deg,#F5A623,#F59E0B)", delay:"delay-3" },
              { val:counters.rate+"%",       label:"Satisfaction Rate",color:"#A78BFA", grad:"linear-gradient(90deg,#A78BFA,#8B5CF6)", delay:"delay-4" },
            ].map(s => (
              <div key={s.label} className={`stat-card reveal from-flip ${s.delay}`} style={{ "--stat-grad":s.grad } as React.CSSProperties}>
                <style>{`.stat-card:hover::before { background:${s.grad}; }`}</style>
                <div className="stat-num" style={{ color:s.color }}>{s.val}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TESTIMONIALS ── */}
        <div id="testimonials" style={{ padding:"80px 0", overflow:"hidden" }}>
          <div className="sec" style={{ paddingBottom:0 }}>
            <div style={{ textAlign:"center" }}>
              <div className="sec-label reveal from-scale">Testimonials</div>
              <h2 className="sec-title reveal from-scale delay-1">Students love StudyBuddy AI</h2>
            </div>
          </div>
          <div className="testi-outer reveal">
            <div className="testi-track">
              {/* Double for seamless loop */}
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={i} className="testi-card">
                  <div className="stars">{"★".repeat(t.stars)}</div>
                  <p className="testi-text">"{t.text}"</p>
                  <div className="testi-author">
                    <div className="testi-avatar" style={{ background:`${t.color}33` }}>
                      <span style={{ color:t.color }}>{t.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{t.name}</div>
                      <div style={{ fontSize:11, color:"#5A7A9E" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PRICING ── */}
        <div id="pricing" className="sec">
          <div style={{ textAlign:"center" }}>
            <div className="sec-label reveal from-scale">Pricing</div>
            <h2 className="sec-title reveal from-scale delay-1">Simple, transparent pricing</h2>
            <p className="sec-desc reveal from-scale delay-2" style={{ margin:"0 auto" }}>Start free. Upgrade when you grow.</p>
          </div>
          <div className="price-grid">
            {[
              { name:"Free", price:"₹0", period:"/month", featured:false, badge:"", delay:"delay-1",
                features:["3 subjects","50 notes","AI Tutor (10 msg/day)","Basic timetable","Focus timer","Streak tracking"],
                btn:"outline", btnText:"Get Started Free" },
              { name:"Pro", price:"₹199", period:"/month", featured:true, badge:"Most Popular", delay:"delay-2",
                features:["Unlimited subjects","Unlimited notes","AI Tutor unlimited","File & PDF upload","Advanced analytics","Priority support"],
                btn:"solid", btnText:"Start Pro →" },
              { name:"Institution", price:"₹999", period:"/month", featured:false, badge:"", delay:"delay-3",
                features:["Entire school/college","Teacher dashboard","Bulk licenses","Custom branding","Analytics export","Dedicated support"],
                btn:"outline", btnText:"Contact Sales" },
            ].map(p => (
              <div key={p.name} className={`price-card ${p.featured?"featured":""} reveal ${p.delay==="delay-1"?"from-left":p.delay==="delay-3"?"from-right":"from-scale"} ${p.delay}`}>
                {p.badge && <div className="price-badge">{p.badge}</div>}
                <div className="price-name">{p.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:2, margin:"12px 0 6px" }}>
                  <span className="price-amount" style={{ color:p.featured?"#4F8EF7":"#E2EAF8" }}>{p.price}</span>
                  <span className="price-period">{p.period}</span>
                </div>
                <ul className="price-list">
                  {p.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button className={`price-btn ${p.btn}`}>
                  {p.btnText}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign:"center", padding:"80px 48px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:"-30%", background:"radial-gradient(ellipse at center,rgba(79,142,247,.07) 0%,transparent 65%)", pointerEvents:"none" }}/>
          <div className="sec-label reveal from-scale">Get Started Today</div>
          <h2 className="sec-title reveal from-scale delay-1">Ready to transform<br/>your academic life?</h2>
          <p className="sec-desc reveal from-scale delay-2" style={{ margin:"0 auto 44px" }}>
            Join 50,000+ students already using StudyBuddy AI. Free forever.
          </p>
          <a href="/auth/signup">
            <button className="cta-btn reveal from-scale delay-3">
              🚀 Start Your Journey — It&apos;s Free!
            </button>
          </a>
          <p className="reveal delay-4" style={{ marginTop:16, fontSize:12, color:"#5A7A9E" }}>
            No credit card required · Setup in 2 minutes · Cancel anytime
          </p>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop:"1px solid #1A2E4A", padding:"44px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, maxWidth:1100, margin:"0 auto" }}>
          <div className="nav-logo" style={{ fontSize:15 }}>
            <div className="nav-logo-icon" style={{ width:32, height:32, fontSize:15 }}>📚</div>
            StudyBuddy AI
          </div>
          <div style={{ fontSize:12, color:"#5A7A9E" }}>© 2026 StudyBuddy AI · Built with ❤️ for students</div>
          <div style={{ display:"flex", gap:24 }}>
            {["Privacy","Terms","Contact"].map(l => (
              <a key={l} href="#" style={{ fontSize:12, color:"#5A7A9E", textDecoration:"none", transition:"color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color="#E2EAF8")}
                onMouseLeave={e => (e.currentTarget.style.color="#5A7A9E")}>
                {l}
              </a>
            ))}
          </div>
        </footer>

      </div>
    </>
  );
}
