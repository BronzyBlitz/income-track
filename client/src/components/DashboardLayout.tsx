import { useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PACKAGE_LIMITS } from '@/lib/store';

export type DashView = 'dashboard' | 'transactions' | 'investments' | 'savings' | 'tax' | 'audit' | 'profile' | 'upgrade';

interface DashboardLayoutProps {
  children: ReactNode;
  activeView: DashView;
  onViewChange: (v: DashView) => void;
}

const navItems: { id: DashView; icon: string; label: string }[] = [
  { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
  { id: 'transactions', icon: 'fa-arrows-left-right', label: 'Transactions' },
  { id: 'investments', icon: 'fa-chart-line', label: 'Investments' },
  { id: 'savings', icon: 'fa-piggy-bank', label: 'Savings' },
  { id: 'tax', icon: 'fa-file-invoice-dollar', label: 'Tax' },
  { id: 'audit', icon: 'fa-folder-open', label: 'Audit' },
  { id: 'profile', icon: 'fa-user-circle', label: 'Profile' },
  { id: 'upgrade', icon: 'fa-crown', label: 'Upgrade' },
];

export default function DashboardLayout({ children, activeView, onViewChange }: DashboardLayoutProps) {
  const { session, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pkg = session?.package || 'BASIC';
  const pkgInfo = PACKAGE_LIMITS[pkg];

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #060d1f 0%, #0a1a2e 50%, #071520 100%)' }}>
      {/* Aurora Orbs */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />

      {/* ====== DESKTOP SIDEBAR ====== */}
      <aside className={`hidden lg:flex flex-col glass-sidebar fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 p-5 border-b border-white/5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
            <i className="fa-solid fa-chart-line text-white text-sm" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-white font-black text-lg tracking-tight">Income<span className="text-green">Track</span></span>
          )}
        </div>

        {/* User Badge */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-white/5">
            <div className="glass-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                {session?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold truncate">{session?.username}</div>
                <div className={`text-xs font-semibold badge-${pkg.toLowerCase()} inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-0.5`}>
                  <i className={`fa-solid ${pkgInfo.icon} text-xs`} />
                  {pkgInfo.label}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                activeView === item.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              style={activeView === item.id ? {
                background: 'rgba(37, 211, 102, 0.12)',
                border: '1px solid rgba(37, 211, 102, 0.2)',
              } : {}}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className={`relative flex-shrink-0 ${activeView === item.id ? 'text-green' : ''}`}>
                <i className={`fa-solid ${item.icon} text-base`} />
                {activeView === item.id && (
                  <span className="absolute -right-1 -top-1 w-1.5 h-1.5 bg-green rounded-full" style={{ boxShadow: '0 0 6px rgba(37,211,102,0.8)' }} />
                )}
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {!sidebarCollapsed && item.id === 'upgrade' && pkg !== 'MASTER' && (
                <span className="ml-auto text-xs bg-green/20 text-green px-1.5 py-0.5 rounded-full font-semibold">Pro</span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle + Logout */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <i className={`fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`} />
            {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <i className="fa-solid fa-right-from-bracket text-sm" />
            {!sidebarCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pb-24 lg:pb-0`}>
        {children}
      </main>

      {/* ====== MOBILE BOTTOM NAV ====== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bottom-nav">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                activeView === item.id ? 'text-green' : 'text-white/35'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg`} />
              <span className="text-xs font-medium">{item.label}</span>
              {activeView === item.id && (
                <div className="w-1 h-1 rounded-full bg-green" style={{ boxShadow: '0 0 4px rgba(37,211,102,0.8)' }} />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
