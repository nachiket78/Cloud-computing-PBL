import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Copy, FileWarning } from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { Button } from "../components/Button.jsx";
import { Dialog } from "../components/Dialog.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Field, inputProps } from "../components/Field.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../lib/api.js";
import { STATUSES, label } from "../lib/constants.js";
import { auditSummary, formatBytes, formatDate, shortId, truncateHash } from "../lib/format.js";

export function IncidentDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [link, setLink] = useState(null);
  const [linkError, setLinkError] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("investigating");
  const [note, setNote] = useState("");
  const [statusError, setStatusError] = useState({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setError("");
    try {
      const next = await api(`/api/incidents/${id}`);
      setData(next);
      setStatus(next.incident.status === "open" ? "investigating" : next.incident.status);
    } catch (err) {
      setData(null);
      setError(err.message);
    }
  }

  useEffect(() => {
    let active = true;
    setData(null);
    setLink(null);
    api(`/api/incidents/${id}`)
      .then((next) => {
        if (!active) return;
        setData(next);
        setStatus(next.incident.status === "open" ? "investigating" : next.incident.status);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!data?.incident) return undefined;
    let active = true;
    api(`/api/incidents/${id}/evidence`)
      .then((next) => {
        if (active) setLink(next);
      })
      .catch((err) => {
        if (active) setLinkError(err.message);
      });
    return () => {
      active = false;
    };
  }, [id, data]);

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(data.incident.sha256);
      setCopied(true);
      showToast("Hash copied.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("Could not copy the hash.", "error");
    }
  }

  async function saveStatus(event) {
    event.preventDefault();
    const next = {};
    if (!STATUSES.includes(status) || status === data.incident.status) next.status = "Choose a different status.";
    if (note.trim().length < 3) next.note = "Add a note between 3 and 1000 characters.";
    setStatusError(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await api(`/api/incidents/${id}/status`, {
        method: "POST",
        body: { status, note: note.trim() },
      });
      setOpen(false);
      setNote("");
      showToast("Status updated.");
      await load();
    } catch (err) {
      if (err.fields) setStatusError(err.fields);
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const incident = data?.incident;
  const reviewer = profile?.role === "reviewer";

  return (
    <>
      <PageHeader
        title={incident?.title || "Case"}
        description={incident ? `${incident.category} · ${shortId(incident.id)}` : "Loading the case."}
        action={reviewer && incident ? <Button onClick={() => setOpen(true)}>Update status</Button> : null}
      />
      <div className="content">
        {!data && !error ? <Skeleton className="block-skeleton" /> : null}
        {error ? (
          <EmptyState icon={FileWarning} title="Case unavailable" body={error} action={<Button to="/incidents">Back to incidents</Button>} />
        ) : null}
        {incident ? (
          <div className="detail-grid">
            <section className="card card-pad rise">
              <h2 className="card-title">Report</h2>
              <p className="prose" style={{ marginTop: 16 }}>{incident.description}</p>
              <div className="card-heading" style={{ marginTop: 24, marginBottom: 0 }}>
                <h2 className="card-title">Evidence</h2>
                {link ? (
                  <a href={link.url} target="_blank" rel="noreferrer">Open file</a>
                ) : null}
              </div>
              <p className="field-hint" style={{ marginTop: 8 }}>
                {incident.file_name} · {formatBytes(incident.byte_size)}
                {link ? ` · link expires in ${Math.round(link.expiresIn / 60)} minutes` : ""}
              </p>
              {linkError ? <p className="field-error" style={{ marginTop: 8 }}>{linkError}</p> : null}
              {!link && !linkError ? <Skeleton className="block-skeleton" /> : null}
              {link ? (
                <div className="evidence-frame">
                  {incident.file_type === "application/pdf" ? (
                    <iframe title="Evidence PDF" src={link.url} />
                  ) : (
                    <img src={link.url} alt={incident.file_name || "Evidence"} />
                  )}
                </div>
              ) : null}
            </section>
            <aside className="stack">
              <section className="card card-pad rise" style={{ animationDelay: "40ms" }}>
                <h2 className="card-title">Record</h2>
                <dl className="meta" style={{ marginTop: 16 }}>
                  <dt>Status</dt>
                  <dd><Badge tone={incident.status}>{label(incident.status)}</Badge></dd>
                  <dt>Severity</dt>
                  <dd><Badge tone={incident.severity} /></dd>
                  <dt>Reporter</dt>
                  <dd>{incident.owner_name}</dd>
                  <dt>Filed</dt>
                  <dd>{formatDate(incident.created_at)}</dd>
                  <dt>Updated</dt>
                  <dd>{formatDate(incident.updated_at)}</dd>
                  <dt>Hash</dt>
                  <dd>
                    <div className="hash-row">
                      <code title={incident.sha256}>{truncateHash(incident.sha256)}</code>
                      <button type="button" className="icon-button" onClick={copyHash} aria-label="Copy file hash">
                        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  </dd>
                </dl>
              </section>
              <section className="card card-pad rise" style={{ animationDelay: "80ms" }}>
                <h2 className="card-title">Audit</h2>
                <ol className="timeline">
                  {(data.audit || []).map((entry) => (
                    <li key={entry.id}>
                      <p>{auditSummary(entry)}</p>
                      <p className="note">{entry.actor_name} · {formatDate(entry.created_at)}</p>
                      {entry.note ? <p className="note">{entry.note}</p> : null}
                    </li>
                  ))}
                </ol>
              </section>
            </aside>
          </div>
        ) : null}
      </div>
      <Dialog
        open={open}
        title="Update status"
        description="A note is required. It is appended to the audit log."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={saveStatus} noValidate>
          <Field id="status" label="Status" error={statusError.status}>
            <select {...inputProps("status", statusError.status)} value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUSES.map((item) => (
                <option key={item} value={item} disabled={item === incident?.status}>{label(item)}</option>
              ))}
            </select>
          </Field>
          <Field id="note" label="Note" error={statusError.note}>
            <textarea {...inputProps("note", statusError.note)} className="textarea" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Saving…" : "Save status"}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
