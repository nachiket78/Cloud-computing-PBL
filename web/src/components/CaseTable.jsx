import { Link, useNavigate } from "react-router-dom";
import { Badge } from "./Badge.jsx";
import { DataTable } from "./DataTable.jsx";
import { label } from "../lib/constants.js";
import { formatDate, shortId, sortRows } from "../lib/format.js";

export function caseColumns(showOwner) {
  const columns = [
    {
      key: "title",
      header: "Case",
      sortable: true,
      render: (row) => (
        <div>
          <Link className="case-link" to={`/incidents/${row.id}`}>{row.title}</Link>
          <div className="mono">{shortId(row.id)}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      hideOnMobile: true,
    },
    {
      key: "severity",
      header: "Severity",
      sortable: true,
      render: (row) => <Badge tone={row.severity} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge tone={row.status}>{label(row.status)}</Badge>,
    },
    {
      key: "updated_at",
      header: "Updated",
      sortable: true,
      hideOnMobile: true,
      render: (row) => formatDate(row.updated_at),
    },
  ];

  if (showOwner) {
    columns.splice(1, 0, {
      key: "owner_name",
      header: "Reporter",
      sortable: true,
      hideOnMobile: true,
    });
  }

  return columns;
}

export function CaseTable({ incidents, showOwner, sort, onSort, refreshing }) {
  const navigate = useNavigate();
  const rows = sortRows(incidents, sort);

  return (
    <DataTable
      columns={caseColumns(showOwner)}
      rows={rows}
      rowKey="id"
      sort={sort}
      onSort={onSort}
      refreshing={refreshing}
      onRowClick={(row) => navigate(`/incidents/${row.id}`)}
    />
  );
}
