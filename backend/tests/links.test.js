process.env.DB_PATH = ":memory:";

const { test } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../src/app");

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const LINKEDIN_UA = "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)";

async function createLink(overrides = {}) {
  const res = await request(app)
    .post("/api/links")
    .send({ targetUrl: "https://example.com/resume.pdf", label: "Acme Corp", ...overrides });
  return res;
}

test("creates a link and returns a short URL", async () => {
  const res = await createLink();

  assert.strictEqual(res.status, 201);
  assert.match(res.body.code, /^[a-zA-Z0-9]{7}$/);
  assert.ok(res.body.shortUrl.endsWith(`/${res.body.code}`));
  assert.strictEqual(res.body.opens, 0);
});

test("rejects missing or invalid input", async () => {
  assert.strictEqual((await createLink({ targetUrl: "" })).status, 400);
  assert.strictEqual((await createLink({ targetUrl: "not a url" })).status, 400);
  assert.strictEqual((await createLink({ targetUrl: "javascript:alert(1)" })).status, 400);
  assert.strictEqual((await createLink({ label: "   " })).status, 400);
});

test("redirects and counts a human open", async () => {
  const { body: link } = await createLink();

  const res = await request(app).get(`/${link.code}`).set("User-Agent", CHROME_UA);
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, "https://example.com/resume.pdf");

  const { body: stats } = await request(app).get(`/api/links/${link.id}`);
  assert.strictEqual(stats.opens, 1);
  assert.strictEqual(stats.botHits, 0);
  assert.ok(stats.lastOpenedAt);
});

test("link preview bots redirect but don't count as opens", async () => {
  const { body: link } = await createLink();

  await request(app).get(`/${link.code}`).set("User-Agent", LINKEDIN_UA);

  const { body: stats } = await request(app).get(`/api/links/${link.id}`);
  assert.strictEqual(stats.opens, 0);
  assert.strictEqual(stats.botHits, 1);
  assert.strictEqual(stats.lastOpenedAt, null);
});

test("unknown short code returns 404", async () => {
  const res = await request(app).get("/doesNotExist");
  assert.strictEqual(res.status, 404);
});

test("deleting a link removes it and its clicks", async () => {
  const { body: link } = await createLink();

  assert.strictEqual((await request(app).delete(`/api/links/${link.id}`)).status, 204);
  assert.strictEqual((await request(app).get(`/api/links/${link.id}`)).status, 404);
  assert.strictEqual((await request(app).get(`/${link.code}`)).status, 404);
});
