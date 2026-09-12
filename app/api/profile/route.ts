import { requireUser } from "@/lib/server/auth";
import {
  ownProfile,
  saveProfile,
  deleteProfile,
} from "@/lib/server/repositories/members";
import { profileSchema } from "@/lib/contracts/member";
import { json, failure, readJson, assertOrigin } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { db } = await requireUser();
    return json({ profile: await ownProfile(db) });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const input = await readJson(request, profileSchema);
    const { db } = await requireUser();
    return json({ profile: await saveProfile(db, input) });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    assertOrigin(request);
    const { db } = await requireUser();
    await deleteProfile(db);
    return json({ deleted: true });
  } catch (error) {
    return failure(error);
  }
}
