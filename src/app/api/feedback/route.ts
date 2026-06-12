import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/ai-rate-limit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // ── Send Email Alert via Resend ──
  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "ZenithStudy Feedback <onboarding@resend.dev>",
        to: process.env.OWNER_EMAIL || "your-email@example.com", // Replace with owner email in env
        subject: `New Feedback from ${name.trim()}`,
        replyTo: email.trim(),
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
      });
    } catch (err) {
      console.error("Failed to send email alert:", err);
      // We don't return an error here because the feedback was already saved to the database.
    }
  }

  return NextResponse.json({ success: true });
}
