import { z } from "zod";
import { requireUser, adminStatus } from "@/lib/server/auth";
import { json, failure, readJson, HttpError } from "@/lib/server/http";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }).strict(),
  z
    .object({
      action: z.literal("verify"),
      factorId: z.string().uuid(),
      code: z.string().regex(/^\d{6}$/),
    })
    .strict(),
]);
export async function POST(request: Request) {
  try {
    const p = await readJson(request, schema);
    const { db } = await requireUser();
    if (!(await adminStatus(db)).admin)
      throw new HttpError(
        403,
        "Acceso reservado a la administración de Kolab.",
      );
    const factors = await db.auth.mfa.listFactors();
    if (factors.error)
      throw new HttpError(503, "No pudimos consultar la verificación.");
    if (p.action === "verify") {
      if (
        !factors.data.all.some(
          (f) => f.id === p.factorId && f.factor_type === "totp",
        )
      )
        throw new HttpError(403, "Verificación no permitida.");
      const { error } = await db.auth.mfa.challengeAndVerify({
        factorId: p.factorId,
        code: p.code,
      });
      if (error)
        throw new HttpError(
          400,
          "Código incorrecto o vencido. Vuelve a intentarlo.",
        );
      return json({ verified: true });
    }
    const verified = factors.data.totp.find((f) => f.status === "verified");
    if (verified) return json({ factorId: verified.id });
    for (const f of factors.data.all.filter(
      (f) => f.factor_type === "totp" && f.status === "unverified",
    ))
      await db.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await db.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Kolab",
      friendlyName: "Administración Kolab",
    });
    if (error) throw new HttpError(503, "No pudimos activar la verificación.");
    return json({
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    });
  } catch (error) {
    return failure(error);
  }
}
