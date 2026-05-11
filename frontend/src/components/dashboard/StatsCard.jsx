import { Card } from '../ui/Card';

export function StatsCard({ title, value, icon: Icon }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          </div>
        </div>
      </div>
    </Card>
  );
}