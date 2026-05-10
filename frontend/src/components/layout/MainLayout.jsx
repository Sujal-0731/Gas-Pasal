import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

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
        {/* ✅ Make sure user is passed here */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          onLogout={onLogout}
          user={user}  // ← This is critical!
        />
        
        <main className="flex-1 overflow-x-auto pb-20 md:pb-0">
          <div className={isMobile ? 'pt-2' : ''}>
            <div className="p-4 md:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {isMobile && (
        <MobileNav activeTab={activeTab} onTabChange={onTabChange} user={user} />
      )}
    </div>
  );
}