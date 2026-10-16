import { useEffect } from "react";

export function PageHeader({ title, description, action }) {
  useEffect(() => {
    document.title = title ? `${title} · Aegis` : "Aegis";
  }, [title]);

  return (
    <header className="page-header fade">
      <div className="page-header-inner">
        <div>
          <h1 className="page-title">{title}</h1>
          {description ? <p className="page-desc">{description}</p> : null}
        </div>
        {action ? <div className="page-action">{action}</div> : null}
      </div>
    </header>
  );
}
