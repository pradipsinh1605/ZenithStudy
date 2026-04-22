"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Edit3, Save, Plus, Trash2, User, GraduationCap, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const COLOR_PALETTE = [
  "#4F8EF7","#A78BFA","#34D399","#F5A623","#F87171",
  "#22D3EE","#EC4899","#FB923C","#84CC16","#E879F9",
  "#38BDF8","#FBBF24","#6EE7B7","#FCA5A5","#93C5FD",
];

const EDU_LEVELS = [
  "School (Grade 6–8)","School (Grade 9–10)",
  "School (Grade 11–12)","Undergraduate",
  "Postgraduate","PhD / Research","Self-learner"
];
const STREAMS = [
  "Science (PCM)","Science (PCB)","Commerce",
  "Arts / Humanities","Engineering","Medical",
  "Law","Business / MBA","Computer Science","Other"
];

// ── Separate Input Component to prevent focus loss ──
function FormInput({
  label, value, onChange, type = "text", placeholder = ""
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        textTransform: "uppercase" as const, letterSpacing: ".05em",
        color: "var(--muted)", marginBottom: 6,
      }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", borderRadius: 12, padding: "10px 14px",
          fontSize: 14, fontFamily: "inherit", outline: "none",
          border: "1px solid var(--border)",
          background: "var(--bg)", color: "var(--text)",
          transition: "border-color .2s",
        }}
        onFocus={e => e.target.style.borderColor = "#4F8EF7"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function FormSelect({
  label, value, onChange, options
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        textTransform: "uppercase" as const, letterSpacing: ".05em",
        color: "var(--muted)", marginBottom: 6,
      }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", borderRadius: 12, padding: "10px 14px",
          fontSize: 14, fontFamily: "inherit", outline: "none",
          border: "1px solid var(--border)",
          background: "var(--bg)", color: "var(--text)",
        }}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FormTextarea({
  label, value, onChange, placeholder = "", rows = 3
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        textTransform: "uppercase" as const, letterSpacing: ".05em",
        color: "var(--muted)", marginBottom: 6,
      }}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", borderRadius: 12, padding: "10px 14px",
          fontSize: 14, fontFamily: "inherit", outline: "none",
          border: "1px solid var(--border)",
          background: "var(--bg)", color: "var(--text)",
          resize: "vertical",
          transition: "border-color .2s",
        }}
        onFocus={e => e.target.style.borderColor = "#4F8EF7"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

export default function ProfilePage() {
  const supabase  = createClient();
  const [tab,     setTab]     = useState<"personal"|"academic"|"subjects">("personal");
  const [edit,    setEdit]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects,setSubjects]= useState<any[]>([]);
  const [newSub,  setNewSub]  = useState("");
  const [newColor,setNewColor]= useState(COLOR_PALETTE[0]);

  // ── Separate state for each field to prevent focus loss ──
  const [name,        setName]        = useState("");
  const [dob,         setDob]         = useState("");
  const [phone,       setPhone]       = useState("");
  const [city,        setCity]        = useState("");
  const [country,     setCountry]     = useState("");
  const [bio,         setBio]         = useState("");
  const [goals,       setGoals]       = useState("");
  const [dailyHours,  setDailyHours]  = useState("");
  const [examDate,    setExamDate]    = useState("");
  const [institution, setInstitution] = useState("");
  const [eduLevel,    setEduLevel]    = useState("");
  const [stream,      setStream]      = useState("");
  const [rollNo,      setRollNo]      = useState("");
  const [yearSem,     setYearSem]     = useState("");
  const [board,       setBoard]       = useState("");
  const [awards,      setAwards]      = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user }, error: authErr } = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: new Error("auth") }));
    if (authErr || !user) return;
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("subjects").select("*").eq("user_id", user.id),
    ]);
    if (p) {
      setName(p.name || "");
      setDob(p.dob || "");
      setPhone(p.phone || "");
      setCity(p.city || "");
      setCountry(p.country || "");
      setBio(p.bio || "");
      setGoals(p.goals || "");
      setDailyHours(p.daily_hours?.toString() || "");
      setExamDate(p.exam_date || "");
      setInstitution(p.institution || "");
      setEduLevel(p.edu_level || "");
      setStream(p.stream || "");
      setRollNo(p.roll_no || "");
      setYearSem(p.year_sem || "");
      setBoard(p.board || "");
      setAwards(p.awards || "");
    }
    setSubjects(s || []);
  };

  const saveProfile = async () => {
    setLoading(true);
    const { data: { user }, error: authErr } = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: new Error("auth") }));
    if (authErr || !user) return;
    const { error } = await supabase.from("profiles").upsert({
      user_id:     user.id,
      name,   dob,      phone,   city,
      country, bio,    goals,
      daily_hours: dailyHours ? parseInt(dailyHours) : null,
      exam_date:   examDate || null,
      institution, edu_level: eduLevel, stream,
      roll_no: rollNo, year_sem: yearSem,
      board,   awards,
      updated_at: new Date().toISOString(),
    });
    if (error) { toast.error("Failed to save"); }
    else { toast.success("Profile saved! ✅"); setEdit(false); }
    setLoading(false);
  };

  const addSubject = async () => {
    if (!newSub.trim()) return;
    const { data: { user }, error: authErr } = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: new Error("auth") }));
    if (authErr || !user) return;
    const { data, error } = await supabase.from("subjects")
      .insert({ user_id: user.id, name: newSub.trim(), color: newColor })
      .select().single();
    if (error) { toast.error("Failed to add subject"); return; }
    setSubjects(prev => [...prev, data]);
    setNewSub("");
    toast.success(`"${newSub.trim()}" added! ✅`);
  };

  const delSubject = async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    setSubjects(prev => prev.filter(s => s.id !== id));
    toast.success("Subject removed");
  };

  const updateSubjectColor = async (id: string, color: string) => {
    await supabase.from("subjects").update({ color }).eq("id", id);
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, color } : s));
  };

  const avatar  = (name || "S")[0].toUpperCase();
  const tabs    = [
    { id: "personal"  as const, label: "Personal Info",    icon: User          },
    { id: "academic"  as const, label: "Academic Details", icon: GraduationCap },
    { id: "subjects"  as const, label: "My Subjects",      icon: BookOpen      },
  ];

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".05em", color: "var(--muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
        {value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Not set</span>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, fontFamily: "inherit" }}>

      {/* ── Hero Banner ── */}
      <div style={{
        borderRadius: 20, padding: "28px 32px", marginBottom: 24,
        background: "linear-gradient(135deg,#0E2448,#1A1060)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -30, top: -30,
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(79,142,247,.2) 0%,transparent 70%)",
        }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: "linear-gradient(135deg,#4F8EF7,#A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, color: "#fff", fontWeight: 800,
          }}>
            {avatar}
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-lora),serif", fontSize: 26, color: "#fff" }}>
              {name || "Student"}
            </h2>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginTop: 4 }}>
              {eduLevel || "Student"}{institution ? ` · ${institution}` : ""}
            </p>
            {bio && <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, marginTop: 6, fontStyle: "italic" }}>"{bio}"</p>}
          </div>
          <div style={{ marginLeft: "auto" }}>
            {edit ? (
              <button onClick={saveProfile} disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "#34D399", color: "#fff", cursor: "pointer",
                  fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                }}>
                <Save size={16}/>
                {loading ? "Saving…" : "Save Changes"}
              </button>
            ) : (
              <button onClick={() => setEdit(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "rgba(255,255,255,.15)", color: "#fff",
                  cursor: "pointer", fontWeight: 600, fontSize: 14,
                  fontFamily: "inherit",
                }}>
                <Edit3 size={16}/>Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 12, cursor: "pointer",
              border: `1px solid ${tab === id ? "#4F8EF7" : "var(--border)"}`,
              background: tab === id ? "#4F8EF722" : "transparent",
              color: tab === id ? "#4F8EF7" : "var(--muted)",
              fontWeight: 600, fontSize: 13, fontFamily: "inherit",
              transition: "all .15s",
            }}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </div>

      {/* ── Personal Info ── */}
      {tab === "personal" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ borderRadius: 20, padding: 24, border: "1px solid var(--border)", background: "var(--card)" }}>
            <h3 style={{ fontFamily: "var(--font-lora),serif", fontSize: 18, color: "var(--text)", marginBottom: 20 }}>
              Basic Information
            </h3>
            {edit ? (
              <>
                <FormInput label="Full Name"     value={name}    onChange={setName}    placeholder="Your name"/>
                <FormInput label="Date of Birth" value={dob}     onChange={setDob}     type="date"/>
                <FormInput label="Phone"         value={phone}   onChange={setPhone}   placeholder="+91 98765 43210"/>
                <FormInput label="City"          value={city}    onChange={setCity}    placeholder="Your city"/>
                <FormInput label="Country"       value={country} onChange={setCountry} placeholder="India"/>
                <FormTextarea label="Bio / About" value={bio} onChange={setBio} placeholder="Tell something about yourself…"/>
              </>
            ) : (
              <>
                <InfoRow label="Full Name"     value={name}    />
                <InfoRow label="Date of Birth" value={dob}     />
                <InfoRow label="Phone"         value={phone}   />
                <InfoRow label="City"          value={city}    />
                <InfoRow label="Country"       value={country} />
                {bio && (
                  <div style={{ padding: "10px 14px", background: "var(--bg)", borderRadius: 10, fontStyle: "italic", color: "var(--muted)", fontSize: 13 }}>
                    "{bio}"
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ borderRadius: 20, padding: 24, border: "1px solid var(--border)", background: "var(--card)" }}>
            <h3 style={{ fontFamily: "var(--font-lora),serif", fontSize: 18, color: "var(--text)", marginBottom: 20 }}>
              Study Goals
            </h3>
            {edit ? (
              <>
                <FormTextarea label="My Goals" value={goals} onChange={setGoals} placeholder="Score 95% in finals…" rows={4}/>
                <FormInput label="Daily Study Target (hours)" value={dailyHours} onChange={setDailyHours} type="number" placeholder="4"/>
                <FormInput label="Next Exam Date" value={examDate} onChange={setExamDate} type="date"/>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--bg)", borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 6 }}>My Goals</div>
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>
                    {goals || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>No goals set yet</span>}
                  </p>
                </div>
                <InfoRow label="Daily Study Target" value={dailyHours ? `${dailyHours} hours/day` : ""}/>
                <InfoRow label="Next Exam Date"      value={examDate}/>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Academic Details ── */}
      {tab === "academic" && (
        <div style={{ borderRadius: 20, padding: 24, border: "1px solid var(--border)", background: "var(--card)" }}>
          <h3 style={{ fontFamily: "var(--font-lora),serif", fontSize: 18, color: "var(--text)", marginBottom: 20 }}>
            Academic Details
          </h3>
          {edit ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <FormInput   label="School / College / University" value={institution} onChange={setInstitution} placeholder="Institution name"/>
              <FormSelect  label="Education Level" value={eduLevel} onChange={setEduLevel} options={EDU_LEVELS}/>
              <FormSelect  label="Stream / Field"  value={stream}   onChange={setStream}   options={STREAMS}/>
              <FormInput   label="Roll No / Student ID" value={rollNo}  onChange={setRollNo}  placeholder="Optional"/>
              <FormInput   label="Year / Semester"      value={yearSem} onChange={setYearSem} placeholder="e.g. 2nd Year"/>
              <FormInput   label="Board / University"   value={board}   onChange={setBoard}   placeholder="e.g. CBSE, GTU"/>
              <div style={{ gridColumn: "1/-1" }}>
                <FormTextarea label="Achievements / Awards" value={awards} onChange={setAwards} placeholder="School topper, Science Olympiad…"/>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["🏫","Institution",   institution],
                ["🎓","Education Level",eduLevel],
                ["📖","Stream / Field", stream],
                ["🔢","Roll No / ID",   rollNo],
                ["📅","Year / Semester",yearSem],
                ["🏛️","Board / University",board],
              ].map(([ico, lbl, val]) => (
                <div key={lbl} style={{ padding: "14px 16px", background: "var(--bg)", borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{ico}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" as const }}>{lbl}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                    {val || <span style={{ color: "var(--muted)", fontStyle: "italic", fontWeight: 400 }}>Not set</span>}
                  </div>
                </div>
              ))}
              {awards && (
                <div style={{ gridColumn: "1/-1", padding: "14px 16px", background: "var(--bg)", borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 6 }}>🏆 Achievements</div>
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{awards}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── My Subjects ── */}
      {tab === "subjects" && (
        <div style={{ borderRadius: 20, padding: 24, border: "1px solid var(--border)", background: "var(--card)" }}>
          <h3 style={{ fontFamily: "var(--font-lora),serif", fontSize: 18, color: "var(--text)", marginBottom: 6 }}>
            Manage Your Subjects
          </h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            These subjects appear everywhere in the app.
          </p>

          {/* Add new subject */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 6 }}>
                Subject Name
              </label>
              <input
                value={newSub}
                onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSubject()}
                placeholder="e.g. Economics, French…"
                style={{
                  width: "100%", borderRadius: 12, padding: "10px 14px",
                  fontSize: 14, fontFamily: "inherit", outline: "none",
                  border: "1px solid var(--border)",
                  background: "var(--bg)", color: "var(--text)",
                }}
                onFocus={e => e.target.style.borderColor = "#4F8EF7"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 6 }}>
                Color
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 200 }}>
                {COLOR_PALETTE.slice(0, 8).map(c => (
                  <button key={c} onClick={() => setNewColor(c)}
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: c, cursor: "pointer",
                      border: newColor === c ? "3px solid white" : "2px solid transparent",
                      outline: newColor === c ? `2px solid ${c}` : "none",
                      transition: "all .15s",
                    }}/>
                ))}
              </div>
            </div>
            <button onClick={addSubject}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 12, border: "none",
                background: "#4F8EF7", color: "#fff", cursor: "pointer",
                fontWeight: 600, fontSize: 14, fontFamily: "inherit",
              }}>
              <Plus size={15}/>Add
            </button>
          </div>

          {/* Subjects list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {subjects.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: .2 }}/>
                <p>No subjects yet. Add one above!</p>
              </div>
            )}
            {subjects.map(s => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12,
                background: "var(--bg)", border: "1px solid var(--border)",
              }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{s.name}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {COLOR_PALETTE.slice(0, 8).map(c => (
                    <button key={c} onClick={() => updateSubjectColor(s.id, c)}
                      style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: c, cursor: "pointer",
                        border: s.color === c ? "2px solid white" : "1px solid transparent",
                        outline: s.color === c ? `2px solid ${c}` : "none",
                      }}/>
                  ))}
                </div>
                <button onClick={() => delSubject(s.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", opacity: .6 }}>
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
