import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/ai-rate-limit";

const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(ip, RATE_LIMIT, WINDOW_MS);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, student_type, message, rating } = body;

  if (!name || typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 100) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!message || typeof message !== "string" || message.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const safeRating = Number(rating);
  if (isNaN(safeRating) || safeRating < 1 || safeRating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("testimonial_submissions").insert({ 
    name: name.trim(), 
    email: email.trim(), 
    student_type: typeof student_type === "string" ? student_type.trim() : "Other",
    message: message.trim(),
    rating: safeRating,
    status: "pending"
  }).select().single();

  if (error) {
    return NextResponse.json({ error: "Failed to submit testimonial" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
