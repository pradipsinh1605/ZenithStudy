import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  
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
    await supabase.from("profiles").upsert({ 
      user_id: data.user.id, 
      name, 
      edu_level: "Student" 
    });
    await supabase.from("user_xp").upsert({ 
      user_id: data.user.id, 
      total_xp: 0, 
      level: 1, 
      streak: 0 
    });
  }

  return NextResponse.json({ success: true, user: data.user });
}
