import "server-only";
import { sessionDatabase } from "./supabase";
import { HttpError } from "./http";
export async function currentUser() {
  const db = await sessionDatabase();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user?.email_confirmed_at) return null;
  return { db, user: data.user };
}
export async function requireUser() {
  const session = await currentUser();
  if (!session) throw new HttpError(401, "Inicia sesión para continuar.");
  return session;
}
export async function adminStatus(
  db: Awaited<ReturnType<typeof sessionDatabase>>,
) {
  const { data, error } = await db.rpc("kolab_admin_status");
  if (error) throw new HttpError(503, "No pudimos verificar el acceso.");
  return data as { admin: boolean; mfa: boolean };
}
export async function requireAdmin() {
  const session = await requireUser();
  const status = await adminStatus(session.db);
  if (!status.admin)
    throw new HttpError(403, "Acceso reservado a la administración de Kolab.");
  if (!status.mfa)
    throw new HttpError(403, "Completa la verificación en dos pasos.");
  return session;
}
