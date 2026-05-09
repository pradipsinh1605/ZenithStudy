import { NextRequest, NextResponse } from "next/server";
import { validateFile, type FileValidationErrorCode } from "@/lib/validateFile";

type UploadValidationError = {
  ok: false;
  error: {
    code: FileValidationErrorCode | "BAD_REQUEST";
    message: string;
  };
};

type UploadValidationSuccess = {
  ok: true;
  sanitizedName: string;
};

function errorResponse(code: UploadValidationError["error"]["code"], message: string, status: number) {
  return NextResponse.json<UploadValidationError>({ ok: false, error: { code, message } }, { status });
}

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body.", 400);
  }

  const result = validateFile({
    name: String(body?.name || ""),
    size: Number(body?.size),
    type: typeof body?.type === "string" ? body.type : undefined,
  });

  if (result.ok === false) {
    return errorResponse(result.code, result.message, 400);
  }

  return NextResponse.json<UploadValidationSuccess>({ ok: true, sanitizedName: result.sanitizedName });
}