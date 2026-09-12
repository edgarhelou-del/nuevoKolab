import "server-only";
import { z } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  console.error("Kolab request failed"); // Never log contacts, cookies, bodies or provider details.
  return json(
    {
      error:
        "El servicio no está disponible por el momento. Inténtalo de nuevo.",
    },
    503,
  );
}
export function assertOrigin(request: Request) {
  const configured = process.env.APP_URL;
  const allowed = configured
    ? new URL(configured).origin
    : process.env.NODE_ENV !== "production"
      ? new URL(request.url).origin
      : null;
  if (
    !allowed ||
    request.headers.get("origin") !== allowed ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "Solicitud no permitida.");
}
export async function readJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  assertOrigin(request);
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new HttpError(415, "Envía el formulario en formato JSON.");
  const limit = 8192;
  if (Number(request.headers.get("content-length")) > limit)
    throw new HttpError(413, "Formulario demasiado largo.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Formulario vacío.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "Formulario demasiado largo.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Revisa el formulario.");
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new HttpError(
      400,
      "Revisa los campos y el consentimiento del formulario.",
    );
  return parsed.data;
}
