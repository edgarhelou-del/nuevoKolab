import assert from "node:assert/strict";
const origin = new URL(process.env.APP_URL || "").origin;
assert.ok(
  origin.startsWith("https://"),
  "APP_URL must be the HTTPS deployment origin",
);
for (const path of [
  "/",
  "/quienes-somos",
  "/servicios",
  "/herramientas",
  "/ideas",
  "/contacto",
  "/en",
  "/unete",
  "/admin",
]) {
  const r = await fetch(origin + path);
  assert.equal(r.status, 200, `Page failed: ${path}`);
  assert.ok(
    r.headers
      .get("content-security-policy")
      ?.includes("frame-ancestors 'none'"),
    `CSP missing: ${path}`,
  );
  assert.ok(
    r.headers.get("cache-control")?.includes("no-store"),
    `Cache policy missing: ${path}`,
  );
}
const network = await fetch(origin + "/api/network");
assert.equal(network.status, 200, "Database not ready");
const data = await network.json();
assert.ok(Array.isArray(data.members));
assert.equal(typeof data.total, "number");
for (const member of data.members)
  assert.deepEqual(Object.keys(member).sort(), ["id", "interests", "name"]);
const profile = await fetch(origin + "/api/profile");
assert.equal(profile.status, 401);
const admin = await fetch(origin + "/api/admin/members", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ search: "", page: 0 }),
});
assert.equal(admin.status, 401);
const csrf = await fetch(origin + "/api/profile", {
  method: "DELETE",
  headers: { Origin: "https://unauthorized.example" },
});
assert.equal(csrf.status, 403);
console.log(
  "Deployment checks passed: public pages, database projection, security headers and anonymous access restrictions. No member data was printed.",
);
