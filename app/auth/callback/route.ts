import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function safeNext(next: string | null) {
  // Prevent open-redirects. Only allow internal paths.
  if (!next) return "/app";
  if (!next.startsWith("/")) return "/app";
  return next;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  // Sem code: volta pro login
  if (!code) {
    const redirect = new URL("/login", url.origin);
    redirect.searchParams.set("next", next);
    return NextResponse.redirect(redirect);
  }

  // Response final (precisa existir ANTES do setAll)
  let res = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          typeof (req.cookies as any).getAll === "function"
            ? (req.cookies as any).getAll()
            : [],
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirect = new URL("/login", url.origin);
    redirect.searchParams.set("next", next);
    redirect.searchParams.set("error", "otp_failed");
    return NextResponse.redirect(redirect);
  }

  return res;
}
