import { HttpError } from "./http.js";
import { findDeviceByTokenHash, touchDevice } from "../services/devices.js";

export const COOKIE_NAME = "pb_device";
// Browsers cap cookie lifetime at 400 days; the dashboard renews it on every visit.
const MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function secretsMatch(a, b) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function deviceCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearedDeviceCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export async function deviceFromRequest(env, request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  return findDeviceByTokenHash(env.DB, await sha256(token));
}

export function requireDevice(handler) {
  return async (context) => {
    const device = await deviceFromRequest(context.env, context.request);
    if (!device) throw new HttpError(401, "This device isn't set up");
    await touchDevice(context.env.DB, device.id);
    return handler({ ...context, device });
  };
}

// Cookies ride along on cross-site requests, so changes must come from our own pages.
export function isSameOrigin(request) {
  if (request.method === "GET" || request.method === "HEAD") return true;
  return request.headers.get("origin") === new URL(request.url).origin;
}
