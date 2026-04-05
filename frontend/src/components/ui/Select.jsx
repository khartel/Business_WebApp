export default function Select({
  label,
  error,
  options = [],
  placeholder = "Select an option",
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
      <select
        className={`input-base ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}