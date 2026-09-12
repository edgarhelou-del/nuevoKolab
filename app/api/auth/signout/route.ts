import { sessionDatabase } from "@/lib/server/supabase";
import { assertOrigin, json, failure, HttpError } from "@/lib/server/http";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const db = await sessionDatabase();
    const { error } = await db.auth.signOut({ scope: "local" });
    if (error) throw new HttpError(503, "No pudimos cerrar la sesión.");
    return json({ signedOut: true });
  } catch (error) {
    return failure(error);
  }
}
