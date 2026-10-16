import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, FolderOpen, SearchCheck, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { CaseTable } from "../components/CaseTable.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Filters } from "../components/Filters.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { SeverityChart } from "../components/SeverityChart.jsx";
import { DashboardSkeleton } from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { sortRows, startOfWeek } from "../lib/format.js";
import { useIncidents } from "../lib/useIncidents.js";

const emptyFilters = { status: "", severity: "", q: "" };

export function Dashboard() {
  const { profile } = useAuth();
  const { incidents, error, loading, refreshing, reload } = useIncidents(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState({ key: "updated_at", dir: "desc" });

  const filtered = useMemo(() => {
    if (!incidents) return [];
    const query = filters.q.trim().toLowerCase();
    return incidents.filter((incident) => {
      if (filters.status && incident.status !== filters.status) return false;
      if (filters.severity && incident.severity !== filters.severity) return false;
      if (!query) return true;
      const haystack = `${incident.title} ${incident.description} ${incident.category}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [incidents, filters]);

  const sorted = sortRows(filtered, sort);
  const recent = sorted.slice(0, 8);
  const weekStart = startOfWeek();
  const open = incidents?.filter((item) => item.status === "open").length || 0;
  const investigating = incidents?.filter((item) => item.status === "investigating").length || 0;
  const resolved = incidents?.filter((item) => item.status === "resolved" && item.resolved_at && new Date(item.resolved_at) >= weekStart).length || 0;
  const bytes = incidents?.reduce((sum, item) => sum + (Number(item.byte_size) || 0), 0) || 0;
  const reviewer = profile?.role === "reviewer";

  function onSort(key) {
    setSort((current) => (
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    ));
  }

  const listQuery = new URLSearchParams();
  if (filters.status) listQuery.set("status", filters.status);
  if (filters.severity) listQuery.set("severity", filters.severity);
  if (filters.q) listQuery.set("q", filters.q);
  const listLink = listQuery.size ? `/incidents?${listQuery}` : "/incidents";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={reviewer ? "Every case currently stored in the cloud." : "Cases you have filed."}
        action={<Button to="/incidents/new">New report</Button>}
      />
      {loading ? <DashboardSkeleton /> : null}
      {!loading && error && !incidents ? (
        <div className="content">
          <div className="card card-pad stack">
            <p>{error}</p>
            <div><Button onClick={reload}>Try again</Button></div>
          </div>
        </div>
      ) : null}
      {incidents ? (
        <div className="content">
          <section className="metric-grid" aria-label="Case totals">
            <MetricCard label="Open" value={open} caption="Waiting for review" icon={FolderOpen} delay={0} />
            <MetricCard label="Investigating" value={investigating} caption="Being reviewed" icon={SearchCheck} delay={40} />
            <MetricCard label="Resolved this week" value={resolved} caption="Since Monday" icon={ShieldCheck} delay={80} />
            <MetricCard label="Evidence stored" value={bytes} caption="Private bucket" icon={Archive} delay={120} format="bytes" />
          </section>
          <div className="dashboard-grid">
            <section className="card card-pad rise" style={{ animationDelay: "160ms" }}>
              <div className="card-heading">
                <h2 className="card-title">Recent cases</h2>
                <p className="card-meta">
                  {sorted.length > recent.length ? `${recent.length} of ${sorted.length}` : `${sorted.length} ${sorted.length === 1 ? "case" : "cases"}`}
                </p>
              </div>
              <Filters
                status={filters.status}
                severity={filters.severity}
                query={filters.q}
                onStatus={(status) => setFilters((current) => ({ ...current, status }))}
                onSeverity={(severity) => setFilters((current) => ({ ...current, severity }))}
                onQuery={(q) => setFilters((current) => ({ ...current, q }))}
                onClear={() => setFilters(emptyFilters)}
              />
              {sorted.length ? (
                <>
                  <CaseTable incidents={recent} showOwner={reviewer} sort={sort} onSort={onSort} refreshing={refreshing} />
                  {sorted.length > recent.length ? (
                    <div className="form-actions">
                      <Link to={listLink}>View all</Link>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title={incidents.length ? "No cases match" : "No cases yet"}
                  body={incidents.length ? "Clear a filter or try a different search." : "File a report to store the first piece of evidence."}
                  action={incidents.length ? null : <Button to="/incidents/new">New report</Button>}
                />
              )}
            </section>
            <section className="card card-pad rise" style={{ animationDelay: "200ms" }}>
              <div className="card-heading">
                <h2 className="card-title">Severity</h2>
              </div>
              {incidents.length ? (
                <SeverityChart incidents={incidents} />
              ) : (
                <EmptyState icon={ShieldCheck} title="Nothing to chart" body="Severity appears after the first report." />
              )}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
