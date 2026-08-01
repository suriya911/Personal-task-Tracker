import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * RSC / Server Action Supabase client, bound to the request's session cookie.
 * Returns null when env vars are absent so the app renders (empty) before
 * Supabase is wired up.
 *
 * Cached per request: a page pulls this from the layout, several queries and
 * the recurrence sweep, and rebuilding the client each time is pure waste.
 */
export const createClient = cache(async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware
          // refreshes the session.
        }
      },
    },
  });
});

/**
 * The signed-in user, resolved once per request.
 *
 * `auth.getUser()` is a network call to Supabase — it verifies the JWT rather
 * than trusting the cookie. Rendering Today used to make about eight of them
 * (layout, each query, the recurrence sweep), which cost well over a second
 * of server time before a single byte went out. React's `cache` collapses
 * them into one for the whole render pass.
 */
export const getSessionUser = cache(async function getSessionUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
