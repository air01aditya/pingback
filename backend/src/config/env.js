const path = require("path");

const port = Number(process.env.PORT) || 4000;

module.exports = {
  port,
  baseUrl: process.env.BASE_URL || `http://localhost:${port}`,
  dbPath: process.env.DB_PATH || path.join(__dirname, "../../data/pingback.db"),
};
