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

  const { name, email, message } = body;

  if (!name || typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 100) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!message || typeof message !== "string" || message.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({ 
    name: name.trim(), 
    email: email.trim(), 
    message: message.trim() 
  });

  if (error) {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
