import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function MainLayout({ children, activeTab, onTabChange, onLogout, user }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar: static column on desktop, off-canvas drawer on mobile (CSS-driven) */}
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          onLogout={onLogout}
          onMenuToggle={() => setMenuOpen((prev) => !prev)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 md:px-6 md:py-5">
            {children}
          </div>
        </main>
      </div>

      <MobileNav activeTab={activeTab} onTabChange={onTabChange} user={user} />
    </div>
  );
}
