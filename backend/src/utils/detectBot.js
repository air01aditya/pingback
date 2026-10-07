// Link previews (LinkedIn, Slack, WhatsApp...) fetch the URL the moment it's pasted,
// before any human clicks it. Counting those would make every link look "opened".
const BOT_PATTERN =
  /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|skypeuripreview|embedly|curl|wget|python-requests|headless/i;

function detectBot(userAgent) {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

module.exports = detectBot;
