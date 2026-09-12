import { publicDatabase } from "@/lib/server/supabase";
import { network } from "@/lib/server/repositories/members";
import { json, failure } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return json(await network(publicDatabase()));
  } catch (error) {
    return failure(error);
  }
}
