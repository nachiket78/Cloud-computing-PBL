import { CATEGORIES, SEVERITIES, STATUSES, ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from "./constants.js";

export function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateIncidentFields(body) {
  const title = cleanText(body.title);
  const category = cleanText(body.category);
  const severity = cleanText(body.severity);
  const description = cleanText(body.description);
  const errors = {};

  if (title.length < 3 || title.length > 120) {
    errors.title = "Use a title between 3 and 120 characters.";
  }
  if (!CATEGORIES.includes(category)) {
    errors.category = "Choose a category.";
  }
  if (!SEVERITIES.includes(severity)) {
    errors.severity = "Choose a severity.";
  }
  if (description.length < 10 || description.length > 4000) {
    errors.description = "Describe the incident in 10 to 4000 characters.";
  }

  return {
    errors,
    value: { title, category, severity, description },
  };
}

export function normalizeMime(type) {
  return type === "image/jpg" ? "image/jpeg" : type;
}

export function validateEvidenceFile(file) {
  if (!file) return "Attach a photo or PDF.";
  if (!file.size) return "The file is empty.";
  if (!ALLOWED_MIME_TYPES.has(normalizeMime(file.mimetype))) {
    return "Upload a JPG, PNG, WebP, or PDF.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Files must be 4 MB or smaller.";
  }
  return "";
}

export function validateStatusChange(body, currentStatus) {
  const status = cleanText(body.status);
  const note = cleanText(body.note);
  const errors = {};

  if (!STATUSES.includes(status)) {
    errors.status = "Choose a status.";
  } else if (status === currentStatus) {
    errors.status = "Choose a different status.";
  }

  if (note.length < 3 || note.length > 1000) {
    errors.note = "Add a note between 3 and 1000 characters.";
  }

  return { errors, value: { status, note } };
}

export function safeFileName(name) {
  const base = String(name || "evidence").split(/[/\\]/).pop();
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 120) || "evidence";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID.test(String(value || ""));
}
