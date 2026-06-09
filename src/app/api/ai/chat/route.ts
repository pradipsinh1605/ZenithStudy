import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/ai-api-responses";
import { filterPrompt, sanitizePrompt } from "@/lib/ai-prompt-filter";
import { checkRateLimit, getClientIp } from "@/lib/ai-rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";

const RATE_LIMIT = 60;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return apiError("AI_NOT_CONFIGURED", "Gemini service is not configured. Please add GEMINI_API_KEY.", 500);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash for speed and full multimodal support
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

  const normalizedMessages = messages
    .filter((message: any) => typeof message?.content === "string")
    .map((message: any) => ({
      role: message.role === "assistant" || message.role === "system" ? message.role : "user",
      content: sanitizePrompt(message.content),
    }));

  if (normalizedMessages.length === 0) {
    return apiError("BAD_REQUEST", "A text message is required.", 400);
  }

  const lastMessage = normalizedMessages[normalizedMessages.length - 1];
  const filtered = filterPrompt(lastMessage.content);

  if (!filtered.sanitized && !attachment) {
    return apiError("BAD_REQUEST", "Message cannot be empty.", 400);
  }

  normalizedMessages[normalizedMessages.length - 1] = {
    ...lastMessage,
    content: filtered.sanitized || "Please analyze this attachment.",
  };

  // Format messages for Gemini (only "user" and "model" are allowed in history)
  const formattedHistory = [];
  let userMessageText = "";
  
  for (let i = 0; i < normalizedMessages.length - 1; i++) {
    const msg = normalizedMessages[i];
    if(msg.role === "system") continue;
    formattedHistory.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    });
  }

  userMessageText = normalizedMessages[normalizedMessages.length - 1].content;

  const chat = model.startChat({
    history: formattedHistory,
    systemInstruction: system ? { role: "system", parts: [{ text: system }] } : undefined,
  });

  const parts: any[] = [{ text: userMessageText }];

  if (attachment?.data) {
    let mimeType = "image/jpeg";
    if (attachment.type === "pdf") {
      mimeType = "application/pdf";
    } else if (attachment.type === "image") {
      const ext = attachment.name?.split(".").pop()?.toLowerCase();
      if (ext === "png") mimeType = "image/png";
      if (ext === "webp") mimeType = "image/webp";
    }
    parts.push({
      inlineData: {
        data: attachment.data,
        mimeType
      }
    });
  }

  try {
    const result = await chat.sendMessage(parts);
    const text = result.response.text();

    if (!text?.trim()) {
      return apiError("AI_EMPTY_RESPONSE", "AI returned an empty response.", 502);
    }

    return apiSuccess(text);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429 || error?.message?.includes("429")) {
      return apiError("RATE_LIMITED", "AI service is busy. Please try again soon.", 429);
    }
    return apiError("AI_PROVIDER_ERROR", "AI service error. Please try again.", 502);
  }
}