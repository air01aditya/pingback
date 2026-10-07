// SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC with no timezone marker.
function parseDbDate(value) {
  return new Date(value.replace(" ", "T") + "Z");
}

export function timeAgo(value) {
  if (!value) return "never";

  const seconds = Math.floor((Date.now() - parseDbDate(value)) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDateTime(value) {
  return parseDbDate(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
