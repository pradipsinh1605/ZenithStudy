import { NextRequest, NextResponse } from "next/server";

// ── Rate limiting (in-memory) ──
const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const limit = rateLimit.get(ip);
  if (!limit || now > limit.reset) {
    rateLimit.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (limit.count >= 20) return false;
  limit.count++;
  return true;
}

function sanitize(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, 4000);
}

const BLOCKED_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all instructions/i,
  /you are now/i,
  /pretend you are/i,
  /disregard/i,
  /forget everything/i,
  /new instructions/i,
  /system prompt/i,
];

function isPromptInjection(text: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(text));
}

function validateMessages(messages: any[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  if (messages.length > 20) return false;
  return messages.every(m =>
    m && typeof m.role === "string" &&
    (typeof m.content === "string" || Array.isArray(m.content)) &&
    ["user", "assistant", "system"].includes(m.role)
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }

    let body: any;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

    const { messages, system, type, attachment } = body;

    if (!validateMessages(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const lastMsg    = messages[messages.length - 1];
    const lastContent = typeof lastMsg.content === "string" ? lastMsg.content : "";
    const cleanContent = sanitize(lastContent);

    if (isPromptInjection(cleanContent)) {
      return NextResponse.json(
        { text: "I can only help with educational topics. Please ask a study-related question! 📚" },
        { status: 200 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    // ── Build messages with attachment support ──
    let cleanMessages = messages.slice(0, -1).map((m: any) => ({
      role: m.role,
      content: typeof m.content === "string" ? sanitize(m.content) : m.content,
    }));

    // Last message — handle attachment (PDF / Image)
    let lastMessageContent: any = cleanContent;
    if (attachment) {
      const mediaType = attachment.type === "pdf" ? "application/pdf" : "image/jpeg";
      // Use vision model for images, text model for PDFs
      if (attachment.type === "image") {
        lastMessageContent = [
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${attachment.data}` } },
          { type: "text", text: cleanContent || "Describe this image in detail for studying." },
        ];
      } else {
        // PDF — send as text with document context instruction
        lastMessageContent = `[PDF Document: "${attachment.name}"]\n\nPlease analyze this PDF document content and answer: ${cleanContent}\n\nNote: PDF base64 data is attached. Extract key educational information.`;
      }
    }

    cleanMessages.push({ role: "user", content: lastMessageContent });

    // Choose model — vision model for images
    const model = attachment?.type === "image"
      ? "llama-3.2-11b-vision-preview"
      : "llama-3.3-70b-versatile";

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 45_000);

    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens:  type === "diagram" ? 800 : type === "json" ? 2000 : 1500,
          temperature: type === "diagram" ? 0.2 : type === "json" ? 0.3 : 0.7,
          stream: false,
          messages: system
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
    } finally { clearTimeout(timeout); }

    if (!res.ok) {
      if (res.status === 429) return NextResponse.json({ error: "AI service busy. Please wait a moment." }, { status: 429 });
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";

    if (!text) return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });

    return NextResponse.json({ text });

  } catch (e: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
