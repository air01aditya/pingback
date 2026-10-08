import { json, readJson } from "../lib/http.js";
import { resumeUrl } from "../lib/validate.js";
import { setResumeUrl } from "../services/settings.js";

export async function update({ request, env }) {
  const body = await readJson(request);
  const url = resumeUrl(body.url);
  await setResumeUrl(env.DB, url);
  return json({ url });
}
