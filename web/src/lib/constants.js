export const CATEGORIES = ["Safety", "Maintenance", "Facilities", "Network", "Other"];
export const SEVERITIES = ["low", "medium", "high"];
export const STATUSES = ["open", "investigating", "resolved"];
export const ROLES = [
  { value: "reporter", label: "Reporter" },
  { value: "reviewer", label: "Reviewer" },
];

export function label(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
