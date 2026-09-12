import { beforeEach, afterEach, expect, test, vi } from "vitest";
const mock = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), signInWithOtp: vi.fn() }));
vi.mock("@/lib/server/supabase", () => ({
  sessionDatabase: async () => ({
    auth: { getUser: mock.getUser, signInWithOtp: mock.signInWithOtp },
    rpc: mock.rpc,
  }),
}));
import {
  GET as profileGet,
  POST as profilePost,
} from "@/app/api/profile/route";
import { POST as adminPost } from "@/app/api/admin/members/route";
import { requireAdmin } from "@/lib/server/auth";
import { POST as requestOtp } from "@/app/api/auth/otp/route";
beforeEach(() => {
  vi.stubEnv("APP_URL", "https://kolab.example");
  mock.getUser.mockReset();
  mock.rpc.mockReset();
  mock.signInWithOtp.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
const request = (
  path: string,
  body: unknown,
  extra: Record<string, string> = {},
) =>
  new Request("https://kolab.example" + path, {
    method: "POST",
    headers: {
      Origin: "https://kolab.example",
      "Content-Type": "application/json",
      ...extra,
    },
    body: JSON.stringify(body),
  });
const verified = () =>
  mock.getUser.mockResolvedValue({
    data: { user: { id: "verified-user", email_confirmed_at: "2026-09-12" } },
    error: null,
  });
test("production sign-in accepts email without an external challenge", async () => {
  vi.stubEnv("NODE_ENV", "production");
  mock.signInWithOtp.mockResolvedValue({ error: null });
  const response = await requestOtp(request("/api/auth/otp", { email: "test@example.test" }));
  expect(response.status).toBe(200);
  expect(mock.signInWithOtp).toHaveBeenCalledWith({ email: "test@example.test", options: { shouldCreateUser: true } });
});
test("OTP requests preserve provider rate limits and generic errors", async () => {
  mock.signInWithOtp.mockResolvedValue({ error: { status: 429, message: "private provider detail" } });
  const response = await requestOtp(request("/api/auth/otp", { email: "test@example.test" }));
  expect(response.status).toBe(429);
  expect(await response.text()).not.toContain("private provider detail");
});
test("OTP requests from another origin cannot trigger an email", async () => {
  const response = await requestOtp(request("/api/auth/otp", { email: "test@example.test" }, { Origin: "https://attacker.example" }));
  expect(response.status).toBe(403);
  expect(mock.signInWithOtp).not.toHaveBeenCalled();
});
test("no verified provider session means 401 even with former ChatGPT identity headers", async () => {
  mock.getUser.mockResolvedValue({
    data: { user: null },
    error: new Error("Invalid token"),
  });
  const p = {
    name: "Ana",
    interests: ["Arte"],
    visible: true,
    phone: "",
    city: "",
    role: "",
    bio: "",
    contactConsent: false,
    consent: true,
  };
  const response = await profilePost(
    request("/api/profile", p, {
      "x-chatgpt-user-id": "administrator",
      "x-openai-user-id": "administrator",
    }),
  );
  expect(response.status).toBe(401);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test("unconfirmed email cannot access its own profile", async () => {
  mock.getUser.mockResolvedValue({
    data: { user: { id: "user", email_confirmed_at: null } },
    error: null,
  });
  expect((await profileGet()).status).toBe(401);
  expect(mock.rpc).not.toHaveBeenCalled();
});
test("private admin API rejects a regular user before reading member contacts", async () => {
  verified();
  mock.rpc.mockResolvedValue({
    data: { admin: false, mfa: true },
    error: null,
  });
  const response = await adminPost(
    request("/api/admin/members", { search: "", page: 0 }),
  );
  expect(response.status).toBe(403);
  expect(mock.rpc).toHaveBeenCalledTimes(1);
  expect(mock.rpc).toHaveBeenCalledWith("kolab_admin_status");
});
test("private admin API rejects an admin without second factor", async () => {
  verified();
  mock.rpc.mockResolvedValue({
    data: { admin: true, mfa: false },
    error: null,
  });
  await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
});
test("private admin API fails closed when role verification is unavailable", async () => {
  verified();
  mock.rpc.mockResolvedValue({
    data: null,
    error: { code: "connection_failure" },
  });
  const response = await adminPost(
    request("/api/admin/members", { search: "", page: 0 }),
  );
  expect(response.status).toBe(503);
  expect(mock.rpc).toHaveBeenCalledTimes(1);
});
test("authorized MFA admin gets only noncached contact response", async () => {
  verified();
  mock.rpc
    .mockResolvedValueOnce({ data: { admin: true, mfa: true }, error: null })
    .mockResolvedValueOnce({ data: { members: [], total: 0 }, error: null });
  const response = await adminPost(
    request("/api/admin/members", { search: "", page: 0 }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(mock.rpc).toHaveBeenLastCalledWith("kolab_admin_members", {
    search_text: "",
    page_number: 0,
  });
});
