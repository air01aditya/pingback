import { createRouter } from "./router.js";
import { HttpError, errorResponse } from "./lib/http.js";
import { isSameOrigin, requireDevice } from "./lib/auth.js";
import * as redirect from "./handlers/redirect.js";
import * as setup from "./handlers/setup.js";
import * as stats from "./handlers/stats.js";
import * as resume from "./handlers/resume.js";
import * as devices from "./handlers/devices.js";

// Pages, CSS and JS in public/ are served by Cloudflare before this code runs.
// Only the routes below reach the Worker.
const router = createRouter()
  .get("/cv", redirect.resume)
  .get("/demo", redirect.demo)
  .get("/api/demo-stats", stats.demo)
  .post("/api/setup", setup.create)
  .get("/api/me", requireDevice(devices.me))
  .get("/api/stats", requireDevice(stats.owner))
  .put("/api/resume", requireDevice(resume.update))
  .get("/api/devices", requireDevice(devices.list))
  .delete("/api/devices/:id", requireDevice(devices.remove));

export default {
  async fetch(request, env, ctx) {
    const isApi = new URL(request.url).pathname.startsWith("/api/");
    try {
      if (!isSameOrigin(request)) throw new HttpError(403, "Cross-site request blocked");

      const match = router.match(request);
      if (!match) throw new HttpError(404, "Not found");

      return await match.handler({ request, env, ctx, params: match.params });
    } catch (err) {
      return errorResponse(err, isApi);
    }
  },
};
