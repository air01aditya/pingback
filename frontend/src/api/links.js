async function request(path, options = {}) {
  const res = await fetch(`/api/links${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function getLinks() {
  return request("");
}

export function getLink(id) {
  return request(`/${id}`);
}

export function createLink({ targetUrl, label }) {
  return request("", {
    method: "POST",
    body: JSON.stringify({ targetUrl, label }),
  });
}

export function deleteLink(id) {
  return request(`/${id}`, { method: "DELETE" });
}
