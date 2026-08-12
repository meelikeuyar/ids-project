import { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { predictionApi } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { ATTACK_COLORS, formatDate } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { PredictionLog, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const { user } = useAuthStore();

  const { data, isLoading, refetch } = useApi<PaginatedResponse<PredictionLog>>(
    () => predictionApi.getLogs({ page, limit: 50, prediction: filter || undefined }),
    [page, filter]
  );

  const handleClearLogs = async () => {
    if (!confirm('Are you sure? This will delete ALL prediction logs.')) return;
    try {
      await predictionApi.clearLogs();
      toast.success('Logs cleared');
      refetch();
    } catch {
      toast.error('Failed to clear logs');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg text-cyber-green tracking-widest">◈ PREDICTION LOGS</h1>
        <div className="flex gap-2">
          <button onClick={refetch} className="flex items-center gap-1 px-3 py-1.5 border border-cyber-border
            rounded font-mono text-xs text-cyber-muted hover:border-cyber-green transition">
            <RefreshCw className="w-3 h-3" /> REFRESH
          </button>
          {user?.role === 'admin' && (
            <button onClick={handleClearLogs} className="flex items-center gap-1 px-3 py-1.5 border border-cyber-red/30
              rounded font-mono text-xs text-cyber-red hover:bg-cyber-red/10 transition">
              <Trash2 className="w-3 h-3" /> CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'BENIGN', 'DoS', 'BruteForce', 'PortScan', 'WebAttack'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1 rounded font-mono text-xs border transition ${
              filter === f
                ? 'border-cyber-green bg-cyber-green/10 text-cyber-green'
                : 'border-cyber-border text-cyber-muted hover:border-cyber-green/50'
            }`}
          >
            {f || 'ALL'}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <>
          {/* Table */}
          <div className="bg-cyber-surface border border-cyber-border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border">
                  {['Time', 'IP Address', 'Model', 'Prediction', 'Confidence', 'Risk', 'Response'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-cyber-muted tracking-wider uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.logs.map((log) => (
                  <tr key={log.id} className="border-b border-cyber-border/50 hover:bg-cyber-green/[0.02] transition">
                    <td className="px-4 py-2.5 font-mono text-xs text-cyber-muted">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-cyber-text">{log.ipAddress}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-cyber-blue">{log.model}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-bold" style={{ color: ATTACK_COLORS[log.prediction] }}>
                        {log.prediction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-cyber-text">{log.confidence.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-cyber-orange">{log.riskScore}/100</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-cyber-muted">{log.responseTimeMs}ms</td>
                  </tr>
                ))}
                {(!data?.logs || data.logs.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center font-mono text-xs text-cyber-muted">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: Math.min(data.pagination.pages, 10) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded font-mono text-xs border transition ${
                    page === i + 1
                      ? 'border-cyber-green bg-cyber-green/10 text-cyber-green'
                      : 'border-cyber-border text-cyber-muted'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
