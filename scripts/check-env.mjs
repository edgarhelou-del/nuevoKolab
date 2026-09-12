// A local build can verify code without cloud credentials. Vercel must be configured.
if (process.env.VERCEL) {
  const required = [
    "APP_URL",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  ];
  const missing = required.filter(
    (key) =>
      !process.env[key] || /REPLACE_ME|YOUR_PROJECT/.test(process.env[key]),
  );
  if (missing.length)
    throw new Error(
      `Configure Vercel environment variables: ${missing.join(", ")}`,
    );
  for (const key of ["APP_URL", "SUPABASE_URL"])
    if (new URL(process.env[key]).protocol !== "https:")
      throw new Error(`${key} must use HTTPS`);
  if (!process.env.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_"))
    throw new Error("Use a publishable key, never a secret/service_role key");
}
