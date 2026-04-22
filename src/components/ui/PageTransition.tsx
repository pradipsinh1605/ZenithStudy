"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Start hidden
    el.style.opacity   = "0";
    el.style.transform = "translateY(14px)";
    el.style.filter    = "blur(3px)";

    // Animate in fast
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity .22s ease, transform .28s cubic-bezier(.34,1.4,.64,1), filter .22s ease";
        el.style.opacity    = "1";
        el.style.transform  = "translateY(0)";
        el.style.filter     = "blur(0)";
      });
    });

    return () => cancelAnimationFrame(t);
  }, [pathname]);

  return (
    <div ref={ref} style={{ width:"100%", height:"100%" }}>
      {children}
    </div>
  );
}
