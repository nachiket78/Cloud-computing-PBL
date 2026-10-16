import { formatBytes } from "../lib/format.js";
import { useCountUp } from "../lib/motion.js";

export function MetricCard({ label, value, caption, icon: Icon, delay = 0, format = "number" }) {
  const display = useCountUp(Number(value) || 0);
  const shown = format === "bytes" ? formatBytes(display) : display.toLocaleString("en-GB");

  return (
    <article className="metric rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="metric-top">
        <p>{label}</p>
        {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      </div>
      <p className="metric-value">{shown}</p>
      <p className="metric-caption">{caption}</p>
    </article>
  );
}
