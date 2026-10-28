export const PageHeader = ({ title, subtitle, icon: Icon, action }) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
