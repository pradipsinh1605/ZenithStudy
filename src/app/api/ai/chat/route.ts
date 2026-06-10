import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/ai-api-responses";
import { filterPrompt, sanitizePrompt } from "@/lib/ai-prompt-filter";
import { checkRateLimit, getClientIp } from "@/lib/ai-rate-limit";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT = 60;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, RATE_LIMIT, WINDOW_MS);

  if (!limit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "AI limit reached. Please try again later.",
      429,
      {
        headers: {
          "Retry-After": String(limit.retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limit.resetAt / 1000)),
        },
      }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return apiError("AI_NOT_CONFIGURED", "Groq service is not configured. Please add GROQ_API_KEY.", 500);
  }

  const groq = new Groq({ apiKey });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("BAD_REQUEST", "Invalid JSON body.", 400);
  }

  const { messages, system, attachment } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return apiError("BAD_REQUEST", "Messages are required.", 400);
  }

  let normalizedMessages = messages
    .filter((message: any) => typeof message?.content === "string")
    .map((message: any) => ({
      role: message.role === "assistant" || message.role === "system" ? message.role : "user",
      content: sanitizePrompt(message.content),
    }));

  // TRUNCATE HISTORY to avoid hitting Groq's Token Per Minute limit.
  // We keep only the last 6 messages (3 interactions).
  if (normalizedMessages.length > 6) {
    normalizedMessages = normalizedMessages.slice(-6);
  }

  if (normalizedMessages.length === 0) {
    return apiError("BAD_REQUEST", "A text message is required.", 400);
  }

  const lastMessage = normalizedMessages[normalizedMessages.length - 1];
  const filtered = filterPrompt(lastMessage.content);

  if (!filtered.allowed) {
    return apiError("FORBIDDEN", filtered.reason || "Prompt injection detected.", 403);
  }

  if (!filtered.sanitized && !attachment) {
    return apiError("BAD_REQUEST", "Message cannot be empty.", 400);
  }

  normalizedMessages[normalizedMessages.length - 1] = {
    ...lastMessage,
    content: filtered.sanitized || "Please analyze this image.",
  };

  const formattedHistory: any[] = [];
  
  // HARDCODED PERSONA
  const HARDCODED_SYSTEM_PROMPT = `You are StudyBuddy AI, a helpful, encouraging, and highly knowledgeable educational tutor. 
Your goal is to help students understand concepts, not just give them the answers. 
Always explain things clearly and concisely. Never use foul language or discuss topics inappropriate for an educational setting.`;
  formattedHistory.push({ role: "system", content: HARDCODED_SYSTEM_PROMPT });
  
  for (let i = 0; i < normalizedMessages.length; i++) {
    const msg = normalizedMessages[i];
    if (msg.role === "system") continue;
    
    // Groq requires standard roles: user, assistant, system.
    const mappedRole = msg.role === "model" || msg.role === "assistant" ? "assistant" : "user";
    let textContent = msg.content;
    
    // Handle image attachment formatting for the last message
    if (i === normalizedMessages.length - 1 && attachment?.data) {
      // Groq has temporarily removed Vision models! We must fallback to text.
      textContent += "\n[System note: The user tried to upload an image or document, but the current backend AI (Groq) does not have eyes! Please politely explain to the user that you can only read text right now, and ask them to type out the content of their image.]";
      formattedHistory.push({ role: mappedRole, content: textContent });
    } else {
      // Standard text message merging
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === mappedRole && typeof formattedHistory[formattedHistory.length - 1].content === "string") {
         formattedHistory[formattedHistory.length - 1].content += "\n\n" + textContent;
      } else {
         formattedHistory.push({ role: mappedRole, content: textContent });
      }
    }
  }

  try {
    const targetModel = "llama-3.1-8b-instant"; // Only use text model since Vision is gone

    const chatCompletion = await groq.chat.completions.create({
      messages: formattedHistory,
      model: targetModel,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = chatCompletion.choices[0]?.message?.content || "";

    if (!text?.trim()) {
      return apiError("AI_EMPTY_RESPONSE", "AI returned an empty response.", 502);
    }

    return apiSuccess(text);
  } catch (error: any) {
    console.error("Groq API Error:", error);
    if (error?.status === 429 || error?.message?.includes("429")) {
      return apiError("RATE_LIMITED", "AI service is busy. Please try again soon.", 429);
    }
    return apiError("AI_PROVIDER_ERROR", "AI service error. Please try again.", 502);
  }
}