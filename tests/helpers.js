import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index.js";

const MIGRATION = readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8");
export const SECRET = "test-secret-that-is-at-least-32-characters";
export const ORIGIN = "https://pingback.test";

export const CHROME = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
export const LINKEDIN = "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)";

// Just enough of Cloudflare D1's API, backed by Node's built-in SQLite.
function fakeD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(MIGRATION);

  const statement = (sql, params = []) => ({
    bind: (...values) => statement(sql, values),
    async first() {
      return sqlite.prepare(sql).get(...params) ?? null;
    },
    async all() {
      return { results: sqlite.prepare(sql).all(...params) };
    },
    async run() {
      const info = sqlite.prepare(sql).run(...params);
      return { meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
    },
  });

  return { prepare: (sql) => statement(sql) };
}

export function createApp() {
  const env = { DB: fakeD1(), SETUP_SECRET: SECRET };

  async function call(method, path, { body, cookie, userAgent = CHROME, origin = ORIGIN, cf } = {}) {
    const headers = { "user-agent": userAgent };
    if (cookie) headers.cookie = cookie;
    if (method !== "GET" && method !== "HEAD" && origin) headers.origin = origin;
    if (body !== undefined) headers["content-type"] = "application/json";

    const request = new Request(ORIGIN + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (cf) Object.defineProperty(request, "cf", { value: cf });

    const pending = [];
    const ctx = { waitUntil: (promise) => pending.push(promise) };
    const response = await worker.fetch(request, env, ctx);
    await Promise.all(pending);
    return response;
  }

  async function setUpDevice(name = "Test laptop") {
    const res = await call("POST", "/api/setup", { body: { secret: SECRET, name } });
    const cookie = res.headers.get("set-cookie").split(";")[0];
    return cookie;
  }

  return { env, call, setUpDevice };
}
