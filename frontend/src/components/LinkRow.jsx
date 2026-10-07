import { useState } from "react";
import { timeAgo } from "../utils/time";

export default function LinkRow({ link, selected, onSelect, onDelete }) {
  const [copied, setCopied] = useState(false);

  async function copy(e) {
    e.stopPropagation();
    await navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function remove(e) {
    e.stopPropagation();
    if (confirm(`Delete the link for "${link.label}"? Its click history goes too.`)) {
      onDelete(link.id);
    }
  }

  const opened = link.opens > 0;

  return (
    <li className={`link-row ${selected ? "selected" : ""}`} onClick={() => onSelect(link.id)}>
      <div className="link-main">
        <span className={`status ${opened ? "opened" : "waiting"}`}>
          {opened ? "Opened" : "Not opened"}
        </span>
        <strong>{link.label}</strong>
        <code className="short-url">{link.shortUrl.replace(/^https?:\/\//, "")}</code>
      </div>

      <div className="link-stats">
        <span>
          <b>{link.opens}</b> {link.opens === 1 ? "open" : "opens"}
        </span>
        <span className="muted">last {timeAgo(link.lastOpenedAt)}</span>
      </div>

      <div className="link-actions">
        <button className="ghost" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
        <button className="ghost danger" onClick={remove}>
          Delete
        </button>
      </div>
    </li>
  );
}
