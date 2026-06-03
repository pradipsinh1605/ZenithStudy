import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/ai-api-responses";
import { filterPrompt, sanitizePrompt } from "@/lib/ai-prompt-filter";
import { checkRateLimit, getClientIp } from "@/lib/ai-rate-limit";
import OpenAI from "openai";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const OPENAI_RATE_LIMIT = 60;
const OPENAI_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, OPENAI_RATE_LIMIT, OPENAI_WINDOW_MS);

  if (!limit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "AI limit reached. Please try again later.",
      429,
      {
        headers: {
          "Retry-After": String(limit.retryAfter),
          "X-RateLimit-Limit": String(OPENAI_RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limit.resetAt / 1000)),
        },
      }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return apiError("AI_NOT_CONFIGURED", "OpenAI service is not configured.", 500);
  }

  const openai = new OpenAI({ apiKey });

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

  if (!filtered.sanitized) {
    return apiError("BAD_REQUEST", "Message cannot be empty.", 400);
  }

  if (!filtered.allowed) {
    return apiError(
      "PROMPT_REJECTED",
      "Please ask a study question without requesting hidden instructions or role changes.",
      400
    );
  }

  normalizedMessages[normalizedMessages.length - 1] = {
    ...lastMessage,
    content: filtered.sanitized,
  };

  const openAIMessages: any[] = [];

  if (system) {
    openAIMessages.push({ role: "system", content: sanitizePrompt(system) });
  }

  // Add history
  for (let i = 0; i < normalizedMessages.length - 1; i++) {
    openAIMessages.push({
      role: normalizedMessages[i].role,
      content: normalizedMessages[i].content,
    });
  }

  // Handle the latest message, which might have an attachment
  const finalMessageContent: any[] = [
    { type: "text", text: normalizedMessages[normalizedMessages.length - 1].content }
  ];

  if (attachment?.data && attachment?.type === "image") {
    // Determine mime type
    const ext = attachment.name?.split(".").pop()?.toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === "png") mimeType = "image/png";
    if (ext === "webp") mimeType = "image/webp";

    finalMessageContent.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${attachment.data}`
      }
    });
  }

  openAIMessages.push({
    role: "user",
    content: finalMessageContent,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content || "";
    
    if (!text.trim()) {
      return apiError("AI_EMPTY_RESPONSE", "AI returned an empty response.", 502);
    }

    return apiSuccess(text);
  } catch (error: any) {
    if (error?.status === 429) {
      return apiError("RATE_LIMITED", "AI service is busy. Please try again soon.", 429);
    }
    return apiError("AI_PROVIDER_ERROR", "AI service error. Please try again.", 502);
  }
}