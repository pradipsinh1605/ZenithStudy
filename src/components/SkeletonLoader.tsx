"use client";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div style={{
      width, height, borderRadius,
      background: "linear-gradient(90deg, var(--border) 25%, var(--card) 50%, var(--border) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }}/>
  );
}

export function CardSkeleton() {
  return (
    <div style={{ padding:20, borderRadius:16, border:"1px solid var(--border)", background:"var(--card)", display:"flex", flexDirection:"column", gap:12 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Skeleton height={20} width="60%"/>
      <Skeleton height={14} width="90%"/>
      <Skeleton height={14} width="75%"/>
    </div>
  );
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Skeleton height={32} width="40%" borderRadius={10}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[1,2,3].map(i => <CardSkeleton key={i}/>)}
      </div>
      {Array.from({length: rows}).map((_,i) => (
        <Skeleton key={i} height={52} borderRadius={12}/>
      ))}
    </div>
  );
}
