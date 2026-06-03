"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { TimerProvider } from "@/lib/TimerContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileText,
  Home,
  Layers,
  LogOut,
  Moon,
  Settings,
  Sun,
  Timer,
  Trophy,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { onXPUpdate } from "@/lib/xp-utils";
import PageTransition from "@/components/ui/PageTransition";

const USER_CACHE_KEY = "sb-user-cache";
const CACHE_TTL = 5 * 60 * 1000;

function getCachedUser() {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedUser(data: any) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

const NAV = [
  { href: "/dashboard", icon: Home, label: "Home", full: "Dashboard" },
  { href: "/planner", icon: CheckSquare, label: "Tasks", full: "Planner" },
  { href: "/notes", icon: FileText, label: "Notes", full: "Notes" },
  { href: "/flashcards", icon: Layers, label: "Cards", full: "Flashcards" },
  { href: "/timer", icon: Timer, label: "Focus", full: "Focus Timer" },
  { href: "/ai", icon: Brain, label: "Tutor", full: "AI Tutor" },
  { href: "/timetable", icon: Calendar, label: "Schedule", full: "Timetable" },
  { href: "/progress", icon: BarChart2, label: "Progress", full: "Progress" },
  { href: "/achievements", icon: Trophy, label: "Awards", full: "Achievements" },
  { href: "/profile", icon: User, label: "Profile", full: "My Profile" },
  { href: "/settings", icon: Settings, label: "Settings", full: "Settings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const bellRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("Student");
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [eduLevel, setEduLevel] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [uid, setUid] = useState("");
  const [navPct, setNavPct] = useState(0);
  const [navLoading, setNavLoading] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [navIdle, setNavIdle] = useState(false);
  const [isScrolledEnd, setIsScrolledEnd] = useState(false);
  const lastScrollY = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = useMemo(
    () => NAV.find((item) => isActive(pathname, item.href)) ?? NAV[0],
    [pathname]
  );
  const CurrentIcon = current.icon;
  const isAIPage = pathname === "/ai";

  useEffect(() => {
    setMounted(true);
    fetchUser();

    const closeBell = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    };

    document.addEventListener("mousedown", closeBell);
    return () => document.removeEventListener("mousedown", closeBell);
  }, []);

  useEffect(() => {
    setNavLoading(true);
    setNavPct(35);
    const middle = setTimeout(() => setNavPct(78), 90);
    const end = setTimeout(() => setNavPct(100), 220);
    const done = setTimeout(() => {
      setNavLoading(false);
      setNavPct(0);
    }, 430);

    return () => {
      clearTimeout(middle);
      clearTimeout(end);
      clearTimeout(done);
    };
  }, [pathname]);

  useEffect(() => {
    if (!uid) return;
    return onXPUpdate(() => {
      supabase
        .from("user_xp")
        .select("total_xp,streak")
        .eq("user_id", uid)
        .single()
        .then(({ data }) => {
          if (!data) return;
          setXp(data.total_xp || 0);
          setStreak(data.streak || 0);
        });
    });
  }, [uid, supabase]);

  useEffect(() => {
    const wakeNav = () => {
      setNavIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setNavIdle(true), 2000);
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      const movingDown = currentY > lastScrollY.current + 8;
      const movingUp = currentY < lastScrollY.current - 8;

      wakeNav();
      if (currentY < 80) setNavHidden(false);
      else if (movingDown) setNavHidden(true);
      else if (movingUp) setNavHidden(false);

      lastScrollY.current = currentY;
    };

    const onPointerMove = (event: PointerEvent) => {
      const nearDock = window.innerHeight - event.clientY < 128;
      if (nearDock) {
        setNavHidden(false);
        wakeNav();
      }
    };

    wakeNav();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  const fetchUser = async (forceRefresh = false) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUid(user.id);

      if (!forceRefresh) {
        const cached = getCachedUser();
        if (cached && cached.uid === user.id) {
          setName(cached.name);
          setEduLevel(cached.eduLevel);
          setXp(cached.xp);
          setStreak(cached.streak);
          setTasks(cached.tasks);
          setTimetable(cached.timetable ?? cached.tt ?? []);
          return;
        }
      }

      const [{ data: profile }, { data: userXp }, { data: taskRows }, { data: tableRows }] =
        await Promise.all([
          supabase.from("profiles").select("name,edu_level").eq("user_id", user.id).single(),
          supabase.from("user_xp").select("total_xp,streak").eq("user_id", user.id).single(),
          supabase.from("tasks").select("*").eq("user_id", user.id).eq("done", false),
          supabase.from("timetable").select("*").eq("user_id", user.id),
        ]);

      const nextName = profile?.name || user.email?.split("@")[0] || "Student";
      const nextEduLevel = profile?.edu_level || "Student";
      const nextXp = userXp?.total_xp || 0;
      const nextStreak = userXp?.streak || 0;
      const nextTasks = taskRows || [];
      const nextTimetable = tableRows || [];

      setName(nextName);
      setEduLevel(nextEduLevel);
      setXp(nextXp);
      setStreak(nextStreak);
      setTasks(nextTasks);
      setTimetable(nextTimetable);
      setCachedUser({
        uid: user.id,
        name: nextName,
        eduLevel: nextEduLevel,
        xp: nextXp,
        streak: nextStreak,
        tasks: nextTasks,
        timetable: nextTimetable,
      });
    } catch {
      // Keep the shell usable even when one dashboard summary query fails.
    }
  };

  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpPct = Math.min(100, (xpInLevel / 500) * 100);
  const avatar = name?.[0]?.toUpperCase() || "S";
  const today = new Date().toISOString().slice(0, 10);
  const todayDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const dueTasks = tasks.filter((task) => task.deadline === today);
  const upcomingTasks = tasks.filter((task) => task.deadline && task.deadline > today).slice(0, 3);
  const classesToday = timetable.filter((entry) => entry.day === todayDay);
  const unread = dueTasks.length + classesToday.length;

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <TimerProvider>
      <div className="app-shell">
        <style dangerouslySetInnerHTML={{ __html: `
          .app-shell {
            min-height: 100vh;
            overflow-x: hidden;
            background: var(--bg);
            color: var(--text);
            font-family: var(--font-dm-sans), var(--font-sora), sans-serif;
          }

          .app-progress {
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            width: ${navPct}%;
            opacity: ${navLoading ? 1 : 0};
            z-index: 9999;
            background: linear-gradient(90deg, var(--primary), #14B8A6, #F59E0B);
            transition: width .18s ease, opacity .22s ease;
          }

          .app-header {
            position: sticky;
            top: 0;
            z-index: 50;
            backdrop-filter: blur(22px);
            background: var(--nav-bg);
            border-bottom: 1px solid var(--border);
          }

          .app-header-inner {
            max-width: 1240px;
            margin: 0 auto;
            padding: 12px 22px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 18px;
            align-items: center;
          }

          .brand-mark {
            width: 38px;
            height: 38px;
            border-radius: var(--radius-sm);
            display: grid;
            place-items: center;
            color: white;
            background: var(--primary);
          }

          .icon-btn {
            width: 38px;
            height: 38px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--muted);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: color .18s ease, border-color .18s ease, background .18s ease;
          }

          .icon-btn:hover {
            color: var(--primary);
            border-color: var(--primary);
            background: var(--primary-soft);
          }

          .profile-chip {
            height: 40px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 12px 0 7px;
            border: 1px solid var(--border);
            border-radius: 14px;
            background: var(--glass-card);
            backdrop-filter: blur(18px);
          }

          .page-wrap {
            width: min(100%, var(--page-max));
            margin: 0 auto;
            padding: clamp(16px, 2.4vw, 28px) var(--page-pad) calc(132px + env(safe-area-inset-bottom));
          }

          .page-heading {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 16px;
            align-items: end;
            margin-bottom: 20px;
          }

          .student-strip {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .metric-pill {
            min-height: 36px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border-radius: var(--radius-sm);
            padding: 7px 10px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--muted);
            font-size: 12px;
            font-weight: 700;
          }

          .bottom-nav {
            position: fixed;
            left: 50%;
            bottom: max(14px, env(safe-area-inset-bottom));
            z-index: 70;
            width: min(600px, calc(100vw - 24px));
            min-height: 60px;
            transform: translateX(-50%);
            border: 1px solid var(--border);
            border-radius: 16px;
            background: rgba(120, 120, 120, 0.15);
            backdrop-filter: blur(32px);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            animation: navFloatIn .55s cubic-bezier(.2,1,.22,1) both;
            transition:
              transform .34s cubic-bezier(.2,1,.22,1),
              opacity .24s ease,
              filter .24s ease,
              box-shadow .24s ease;
          }

          .bottom-nav-scroll {
            display: flex;
            align-items: center;
            gap: 20px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding: 6px 8px;
            width: 100%;
            height: 100%;
            scrollbar-width: none;
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
          }

          .bottom-nav-scroll::-webkit-scrollbar {
            display: none;
          }

          .bottom-nav.nav-hidden,
          .bottom-nav.nav-idle {
            transform: translateX(-50%) translateY(110px) scale(.98);
            opacity: 0;
            pointer-events: none;
          }

          .bottom-nav:hover,
          .bottom-nav:focus-within {
            opacity: 1;
            filter: saturate(1.12);
          }

          .nav-hit-zone {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            height: 124px;
            z-index: 60;
            pointer-events: auto;
          }



          .bottom-link {
            flex: 0 0 72px;
            height: 48px;
            padding: 0 4px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: rgba(226,232,240,.76);
            text-decoration: none;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            flex: 0 0 auto;
            border: 1px solid transparent;
            position: relative;
            transition:
              background .22s ease,
              color .22s ease,
              transform .22s ease,
              box-shadow .22s ease,
              border-color .22s ease;
          }

          .bottom-link:not(:last-child)::before {
            content: "";
            position: absolute;
            right: -10.5px;
            top: 25%;
            height: 50%;
            width: 1px;
            background: var(--border);
            opacity: 0.6;
            pointer-events: none;
          }

          .bottom-link:hover {
            color: #fff;
            background: rgba(255,255,255,.07);
            transform: translateY(-2px);
          }

          .bottom-link.active {
            color: var(--primary);
            background: var(--primary-soft);
            border-color: transparent;
            box-shadow: none;
          }

          .bottom-link svg {
            flex: 0 0 auto;
            transition: transform .24s cubic-bezier(.2,1,.22,1);
          }

          .bottom-link:hover svg,
          .bottom-link.active svg {
            transform: translateY(-1px) scale(1.12);
          }

          .bottom-link::after {
            content: attr(data-label);
            position: fixed;
            left: 50%;
            bottom: 88px;
            transform: translateX(-50%) translateY(8px);
            pointer-events: none;
            opacity: 0;
            padding: 7px 10px;
            border-radius: 10px;
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--text);
            box-shadow: 0 14px 40px rgba(0,0,0,.2);
            font-size: 12px;
            font-weight: 900;
            white-space: nowrap;
            transition: opacity .18s ease, transform .18s ease;
          }

          .bottom-link:not(.active):hover::after {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }

          @keyframes navFloatIn {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(22px) scale(.96);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0) scale(1);
            }
          }

          @media (min-width: 901px) {
            .bottom-nav {
              grid-auto-columns: minmax(68px, 1fr);
              padding: 10px 16px;
            }
          }

          @media (max-width: 900px) {
            .app-header-inner {
              grid-template-columns: minmax(0, 1fr) auto;
            }

            .profile-chip {
              display: none;
            }

            .page-heading {
              grid-template-columns: 1fr;
            }

            .student-strip {
              justify-content: flex-start;
            }

            .bottom-nav {
              width: min(560px, calc(100vw - 20px));
              min-height: 56px;
              border-radius: 14px;
            }

            .bottom-nav-scroll {
              gap: 16px;
            }

            .bottom-link:not(:last-child)::before {
              right: -8.5px;
            }

            .bottom-link {
              flex: 0 0 64px;
              height: 44px;
              border-radius: 10px;
              font-size: 10px;
            }
          }

          @media (max-width: 560px) {
            .app-header-inner {
              padding: 10px 14px;
            }

            .page-wrap {
              padding: 16px 12px calc(112px + env(safe-area-inset-bottom));
            }

            .bottom-nav {
              width: min(100vw - 20px, 420px);
              min-height: 52px;
              border-radius: 12px;
            }

            .bottom-nav-scroll {
              gap: 14px;
              padding: 6px;
            }

            .bottom-link:not(:last-child)::before {
              right: -7.5px;
            }

            .bottom-link {
              flex: 0 0 58px;
              height: 42px;
              border-radius: 10px;
              font-size: 9px;
            }

            .bottom-link svg { width: 17px; height: 17px; }

            .brand-copy p {
              display: none;
            }

            .student-strip { gap: 6px; }
          }

          .page-wrap.ai-mode {
            padding: 16px 20px 16px 20px !important;
            height: calc(100vh - 72px);
            display: flex;
            flex-direction: column;
          }
          @media (max-width: 560px) {
            .page-wrap.ai-mode {
              padding: 12px !important;
            }
          }
        `}} />

        <div className="app-progress" />

        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div className="brand-mark">
                <BookOpen size={20} />
              </div>
              <div className="brand-copy" style={{ minWidth: 0 }}>
                <div style={{ color: "var(--text)", fontSize: 16, fontWeight: 900, lineHeight: 1 }}>
                  StudyBuddy
                </div>
                <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 4, fontWeight: 700 }}>
                  Learn, plan, revise
                </p>
              </div>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <div className="profile-chip">
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--primary)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {avatar}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      maxWidth: 130,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--text)",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {name}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>
                    Lv {level} - {eduLevel || "Student"}
                  </div>
                </div>
              </div>

              <div ref={bellRef} style={{ position: "relative" }}>
                <button
                  className="icon-btn"
                  onClick={() => setBellOpen((value) => !value)}
                  aria-label="Notifications"
                  type="button"
                >
                  <Bell size={17} />
                  {unread > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                        minWidth: 17,
                        height: 17,
                        borderRadius: 9,
                        background: "var(--danger)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 9,
                        fontWeight: 900,
                        border: "2px solid var(--surface)",
                      }}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: 46,
                      right: 0,
                      width: 330,
                      maxWidth: "calc(100vw - 28px)",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      borderRadius: 8,
                      boxShadow: "var(--shadow-lg)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 14 }}>Today</div>
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 3 }}>
                        {unread > 0 ? `${unread} item needs attention` : "No urgent reminders"}
                      </div>
                    </div>

                    <div style={{ maxHeight: 320, overflowY: "auto", padding: 10 }}>
                      {classesToday.length === 0 && dueTasks.length === 0 && upcomingTasks.length === 0 ? (
                        <div style={{ padding: 30, textAlign: "center", color: "var(--muted)" }}>
                          <CheckCircle2 size={34} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
                          <div style={{ fontSize: 13, fontWeight: 800 }}>All clear</div>
                        </div>
                      ) : (
                        <>
                          {classesToday.map((item: any) => (
                            <div key={item.id} style={noticeStyle("var(--primary-soft)")}>
                              <Calendar size={15} color="var(--primary)" />
                              <div style={{ minWidth: 0 }}>
                                <div style={noticeTitleStyle}>{item.subject}</div>
                                <div style={noticeMetaStyle}>
                                  {item.start_time}-{item.end_time}
                                  {item.room ? ` - ${item.room}` : ""}
                                </div>
                              </div>
                            </div>
                          ))}
                          {dueTasks.map((item: any) => (
                            <div key={item.id} style={noticeStyle("rgba(239,68,68,.08)")}>
                              <Clock size={15} color="var(--danger)" />
                              <div style={{ minWidth: 0 }}>
                                <div style={noticeTitleStyle}>{item.title}</div>
                                <div style={{ ...noticeMetaStyle, color: "var(--danger)" }}>Due today</div>
                              </div>
                            </div>
                          ))}
                          {upcomingTasks.map((item: any) => (
                            <div key={item.id} style={noticeStyle("var(--soft)")}>
                              <Clock size={15} color="#F59E0B" />
                              <div style={{ minWidth: 0 }}>
                                <div style={noticeTitleStyle}>{item.title}</div>
                                <div style={noticeMetaStyle}>{item.deadline}</div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {mounted && (
                <button
                  className="icon-btn"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                  type="button"
                >
                  {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              )}

              <button className="icon-btn" onClick={logout} aria-label="Sign out" type="button">
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <main className={`page-wrap${isAIPage ? " ai-mode" : ""}`}>
          {!isAIPage && (
            <section className="page-heading">
              <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                  }}
                >
                  <CurrentIcon size={18} />
                </div>
                <div>
                  <h1
                    style={{
                      fontFamily: "var(--font-dm-serif), var(--font-lora), serif",
                      color: "var(--text)",
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {current.full}
                  </h1>
                  <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                    {new Date().toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="student-strip">
              <div className="metric-pill">
                <span style={{ color: "var(--primary)" }}>{xp}</span> XP
              </div>
              <div className="metric-pill">
                <span style={{ color: "#F59E0B" }}>{streak}</span> day streak
              </div>
              <div className="metric-pill" style={{ minWidth: 140 }}>
                <span>Lv {level}</span>
                <span
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    overflow: "hidden",
                    background: "var(--soft)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: `${xpPct}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,var(--primary),#14B8A6)",
                    }}
                  />
                </span>
              </div>
            </div>
          </section>
          )}

          <PageTransition>{children}</PageTransition>
        </main>

        {!isAIPage && (
          <>
            <div className="nav-hit-zone" onMouseEnter={() => { setNavHidden(false); setNavIdle(false); }} />

            <nav
              className={`bottom-nav${navHidden ? " nav-hidden" : ""}${navIdle ? " nav-idle" : ""}`}
          aria-label="Primary navigation"
          onMouseEnter={() => { setNavHidden(false); setNavIdle(false); }}
        >
          <div 
            className="bottom-nav-scroll"
            onScroll={(e) => {
              const t = e.currentTarget;
              setIsScrolledEnd(t.scrollLeft + t.clientWidth >= t.scrollWidth - 10);
            }}
            style={isScrolledEnd ? { maskImage: 'none', WebkitMaskImage: 'none' } : undefined}
          >
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`bottom-link${active ? " active" : ""}`}
                  data-label={label}
                  title={label}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
        </>
        )}
      </div>
    </TimerProvider>
  );
}

const noticeTitleStyle: CSSProperties = {
  color: "var(--text)",
  fontSize: 13,
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const noticeMetaStyle: CSSProperties = {
  color: "var(--muted)",
  fontSize: 11,
  marginTop: 3,
  fontWeight: 700,
};

function noticeStyle(background: string): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background,
    marginBottom: 8,
  };
}
