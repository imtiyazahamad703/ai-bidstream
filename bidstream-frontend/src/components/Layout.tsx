import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuthStore } from '../store/useAuthStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200 relative">
      {/* Global Background Image & Overlays */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen pointer-events-none"
        style={{ backgroundImage: 'url(/images/bidstream_hero_bg.png)' }}
      />
      <div className="fixed inset-0 z-0 bg-slate-950/70 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90 pointer-events-none" />
      
      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        {!isAuthenticated && <Footer />}
      </div>
    </div>
  );
};

export default Layout;
