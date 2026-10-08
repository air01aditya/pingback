const form = document.getElementById("setup-form");
const secretInput = document.getElementById("secret");
const nameInput = document.getElementById("name");
const errorEl = document.getElementById("error");

// The key travels after "#", which browsers never send to a server.
const key = new URLSearchParams(location.hash.slice(1)).get("key");
if (key) {
  secretInput.value = key;
  document.getElementById("secret-field").classList.add("hidden");
  history.replaceState(null, "", location.pathname);
}

nameInput.value = guessDeviceName(navigator.userAgent);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");
  const button = form.querySelector("button");
  button.disabled = true;

  try {
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretInput.value, name: nameInput.value }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    location.href = "/app";
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong";
    errorEl.classList.remove("hidden");
    document.getElementById("secret-field").classList.remove("hidden");
    button.disabled = false;
  }
});

function guessDeviceName(ua) {
  if (/Android/.test(ua)) return "Android phone";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Windows/.test(ua)) return "Windows laptop";
  if (/Mac OS X/.test(ua)) return "Mac";
  return "My device";
}
