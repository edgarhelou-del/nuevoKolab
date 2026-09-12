import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  OwnProfile,
  ProfileInput,
  AdminMember,
} from "@/lib/contracts/member";
import { publicMember } from "@/lib/contracts/member";
import { HttpError } from "../http";
function check(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "P0429")
    throw new HttpError(
      429,
      "Demasiadas solicitudes. Espera unos minutos antes de continuar.",
    );
  if (error.code === "42501")
    throw new HttpError(403, "No tienes acceso a esta información.");
  throw new HttpError(
    503,
    "No pudimos consultar o guardar los datos. Inténtalo de nuevo.",
  );
}
export async function network(db: SupabaseClient) {
  const { data, error } = await db.rpc("kolab_network");
  check(error);
  return {
    members: (data?.members ?? []).map(publicMember),
    total: Number(data?.total ?? 0),
  };
}
export async function ownProfile(
  db: SupabaseClient,
): Promise<OwnProfile | null> {
  const { data, error } = await db.rpc("kolab_my_profile");
  check(error);
  return data;
}
export async function saveProfile(db: SupabaseClient, input: ProfileInput) {
  const { error } = await db.rpc("kolab_save_profile", { p: input });
  check(error);
  return ownProfile(db);
}
export async function deleteProfile(db: SupabaseClient) {
  const { error } = await db.rpc("kolab_delete_profile");
  check(error);
}
export async function adminMembers(
  db: SupabaseClient,
  search: string,
  page: number,
): Promise<{ members: AdminMember[]; total: number }> {
  const { data, error } = await db.rpc("kolab_admin_members", {
    search_text: search,
    page_number: page,
  });
  check(error);
  return data;
}
