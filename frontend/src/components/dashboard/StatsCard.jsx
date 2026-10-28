import { Card } from '../ui/Card';

// StatsCard — dashboard statistic tile. Optional `onClick` turns the whole
// card into a real <button> with an obvious interactive affordance (hover
// shadow, focus ring, → hint); without it the card renders exactly as before.
export function StatsCard({ title, value, icon: Icon, caption, onClick }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {caption && <p className="text-xs text-gray-400 mt-1">{caption}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>
      {onClick }
    </>
  );

  if (!onClick) {
    return <Card>{inner}</Card>;
  }

  // Hover lives on the card shell (like every other card in the app), not on
  // an inner element — the button fills the card via negative margin so the
  // click target, hover area and focus ring all match the card's own bounds.
  return (
    <Card className="transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left -m-5 p-5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
      >
        {inner}
      </button>
    </Card>
  );
}

export default StatsCard;