const countEl = document.getElementById("demo-count");
const POLL_MS = 10_000;
const STOP_AFTER_MS = 5 * 60_000;
const startedAt = Date.now();

async function refresh() {
  try {
    const res = await fetch("/api/demo-stats");
    if (res.ok) countEl.textContent = (await res.json()).opens;
  } catch {
    // Offline or blocked: keep showing the last number.
  }
}

refresh();

const timer = setInterval(() => {
  if (Date.now() - startedAt > STOP_AFTER_MS) return clearInterval(timer);
  if (!document.hidden) refresh();
}, POLL_MS);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refresh();
});
