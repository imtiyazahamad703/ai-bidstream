import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const SellerLayout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/seller/dashboard' },
    { name: 'My Items', href: '/seller/items' },
    { name: 'My Auctions', href: '/seller/auctions' },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 hidden md:block">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="mb-6 px-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Seller Control Panel
            </h2>
          </div>
          <ul className="space-y-2 font-medium">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center p-2 rounded-lg group ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default SellerLayout;
