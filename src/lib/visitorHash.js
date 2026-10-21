// Turns IP + browser into an id that can't be reversed without the secret.
// The day is part of the input, so the same person gets a new id every day
// and old ids can't be linked to new ones.
export async function visitorHash(secret, request, now = new Date()) {
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip || !secret) return null;

  const userAgent = request.headers.get("user-agent") || "";
  const day = now.toISOString().slice(0, 10);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`visitor|${day}|${ip}|${userAgent}`));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
