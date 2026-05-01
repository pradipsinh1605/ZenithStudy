"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Page error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16, textAlign:"center", padding:24 }}>
          <div style={{ fontSize:48 }}>⚠️</div>
          <h2 style={{ fontFamily:"var(--font-lora),serif", fontSize:22, color:"var(--text)", fontWeight:700 }}>Something went wrong</h2>
          <p style={{ fontSize:14, color:"var(--muted)", maxWidth:400, lineHeight:1.7 }}>
            This page ran into an error. Try refreshing the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError:false }); window.location.reload(); }}
            style={{ padding:"10px 24px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4F8EF7,#6366F1)", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:14 }}>
            Refresh Page
          </button>
          {this.state.error && (
            <details style={{ fontSize:11, color:"var(--muted)", maxWidth:500, textAlign:"left" }}>
              <summary style={{ cursor:"pointer" }}>Error details</summary>
              <pre style={{ marginTop:8, padding:12, background:"var(--card)", borderRadius:8, overflow:"auto", fontSize:11 }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
