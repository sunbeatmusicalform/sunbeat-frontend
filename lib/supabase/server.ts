import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase SSR client for Route Handlers / Server Actions / Server Components.
 *
 * Notes for Next.js 16+:
 * - `cookies()` is async, so this helper is async.
 * - In Server Components, `cookieStore.set(...)` may throw (no side effects allowed).
 *   We swallow that so reads still work.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Some runtimes/adapters may not implement getAll()
          return typeof (cookieStore as any).getAll === "function"
            ? (cookieStore as any).getAll()
            : [];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Some contexts (RSC) may throw on set()
              (cookieStore as any).set?.(name, value, options);
            });
          } catch {
            // no-op
          }
        },
      },
    }
  );
}
