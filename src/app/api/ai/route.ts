import { NextRequest, NextResponse } from "next/server";

// ── Rate limiting (in-memory) ──
const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const limit = rateLimit.get(ip);
  if (!limit || now > limit.reset) {
    rateLimit.set(ip, { count: 1, reset: now + 60_000 }); // 1 min window
    return true;
  }
  if (limit.count >= 20) return false; // max 20 req/min
  limit.count++;
  return true;
}

// ── Input sanitization ──
function sanitize(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")           // Remove HTML tags
    .replace(/javascript:/gi, "")       // Remove JS
    .replace(/on\w+\s*=/gi, "")        // Remove event handlers
    .trim()
    .slice(0, 2000);                    // Max 2000 chars
}

// ── Prompt injection detection ──
const BLOCKED_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all instructions/i,
  /you are now/i,
  /act as/i,
  /pretend you are/i,
  /disregard/i,
  /forget everything/i,
  /new instructions/i,
  /system prompt/i,
];

function isPromptInjection(text: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(text));
}

// ── Validate messages ──
function validateMessages(messages: any[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  if (messages.length > 20) return false; // Max conversation length
  return messages.every(m =>
    m && typeof m.role === "string" &&
    typeof m.content === "string" &&
    m.content.length > 0 &&
    m.content.length <= 2000 &&
    ["user", "assistant", "system"].includes(m.role)
  );
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 }
      );
    }

    // ── Parse body ──
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { messages, system, type } = body;

    // ── Validate ──
    if (!validateMessages(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // ── Sanitize + Check injection ──
    const lastMsg = messages[messages.length - 1];
    const cleanContent = sanitize(lastMsg.content);

    if (isPromptInjection(cleanContent)) {
      return NextResponse.json(
        { text: "I can only help with educational topics. Please ask a study-related question! 📚" },
        { status: 200 }
      );
    }

    if (cleanContent.length < 2) {
      return NextResponse.json({ error: "Message too short" }, { status: 400 });
    }

    // ── Sanitize all messages ──
    const cleanMessages = messages.map((m: any) => ({
      role: m.role,
      content: sanitize(m.content),
    }));

    // ── Call Groq API ──
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model:       "llama-3.3-70b-versatile",
          max_tokens:  type === "diagram" ? 800 : 1500,
          temperature: type === "diagram" ? 0.2 : 0.7,
          stream:      false,
          messages:    system
            ? [{ role: "system", content: sanitize(system) }, ...cleanMessages]
            : cleanMessages,
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 408 });
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", res.status, errText);
      if (res.status === 429) {
        return NextResponse.json({ error: "AI service busy. Please wait a moment." }, { status: 429 });
      }
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";

    if (!text) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
    }

    return NextResponse.json({ text });

  } catch (e: any) {
    console.error("AI route error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
