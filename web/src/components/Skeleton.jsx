export function Skeleton({ className = "line-skeleton" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="content" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      <div className="metric-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="metric-skeleton" key={index} />
        ))}
      </div>
      <div className="dashboard-grid">
        <Skeleton className="block-skeleton" />
        <Skeleton className="block-skeleton" />
      </div>
    </div>
  );
}

export function BootScreen() {
  return (
    <div className="boot">
      <div className="boot-card" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading Aegis</span>
        <Skeleton className="line-skeleton" />
        <Skeleton className="line-skeleton" />
        <Skeleton className="line-skeleton" />
      </div>
    </div>
  );
}
