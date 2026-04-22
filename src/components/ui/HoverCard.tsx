"use client";
import { ReactNode, CSSProperties } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Universal HoverCard — adds lift + glow on hover
// Works in BOTH light and dark mode
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  glow?: string; // e.g. "#4F8EF7"
}

export function HoverCard({ children, style = {}, className = "", onClick, glow }: Props) {
  const glowColor = glow || "#4F8EF7";
  return (
    <div
      onClick={onClick}
      className={`hv-card ${className}`}
      style={{
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "var(--card)",
        padding: 20,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.transform  = "translateY(-5px) scale(1.02)";
        el.style.boxShadow  = `0 16px 48px ${glowColor}22, 0 4px 20px rgba(0,0,0,.15)`;
        el.style.borderColor = `${glowColor}44`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.transform   = "translateY(0) scale(1)";
        el.style.boxShadow   = "none";
        el.style.borderColor = "var(--border)";
      }}
    >
      {children}
    </div>
  );
}

// Small lift variant
export function HoverLift({ children, style = {}, className = "" }: Props) {
  return (
    <div
      className={`hv-lift ${className}`}
      style={{
        transition: "transform .2s cubic-bezier(.34,1.4,.64,1)",
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </div>
  );
}

// Glow button variant
export function GlowButton({
  children,
  onClick,
  style = {},
  color = "#4F8EF7",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  color?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`hv-btn ${className}`}
      style={{
        padding: "10px 22px",
        borderRadius: 12,
        border: "none",
        background: `linear-gradient(135deg,${color},${color}cc)`,
        color: "#fff",
        fontFamily: "var(--font-sora),sans-serif",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        boxShadow: `0 4px 20px ${color}44`,
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform  = "translateY(-2px) scale(1.03)";
        e.currentTarget.style.boxShadow  = `0 8px 32px ${color}66`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform  = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow  = `0 4px 20px ${color}44`;
      }}
      onMouseDown={e => { e.currentTarget.style.transform = "scale(.97)"; }}
      onMouseUp={e => { e.currentTarget.style.transform   = "translateY(-2px) scale(1.03)"; }}
    >
      {children}
    </button>
  );
}
