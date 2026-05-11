import { useEffect } from 'react';

export const Toast = ({ message, type, onClose }) => { 
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose, message]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✓' : '✕';
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
      <span className="text-sm font-medium">{icon}</span>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">✕</button>
    </div>
  );
};