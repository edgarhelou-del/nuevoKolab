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
          token: z.string().regex(/^\d{6,8}$/),
        })
        .strict(),
    );
    const db = await sessionDatabase();
    const { error } = await db.auth.verifyOtp({
      email: p.email,
      token: p.token,
      type: "email",
    });
    if (error)
      throw new HttpError(
        error.status === 429 ? 429 : 400,
        "El código no es válido o ya venció. Solicita uno nuevo.",
      );
    return json({ authenticated: true });
  } catch (error) {
    return failure(error);
  }
}
