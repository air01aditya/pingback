import { test } from "node:test";
import assert from "node:assert/strict";
import { CHROME, LINKEDIN, SECRET, createApp } from "./helpers.js";

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
