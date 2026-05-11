import { X } from "lucide-react";

export default function Drawer({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
