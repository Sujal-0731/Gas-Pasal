export const Select = ({ label, value, onChange, options, required = false, icon: Icon }) => {
  return (
    <div className="mb-5">
      {label && (
        <label className="block text-base font-semibold text-gray-800 mb-2">
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
          className={`
            w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl
            focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none
            transition-all font-medium appearance-none bg-white
            ${Icon ? 'pl-11' : ''} pr-12
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
    </div>
  );
};