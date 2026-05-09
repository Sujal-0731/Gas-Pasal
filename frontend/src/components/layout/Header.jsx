import React from 'react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 py-3 md:py-4 px-4 shadow-md">
      <div className="flex items-center justify-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white text-sm font-bold">A</span>
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Anam Store</h1>
          <p className="text-xs text-gray-500">लोकप्रिय · सुगम · एभरेस्ट</p>
        </div>
      </div>
    </header>
  );
}