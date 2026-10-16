import { label } from "../lib/constants.js";

export function Badge({ tone, children }) {
  return <span className={`badge badge-${tone}`}>{children || label(tone)}</span>;
}
