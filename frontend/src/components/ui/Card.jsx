export const Card = ({ children, title, subtitle, icon: Icon, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

export default Card;
