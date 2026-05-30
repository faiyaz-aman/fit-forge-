import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname } = request.nextUrl;

  // Always allow static assets and API routes through (never redirect these)
  const isStaticAsset =
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/");

  if (isStaticAsset) {
    return supabaseResponse;
  }

  // Sign-in and Sign-up routes are auth routes. Onboarding is a protected setup route.
  const isAuthRoute =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Helper: redirect using fitforge-session cookie (sandbox/demo mode)
  const sandboxCheck = () => {
    const mockSession = request.cookies.get("fitforge-session");
    if (!mockSession) {
      if (!isAuthRoute && pathname !== "/") {
        const urlObj = request.nextUrl.clone();
        urlObj.pathname = "/signin";
        return NextResponse.redirect(urlObj);
      }
    } else {
      if (isAuthRoute || pathname === "/") {
        const urlObj = request.nextUrl.clone();
        urlObj.pathname = "/home";
        return NextResponse.redirect(urlObj);
      }
    }
    return supabaseResponse;
  };

  // Use sandbox mode if Supabase credentials are missing or placeholder values
  const isSandbox =
    !url ||
    !anonKey ||
    url.includes("[YOUR-") ||
    url.includes("dummy-") ||
    url === "https://dummy-project.supabase.co" ||
    anonKey.includes("dummy") ||
    anonKey.startsWith("sb_publishable_");

  if (isSandbox) {
    return sandboxCheck();
  }

  // Real Supabase auth check
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Also accept the sandbox cookie as a valid session fallback
    const mockSession = request.cookies.get("fitforge-session");
    const isAuthenticated = !!user || !!mockSession;

    if (!isAuthenticated) {
      if (!isAuthRoute && pathname !== "/") {
        const urlObj = request.nextUrl.clone();
        urlObj.pathname = "/signin";
        return NextResponse.redirect(urlObj);
      }
    } else {
      if (isAuthRoute || pathname === "/") {
        const urlObj = request.nextUrl.clone();
        urlObj.pathname = "/home";
        return NextResponse.redirect(urlObj);
      }
    }
  } catch (err) {
    console.error("Supabase proxy error — falling back to cookie check:", err);
    // On any Supabase failure, fall back to sandbox cookie check
    return sandboxCheck();
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
