const linksService = require("../services/links.service");
const detectBot = require("../utils/detectBot");
const HttpError = require("../utils/httpError");

function follow(req, res) {
  const link = linksService.findByCode(req.params.code);
  if (!link) throw new HttpError(404, "Short link not found");

  const userAgent = req.get("user-agent");
  linksService.recordClick(link.id, {
    userAgent,
    referrer: req.get("referer"),
    isBot: detectBot(userAgent),
  });

  // 302, not 301: browsers cache 301s and would skip us on the next visit.
  res.redirect(302, link.target_url);
}

module.exports = { follow };
