import { test } from "node:test";
import assert from "node:assert/strict";
import { CHROME, LINKEDIN, SECRET, createApp } from "./helpers.js";
import { visitorHash } from "../src/lib/visitorHash.js";
import worker from "../src/index.js";

const RESUME = "https://drive.google.com/file/d/abc123/view";

async function appWithResume() {
  const app = createApp();
  const cookie = await app.setUpDevice();
  await app.call("PUT", "/api/resume", { cookie, body: { url: RESUME } });
  return { ...app, cookie };
}

async function stats(app) {
  const res = await app.call("GET", "/api/stats", { cookie: app.cookie });
  return res.json();
}

test("/cv isn't active until a resume is set", async () => {
  const app = createApp();
  const res = await app.call("GET", "/cv");
  assert.equal(res.status, 404);
});

test("setup rejects a wrong secret and accepts the right one", async () => {
  const app = createApp();

  const wrong = await app.call("POST", "/api/setup", { body: { secret: "nope" } });
  assert.equal(wrong.status, 401);

  const right = await app.call("POST", "/api/setup", { body: { secret: SECRET, name: "Phone" } });
  assert.equal(right.status, 201);
  const cookie = right.headers.get("set-cookie");
  assert.match(cookie, /pb_device=[\w-]{40,};/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
});

test("owner routes need a remembered device", async () => {
  const app = createApp();
  assert.equal((await app.call("GET", "/api/stats")).status, 401);
  assert.equal((await app.call("PUT", "/api/resume", { body: { url: RESUME } })).status, 401);
  assert.equal((await app.call("GET", "/api/stats", { cookie: "pb_device=made-up" })).status, 401);
});

test("resume link must be a valid https URL", async () => {
  const app = createApp();
  const cookie = await app.setUpDevice();

  for (const url of ["", "not a link", "http://drive.google.com/x", "javascript:alert(1)"]) {
    const res = await app.call("PUT", "/api/resume", { cookie, body: { url } });
    assert.equal(res.status, 400, `expected 400 for "${url}"`);
  }
  const ok = await app.call("PUT", "/api/resume", { cookie, body: { url: RESUME } });
  assert.equal(ok.status, 200);
});

test("a person opening /cv is redirected and counted", async () => {
  const app = await appWithResume();

  const res = await app.call("GET", "/cv", { userAgent: CHROME, cf: { city: "Bengaluru", country: "IN" } });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), RESUME);
  assert.equal(res.headers.get("cache-control"), "no-store");

  const data = await stats(app);
  assert.equal(data.opens, 1);
  assert.equal(data.lastOpen.city, "Bengaluru");
  assert.equal(data.lastOpen.browser, "Chrome on Android");
  assert.equal(data.recent.length, 1);
});

test("preview bots are redirected but not counted", async () => {
  const app = await appWithResume();

  const res = await app.call("GET", "/cv", { userAgent: LINKEDIN });
  assert.equal(res.status, 302);
  await app.call("HEAD", "/cv", { userAgent: CHROME });

  const data = await stats(app);
  assert.equal(data.opens, 0);
  assert.equal(data.botsIgnored, 2);
  assert.equal(data.lastOpen, null);
});

test("browser prefetches are redirected but not counted", async () => {
  const app = await appWithResume();

  const res = await app.call("GET", "/cv", { extraHeaders: { "sec-purpose": "prefetch;prerender" } });
  assert.equal(res.status, 302);
  await app.call("GET", "/cv", { extraHeaders: { purpose: "prefetch" } });

  const data = await stats(app);
  assert.equal(data.opens, 0);
  assert.equal(data.botsIgnored, 2);
});

test("the dashboard still loads if updating last seen fails", async () => {
  const app = await appWithResume();
  const prepare = app.env.DB.prepare;
  app.env.DB.prepare = (sql) => {
    if (!sql.startsWith("UPDATE devices")) return prepare(sql);
    const failing = { bind: () => failing, run: async () => { throw new Error("D1 write limit reached"); } };
    return failing;
  };

  const res = await app.call("GET", "/api/stats", { cookie: app.cookie });
  assert.equal(res.status, 200);
});

test("the owner's own clicks are skipped", async () => {
  const app = await appWithResume();

  const res = await app.call("GET", "/cv", { cookie: app.cookie });
  assert.equal(res.status, 302);

  const data = await stats(app);
  assert.equal(data.opens, 0);
  assert.equal(data.ownClicksSkipped, 1);
});

test("the demo link has its own counter", async () => {
  const app = await appWithResume();

  const res = await app.call("GET", "/demo");
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://pingback.test/sample");

  const demo = await (await app.call("GET", "/api/demo-stats")).json();
  assert.equal(demo.opens, 1);
  assert.equal((await stats(app)).opens, 0);
});

