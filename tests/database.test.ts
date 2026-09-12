import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  test,
  expect,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333",
  unverified = "44444444-4444-4444-8444-444444444444";
const profile = {
  name: "Persona de prueba",
  interests: ["Arte"],
  visible: true,
  phone: "+57 300 1234567",
  city: "Ciudad privada",
  role: "Rol privado",
  bio: "Idea privada",
  contactConsent: false,
  consent: true,
};
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, banned_until timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
    grant usage on schema public to anon, authenticated;
    insert into auth.users values ('${alice}','alice@example.test',now(),null),('${bob}','bob@example.test',now(),null),('${admin}','admin@example.test',now(),null),('${unverified}','unverified@example.test',null,null);`);
  await db.exec(
    readFileSync("supabase/migrations/202609120001_kolab.sql", "utf8"),
  );
  await db.query("insert into kolab_private.admin_users(user_id) values ($1)", [
    admin,
  ]);
});
afterAll(() => db.close());
beforeEach(async () => {
  await db.exec("begin");
});
afterEach(async () => {
  await db.exec("rollback; reset role");
});
async function asUser(id: string | null, aal = "aal1", metadata = {}) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: id, aal, user_metadata: metadata }),
  ]);
  await db.exec(id ? "set local role authenticated" : "set local role anon");
}
async function save(p = profile) {
  return db.query("select public.kolab_save_profile($1::jsonb)", [
    JSON.stringify(p),
  ]);
}
async function value<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = [],
): Promise<T> {
  const q = await db.query<{ result: T }>(`select ${sql} as result`, args);
  return q.rows[0].result;
}
// Savepoints let us test permission failures without aborting the whole fixture.
async function denied(sql: string, code = "42501", args: unknown[] = []) {
  await db.exec("savepoint denied");
  await expect(db.query(sql, args)).rejects.toMatchObject({ code });
  await db.exec("rollback to savepoint denied");
}
test("anonymous JSON contains only id, name and interests; no contact or auth identity", async () => {
  await asUser(alice);
  await save();
  await asUser(bob);
  await save({ ...profile, visible: false });
  await asUser(null);
  const result = await value<{
    members: Record<string, unknown>[];
    total: number;
  }>("public.kolab_network()");
  expect(result.total).toBe(1);
  expect(Object.keys(result.members[0]).sort()).toEqual([
    "id",
    "interests",
    "name",
  ]);
  expect(JSON.stringify(result)).not.toMatch(
    /email|phone|city|role|bio|user_id|alice@example|11111111/,
  );
});
test("anonymous and signed-in clients cannot query private tables or invoke helper functions", async () => {
  for (const id of [null, alice]) {
    await asUser(id);
    await denied("select * from kolab_private.member_contacts");
    await denied("select * from kolab_private.network_profiles");
    await denied("select kolab_private.is_admin()");
  }
  await asUser(null);
  await denied("select public.kolab_my_profile()");
  await denied("select public.kolab_admin_members()");
  await denied("select public.kolab_delete_profile()");
});
test("each user can read, modify and delete only their own profile", async () => {
  await asUser(alice);
  await save();
  await asUser(bob);
  expect(await value("public.kolab_my_profile()")).toBeNull();
  await save({ ...profile, name: "Bob privado" });
  expect((await value("public.kolab_my_profile()")).email).toBe(
    "bob@example.test",
  );
  await value("public.kolab_delete_profile()");
  await asUser(alice);
  expect((await value("public.kolab_my_profile()")).name).toBe(profile.name);
});
test("payload cannot override identity, verified email or administration status", async () => {
  await asUser(alice);
  for (const extra of [
    { user_id: bob },
    { email: "impostor@example.test" },
    { admin: true },
  ])
    await denied("select public.kolab_save_profile($1::jsonb)", "22023", [
      JSON.stringify({ ...profile, ...extra }),
    ]);
  await denied(
    `insert into kolab_private.admin_users(user_id) values ('${alice}')`,
  );
});
test("unverified users cannot create profiles even with an authenticated role", async () => {
  await asUser(unverified);
  await denied("select public.kolab_save_profile($1::jsonb)", "42501", [
    JSON.stringify(profile),
  ]);
});
test("public RPC validates consent, tags, lengths and types independently of frontend", async () => {
  await asUser(alice);
  for (const p of [
    { ...profile, consent: false },
    { ...profile, interests: [] },
    { ...profile, interests: ["Arte", "Arte"] },
    { ...profile, interests: ["Unknown"] },
    { ...profile, visible: "true" },
    { ...profile, phone: null },
  ])
    await denied("select public.kolab_save_profile($1::jsonb)", "22023", [
      JSON.stringify(p),
    ]);
  await denied("select public.kolab_save_profile($1::jsonb)", "23514", [
    JSON.stringify({ ...profile, phone: "x".repeat(40) }),
  ]);
});
test("hiding removes a member from all public output; deleting cascades private contacts", async () => {
  await asUser(alice);
  await save();
  await save({ ...profile, visible: false });
  expect((await value("public.kolab_network()")).total).toBe(0);
  await value("public.kolab_delete_profile()");
  await db.exec("reset role");
  expect(
    await value("(select count(*)::int from kolab_private.member_contacts)"),
  ).toBe(0);
});
test("only a provisioned admin with AAL2 can read private contacts; user metadata cannot promote", async () => {
  await asUser(alice);
  await save();
  await asUser(bob, "aal2", { admin: true, role: "admin" });
  await denied("select public.kolab_admin_members()");
  await asUser(admin);
  await denied("select public.kolab_admin_members()");
  await asUser(admin, "aal2");
  const result = await value<{ members: Record<string, unknown>[] }>(
    "public.kolab_admin_members()",
  );
  expect(result.members[0].email).toBe("alice@example.test");
  expect(result.members[0].phone).toBe(profile.phone);
  await db.exec("reset role");
  expect(
    await value("(select count(*)::int from kolab_private.admin_audit)"),
  ).toBe(1);
});
test("literal search and pagination do not interpolate SQL or allow wildcard extraction", async () => {
  await asUser(alice);
  await save();
  await asUser(admin, "aal2");
  for (const query of ["' OR 1=1 --", "%", "_"])
    expect(
      (await value("public.kolab_admin_members($1, 0)", [query])).total,
    ).toBe(0);
  expect(
    (await value("public.kolab_admin_members($1, 0)", ["alice@"])).total,
  ).toBe(1);
});
test("write rate limit is enforced in the database for direct API callers", async () => {
  await asUser(alice);
  for (let i = 0; i < 30; i++) await save();
  await denied("select public.kolab_save_profile($1::jsonb)", "P0429", [
    JSON.stringify(profile),
  ]);
});
