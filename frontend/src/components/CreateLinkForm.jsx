import { useState } from "react";
import { createLink } from "../api/links";

export default function CreateLinkForm({ onCreated }) {
  const [label, setLabel] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const link = await createLink({ label, targetUrl });
      setLabel("");
      onCreated(link);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card create-form" onSubmit={handleSubmit}>
      <h2>New tracking link</h2>
      <p className="muted">One link per application, so you know exactly who opened it.</p>

      <div className="fields">
        <label>
          Company / where you're sending it
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Razorpay – Backend Intern"
            maxLength={100}
            required
          />
        </label>

        <label>
          Your resume or portfolio URL
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://drive.google.com/…"
            required
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={saving}>
        {saving ? "Creating…" : "Create link"}
      </button>
    </form>
  );
}
