import { Link } from "react-router-dom";

export function Button({
  variant = "primary",
  type = "button",
  to,
  children,
  className = "",
  ...props
}) {
  const classes = `button button-${variant} ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
