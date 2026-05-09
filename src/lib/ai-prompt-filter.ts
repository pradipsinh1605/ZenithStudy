export type PromptFilterResult = {
  allowed: boolean;
  sanitized: string;
  reason?: string;
};

const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bignore\s+(all|any|the|your)?\s*(previous|prior|above)\s+instructions?\b/i, reason: "instruction override" },
  { pattern: /\b(disregard|forget)\s+(all|any|the|your)?\s*(previous|prior|above)\s+instructions?\b/i, reason: "instruction override" },
  { pattern: /\breveal\s+(your\s+)?(system|developer)\s+prompt\b/i, reason: "prompt extraction" },
  { pattern: /\b(repeat|print|show|display)\s+(your\s+)?(system|developer)\s+(prompt|instructions?)\b/i, reason: "prompt extraction" },
  { pattern: /\byou\s+are\s+(now\s+)?dan\b/i, reason: "jailbreak attempt" },
  { pattern: /\bjailbreak\b/i, reason: "jailbreak attempt" },
  { pattern: /\bbase64\s*:\s*[a-z0-9+/=]{24,}/i, reason: "encoded instruction attempt" },
];

export function sanitizePrompt(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, 4000);
}

export function filterPrompt(input: string): PromptFilterResult {
  const sanitized = sanitizePrompt(input);

  for (const item of INJECTION_PATTERNS) {
    if (item.pattern.test(sanitized)) {
      return { allowed: false, sanitized, reason: item.reason };
    }
  }

  return { allowed: true, sanitized };
}
