const $ = (id) => document.getElementById(id);
const DAYS = 30;

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

const dateTime = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const shortDate = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function place(open) {
  return [open.city, open.country].filter(Boolean).join(", ");
}

function localDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function renderChart(opens) {
  const counts = new Map();
  for (const open of opens) {
    const key = localDayKey(new Date(open.clickedAt));
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const days = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    days.push({ day, count: counts.get(localDayKey(day)) || 0 });
  }

  const max = Math.max(1, ...days.map((d) => d.count));
  const chart = $("chart");
  chart.replaceChildren(
    ...days.map(({ day, count }) => {
      const bar = document.createElement("div");
      bar.className = count ? "bar" : "bar empty";
      bar.style.height = `${(count / max) * 100}%`;
      bar.title = `${shortDate.format(day)}: ${count} ${count === 1 ? "open" : "opens"}`;
      return bar;
    })
  );
  $("chart-start").textContent = shortDate.format(days[0].day);
}

function renderRecent(opens) {
  $("no-opens").classList.toggle("hidden", opens.length > 0);
  $("recent").replaceChildren(
    ...opens.slice(0, 20).map((open) => {
      const li = document.createElement("li");
      const when = document.createElement("span");
      when.textContent = dateTime.format(new Date(open.clickedAt));
      const where = document.createElement("span");
      where.className = "muted";
      where.textContent = [open.browser, place(open)].filter(Boolean).join(" · ");
      li.append(when, where);
      return li;
    })
  );
}

function renderStats(stats) {
  $("link").textContent = stats.link;
  $("no-resume").classList.toggle("hidden", Boolean(stats.resumeUrl));
  if (stats.resumeUrl && document.activeElement !== $("resume-url")) $("resume-url").value = stats.resumeUrl;

  $("opens").textContent = stats.opens;
  $("opens-label").textContent = stats.opens === 1 ? "open" : "opens";

  const last = stats.lastOpen;
  $("last-open").textContent = last
    ? `Last opened ${timeAgo(last.clickedAt)} · ${[last.browser, place(last)].filter(Boolean).join(" · ")}`
    : "Not opened yet.";

  $("ignored").textContent =
    `${stats.botsIgnored} link ${stats.botsIgnored === 1 ? "preview" : "previews"} ignored · ` +
    `${stats.ownClicksSkipped} of your own ${stats.ownClicksSkipped === 1 ? "click" : "clicks"} skipped`;

  renderChart(stats.recent);
  renderRecent(stats.recent);
}

async function renderDevices() {
  const { devices } = await api("/api/devices");
  $("devices").replaceChildren(
    ...devices.map((device) => {
      const li = document.createElement("li");
      const info = document.createElement("span");
      info.textContent = device.name;
      if (device.current) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = "  this device";
        info.append(tag);
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = "Remove";
      remove.addEventListener("click", async () => {
        const warning = device.current
          ? "Remove this device? You'll need your setup link to get back in."
          : `Remove "${device.name}"?`;
        if (!confirm(warning)) return;
        await api(`/api/devices/${device.id}`, { method: "DELETE" });
        if (device.current) location.reload();
        else renderDevices();
      });

      li.append(info, remove);
      return li;
    })
  );
}

async function loadStats() {
  renderStats(await api("/api/stats"));
}

$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("link").textContent);
  $("copy").textContent = "Copied";
  setTimeout(() => ($("copy").textContent = "Copy"), 1500);
});

$("resume-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = $("resume-status");
  try {
    await api("/api/resume", { method: "PUT", body: JSON.stringify({ url: $("resume-url").value }) });
    status.textContent = "Saved. Your link now opens this resume.";
    status.className = "muted small";
    loadStats();
  } catch (err) {
    status.textContent = err.message;
    status.className = "error small";
  }
});

async function start() {
  try {
    const me = await api("/api/me");
    $("subtitle").textContent = `Signed in on ${me.name}`;
  } catch (err) {
    if (err.status === 401) {
      $("subtitle").textContent = "";
      $("not-set-up").classList.remove("hidden");
      return;
    }
    $("subtitle").textContent = err.message;
    return;
  }

  $("dashboard").classList.remove("hidden");
  await Promise.all([loadStats(), renderDevices()]);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadStats();
  });
}

start();
