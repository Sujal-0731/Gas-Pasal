export const Card = ({ children, title, subtitle, icon: Icon, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-5">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-6 h-6 text-white" />}
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle && <p className="text-blue-50 text-base mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};