test("changes from another website are blocked", async () => {
  const app = createApp();
  const cookie = await app.setUpDevice();

  const res = await app.call("PUT", "/api/resume", {
    cookie,
    body: { url: RESUME },
    origin: "https://evil.example",
  });
  assert.equal(res.status, 403);
});

test("removing a device signs it out", async () => {
  const app = createApp();
  const laptop = await app.setUpDevice("Laptop");
  const phone = await app.setUpDevice("Phone");

  const { devices } = await (await app.call("GET", "/api/devices", { cookie: laptop })).json();
  assert.equal(devices.length, 2);
  const phoneId = devices.find((d) => d.name === "Phone").id;

  const res = await app.call("DELETE", `/api/devices/${phoneId}`, { cookie: laptop });
  assert.equal(res.status, 200);
  assert.equal((await app.call("GET", "/api/stats", { cookie: phone })).status, 401);
  assert.equal((await app.call("GET", "/api/stats", { cookie: laptop })).status, 200);
});

test("unknown routes return 404", async () => {
  const app = createApp();
  const api = await app.call("GET", "/api/nothing");
  assert.equal(api.status, 404);
  assert.deepEqual(await api.json(), { error: "Not found" });
  assert.equal((await app.call("GET", "/nothing")).status, 404);
});

test("a broken escape in a device id returns 404, not a crash", async () => {
  const app = createApp();
  const res = await app.call("DELETE", "/api/devices/%E0");
  assert.equal(res.status, 404);
});

test("?src= records where an open came from", async () => {
  const app = await appWithResume();

  await app.call("GET", "/cv?src=linkedin");
  await app.call("GET", "/cv?src=LinkedIn");
  await app.call("GET", "/cv?src=resume");
  await app.call("GET", "/cv?src=<script>");
  const res = await app.call("GET", "/cv");
  assert.equal(res.headers.get("location"), RESUME, "?src= must not change where the link goes");

  const data = await stats(app);
  assert.equal(data.opens, 5);
  assert.deepEqual(data.sources, [
    { source: "linkedin", opens: 2 },
    { source: "direct", opens: 1 },
    { source: "other", opens: 1 },
    { source: "resume", opens: 1 },
  ]);
});

test("unique visitors count each device once, and the raw IP is never stored", async () => {
  const app = await appWithResume();
  const phone = { extraHeaders: { "cf-connecting-ip": "203.0.113.7" } };
  const laptop = { extraHeaders: { "cf-connecting-ip": "198.51.100.20" } };

  await app.call("GET", "/cv", phone);
  await app.call("GET", "/cv", phone);
  await app.call("GET", "/cv", laptop);
  await app.call("GET", "/cv", { ...phone, userAgent: LINKEDIN });

  const data = await stats(app);
  assert.equal(data.opens, 3);
  assert.equal(data.visitors, 2);

  const { results } = await app.env.DB.prepare("SELECT * FROM clicks").all();
  for (const row of results) {
    assert.ok(!JSON.stringify(row).includes("203.0.113.7"), "raw IP must not be saved");
  }
  const bot = results.find((row) => row.kind === "bot");
  assert.equal(bot.visitor, null, "bots don't get a visitor hash");
});

test("the visitor hash changes every day and depends on the secret", async () => {
  const request = new Request("https://pingback.test/cv", {
    headers: { "cf-connecting-ip": "203.0.113.7", "user-agent": CHROME },
  });
  const monday = new Date("2026-10-19T10:00:00Z");
  const tuesday = new Date("2026-10-20T10:00:00Z");

  const a = await visitorHash(SECRET, request, monday);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await visitorHash(SECRET, request, monday));
  assert.notEqual(a, await visitorHash(SECRET, request, tuesday));
  assert.notEqual(a, await visitorHash("another-secret-that-is-32-characters!", request, monday));
});

test("the daily cleanup clears visitor hashes older than 30 days but keeps the opens", async () => {
  const app = await appWithResume();
  const insert = "INSERT INTO clicks (link, kind, clicked_at, visitor) VALUES ('cv', 'human', ?, ?)";
  await app.env.DB.prepare(insert).bind("2026-09-01T10:00:00Z", "old-hash").run();
  await app.env.DB.prepare(insert).bind("2026-10-20T10:00:00Z", "new-hash").run();

  await worker.scheduled({ scheduledTime: Date.parse("2026-10-21T21:30:00Z") }, app.env);

  const { results } = await app.env.DB.prepare("SELECT clicked_at, visitor FROM clicks ORDER BY clicked_at").all();
  assert.deepEqual(
    results.map((row) => row.visitor),
    [null, "new-hash"]
  );
  assert.equal((await stats(app)).opens, 2, "opens are kept");
});
