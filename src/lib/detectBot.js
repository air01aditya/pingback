// LinkedIn, Slack, WhatsApp and friends fetch a link the moment it's pasted to build a
// preview card. Counting those would make the link look "opened" before anyone clicks.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|skypeuripreview|embedly|vkshare|curl|wget|python|go-http-client|okhttp|java\/|headless|lighthouse/i;

export function detectBot(userAgent) {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}
