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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {!isAuthenticated && <Footer />}
    </div>
  );
};

export default Layout;
