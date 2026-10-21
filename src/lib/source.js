// Places the link gets shared. Anything else becomes "other", so the table can't fill with junk.
const SOURCES = ["resume", "linkedin", "naukri", "github", "email"];

export function sourceFromRequest(request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src) return null;
  const value = src.trim().toLowerCase();
  return SOURCES.includes(value) ? value : "other";
}
