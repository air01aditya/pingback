const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ', 'now')";
const COLUMNS = "id, name, created_at AS createdAt, last_seen_at AS lastSeenAt";

export function createDevice(db, { name, tokenHash }) {
  return db.prepare("INSERT INTO devices (name, token_hash) VALUES (?, ?)").bind(name, tokenHash).run();
}

export function findDeviceByTokenHash(db, tokenHash) {
  return db.prepare(`SELECT ${COLUMNS} FROM devices WHERE token_hash = ?`).bind(tokenHash).first();
}

export function touchDevice(db, id) {
  return db.prepare(`UPDATE devices SET last_seen_at = ${NOW} WHERE id = ?`).bind(id).run();
}

export async function listDevices(db) {
  const { results } = await db.prepare(`SELECT ${COLUMNS} FROM devices ORDER BY id`).all();
  return results;
}

export async function countDevices(db) {
  const row = await db.prepare("SELECT COUNT(*) AS total FROM devices").first();
  return row.total;
}

export async function deleteDevice(db, id) {
  const result = await db.prepare("DELETE FROM devices WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}
