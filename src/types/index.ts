// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// StudyBuddy AI — TypeScript Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── User & Profile ──
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Profile {
  user_id:     string;
  name:        string;
  dob?:        string;
  phone?:      string;
  city?:       string;
  country?:    string;
  bio?:        string;
  goals?:      string;
  daily_hours?: number;
  exam_date?:  string;
  institution?: string;
  edu_level?:  string;
  stream?:     string;
  roll_no?:    string;
  year_sem?:   string;
  board?:      string;
  awards?:     string;
}

// ── Subject ──
export interface Subject {
  id:      string;
  user_id: string;
  name:    string;
  color:   string;
}

// ── Task ──
export type Priority = "high" | "medium" | "low";

export interface Task {
  id:          string;
  user_id:     string;
  subject_id?: string;
  subject?:    string;
  title:       string;
  deadline?:   string;
  priority:    Priority;
  done:        boolean;
  created_at:  string;
}

// ── Note ──
export interface Note {
  id:         string;
  user_id:    string;
  subject_id?: string;
  subject?:   string;
  title:      string;
  content:    string;
  starred:    boolean;
  created_at: string;
  updated_at: string;
}

// ── Timetable ──
export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type ClassType = "class" | "lab" | "study" | "exam";

export interface TimetableEntry {
  id:         string;
  user_id:    string;
  subject_id?: string;
  subject?:   string;
  day:        DayOfWeek;
  start_time: string;
  end_time:   string;
  room?:      string;
  type:       ClassType;
}

// ── Flashcard ──
export interface Flashcard {
  id:          string;
  user_id:     string;
  subject_id?: string;
  subject?:    string;
  front:       string;
  back:        string;
  difficulty?: number;
  next_review?: string;
}

// ── Study Session ──
export interface StudySession {
  id:           string;
  user_id:      string;
  subject_id?:  string;
  duration_mins: number;
  type:         "pomodoro" | "regular";
  completed:    boolean;
  created_at:   string;
}

// ── XP & Gamification ──
export interface UserXP {
  user_id:     string;
  total_xp:    number;
  level:       number;
  streak:      number;
  last_active: string;
}

export interface Badge {
  id:      string;
  icon:    string;
  name:    string;
  desc:    string;
  earned:  boolean;
}

// ── AI Chat ──
export interface ChatMessage {
  role:      "user" | "assistant";
  content:   string;
  fileName?: string;
  timestamp: string;
}

// ── Notification ──
export type NotifType = "success" | "danger" | "info" | "reminder";

export interface Notification {
  id:       number;
  type:     NotifType;
  title:    string;
  message?: string;
  ts:       number;
}

// ── API Response ──
export interface ApiResponse<T> {
  data?:  T;
  error?: string;
  success: boolean;
}
