import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children, activeTab, onTabChange, onLogout, user }) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      
      <div className="flex flex-1">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          onLogout={onLogout}
          user={user}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-x-auto">
          <div className={isMobile ? 'pt-2 pb-4' : 'p-4 md:p-6'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}