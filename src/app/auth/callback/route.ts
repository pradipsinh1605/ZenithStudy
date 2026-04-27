import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${origin}/auth/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  // CRITICAL FIX: Create response AFTER exchange so cookies are set correctly
  const tempResponse = new NextResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            tempResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Exchange error:", exchangeError.message);
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`);
  }

  // Build final redirect response and copy all cookies from tempResponse
  const finalResponse = NextResponse.redirect(`${origin}${next}`);
  tempResponse.cookies.getAll().forEach(cookie => {
    finalResponse.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as any,
      maxAge: cookie.maxAge,
      path: cookie.path,
    });
  });

  return finalResponse;
}
