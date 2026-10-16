export const CATEGORIES = ["Safety", "Maintenance", "Facilities", "Network", "Other"];
export const SEVERITIES = ["low", "medium", "high"];
export const STATUSES = ["open", "investigating", "resolved"];
export const ROLES = ["reporter", "reviewer"];

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const SIGNED_URL_SECONDS = 300;
