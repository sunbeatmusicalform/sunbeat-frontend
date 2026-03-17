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
  const cookieAdapter = cookieStore as unknown as {
    getAll: typeof cookieStore.getAll;
    set?: (name: string, value: string, options?: Record<string, unknown>) => void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieAdapter.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Some contexts (RSC) may throw on set()
              cookieAdapter.set?.(name, value, options as Record<string, unknown>);
            });
          } catch {
            // no-op
          }
        },
      },
    }
  );
}
