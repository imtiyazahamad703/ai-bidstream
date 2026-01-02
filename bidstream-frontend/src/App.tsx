import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { useAuthStore } from './store/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SellerLayout from './pages/seller/SellerLayout';
import SellerDashboard from './pages/seller/SellerDashboard';
import ItemListPage from './pages/seller/ItemListPage';
import ItemCreatePage from './pages/seller/ItemCreatePage';
import ItemDetailPage from './pages/seller/ItemDetailPage';
import AuctionCreatePage from './pages/seller/AuctionCreatePage';
import AuctionListPage from './pages/seller/AuctionListPage';
import ActiveAuctionsPage from './pages/ActiveAuctionsPage';
import LiveAuctionRoom from './pages/LiveAuctionRoom';
import { wsService } from './api/stompClient';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const checkSession = useAuthStore((state) => state.checkSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    checkSession();
    // Connect WebSocket when app loads
    wsService.connect(token || undefined);
    
    return () => {
      wsService.disconnect();
    };
  }, [checkSession, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected Routes (Placeholders for now) */}
            <Route 
              path="/auctions" 
              element={
                <ProtectedRoute allowedRoles={['BIDDER', 'SELLER']}>
                  <ActiveAuctionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auctions/:id" 
              element={
                <ProtectedRoute allowedRoles={['BIDDER', 'SELLER']}>
                  <LiveAuctionRoom />
                </ProtectedRoute>
              } 
            />
            
            {/* Seller Routes */}
            <Route 
              path="/seller" 
              element={
                <ProtectedRoute allowedRoles={['SELLER']}>
                  <SellerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="items" element={<ItemListPage />} />
              <Route path="items/new" element={<ItemCreatePage />} />
              <Route path="items/:id" element={<ItemDetailPage />} />
              <Route path="auctions" element={<AuctionListPage />} />
              <Route path="auctions/new" element={<AuctionCreatePage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
};

export default App;
