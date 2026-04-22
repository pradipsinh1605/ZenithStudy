"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Brain, Bell, Moon, Sun, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted,   setMounted]   = useState(false);
  const [notifPerm, setNotifPerm] = useState("default");
  const [email,     setEmail]     = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof Notification !== "undefined") {
        setNotifPerm(Notification.permission);
      }
    } catch {}
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || "");
    })();
  }, []);

  const requestNotif = async () => {
    try {
      if (typeof Notification === "undefined") {
        toast.error("Notifications not supported in this browser");
        return;
      }
      const result = await Notification.requestPermission();
      setNotifPerm(result);
      if (result === "granted") {
        toast.success("Notifications enabled! 🔔");
        new Notification("StudyBuddy AI", { body: "Notifications are now active! 🎉" });
      } else {
        toast.error("Please allow notifications in browser settings");
      }
    } catch {
      toast.error("Could not request notification permission");
    }
  };

  const testNotif = () => {
    toast.success("🔔 Test notification sent!");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("⏰ Test Reminder", { body: "StudyBuddy AI notification is working!" });
      }
    } catch {}
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* AI Bot Status */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
          <div style={{ width:44, height:44, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#4F8EF7,#A78BFA)" }}>
            <Brain size={22} color="#fff"/>
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>AI Study Tutor — Dify Bot</h3>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Powered by your personal Dify AI bot</p>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[["🤖","Bot Status","Active & Connected","#34D399"],["📄","File Support","PDF, Images, Documents","var(--muted)"],["💬","Memory","Persistent conversation","var(--muted)"],["🎓","Capabilities","Explain, Quiz, Plan, Summarise","var(--muted)"]].map(([ico,lbl,val,color]) => (
            <div key={lbl as string} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"var(--bg)", borderRadius:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:18 }}>{ico}</span>
                <span style={{ fontSize:13, color:"var(--muted)" }}>{lbl}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color: color as string }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:7, fontSize:13, color:"#34D399" }}>
          <CheckCircle2 size={15}/> Your Dify bot is configured and ready
        </div>
      </div>

      {/* Notifications */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
          <div style={{ width:44, height:44, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#F5A623,#F87171)" }}>
            <Bell size={22} color="#fff"/>
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>Notifications & Reminders</h3>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Get alerted for classes, tasks & deadlines</p>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {[["📅","Timetable Reminders","Get notified before each class"],["📋","Task Deadlines","Reminders when tasks are due"],["🎯","Study Streak","Daily reminder to study"],["⏰","Pomodoro Breaks","Break reminders during focus"]].map(([ico,title,desc]) => (
            <div key={title as string} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"var(--bg)", borderRadius:12 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:20 }}>{ico}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{title}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{desc}</div>
                </div>
              </div>
              <div style={{ width:38, height:22, borderRadius:11, background:notifPerm==="granted" ? "#34D399" : "var(--border)", cursor:"pointer", position:"relative", transition:"all .2s" }}
                onClick={notifPerm !== "granted" ? requestNotif : undefined}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:notifPerm==="granted" ? 18 : 2, transition:"left .2s" }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {notifPerm !== "granted" ? (
            <button onClick={requestNotif} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", borderRadius:12, border:"none", background:"#4F8EF7", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
              <Bell size={15}/> Enable Notifications
            </button>
          ) : (
            <button style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", borderRadius:12, border:"none", background:"#34D39922", color:"#34D399", cursor:"default", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
              <CheckCircle2 size={15}/> Notifications Enabled
            </button>
          )}
          <button onClick={testNotif} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", borderRadius:12, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
            <Bell size={15}/> Test Notification
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Appearance</h3>
        {mounted && (
          <div style={{ display:"flex", gap:12 }}>
            {[["🌙","Dark Mode","dark"],["☀️","Light Mode","light"]].map(([ico,lbl,val]) => (
              <button key={val as string} onClick={() => setTheme(val as string)}
                style={{ flex:1, padding:"16px", borderRadius:14, cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:14, transition:"all .2s", border:`2px solid ${theme===val ? "#4F8EF7" : "var(--border)"}`, background:theme===val ? "#4F8EF722" : "var(--bg)", color:theme===val ? "#4F8EF7" : "var(--muted)" }}>
                <div style={{ fontSize:26, marginBottom:8 }}>{ico}</div>
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Account</h3>
        <div style={{ padding:"12px 16px", background:"var(--bg)", borderRadius:12, marginBottom:16 }}>
          <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600, textTransform:"uppercase" as const, marginBottom:4 }}>Logged in as</div>
          <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{email}</div>
        </div>
        <button onClick={logout}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", borderRadius:12, border:"1px solid #F8717144", background:"#F8717111", color:"#F87171", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>
          <Trash2 size={15}/> Sign Out
        </button>
      </div>
    </div>
  );
}
