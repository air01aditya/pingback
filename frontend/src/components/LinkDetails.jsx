import { useEffect, useState } from "react";
import { getLink } from "../api/links";
import { formatDateTime } from "../utils/time";

function describeAgent(userAgent) {
  if (!userAgent) return "Unknown";
  if (/linkedinbot/i.test(userAgent)) return "LinkedIn preview";
  if (/slackbot/i.test(userAgent)) return "Slack preview";
  if (/whatsapp/i.test(userAgent)) return "WhatsApp preview";
  if (/iphone|android/i.test(userAgent)) return "Phone browser";
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  return userAgent.slice(0, 40);
}

export default function LinkDetails({ linkId, refreshKey }) {
  const [link, setLink] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    getLink(linkId)
      .then((data) => !ignore && setLink(data))
      .catch((err) => !ignore && setError(err.message));
    return () => {
      ignore = true;
    };
  }, [linkId, refreshKey]);

  if (error) return <aside className="card details error">{error}</aside>;
  if (!link) return <aside className="card details muted">Loading…</aside>;

  return (
    <aside className="card details">
      <h2>{link.label}</h2>
      <a className="target" href={link.targetUrl} target="_blank" rel="noreferrer">
        {link.targetUrl}
      </a>

      <div className="summary">
        <div>
          <b>{link.opens}</b>
          <span>human opens</span>
        </div>
        <div>
          <b>{link.botHits}</b>
          <span>previews filtered</span>
        </div>
      </div>

      <h3>Activity</h3>
      {link.clicks.length === 0 ? (
        <p className="muted">No activity yet. Paste the link into your application and check back.</p>
      ) : (
        <ul className="activity">
          {link.clicks.map((click, i) => (
            <li key={i} className={click.isBot ? "bot" : ""}>
              <span>{formatDateTime(click.clickedAt)}</span>
              <span>{describeAgent(click.userAgent)}</span>
              {click.isBot && <span className="tag">ignored</span>}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
