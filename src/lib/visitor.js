import { detectBot } from "./detectBot.js";
import { describeBrowser } from "./browser.js";
import { deviceFromRequest } from "./auth.js";

export async function classifyVisit(env, request) {
  const userAgent = request.headers.get("user-agent") || "";
  const cf = request.cf || {};
  const visit = {
    browser: describeBrowser(userAgent),
    city: cf.city || null,
    country: cf.country || null,
  };

  // Real browsers send GET when someone clicks a link; HEAD comes from link checkers.
  if (request.method === "HEAD" || detectBot(userAgent)) return { ...visit, kind: "bot" };
  if (await deviceFromRequest(env, request)) return { ...visit, kind: "owner" };
  return { ...visit, kind: "human" };
}
