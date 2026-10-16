import { Search, X } from "lucide-react";
import { SEVERITIES, STATUSES, label } from "../lib/constants.js";
import { Button } from "./Button.jsx";

export function Filters({ status, severity, query, onStatus, onSeverity, onQuery, onClear }) {
  const active = Boolean(status || severity || query);

  return (
    <div className="filters">
      <div className="search">
        <Search size={16} aria-hidden="true" />
        <input
          className="input"
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search title or description"
          aria-label="Search cases"
        />
      </div>
      <select className="input" value={status} onChange={(event) => onStatus(event.target.value)} aria-label="Filter by status">
        <option value="">All statuses</option>
        {STATUSES.map((item) => (
          <option key={item} value={item}>{label(item)}</option>
        ))}
      </select>
      <select className="input" value={severity} onChange={(event) => onSeverity(event.target.value)} aria-label="Filter by severity">
        <option value="">All severities</option>
        {SEVERITIES.map((item) => (
          <option key={item} value={item}>{label(item)}</option>
        ))}
      </select>
      {active ? (
        <Button variant="ghost" onClick={onClear}>
          <X size={16} aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
