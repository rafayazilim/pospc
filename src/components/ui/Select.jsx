export default function Select({ label, children, className = "", ...props }) {
  return (
    <label className={`field ${className}`}>
      {label ? <span>{label}</span> : null}
      <select {...props}>{children}</select>
    </label>
  );
}
