import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { LandingHero } from '../components/LandingHero';
import { Navigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'SELLER') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/auctions" replace />;
  }

  return (
    <div className="space-y-6">
      <LandingHero />
    </div>
  );
};

export default HomePage;
