import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ✅ Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ XP to Level calculator
export function xpToLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

// ✅ Format date nicely
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ✅ Get greeting based on time
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ✅ Subject color map
export const SUBJECT_COLORS: Record<string, string> = {
  Math:      "#4F8EF7",
  Physics:   "#A78BFA",
  Chemistry: "#34D399",
  Biology:   "#F5A623",
  English:   "#F87171",
  History:   "#22D3EE",
  CS:        "#EC4899",
  Economics: "#FB923C",
};

// ✅ Color palette for custom subjects
export const COLOR_PALETTE = [
  "#4F8EF7", "#A78BFA", "#34D399", "#F5A623", "#F87171",
  "#22D3EE", "#EC4899", "#FB923C", "#84CC16", "#E879F9",
  "#38BDF8", "#FBBF24", "#6EE7B7", "#FCA5A5", "#93C5FD",
];

// ✅ Days of week
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// ✅ Priority config
export const PRIORITIES = {
  high:   { label: "High",   color: "#F87171" },
  medium: { label: "Medium", color: "#F5A623" },
  low:    { label: "Low",    color: "#34D399"  },
} as const;

// ✅ Safe notification wrapper
export const safeNotification = {
  get permission(): NotificationPermission {
    try {
      return typeof Notification !== "undefined"
        ? Notification.permission : "denied";
    } catch { return "denied"; }
  },
  async requestPermission(): Promise<NotificationPermission> {
    try {
      return typeof Notification !== "undefined"
        ? await Notification.requestPermission() : "denied";
    } catch { return "denied"; }
  },
  send(title: string, body?: string): void {
    try {
      if (typeof Notification !== "undefined" &&
          Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon.png" });
      }
    } catch {}
  },
};

// ✅ Truncate long text
export function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

// ✅ Debounce (prevent too many API calls)
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T, delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
