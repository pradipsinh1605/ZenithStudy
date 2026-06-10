import { Brain } from "lucide-react";

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({ text = "Loading StudyBuddy AI...", fullScreen = false }: LoaderProps) {
  const content = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Outer glowing spinning ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#4F8EF7", borderRightColor: "#A78BFA",
          animation: "loader-spin 1s linear infinite",
          boxShadow: "0 0 15px rgba(79,142,247,0.3)"
        }} />
        
        {/* Inner pulsing background */}
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(79,142,247,0.15), rgba(167,139,250,0.15))",
          animation: "loader-pulse 2s ease-in-out infinite"
        }} />
        
        {/* Center Brain Icon */}
        <Brain size={26} color="#4F8EF7" style={{ zIndex: 1, animation: "loader-pulse 2s ease-in-out infinite" }} />
      </div>
      
      {text && (
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          background: "linear-gradient(90deg, #4F8EF7, #A78BFA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "loader-pulse 2s ease-in-out infinite"
        }}>
          {text}
        </p>
      )}
      <style>{`
        @keyframes loader-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes loader-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", flex: 1 }}>
      {content}
    </div>
  );
}
