import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { alertApi } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { formatDate, ATTACK_COLORS } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Alert } from '@/types';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = { critical: '#ff0040', high: '#ff4060', medium: '#ff8c00', low: '#00aaff' };

export default function AlertsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const { data, isLoading, refetch } = useApi<{ alerts: Alert[]; unreadCount: number }>(
    () => alertApi.getAll({ type: typeFilter || undefined }),
    [typeFilter]
  );

  const handleMarkAllRead = async () => {
    try {
      await alertApi.markAllAsRead();
      toast.success('All alerts marked as read');
      refetch();
    } catch { toast.error('Failed'); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await alertApi.markAsRead(id);
      refetch();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg text-cyber-green tracking-widest">◈ ALERTS</h1>
        <button onClick={handleMarkAllRead}
          className="flex items-center gap-1 px-3 py-1.5 border border-cyber-border rounded
            font-mono text-xs text-cyber-muted hover:border-cyber-green transition">
          <CheckCheck className="w-3 h-3" /> MARK ALL READ
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'critical', 'high', 'medium', 'low'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded font-mono text-xs border transition ${
              typeFilter === t ? 'border-cyber-green bg-cyber-green/10 text-cyber-green'
                : 'border-cyber-border text-cyber-muted'}`}>
            {(t || 'ALL').toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {data?.alerts.map((alert) => (
            <div key={alert.id} onClick={() => !alert.isRead && handleMarkRead(alert.id)}
              className={`bg-cyber-surface border rounded-lg p-4 cursor-pointer transition ${
                alert.isRead ? 'border-cyber-border/50 opacity-60' : 'border-cyber-border hover:border-cyber-green/30'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[alert.type] }} />
                  <div>
                    <div className="font-mono text-xs" style={{ color: ATTACK_COLORS[alert.attackType] }}>
                      {alert.attackType} — {alert.type.toUpperCase()}
                    </div>
                    <div className="font-mono text-[11px] text-cyber-text mt-1">{alert.message}</div>
                    <div className="font-mono text-[10px] text-cyber-muted mt-1">
                      IP: {alert.ipAddress} | Confidence: {alert.confidence.toFixed(1)}% | {formatDate(alert.createdAt)}
                    </div>
                  </div>
                </div>
                {!alert.isRead && <Bell className="w-3 h-3 text-cyber-orange animate-pulse" />}
              </div>
            </div>
          ))}
          {(!data?.alerts || data.alerts.length === 0) && (
            <div className="text-center py-12 font-mono text-xs text-cyber-muted">No alerts found.</div>
          )}
        </div>
      )}
    </div>
  );
}
