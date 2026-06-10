import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "PROMPT_REJECTED"
  | "RATE_LIMITED"
  | "AI_NOT_CONFIGURED"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "AI_EMPTY_RESPONSE"
  | "INTERNAL_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type AiTextResponse = {
  ok: true;
  text: string;
};

export function apiSuccess(text: string, init?: ResponseInit) {
  return NextResponse.json<AiTextResponse>({ ok: true, text }, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  init?: ResponseInit
) {
  return NextResponse.json<ApiErrorResponse>(
    { ok: false, error: { code, message } },
    { ...init, status }
  );
}
