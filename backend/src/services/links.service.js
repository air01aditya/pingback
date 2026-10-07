const db = require("../db");
const generateCode = require("../utils/generateCode");

const statsColumns = `
  SUM(CASE WHEN c.is_bot = 0 THEN 1 ELSE 0 END) AS opens,
  SUM(CASE WHEN c.is_bot = 1 THEN 1 ELSE 0 END) AS bot_hits,
  MAX(CASE WHEN c.is_bot = 0 THEN c.clicked_at END) AS last_opened_at
`;

const listStmt = db.prepare(`
  SELECT l.*, ${statsColumns}
  FROM links l
  LEFT JOIN clicks c ON c.link_id = l.id
  GROUP BY l.id
  ORDER BY l.created_at DESC, l.id DESC
`);

const findByIdStmt = db.prepare(`
  SELECT l.*, ${statsColumns}
  FROM links l
  LEFT JOIN clicks c ON c.link_id = l.id
  WHERE l.id = ?
  GROUP BY l.id
`);

const findByCodeStmt = db.prepare("SELECT * FROM links WHERE code = ?");
const insertStmt = db.prepare("INSERT INTO links (code, target_url, label) VALUES (?, ?, ?)");
const deleteStmt = db.prepare("DELETE FROM links WHERE id = ?");
const clicksForLinkStmt = db.prepare(
  "SELECT clicked_at, user_agent, referrer, is_bot FROM clicks WHERE link_id = ? ORDER BY clicked_at DESC, id DESC LIMIT 100"
);
const insertClickStmt = db.prepare(
  "INSERT INTO clicks (link_id, user_agent, referrer, is_bot) VALUES (?, ?, ?, ?)"
);

function toLink(row) {
  return {
    id: row.id,
    code: row.code,
    targetUrl: row.target_url,
    label: row.label,
    createdAt: row.created_at,
    opens: row.opens || 0,
    botHits: row.bot_hits || 0,
    lastOpenedAt: row.last_opened_at || null,
  };
}

function listLinks() {
  return listStmt.all().map(toLink);
}

function getLink(id) {
  const row = findByIdStmt.get(id);
  if (!row) return null;

  const clicks = clicksForLinkStmt.all(id).map((c) => ({
    clickedAt: c.clicked_at,
    userAgent: c.user_agent,
    referrer: c.referrer,
    isBot: c.is_bot === 1,
  }));

  return { ...toLink(row), clicks };
}

function createLink({ targetUrl, label }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      const result = insertStmt.run(code, targetUrl, label);
      return getLink(result.lastInsertRowid);
    } catch (err) {
      if (err.code !== "SQLITE_CONSTRAINT_UNIQUE") throw err;
    }
  }
  throw new Error("Could not generate a unique code");
}

function deleteLink(id) {
  return deleteStmt.run(id).changes > 0;
}

function findByCode(code) {
  return findByCodeStmt.get(code);
}

function recordClick(linkId, { userAgent, referrer, isBot }) {
  insertClickStmt.run(linkId, userAgent || null, referrer || null, isBot ? 1 : 0);
}

module.exports = {
  listLinks,
  getLink,
  createLink,
  deleteLink,
  findByCode,
  recordClick,
};
