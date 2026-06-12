"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Bell, Moon, Sun, CheckCircle2, Trash2, Loader2, Download, ShieldAlert, LifeBuoy, Info, ExternalLink, Timer, Volume2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted,   setMounted]   = useState(false);
  const [notifPerm, setNotifPerm] = useState("default");
  const [email,     setEmail]     = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        new Notification("Learnixio AI", { body: "Notifications are now active! 🎉" });
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
        new Notification("⏰ Test Reminder", { body: "Learnixio AI notification is working!" });
      }
    } catch {}
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/auth/login");
    }
  };

  const downloadData = async () => {
    toast.loading("Gathering your data...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.dismiss(); toast.error("Not logged in"); return; }
      
      const [notes, tasks, subjects, flashcards, ai_threads] = await Promise.all([
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("subjects").select("*").eq("user_id", user.id),
        supabase.from("flashcards").select("*").eq("user_id", user.id),
        supabase.from("ai_threads").select("*").eq("user_id", user.id)
      ]);

      const data = {
        user: { email: user.email, id: user.id },
        exportDate: new Date().toISOString(),
        notes: notes.data || [],
        tasks: tasks.data || [],
        subjects: subjects.data || [],
        flashcards: flashcards.data || [],
        ai_threads: ai_threads.data || [],
        localStorageReminders: JSON.parse(localStorage.getItem("learnixio-reminders-v1") || "[]")
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Learnixio_Data_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("Data downloaded successfully! 📁");
    } catch (e: any) {
      toast.dismiss();
      toast.error("Failed to download data");
    }
  };

  const deleteAccountData = async () => {
    toast.loading("Deleting your data...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await Promise.all([
        supabase.from("notes").delete().eq("user_id", user.id),
        supabase.from("tasks").delete().eq("user_id", user.id),
        supabase.from("subjects").delete().eq("user_id", user.id),
        supabase.from("flashcards").delete().eq("user_id", user.id),
        supabase.from("ai_threads").delete().eq("user_id", user.id),
        supabase.from("xp_logs").delete().eq("user_id", user.id)
      ]);
      
      toast.dismiss();
      toast.success("Account data securely deleted!");
      setShowDeleteConfirm(false);
      logout();
    } catch {
      toast.dismiss();
      toast.error("Failed to delete account data");
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Focus & Study Settings */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Focus Timer Settings</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"var(--bg)", borderRadius:12 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <Timer size={20} style={{ color:"var(--muted)" }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>Default Focus Time</div>
                <div style={{ fontSize:12, color:"var(--muted)" }}>25 minutes</div>
              </div>
            </div>
            <button onClick={() => router.push("/timer")} style={{ padding:"6px 12px", borderRadius:8, background:"var(--border)", color:"var(--text)", border:"none", fontSize:12, cursor:"pointer", fontWeight:600 }}>Change</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"var(--bg)", borderRadius:12 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <Clock size={20} style={{ color:"var(--muted)" }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>Default Session Length</div>
                <div style={{ fontSize:12, color:"var(--muted)" }}>Customize in the Focus Timer page</div>
              </div>
            </div>
            <button onClick={() => router.push("/timer")} style={{ padding:"6px 12px", borderRadius:8, background:"var(--border)", color:"var(--text)", border:"none", fontSize:12, cursor:"pointer", fontWeight:600 }}>Open Timer</button>
          </div>
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
        <button onClick={logout} disabled={loggingOut}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", borderRadius:12, border:"1px solid #F8717144", background:"#F8717111", color:"#F87171", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit", opacity: loggingOut ? 0.6 : 1 }}>
          {loggingOut ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={15}/>} {loggingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>

      {/* Data & Privacy */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Data & Privacy</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={downloadData} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--bg)", borderRadius:12, border:"1px solid var(--border)", cursor:"pointer", color:"var(--text)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Download size={18} />
              <span style={{ fontSize:13, fontWeight:600 }}>Download My Data</span>
            </div>
            <span style={{ fontSize:12, color:"var(--muted)" }}>Export JSON</span>
          </button>
          
          <button onClick={() => setShowDeleteConfirm(true)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#F8717111", borderRadius:12, border:"1px solid #F8717144", cursor:"pointer", color:"#F87171" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <ShieldAlert size={18} />
              <span style={{ fontSize:13, fontWeight:600 }}>Delete Account</span>
            </div>
            <span style={{ fontSize:12, opacity:0.8 }}>Permanent Action</span>
          </button>
        </div>
      </div>

      {/* Help & Support */}
      <div style={{ borderRadius:20, padding:24, border:"1px solid var(--border)", background:"var(--card)" }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:16 }}>Help & Support</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <button onClick={() => window.location.href = "mailto:support@learnixio.ai"} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px", background:"var(--bg)", borderRadius:12, border:"1px solid var(--border)", color:"var(--text)", cursor:"pointer", justifyContent:"center" }}>
            <LifeBuoy size={18} style={{ color:"#4F8EF7" }}/>
            <span style={{ fontSize:13, fontWeight:600 }}>Contact Us</span>
          </button>
          <button onClick={() => window.open("/terms", "_blank")} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px", background:"var(--bg)", borderRadius:12, border:"1px solid var(--border)", color:"var(--text)", cursor:"pointer", justifyContent:"center" }}>
            <ExternalLink size={18} style={{ color:"#A78BFA" }}/>
            <span style={{ fontSize:13, fontWeight:600 }}>Terms & Policy</span>
          </button>
        </div>
      </div>

      {/* About */}
      <div style={{ textAlign:"center", padding:"20px 0 40px", color:"var(--muted)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8 }}>
          <Info size={16}/>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>Learnixio AI</span>
        </div>
        <p style={{ fontSize:12 }}>Version 1.0.0</p>
        <p style={{ fontSize:12, marginTop:4 }}>Made with ❤️ for students</p>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone."
        onConfirm={deleteAccountData}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete Account"
      />
    </div>
  );
}
