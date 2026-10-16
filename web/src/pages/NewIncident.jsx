import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.jsx";
import { Field, inputProps } from "../components/Field.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../lib/api.js";
import { CATEGORIES, SEVERITIES, label } from "../lib/constants.js";
import { formatBytes } from "../lib/format.js";

const empty = { title: "", category: "", severity: "", description: "" };

export function NewIncident() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const next = {};
    if (form.title.trim().length < 3 || form.title.trim().length > 120) {
      next.title = "Use a title between 3 and 120 characters.";
    }
    if (!CATEGORIES.includes(form.category)) next.category = "Choose a category.";
    if (!SEVERITIES.includes(form.severity)) next.severity = "Choose a severity.";
    if (form.description.trim().length < 10) next.description = "Describe the incident in at least 10 characters.";
    if (!file) next.file = "Attach a photo or PDF.";
    else if (file.size > 4 * 1024 * 1024) next.file = "Files must be 4 MB or smaller.";
    else if (!["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"].includes(file.type)) {
      next.file = "Upload a JPG, PNG, WebP, or PDF.";
    }
    return next;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const body = new FormData();
    body.set("title", form.title.trim());
    body.set("category", form.category);
    body.set("severity", form.severity);
    body.set("description", form.description.trim());
    body.set("file", file);

    setSubmitting(true);
    try {
      const data = await api("/api/incidents", { method: "POST", body });
      showToast("Report filed. The file is in cloud storage.");
      navigate(`/incidents/${data.incident.id}`);
    } catch (error) {
      if (error.fields) setErrors(error.fields);
      showToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="New report" description="The note is saved in the database. The file goes to private cloud storage." />
      <div className="content">
        <form className="card card-pad form-card" onSubmit={onSubmit} noValidate>
          <Field id="title" label="Title" error={errors.title}>
            <input {...inputProps("title", errors.title)} maxLength={120} value={form.title} onChange={(event) => update("title", event.target.value)} />
          </Field>
          <Field id="category" label="Category" error={errors.category}>
            <select {...inputProps("category", errors.category)} value={form.category} onChange={(event) => update("category", event.target.value)}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>
          <Field id="severity" label="Severity" error={errors.severity}>
            <select {...inputProps("severity", errors.severity)} value={form.severity} onChange={(event) => update("severity", event.target.value)}>
              <option value="">Choose a severity</option>
              {SEVERITIES.map((severity) => <option key={severity} value={severity}>{label(severity)}</option>)}
            </select>
          </Field>
          <Field id="description" label="What happened" error={errors.description}>
            <textarea {...inputProps("description", errors.description)} className="textarea" maxLength={4000} value={form.description} onChange={(event) => update("description", event.target.value)} />
          </Field>
          <Field id="file" label="Evidence" error={errors.file} hint="JPG, PNG, WebP, or PDF. 4 MB maximum.">
            <label className="file-drop">
              <input
                id="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                aria-invalid={errors.file ? "true" : undefined}
                aria-describedby={errors.file ? "file-error" : "file-hint"}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <strong>{file ? file.name : "Choose a file"}</strong>
              <span>{file ? formatBytes(file.size) : "Stored privately. Downloads use a short-lived link."}</span>
            </label>
          </Field>
          <div className="form-actions">
            <Button variant="secondary" to="/incidents">Cancel</Button>
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Saving…" : "File report"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
