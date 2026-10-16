import { ChevronDown, ChevronUp } from "lucide-react";

export function DataTable({ columns, rows, rowKey, onRowClick, sort, onSort, refreshing }) {
  return (
    <div className={`table-wrap${refreshing ? " is-refreshing" : ""}`}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.hideOnMobile ? "col-optional" : undefined} scope="col">
                {column.sortable && onSort ? (
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => onSort(column.key)}
                    aria-sort={sort?.key === column.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    {column.header}
                    {sort?.key === column.key ? (
                      sort.dir === "asc" ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />
                    ) : null}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              className={onRowClick ? "is-clickable" : undefined}
              onClick={onRowClick ? (event) => {
                if (event.target.closest("a, button")) return;
                onRowClick(row);
              } : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.hideOnMobile ? "col-optional" : undefined}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
