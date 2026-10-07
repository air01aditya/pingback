import { useCallback, useEffect, useState } from "react";
import { deleteLink, getLinks } from "./api/links";
import CreateLinkForm from "./components/CreateLinkForm";
import LinkRow from "./components/LinkRow";
import LinkDetails from "./components/LinkDetails";

export default function App() {
  const [links, setLinks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadLinks = useCallback(async () => {
    try {
      setLinks(await getLinks());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  function refresh() {
    loadLinks();
    setRefreshKey((k) => k + 1);
  }

  function handleCreated(link) {
    setLinks((prev) => [link, ...prev]);
    setSelectedId(link.id);
  }

  async function handleDelete(id) {
    try {
      await deleteLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  const openedCount = links.filter((l) => l.opens > 0).length;

  return (
    <div className="page">
      <header>
        <div>
          <h1>Pingback</h1>
          <p className="muted">Know when a recruiter actually opens your resume.</p>
        </div>
        {links.length > 0 && (
          <p className="headline-stat">
            <b>{openedCount}</b> of {links.length} opened
          </p>
        )}
      </header>

      <CreateLinkForm onCreated={handleCreated} />

      {error && <p className="error">{error}</p>}

      <div className={`layout ${selectedId ? "with-details" : ""}`}>
        <section className="card">
          <div className="section-head">
            <h2>Your links</h2>
            <button className="ghost" onClick={refresh}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="muted">Loading…</p>
          ) : links.length === 0 ? (
            <p className="muted">No links yet. Create one for your next application.</p>
          ) : (
            <ul className="link-list">
              {links.map((link) => (
                <LinkRow
                  key={link.id}
                  link={link}
                  selected={link.id === selectedId}
                  onSelect={setSelectedId}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </section>

        {selectedId && <LinkDetails linkId={selectedId} refreshKey={refreshKey} />}
      </div>
    </div>
  );
}
