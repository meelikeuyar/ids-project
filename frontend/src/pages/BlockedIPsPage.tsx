import { useState } from 'react';
import { ShieldBan, Unlock, Plus } from 'lucide-react';
import { blockedIPApi } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { formatDate, ATTACK_COLORS } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { BlockedIP } from '@/types';
import toast from 'react-hot-toast';

export default function BlockedIPsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, refetch } = useApi<{ blockedIPs: BlockedIP[]; total: number }>(
    () => blockedIPApi.getAll(true), []
  );

  const [showForm, setShowForm] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');
  const [attackType, setAttackType] = useState('DoS');

  const handleUnblock = async (ip: string) => {
    if (!confirm(`Unblock ${ip}?`)) return;
    try {
      await blockedIPApi.unblock(ip);
      toast.success(`${ip} unblocked`);
      refetch();
    } catch { toast.error('Failed to unblock'); }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await blockedIPApi.block({ ipAddress: newIP, reason, attackType });
      toast.success(`${newIP} blocked`);
      setShowForm(false); setNewIP(''); setReason('');
      refetch();
    } catch { toast.error('Failed to block'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg text-cyber-green tracking-widest">◈ BLOCKED IPs</h1>
        {(user?.role === 'analyst' || user?.role === 'admin') && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 border border-cyber-red/30 rounded
              font-mono text-xs text-cyber-red hover:bg-cyber-red/10 transition">
            <Plus className="w-3 h-3" /> BLOCK IP
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleBlock} className="bg-cyber-surface border border-cyber-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input value={newIP} onChange={(e) => setNewIP(e.target.value)} placeholder="IP Address"
            pattern="^(\d{1,3}\.){3}\d{1,3}$" required
            className="bg-cyber-bg border border-cyber-border rounded px-3 py-2 font-mono text-xs text-cyber-green outline-none" />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" required minLength={3}
            className="bg-cyber-bg border border-cyber-border rounded px-3 py-2 font-mono text-xs text-cyber-green outline-none" />
          <select value={attackType} onChange={(e) => setAttackType(e.target.value)}
            className="bg-cyber-bg border border-cyber-border rounded px-3 py-2 font-mono text-xs text-cyber-green outline-none">
            {['DoS', 'BruteForce', 'PortScan', 'WebAttack'].map((t) => <option key={t}>{t}</option>)}
          </select>
          <button type="submit" className="bg-cyber-red/10 border border-cyber-red text-cyber-red font-mono text-xs rounded
            hover:bg-cyber-red/20 transition">BLOCK</button>
        </form>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-cyber-surface border border-cyber-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                {['IP Address', 'Attack Type', 'Reason', 'Confidence', 'Method', 'Blocked At', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-cyber-muted tracking-wider uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.blockedIPs.map((ip) => (
                <tr key={ip.id} className="border-b border-cyber-border/50">
                  <td className="px-4 py-2.5 font-mono text-xs text-cyber-red">{ip.ipAddress}</td>
                  <td className="px-4 py-2.5 font-mono text-xs" style={{ color: ATTACK_COLORS[ip.attackType] }}>{ip.attackType}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-cyber-text">{ip.reason}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-cyber-muted">{ip.confidence.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-cyber-blue uppercase">{ip.blockedBy}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-cyber-muted">{formatDate(ip.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    {user?.role === 'admin' && (
                      <button onClick={() => handleUnblock(ip.ipAddress)}
                        className="flex items-center gap-1 px-2 py-1 border border-cyber-green/30 rounded
                          font-mono text-[10px] text-cyber-green hover:bg-cyber-green/10 transition">
                        <Unlock className="w-3 h-3" /> UNBLOCK
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(!data?.blockedIPs || data.blockedIPs.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-8 text-center font-mono text-xs text-cyber-muted">
                  No blocked IPs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
