export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...BASE_HEADERS, ...headers },
  });
}

export function text(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...BASE_HEADERS },
  });
}

export function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "Referrer-Policy": "no-referrer", ...BASE_HEADERS },
  });
}

export function errorResponse(err, isApi) {
  if (!(err instanceof HttpError)) {
    console.error(err);
    err = new HttpError(500, "Something went wrong");
  }
  return isApi ? json({ error: err.message }, err.status) : text(err.message, err.status);
}

const MAX_BODY_BYTES = 10_000;

export async function readJson(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new HttpError(415, "Send the request as JSON");
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request is too large");
  }
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Request body is not valid JSON");
  }
}
