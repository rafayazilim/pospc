export default function Button({ variant = "secondary", size = "normal", className = "", children, ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {children}
    </button>
  );
}
