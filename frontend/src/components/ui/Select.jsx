export const Select = ({
  label,
  value,
  onChange,
  options,
  required = false,
  icon: Icon,
  disabled = false,
  error = '',
  name,
  id,
  className = ''
}) => {
  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <select
          value={value}
          onChange={onChange}
          name={name}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          className={`
            w-full px-4 py-3 text-base border-2 rounded-xl bg-white
            outline-none transition-all font-medium appearance-none
            focus:border-blue-500 focus:ring-4 focus:ring-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${Icon ? 'pl-11' : ''} pr-12
            ${className}
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1.5" role="alert">{error}</p>
      )}
    </div>
  );
};

export default Select;
