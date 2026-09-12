import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { adminMembers } from "@/lib/server/repositories/members";
import { json, failure, readJson } from "@/lib/server/http";
export const dynamic = "force-dynamic";
// POST keeps private search terms out of URLs and access logs. This only reads.
export async function POST(request: Request) {
  try {
    const input = await readJson(
      request,
      z
        .object({
          search: z.string().trim().max(100),
          page: z.number().int().min(0).max(100000),
        })
        .strict(),
    );
    const { db } = await requireAdmin();
    return json(await adminMembers(db, input.search, input.page));
  } catch (error) {
    return failure(error);
  }
}
