import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, name } = body;

  // Input Validation
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 255) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Password must be 8-128 characters" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json({ error: "Name must be 1-100 characters" }, { status: 400 });
  }
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signUp({ email, password });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({ 
      user_id: data.user.id, 
      name, 
      edu_level: "Student" 
    });

    if (profileError) {
      return NextResponse.json({ error: "Failed to create user profile." }, { status: 500 });
    }

    const { error: xpError } = await supabase.from("user_xp").upsert({ 
      user_id: data.user.id, 
      total_xp: 0, 
      level: 1, 
      streak: 0 
    });

    if (xpError) {
      return NextResponse.json({ error: "Failed to initialize user XP." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, user: data.user });
}
