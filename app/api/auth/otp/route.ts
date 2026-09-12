import { z } from "zod";
import { sessionDatabase } from "@/lib/server/supabase";
import { json, failure, readJson, HttpError } from "@/lib/server/http";
export async function POST(request: Request) {
  try {
    const p = await readJson(
      request,
      z
        .object({
          email: z.string().trim().email().max(254),
          captchaToken: z.string().max(4096).optional(),
        })
        .strict(),
    );
    if (
      process.env.NODE_ENV === "production" &&
      (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !p.captchaToken)
    )
      throw new HttpError(400, "Completa la verificación de seguridad.");
    const db = await sessionDatabase();
    const { error } = await db.auth.signInWithOtp({
      email: p.email,
      options: { shouldCreateUser: true, captchaToken: p.captchaToken },
    });
    if (error)
      throw new HttpError(
        error.status === 429 ? 429 : 400,
        "No pudimos enviar el código. Revisa el correo y espera un minuto antes de intentarlo de nuevo.",
      );
    return json({ sent: true });
  } catch (error) {
    return failure(error);
  }
}
