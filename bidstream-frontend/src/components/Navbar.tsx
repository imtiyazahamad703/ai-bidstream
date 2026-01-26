import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Gavel, LogOut, UserCheck, Wallet } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <img src="/logos/bidstream_logo.png" alt="BidStream Logo" className="w-10 h-10 rounded-full object-cover shadow-lg group-hover:scale-105 transition-transform mix-blend-screen" />
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">
              Bid<span className="text-orange-400">Stream</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
            {!isAuthenticated && (
              <>
                <Link
                  to="/about"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    isActive('/about')
                      ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                      : 'hover:text-white hover:bg-slate-900'
                  }`}
                >
                  About Us
                </Link>
                <Link
                  to="/how-it-works"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    isActive('/how-it-works')
                      ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                      : 'hover:text-white hover:bg-slate-900'
                  }`}
                >
                  How It Works
                </Link>
                <Link
                  to="/contact"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    isActive('/contact')
                      ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                      : 'hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Contact Support
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'SELLER' && (
              <Link
                to="/seller/dashboard"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive('/seller')
                    ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                    : 'hover:text-white hover:bg-slate-900'
                }`}
              >
                Seller Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 text-xs">
              {/* User Greeting */}
              <div className="text-slate-300 text-xs flex items-center gap-2">
                <span className="hidden sm:inline text-slate-400">
                  Welcome, <strong className="text-white font-normal">{user.email}</strong>
                </span>
                
                {/* Role Badge */}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {user.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            /* Guest Actions */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
