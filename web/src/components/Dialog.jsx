import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Dialog({ open, title, description, onClose, children }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const node = ref.current;
    const focusable = node?.querySelector("select, input, textarea, button");
    focusable?.focus();

    function onKey(event) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll("select, input, textarea, button, a")].filter(
        (item) => !item.disabled,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="dialog-backdrop fade" onMouseDown={onClose}>
      <div
        className="dialog rise"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        {description ? <p className="dialog-copy">{description}</p> : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
