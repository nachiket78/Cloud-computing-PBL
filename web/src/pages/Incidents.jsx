import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { CaseTable } from "../components/CaseTable.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Filters } from "../components/Filters.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useIncidents } from "../lib/useIncidents.js";

export function Incidents() {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState({ key: "updated_at", dir: "desc" });
  const filters = {
    status: params.get("status") || "",
    severity: params.get("severity") || "",
    q: params.get("q") || "",
  };
  const { incidents, error, loading, refreshing, reload } = useIncidents(filters);

  function update(next) {
    const merged = { ...filters, ...next };
    const query = {};
    if (merged.status) query.status = merged.status;
    if (merged.severity) query.severity = merged.severity;
    if (merged.q) query.q = merged.q;
    setParams(query, { replace: true });
  }

  function onSort(key) {
    setSort((current) => (
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    ));
  }

  return (
    <>
      <PageHeader
        title="Incidents"
        description={profile?.role === "reviewer" ? "All reports, newest activity first." : "Reports filed from your account."}
        action={<Button to="/incidents/new">New report</Button>}
      />
      <div className="content">
        <section className="card card-pad">
          <Filters
            status={filters.status}
            severity={filters.severity}
            query={filters.q}
            onStatus={(status) => update({ status })}
            onSeverity={(severity) => update({ severity })}
            onQuery={(q) => update({ q })}
            onClear={() => setParams({}, { replace: true })}
          />
          {loading ? <Skeleton className="block-skeleton" /> : null}
          {!loading && error && !incidents ? (
            <EmptyState icon={FolderOpen} title="Could not load cases" body={error} action={<Button onClick={reload}>Try again</Button>} />
          ) : null}
          {incidents && incidents.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={filters.status || filters.severity || filters.q ? "No cases match" : "No cases yet"}
              body={filters.status || filters.severity || filters.q ? "Clear a filter or try a different search." : "File a report to store the first piece of evidence."}
              action={<Button to="/incidents/new">New report</Button>}
            />
          ) : null}
          {incidents && incidents.length > 0 ? (
            <CaseTable
              incidents={incidents}
              showOwner={profile?.role === "reviewer"}
              sort={sort}
              onSort={onSort}
              refreshing={refreshing}
            />
          ) : null}
        </section>
      </div>
    </>
  );
}
