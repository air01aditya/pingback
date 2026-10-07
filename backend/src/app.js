const express = require("express");
const linksRoutes = require("./routes/links.routes");
const redirectRoutes = require("./routes/redirect.routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/links", linksRoutes);
app.use("/", redirectRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
