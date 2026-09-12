import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { z } from "zod";
import { publicMember, profileSchema } from "@/lib/contracts/member";
import {
  assertOrigin,
  readJson,
  json,
  failure,
  HttpError,
} from "@/lib/server/http";
beforeEach(() => {
  vi.stubEnv("APP_URL", "https://kolab.example");
});
afterEach(() => vi.unstubAllEnvs());
const request = (body: string, origin = "https://kolab.example", extra = {}) =>
  new Request("https://kolab.example/api/profile", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...extra },
    body,
  });
test("public DTO strips private fields even if backend accidentally includes them", () => {
  const member = publicMember({
    id: "11111111-1111-4111-8111-111111111111",
    name: "Ana",
    interests: ["Arte"],
    email: "private@example.test",
    phone: "123",
    bio: "private",
    user_id: "auth-identity",
  });
  expect(Object.keys(member)).toEqual(["id", "name", "interests"]);
});
test("cross-origin writes, missing origins and spoofed forwarded hosts are rejected", () => {
  expect(() => assertOrigin(request("{}"))).not.toThrow();
  for (const origin of [
    "",
    "https://attacker.test",
    "https://kolab.example.attacker.test",
  ])
    expect(() =>
      assertOrigin(
        request("{}", origin, { "x-forwarded-host": "attacker.test" }),
      ),
    ).toThrow(HttpError);
  expect(() =>
    assertOrigin(
      request("{}", "https://kolab.example", {
        "sec-fetch-site": "cross-site",
      }),
    ),
  ).toThrow(HttpError);
});
test("JSON parser rejects oversized chunked bodies, wrong media types and malformed JSON", async () => {
  await expect(
    readJson(request("a".repeat(8193)), z.any()),
  ).rejects.toMatchObject({ status: 413 });
  await expect(readJson(request("{"), z.any())).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    readJson(
      request("{}", "https://kolab.example", { "Content-Type": "text/plain" }),
      z.any(),
    ),
  ).rejects.toMatchObject({ status: 415 });
});
test("validation rejects client-selected ownership and consent omission", () => {
  const p = {
    name: "Ana",
    interests: ["Arte"],
    visible: false,
    phone: "",
    city: "",
    role: "",
    bio: "",
    contactConsent: false,
    consent: true,
  };
  expect(profileSchema.safeParse(p).success).toBe(true);
  expect(profileSchema.safeParse({ ...p, user_id: "victim" }).success).toBe(
    false,
  );
  expect(profileSchema.safeParse({ ...p, consent: false }).success).toBe(false);
});
test("private responses and errors never cache or serialize raw errors", async () => {
  expect(json({ email: "private" }).headers.get("cache-control")).toContain(
    "no-store",
  );
  const result = failure(new HttpError(403, "Acceso denegado"));
  expect(result.status).toBe(403);
  expect(result.headers.get("cache-control")).toContain("no-store");
});
