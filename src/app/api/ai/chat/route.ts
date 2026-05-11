import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/ai-api-responses";
import { filterPrompt, sanitizePrompt } from "@/lib/ai-prompt-filter";
import { checkRateLimit, getClientIp } from "@/lib/ai-rate-limit";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type DifyFile = {
  type: "image" | "document";
  transfer_method: "local_file";
  upload_file_id: string;
};

type DifyConfig = {
  apiKey: string;
  baseUrl: string;
  user: string;
};

const DIFY_TIMEOUT_MS = 15000;
const DIFY_RATE_LIMIT = 60;
const DIFY_WINDOW_MS = 60 * 60 * 1000;

function buildDifyQuery(messages: ChatMessage[], system?: string): string {
  const latest = messages[messages.length - 1];
  const history = messages
    .slice(-8, -1)
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role === "assistant" ? "Assistant" : "Student"}: ${sanitizePrompt(message.content)}`)
    .join("\n");

  const parts = [
    system ? `Tutor instructions:\n${sanitizePrompt(system)}` : "",
    history ? `Recent conversation:\n${history}` : "",
    `Student question:\n${latest.content}`,
  ].filter(Boolean);

  return parts.join("\n\n");
}

function getDifyConfig(req: NextRequest): DifyConfig | null {
  const apiKey = process.env.DIFY_BOT_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.DIFY_BASE_URL || "https://api.dify.ai/v1").replace(/\/$/, "");
  const user = `ip:${getClientIp(req.headers)}`;

  return { apiKey, baseUrl, user };
}

function getMimeType(type: string, name: string): string {
  if (type === "pdf") return "application/pdf";
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

async function uploadDifyFile(
  config: DifyConfig,
  attachment: any,
  signal: AbortSignal
): Promise<DifyFile | null> {
  if (!attachment?.data || !attachment?.type) return null;
  if (attachment.type !== "pdf" && attachment.type !== "image") return null;

  const fileName = sanitizePrompt(attachment.name || (attachment.type === "pdf" ? "document.pdf" : "image.jpg"));
  const mimeType = getMimeType(attachment.type, fileName);
  const fileBytes = Uint8Array.from(Buffer.from(String(attachment.data), "base64"));
  const file = new File([fileBytes], fileName, { type: mimeType });
  const form = new FormData();

  form.append("user", config.user);
  form.append("file", file);

  const response = await fetch(`${config.baseUrl}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: form,
    signal,
  });

  if (!response.ok) return null;

  const data = await response.json();
  const uploadFileId = typeof data?.id === "string" ? data.id : "";
  if (!uploadFileId) return null;

  return {
    type: attachment.type === "pdf" ? "document" : "image",
    transfer_method: "local_file",
    upload_file_id: uploadFileId,
  };
}

function extractDifyText(data: any): string {
  if (typeof data?.answer === "string") return data.answer;
  if (typeof data?.text === "string") return data.text;
  if (typeof data?.data?.answer === "string") return data.data.answer;
  if (typeof data?.data?.text === "string") return data.data.text;
  if (typeof data?.message === "string") return data.message;
  return "";
}

async function postDifyMessage(
  config: DifyConfig,
  endpoint: "chat-messages" | "completion-messages",
  payload: Record<string, unknown>,
  signal: AbortSignal
) {
  return fetch(`${config.baseUrl}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });
}
async function callDify(
  req: NextRequest,
  query: string,
  inputs: Record<string, unknown>,
  attachment?: any
) {
  const config = getDifyConfig(req);

  if (!config) {
    return apiError("AI_NOT_CONFIGURED", "AI service is not configured.", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DIFY_TIMEOUT_MS);

  try {
    const file = await uploadDifyFile(config, attachment, controller.signal);
    const files = file ? [file] : [];

    const payload = {
      inputs,
      query,
      response_mode: "blocking",
      user: config.user,
      files,
    };

    let response = await postDifyMessage(config, "chat-messages", payload, controller.signal);

    if (!response.ok && (response.status === 400 || response.status === 404 || response.status === 405)) {
      response = await postDifyMessage(config, "completion-messages", payload, controller.signal);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return apiError("RATE_LIMITED", "AI service is busy. Please try again soon.", 429);
      }

      return apiError("AI_PROVIDER_ERROR", "AI service error. Please try again.", 502);
    }

    const data = await response.json();
    const text = extractDifyText(data);

    if (!text.trim()) {
      return apiError("AI_EMPTY_RESPONSE", "AI returned an empty response.", 502);
    }

    return apiSuccess(text);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return apiError("AI_TIMEOUT", "AI request timed out. Please try a shorter prompt.", 408);
    }

    return apiError("AI_PROVIDER_ERROR", "AI service error. Please try again.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, DIFY_RATE_LIMIT, DIFY_WINDOW_MS);

  if (!limit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "AI limit reached. Please try again later.",
      429,
      {
        headers: {
          "Retry-After": String(limit.retryAfter),
          "X-RateLimit-Limit": String(DIFY_RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limit.resetAt / 1000)),
        },
      }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("BAD_REQUEST", "Invalid JSON body.", 400);
  }

  const { messages, system, type, attachment } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return apiError("BAD_REQUEST", "Messages are required.", 400);
  }

  const normalizedMessages: ChatMessage[] = messages
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

  const inputs = {
    type: typeof type === "string" ? sanitizePrompt(type) : "chat",
    hasAttachment: Boolean(attachment?.type),
    attachmentType: typeof attachment?.type === "string" ? sanitizePrompt(attachment.type) : undefined,
    attachmentName: typeof attachment?.name === "string" ? sanitizePrompt(attachment.name) : undefined,
  };

  return callDify(req, buildDifyQuery(normalizedMessages, system), inputs, attachment);
}