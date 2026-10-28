export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  icon: Icon,
  disabled = false,
  error = '',
  name,
  id,
  autoComplete,
  min,
  step,
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
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          name={name}
          id={id}
          autoComplete={autoComplete}
          min={min}
          step={step}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          className={`
            w-full px-4 py-3 text-base border-2 rounded-xl
            outline-none transition-all font-medium
            focus:border-blue-500 focus:ring-4 focus:ring-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
            ${Icon ? 'pl-11' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1.5" role="alert">{error}</p>
      )}
    </div>
  );
};

export default Input;
