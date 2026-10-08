const RESUME_URL = "resume_url";

export async function getResumeUrl(db) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = ?").bind(RESUME_URL).first();
  return row ? row.value : null;
}

export function setResumeUrl(db, url) {
  return db
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value"
    )
    .bind(RESUME_URL, url)
    .run();
}
