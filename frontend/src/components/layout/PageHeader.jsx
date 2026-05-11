export const PageHeader = ({ title, subtitle, icon: Icon, action }) => {
  return (
    <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-5 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-white" />}
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-blue-50 text-base mt-1">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};