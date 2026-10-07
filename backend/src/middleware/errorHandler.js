function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    error: status >= 500 ? "Something went wrong on our side" : err.message,
  });
}

module.exports = errorHandler;
