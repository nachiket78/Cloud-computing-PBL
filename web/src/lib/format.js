export function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value)) return "—";
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function shortId(id) {
  return String(id || "").slice(0, 8).toUpperCase();
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A";
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export function startOfWeek(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

export function truncateHash(hash) {
  if (!hash) return "—";
  if (hash.length < 20) return hash;
  return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
}

const STATUS_RANK = { open: 0, investigating: 1, resolved: 2 };
const SEVERITY_RANK = { low: 0, medium: 1, high: 2 };

export function sortRows(rows, sort) {
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = rank(sort.key, a[sort.key]);
    const bv = rank(sort.key, b[sort.key]);
    let cmp = 0;
    if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    return sort.dir === "asc" ? cmp : -cmp;
  });
  return copy;
}

function rank(key, value) {
  if (key === "status") return STATUS_RANK[value] ?? value;
  if (key === "severity") return SEVERITY_RANK[value] ?? value;
  return value ?? "";
}

export function auditSummary(entry) {
  if (entry.action === "created") return "Filed the report";
  const from = entry.from_status ? labelStatus(entry.from_status) : "Unknown";
  const to = entry.to_status ? labelStatus(entry.to_status) : "Unknown";
  return `${from} → ${to}`;
}

function labelStatus(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
