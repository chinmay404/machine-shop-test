import React from 'react';
import { NavLink, useLocation } from '../router/nextRouterCompat';
import { useAuth } from '../context/AuthContext';

const TOP_NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/kanban', label: 'Kanban Store' },
  { to: '/tools', label: 'Tools' },
  { to: '/trials/running', label: 'Trial Dashboard' },
  { to: '/import', label: 'Admin' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLightTheme = location.pathname.includes('/trials/new') || location.pathname.match(/\/trials\/\d+\/edit/);
  const displayName = user?.display_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Operator';

  return (
    <div className={`flex flex-col h-screen ${isLightTheme ? 'theme-light' : ''}`}>
      {/* Top Navigation Bar */}
      <header className="h-12 bg-dark-800 border-b border-dark-500 flex items-center px-4 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <div className="w-7 h-7 rounded-lg bg-accent-red flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">AAROHAM TOOLING</span>
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {TOP_NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-dark-600 text-white underline underline-offset-4 decoration-accent-red decoration-2'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side - Connection + User */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-mono">HMC-90 CONNECTED</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="text-right">
              <p className="text-[10px] font-medium text-gray-300">{displayName}</p>
              <p className="text-[9px] text-gray-500 capitalize">Shift 8</p>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors ml-1" title="Logout">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
