export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty">
      {Icon ? <Icon size={20} aria-hidden="true" /> : null}
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}
