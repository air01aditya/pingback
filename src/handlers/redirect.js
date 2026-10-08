import { getResumeUrl } from "../services/settings.js";
import { recordClick } from "../services/clicks.js";
import { classifyVisit } from "../lib/visitor.js";
import { redirect, text } from "../lib/http.js";

export async function resume({ request, env, ctx }) {
  const target = await getResumeUrl(env.DB);
  if (!target) return text("This link isn't active yet.", 404);

  // Respond first and record afterwards, so tracking can never slow down or break the click.
  ctx.waitUntil(track(env, request, "cv"));
  return redirect(target);
}

export function demo({ request, env, ctx }) {
  ctx.waitUntil(track(env, request, "demo"));
  return redirect(new URL("/sample", request.url).toString());
}

async function track(env, request, link) {
  try {
    const visit = await classifyVisit(env, request);
    await recordClick(env.DB, { link, ...visit });
  } catch (err) {
    console.error("Could not record click", err);
  }
}
