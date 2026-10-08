import { HttpError, json, readJson } from "../lib/http.js";
import { deviceCookie, newToken, secretsMatch, sha256 } from "../lib/auth.js";
import { deviceName } from "../lib/validate.js";
import { countDevices, createDevice } from "../services/devices.js";

const MAX_DEVICES = 10;

export async function create({ request, env }) {
  const secret = env.SETUP_SECRET;
  if (!secret || secret.length < 32) throw new HttpError(500, "Setup secret is not configured");

  const body = await readJson(request);
  if (typeof body.secret !== "string" || !(await secretsMatch(body.secret, secret))) {
    throw new HttpError(401, "That setup link isn't valid");
  }
  if ((await countDevices(env.DB)) >= MAX_DEVICES) {
    throw new HttpError(409, "Too many devices. Remove one from the dashboard first.");
  }

  const token = newToken();
  const name = deviceName(body.name);
  await createDevice(env.DB, { name, tokenHash: await sha256(token) });

  return json({ name }, 201, { "Set-Cookie": deviceCookie(token) });
}
