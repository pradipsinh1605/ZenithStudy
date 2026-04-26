// Input validation utilities for StudyBuddy AI

export const validate = {
  // Email
  email(v: string): string | null {
    if (!v.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Invalid email format";
    return null;
  },

  // Password
  password(v: string): string | null {
    if (!v) return "Password is required";
    if (v.length < 6) return "Password must be at least 6 characters";
    return null;
  },

  // Name
  name(v: string): string | null {
    if (!v.trim()) return "Name is required";
    if (v.trim().length < 2) return "Name too short";
    if (v.length > 100) return "Name too long";
    return null;
  },

  // Task title
  taskTitle(v: string): string | null {
    if (!v.trim()) return "Task title is required";
    if (v.trim().length < 2) return "Title too short";
    if (v.length > 200) return "Title too long (max 200 chars)";
    return null;
  },

  // Note title
  noteTitle(v: string): string | null {
    if (!v.trim()) return "Note title is required";
    if (v.length > 200) return "Title too long";
    return null;
  },

  // Chat message
  chatMessage(v: string): string | null {
    if (!v.trim()) return "Message cannot be empty";
    if (v.trim().length < 2) return "Message too short";
    if (v.length > 2000) return "Message too long (max 2000 chars)";
    return null;
  },

  // Generic required
  required(v: string, field = "Field"): string | null {
    if (!v || !v.trim()) return `${field} is required`;
    return null;
  },
};

// Sanitize text (remove HTML/script)
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
