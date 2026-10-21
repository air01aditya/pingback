export function recordClick(db, { link, kind, browser, city, country, source = null, visitor = null }) {
  return db
    .prepare("INSERT INTO clicks (link, kind, browser, city, country, source, visitor) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(link, kind, browser, city, country, source, visitor)
    .run();
}

export async function countByKind(db, link) {
  const { results } = await db
    .prepare("SELECT kind, COUNT(*) AS total FROM clicks WHERE link = ? GROUP BY kind")
    .bind(link)
    .all();

  const counts = { human: 0, bot: 0, owner: 0 };
  for (const row of results) counts[row.kind] = row.total;
  return counts;
}

export async function humanOpensSince(db, link, since, limit = 500) {
  const { results } = await db
    .prepare(
      `SELECT clicked_at AS clickedAt, browser, city, country
       FROM clicks
       WHERE link = ? AND kind = 'human' AND clicked_at >= ?
       ORDER BY clicked_at DESC, id DESC
       LIMIT ?`
    )
    .bind(link, since, limit)
    .all();
  return results;
}

export function lastHumanOpen(db, link) {
  return db
    .prepare(
      `SELECT clicked_at AS clickedAt, browser, city, country
       FROM clicks
       WHERE link = ? AND kind = 'human'
       ORDER BY clicked_at DESC, id DESC
       LIMIT 1`
    )
    .bind(link)
    .first();
}

// Clicks without ?src= are counted as "direct".
export async function humanOpensBySource(db, link) {
  const { results } = await db
    .prepare(
      `SELECT COALESCE(source, 'direct') AS source, COUNT(*) AS opens
       FROM clicks
       WHERE link = ? AND kind = 'human'
       GROUP BY COALESCE(source, 'direct')
       ORDER BY opens DESC, source`
    )
    .bind(link)
    .all();
  return results;
}

// The hash changes every day, so this counts each device once per day.
export async function uniqueVisitorsSince(db, link, since) {
  const row = await db
    .prepare(
      `SELECT COUNT(DISTINCT visitor) AS total
       FROM clicks
       WHERE link = ? AND kind = 'human' AND visitor IS NOT NULL AND clicked_at >= ?`
    )
    .bind(link, since)
    .first();
  return row.total;
}
