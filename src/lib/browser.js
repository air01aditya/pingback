const PREVIEWERS = [
  ["linkedinbot", "LinkedIn preview"],
  ["slackbot", "Slack preview"],
  ["whatsapp", "WhatsApp preview"],
  ["telegrambot", "Telegram preview"],
  ["discordbot", "Discord preview"],
  ["twitterbot", "X preview"],
  ["facebookexternalhit", "Facebook preview"],
  ["googlebot", "Google crawler"],
];

const BROWSERS = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/SamsungBrowser/, "Samsung Internet"],
  [/Firefox\/|FxiOS/, "Firefox"],
  [/Chrome\/|CriOS/, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS = [
  [/Android/, "Android"],
  [/iPhone|iPad/, "iOS"],
  [/Windows/, "Windows"],
  [/Mac OS X/, "macOS"],
  [/Linux/, "Linux"],
];

export function describeBrowser(userAgent) {
  if (!userAgent) return "Unknown";

  const lower = userAgent.toLowerCase();
  const previewer = PREVIEWERS.find(([needle]) => lower.includes(needle));
  if (previewer) return previewer[1];

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Other";
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  return system ? `${browser} on ${system}` : browser;
}
