import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(3, 7, 17, 0.75)", backdropFilter: "blur(12px)",
      zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20
    }}>
      <style>{`
        @keyframes modalPopIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{
        background: "var(--card, #1E293B)", border: "1px solid var(--border, #334155)",
        borderRadius: 24, width: "100%", maxWidth: 420, overflow: "hidden",
        boxShadow: "0 24px 50px rgba(0,0,0,0.5)", animation: "modalPopIn 0.25s cubic-bezier(0.34, 1.3, 0.64, 1)"
      }}>
        <div style={{ padding: "28px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#F8717122", display: "flex", alignItems: "center", justifyContent: "center", color: "#F87171" }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: "var(--text, #F8FAFC)", margin: 0, fontFamily: "var(--font-lora), serif" }}>{title}</h3>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted, #94A3B8)", lineHeight: 1.6, margin: 0 }}>{message}</p>
        </div>
        <div style={{ padding: "16px 28px", background: "rgba(0,0,0,0.15)", display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid var(--border, #334155)" }}>
          <button onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 12, background: "transparent", border: "1px solid var(--border, #334155)", color: "var(--text, #F8FAFC)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onCancel(); }} style={{ padding: "10px 20px", borderRadius: 12, background: "#F87171", border: "none", color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(248, 113, 113, 0.3)" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(248, 113, 113, 0.4)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(248, 113, 113, 0.3)"; }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
