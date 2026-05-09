export type FileValidationInput = {
  name: string;
  size: number;
  type?: string;
};

export type FileValidationErrorCode = "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "INVALID_FILE_NAME";

export type FileValidationResult =
  | { ok: true; sanitizedName: string }
  | { ok: false; code: FileValidationErrorCode; message: string };

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 120);

  return cleaned || "upload.pdf";
}

export function validateFile(file: FileValidationInput): FileValidationResult {
  const sanitizedName = sanitizeFilename(file.name || "upload.pdf");
  const isPdfName = sanitizedName.toLowerCase().endsWith(".pdf");
  const isPdfType = file.type === "application/pdf" || !file.type;

  if (!isPdfName || !isPdfType) {
    return { ok: false, code: "INVALID_FILE_TYPE", message: "Only PDF files are allowed." };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, code: "INVALID_FILE_NAME", message: "Invalid PDF file." };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, code: "FILE_TOO_LARGE", message: "PDF must be 10MB or smaller." };
  }

  return { ok: true, sanitizedName };
}