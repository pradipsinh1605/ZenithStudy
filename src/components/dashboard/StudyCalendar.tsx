"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Reminder = {
  id: string;
  date: string;
  title: string;
  time: string;
};

const STORAGE_KEY = "learnixio-reminders-v1";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function StudyCalendar() {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => toDateKey(new Date()));
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("18:00");
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setReminders(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch {}
  }, [reminders]);

  const cells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const result: Array<{ day: number | null; key: string | null }> = [];

    for (let i = 0; i < firstDay; i++) result.push({ day: null, key: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      result.push({ day, key: toDateKey(date) });
    }
    while (result.length % 7 !== 0) result.push({ day: null, key: null });

    return result;
  }, [month]);

  const selectedReminders = reminders
    .filter((reminder) => reminder.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));

  const monthLabel = month.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const todayKey = toDateKey(new Date());

  const addReminder = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error("Reminder title enter karo");
      return;
    }

    setReminders((current) => [
      ...current,
      { id: crypto.randomUUID(), date: selected, title: cleanTitle, time },
    ]);
    setTitle("");
    toast.success("Reminder added");
  };

  const deleteReminder = (id: string) => {
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
    toast.success("Reminder removed");
  };

  return (
    <section className="study-calendar-card">
      <style>{`
        .study-calendar-card {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr);
          gap: 18px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(96,165,250,.1), transparent 35%),
            var(--card);
          padding: 18px;
          box-shadow: 0 14px 40px rgba(0,0,0,.12);
          overflow: hidden;
        }

        .calendar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 7px;
        }

        .calendar-day,
        .calendar-weekday {
          min-height: 42px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          position: relative;
          font-weight: 900;
        }

        .calendar-weekday {
          min-height: 24px;
          color: var(--muted);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .calendar-day {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
          animation: calendarPop .34s cubic-bezier(.2,1,.22,1) both;
          transition: transform .22s cubic-bezier(.2,1,.22,1), border-color .2s, background .2s;
        }

        .calendar-day:hover {
          transform: translateY(-3px) scale(1.03);
          border-color: var(--primary);
          background: var(--primary-soft);
        }

        .calendar-day.active {
          color: white;
          border-color: transparent;
          background: linear-gradient(135deg, #A100FF, #7C3AED);
          box-shadow: 0 12px 26px rgba(124,58,237,.32);
        }

        .calendar-day.today:not(.active) {
          color: var(--primary);
          border-color: var(--primary);
        }

        .calendar-dot {
          position: absolute;
          bottom: 6px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 12px rgba(245,158,11,.85);
        }

        .reminder-panel {
          border: 1px solid var(--border);
          border-radius: 14px;
          background: rgba(255,255,255,.035);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .reminder-item {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          padding: 10px 11px;
          animation: reminderIn .32s cubic-bezier(.2,1,.22,1) both;
        }

        @keyframes calendarPop {
          from { opacity: 0; transform: translateY(10px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes reminderIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 820px) {
          .study-calendar-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div>
        <div className="calendar-top">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="animate-float"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg,#2563EB,#14B8A6)",
                color: "#fff",
                boxShadow: "0 12px 28px rgba(37,99,235,.22)",
              }}
            >
              <CalendarDays size={20} />
            </div>
            <div>
              <h3
                style={{
                  color: "var(--text)",
                  fontFamily: "var(--font-lora),serif",
                  fontSize: 19,
                  fontWeight: 800,
                }}
              >
                Study Calendar
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 3, fontWeight: 700 }}>
                Pick a date and set reminders
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="icon-btn"
              type="button"
              onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
              aria-label="Previous month"
              style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ minWidth: 134, textAlign: "center", color: "var(--text)", fontWeight: 900, fontSize: 13 }}>
              {monthLabel}
            </div>
            <button
              className="icon-btn"
              type="button"
              onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
              aria-label="Next month"
              style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="calendar-grid" style={{ marginBottom: 7 }}>
          {WEEKDAYS.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((cell, index) =>
            cell.key ? (
              <button
                key={cell.key}
                className={`calendar-day${cell.key === selected ? " active" : ""}${
                  cell.key === todayKey ? " today" : ""
                }`}
                style={{ animationDelay: `${Math.min(index, 35) * 14}ms` }}
                type="button"
                onClick={() => setSelected(cell.key!)}
              >
                {cell.day}
                {reminders.some((reminder) => reminder.date === cell.key) && <span className="calendar-dot" />}
              </button>
            ) : (
              <div key={`empty-${index}`} />
            )
          )}
        </div>
      </div>

      <aside className="reminder-panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 15 }}>{selectedLabel}</div>
            <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 3, fontWeight: 700 }}>
              {selectedReminders.length} reminders
            </div>
          </div>
          <Bell size={18} color="var(--primary)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0, 1fr) 42px", gap: 8 }}>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            style={inputStyle}
          />
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addReminder();
            }}
            placeholder="Reminder title"
            style={inputStyle}
          />
          <button
            className="icon-btn"
            type="button"
            onClick={addReminder}
            aria-label="Add reminder"
            style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Plus size={17} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 126 }}>
          {selectedReminders.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                border: "1px dashed var(--border)",
                borderRadius: 12,
                color: "var(--muted)",
                fontSize: 12,
                fontWeight: 700,
                textAlign: "center",
                padding: 18,
              }}
            >
              No reminders for this date
            </div>
          ) : (
            selectedReminders.map((reminder) => (
              <div key={reminder.id} className="reminder-item">
                <div
                  style={{
                    width: 42,
                    borderRadius: 9,
                    color: "#fff",
                    background: "linear-gradient(135deg,#A100FF,#7C3AED)",
                    padding: "6px 0",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {reminder.time}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "var(--text)",
                      fontSize: 13,
                      fontWeight: 900,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {reminder.title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderToDelete(reminder.id)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    border: "1px solid rgba(248,113,113,.25)",
                    background: "rgba(248,113,113,.08)",
                    color: "#F87171",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                  aria-label="Delete reminder"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <ConfirmModal
        isOpen={reminderToDelete !== null}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder?"
        onConfirm={() => reminderToDelete && deleteReminder(reminderToDelete)}
        onCancel={() => setReminderToDelete(null)}
      />
    </section>
  );
}

const inputStyle = {
  width: "100%",
  height: 42,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  outline: "none",
  padding: "0 10px",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};
