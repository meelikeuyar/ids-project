import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, FileText, ScrollText, ShieldBan, Bell, LogOut, Shield, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analysis', icon: Search, label: 'Analysis' },
  { to: '/batch', icon: FileText, label: 'Batch CSV' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/blocked-ips', icon: ShieldBan, label: 'Blocked IPs' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 z-20 flex flex-col border-r border-white/[0.06]"
      style={{ background: 'linear-gradient(180deg, rgba(3,7,18,0.97) 0%, rgba(3,7,18,0.99) 100%)', backdropFilter: 'blur(20px)' }}>
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,65,0.15), rgba(0,255,65,0.05))', border: '1px solid rgba(0,255,65,0.2)' }}>
            <Shield className="w-5 h-5 text-cyber-green" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-[0.25em]"
              style={{ background: 'linear-gradient(135deg, #00ff41, #00cc33)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IDS</h1>
            <p className="text-[9px] text-gray-500 tracking-[0.2em] mt-0.5">INTRUSION DETECTION</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-semibold text-gray-500 tracking-[0.2em] uppercase">Navigation</p>
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <NavLink key={to} to={to}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active ? 'text-cyber-green' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'}`}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(0,255,65,0.08), rgba(0,255,65,0.02))',
                border: '1px solid rgba(0,255,65,0.12)', boxShadow: '0 0 20px rgba(0,255,65,0.05)',
              } : { border: '1px solid transparent' }}>
              <Icon className={`w-[18px] h-[18px] transition-all ${active ? 'text-cyber-green' : 'text-gray-500 group-hover:text-gray-400'}`} />
              <span className="tracking-wide">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-cyber-green/50" />}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-5 border-t border-white/[0.06] mx-3 mb-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-cyber-green"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,65,0.12), rgba(0,255,65,0.04))', border: '1px solid rgba(0,255,65,0.15)' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button onClick={() => logout()}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-cyber-red transition-colors w-full px-1">
          <LogOut className="w-3.5 h-3.5" /><span className="tracking-wider">Logout</span>
        </button>
      </div>
    </aside>
  );
}
