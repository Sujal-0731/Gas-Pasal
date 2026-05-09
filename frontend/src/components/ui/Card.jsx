import React from 'react';

export const Card = ({ children, className = '', padding = true }) => {
  return (
    <div className={`
      bg-white
      rounded-xl
      border
      border-gray-200
      shadow-sm
      hover:shadow-md
      transition-all
      duration-200
      ${padding ? 'p-6' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className = '' }) => {
  return (
    <div className={`pt-4 ${className}`}>
      {children}
    </div>
  );
};