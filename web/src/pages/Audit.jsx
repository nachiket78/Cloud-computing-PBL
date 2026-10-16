import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScrollText } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { auditSummary, formatDate, sortRows } from "../lib/format.js";

export function Audit() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });

  function load() {
    setError("");
    api("/api/audit")
      .then((data) => setRows(data.audit))
      .catch((err) => {
        setRows(null);
        setError(err.message);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const columns = [
    {
      key: "created_at",
      header: "When",
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    { key: "actor_name", header: "Who", sortable: true },
    {
      key: "incident_title",
      header: "Case",
      sortable: true,
      render: (row) => row.incident_id ? <Link className="case-link" to={`/incidents/${row.incident_id}`}>{row.incident_title}</Link> : row.incident_title,
    },
    {
      key: "action",
      header: "Change",
      sortable: true,
      render: (row) => auditSummary(row),
    },
    {
      key: "note",
      header: "Note",
      render: (row) => <span className="clamp" title={row.note || ""}>{row.note || "—"}</span>,
    },
  ];

  return (
    <>
      <PageHeader title="Audit" description="Every report and status change, in the order it was written." />
      <div className="content">
        <section className="card card-pad">
          {!rows && !error ? <Skeleton className="block-skeleton" /> : null}
          {error ? <EmptyState icon={ScrollText} title="Could not load the audit log" body={error} action={<Button onClick={load}>Try again</Button>} /> : null}
          {rows && rows.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries" body="Entries appear when someone files a report or changes a status." /> : null}
          {rows && rows.length > 0 ? (
            <DataTable
              columns={columns}
              rows={sortRows(rows, sort)}
              rowKey="id"
              sort={sort}
              onSort={(key) => setSort((current) => (
                current.key === key
                  ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
                  : { key, dir: "desc" }
              ))}
            />
          ) : null}
        </section>
      </div>
    </>
  );
}
