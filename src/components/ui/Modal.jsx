import { X } from "lucide-react";

export default function Modal({ open, title, children, footer, onClose, wide = false }) {
  if (!open) return null;

  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
