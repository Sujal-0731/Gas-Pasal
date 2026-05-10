import React from 'react';

export const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  icon: Icon,
  className = ''
}) => {
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
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl
            focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none
            transition-all font-medium
            ${Icon ? 'pl-11' : ''}
            ${className}
          `}
        />
      </div>
    </div>
  );
};