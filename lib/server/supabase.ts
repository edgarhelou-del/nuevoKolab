import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { HttpError } from "./http";
export function databaseConfig() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new HttpError(503, "El registro está en preparación. Vuelve pronto.");
  return { url, key };
}
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export async function sessionDatabase() {
  const { url, key } = databaseConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, { ...options, ...sessionCookieOptions }),
          );
        } catch {
          /* Server Components cannot set cookies; proxy refreshes them before rendering. */
        }
      },
    },
  });
}
export function publicDatabase() {
  const { url, key } = databaseConfig();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
