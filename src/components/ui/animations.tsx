"use client";
import { useEffect, useRef, ReactNode } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Animation Components — No extra library needed!
// Pure CSS animations via React
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Fade In Up (page entry) ──
export function FadeInUp({
  children,
  delay = 0,
  duration = 400,
  style = {},
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
    el.style.transitionDelay = `${delay}ms`;
    const t = setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 20);
    return () => clearTimeout(t);
  }, [delay, duration]);

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
}

// ── Stagger Children (animate list items one by one) ──
export function StaggerChildren({
  children,
  staggerMs = 80,
}: {
  children: ReactNode[];
  staggerMs?: number;
}) {
  return (
    <>
      {children.map((child, i) => (
        <FadeInUp key={i} delay={i * staggerMs}>
          {child}
        </FadeInUp>
      ))}
    </>
  );
}

// ── Scale In (for cards, modals) ──
export function ScaleIn({
  children,
  delay = 0,
  style = {},
}: {
  children: ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "scale(0.95)";
    el.style.transition = `opacity 300ms ease, transform 300ms ease`;
    el.style.transitionDelay = `${delay}ms`;
    const t = setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "scale(1)";
    }, 20);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
}

// ── Slide In Right (for notifications, drawers) ──
export function SlideInRight({
  children,
  delay = 0,
  style = {},
}: {
  children: ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateX(30px)";
    el.style.transition = "opacity 350ms ease, transform 350ms ease";
    el.style.transitionDelay = `${delay}ms`;
    const t = setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    }, 20);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
}

// ── Animated Counter (numbers count up) ──
export function AnimatedCounter({
  value,
  duration = 1000,
  style = {},
}: {
  value: number;
  duration?: number;
  style?: React.CSSProperties;
}) {
  const ref       = useRef<HTMLSpanElement>(null);
  const startRef  = useRef<number>(0);
  const rafRef    = useRef<number>();

  useEffect(() => {
    const el    = ref.current;
    if (!el)    return;
    const start = performance.now();
    const from  = startRef.current;
    const to    = value;

    const animate = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease     = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(from + (to - from) * ease);
      el.textContent = current.toLocaleString();
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else startRef.current = to;
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span ref={ref} style={style}>{value}</span>;
}

// ── Pulse (for streak fire, notifications) ──
export function Pulse({
  children,
  style = {},
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      animation: "studioPulse 2s ease-in-out infinite",
      ...style,
    }}>
      <style>{`
        @keyframes studioPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>
      {children}
    </div>
  );
}

// ── Shimmer Loading Skeleton ──
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style = {},
}: {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
      <div style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--border) 25%, var(--card) 50%, var(--border) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }}/>
    </>
  );
}

// ── Hover Card (lift on hover) ──
export function HoverCard({
  children,
  style = {},
  onClick,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onEnter = () => {
    if (ref.current) {
      ref.current.style.transform = "translateY(-3px)";
      ref.current.style.boxShadow = "0 12px 40px rgba(79,142,247,.2)";
    }
  };
  const onLeave = () => {
    if (ref.current) {
      ref.current.style.transform = "translateY(0)";
      ref.current.style.boxShadow = "none";
    }
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── XP Float Animation (+25 XP floating text) ──
export function XPFloat({
  amount,
  onDone,
}: {
  amount: number;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
    el.style.transition = "opacity 1.2s ease, transform 1.2s ease";

    const t1 = setTimeout(() => {
      el.style.opacity   = "0";
      el.style.transform = "translateY(-40px)";
    }, 100);
    const t2 = setTimeout(onDone, 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div ref={ref} style={{
      position: "fixed",
      top: "40%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      pointerEvents: "none",
      fontSize: 22,
      fontWeight: 800,
      color: "#F5A623",
      textShadow: "0 2px 12px rgba(245,166,35,.5)",
      fontFamily: "var(--font-sora),sans-serif",
      opacity: 0,
    }}>
      ⚡ +{amount} XP!
    </div>
  );
}
