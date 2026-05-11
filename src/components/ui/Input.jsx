export function Input({ label, className = "", ...props }) {
  return (
    <label className={`field ${className}`}>
      {label ? <span>{label}</span> : null}
      <input {...props} />
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className={`field ${className}`}>
      {label ? <span>{label}</span> : null}
      <textarea {...props} />
    </label>
  );
}
