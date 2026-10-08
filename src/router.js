export function createRouter() {
  const routes = [];

  const add = (method) => (pattern, handler) => {
    routes.push({ method, parts: pattern.split("/").filter(Boolean), handler });
    return router;
  };

  const router = {
    get: add("GET"),
    post: add("POST"),
    put: add("PUT"),
    delete: add("DELETE"),

    match(request) {
      const segments = new URL(request.url).pathname.split("/").filter(Boolean);
      const method = request.method === "HEAD" ? "GET" : request.method;

      for (const route of routes) {
        if (route.method !== method || route.parts.length !== segments.length) continue;

        const params = {};
        const matches = route.parts.every((part, i) => {
          if (part.startsWith(":")) {
            params[part.slice(1)] = decodeURIComponent(segments[i]);
            return true;
          }
          return part === segments[i];
        });

        if (matches) return { handler: route.handler, params };
      }
      return null;
    },
  };

  return router;
}
