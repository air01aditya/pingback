import { json } from "../lib/http.js";
import {
  countByKind,
  humanOpensBySource,
  humanOpensSince,
  lastHumanOpen,
  uniqueVisitorsSince,
} from "../services/clicks.js";
import { getResumeUrl } from "../services/settings.js";

const DAYS = 30;

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 19) + "Z";
}

export async function owner({ request, env }) {
  const since = isoDaysAgo(DAYS);
  const [counts, lastOpen, recent, sources, visitors, resumeUrl] = await Promise.all([
    countByKind(env.DB, "cv"),
    lastHumanOpen(env.DB, "cv"),
    humanOpensSince(env.DB, "cv", since),
    humanOpensBySource(env.DB, "cv"),
    uniqueVisitorsSince(env.DB, "cv", since),
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
    sources,
    visitors,
  });
}

export async function demo({ env }) {
  const counts = await countByKind(env.DB, "demo");
  return json({ opens: counts.human + counts.owner });
}
