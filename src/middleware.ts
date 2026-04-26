import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES    = ["/auth/login", "/auth/signup", "/auth/reset-password"];
const PROTECTED_ROUTES = ["/dashboard", "/planner", "/notes", "/timetable", "/flashcards", "/timer", "/progress", "/ai", "/achievements", "/profile", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response that we can modify (cookies must be set on THIS response)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Must set on both request AND response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: always call getUser() — this refreshes the session cookie
  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAuthPage  = AUTH_ROUTES.some(r => pathname.startsWith(r));

  // Not logged in → send to login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Logged in → don't show login/signup pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|manifest|api).*)"],
};
