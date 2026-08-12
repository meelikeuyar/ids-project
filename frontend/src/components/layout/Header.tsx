import { useState, useEffect } from 'react';
import { Bell, Wifi, WifiOff, Shield } from 'lucide-react';
import { alertApi, healthApi } from '@/services/api';

export default function Header() {
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const check = async () => {
      try { await healthApi.check(); setOnline(true); } catch { setOnline(false); }
    };
    const alerts = async () => {
      try { const { data } = await alertApi.getAll({ isRead: false }); setUnread(data.data.unreadCount); } catch {}
    };
    check(); alerts();
    const i = setInterval(() => { check(); alerts(); }, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-8 border-b border-white/[0.04]"
      style={{ background: 'rgba(3,7,18,0.6)', backdropFilter: 'blur(10px)' }}>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          online ? 'text-cyber-green' : 'text-cyber-red'
        }`} style={{
          background: online ? 'rgba(0,255,65,0.06)' : 'rgba(255,0,64,0.06)',
          border: `1px solid ${online ? 'rgba(0,255,65,0.15)' : 'rgba(255,0,64,0.15)'}`
        }}>
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {online ? 'System Online' : 'Offline'}
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative">
          <Bell className="w-[18px] h-[18px] text-gray-500 hover:text-gray-300 transition cursor-pointer" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-red rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
          <span className="ml-2 text-gray-600">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </header>
  );
}
