import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (data.user) {
    await supabase.from("profiles").upsert({ user_id: data.user.id, name, edu_level: "Student" });
    await supabase.from("user_xp").upsert({ user_id: data.user.id, total_xp: 0, level: 1, streak: 0 });
  }
  return NextResponse.json({ success: true });
}
