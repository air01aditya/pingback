import { json } from "../lib/http.js";
import { countByKind, humanOpensSince, lastHumanOpen } from "../services/clicks.js";
import { getResumeUrl } from "../services/settings.js";

const DAYS = 30;

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 19) + "Z";
}

export async function owner({ request, env }) {
  const [counts, lastOpen, recent, resumeUrl] = await Promise.all([
    countByKind(env.DB, "cv"),
    lastHumanOpen(env.DB, "cv"),
    humanOpensSince(env.DB, "cv", isoDaysAgo(DAYS)),
    getResumeUrl(env.DB),
  ]);

  return json({
    link: new URL("/cv", request.url).toString(),
    resumeUrl,
    opens: counts.human,
    botsIgnored: counts.bot,
    ownClicksSkipped: counts.owner,
    lastOpen,
    recent,
  });
}

export async function demo({ env }) {
  const counts = await countByKind(env.DB, "demo");
  return json({ opens: counts.human + counts.owner });
}
