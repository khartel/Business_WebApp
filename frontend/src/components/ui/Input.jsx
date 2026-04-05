export default function Input({
  label,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-dark-300">
          {label}
        </label>
      )}
      <input
        className={`input-base ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}