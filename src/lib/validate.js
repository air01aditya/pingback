import { HttpError } from "./http.js";

export function resumeUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, "Paste your resume link");
  }
  const raw = value.trim();
  if (raw.length > 2000) throw new HttpError(400, "That link is too long");

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(400, "That isn't a valid link");
  }
  if (url.protocol !== "https:") throw new HttpError(400, "The link must start with https://");
  return url.toString();
}

export function deviceName(value) {
  if (typeof value !== "string") return "My device";
  const name = value.trim().slice(0, 60);
  return name || "My device";
}

export function positiveInt(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${label} must be a positive number`);
  return n;
}
