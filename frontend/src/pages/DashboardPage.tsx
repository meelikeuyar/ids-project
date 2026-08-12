import { Activity, Shield, AlertTriangle, Clock, Ban, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { useApi } from '@/hooks/useApi';
import { predictionApi } from '@/services/api';
import { ATTACK_COLORS } from '@/utils/helpers';
import MetricCard from '@/components/common/MetricCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Statistics, HourlyTrend } from '@/types';

const CHART_TOOLTIP = {
  contentStyle: {
    background: 'rgba(3,7,18,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px',
    padding: '10px 14px',
  },
  labelStyle: { color: '#00ff41', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: '#9ca3af', padding: '2px 0' },
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useApi<Statistics>(() => predictionApi.getStatistics(), []);
  const { data: trend } = useApi<HourlyTrend[]>(() => predictionApi.getHourlyTrend(24), []);

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return <EmptyState />;

  const totalAttacks = stats.totalPredictions - (stats.classDistribution['BENIGN'] || 0);
  const attackRate = stats.totalPredictions > 0 ? ((totalAttacks / stats.totalPredictions) * 100).toFixed(1) : '0';

  const classData = Object.entries(stats.classDistribution).map(([name, value]) => ({
    name, value, color: ATTACK_COLORS[name] || '#666',
  }));

  const modelData = Object.entries(stats.modelDistribution).map(([name, value]) => ({ name, value }));
  const modelColors = ['#00ff41', '#ff8c00', '#00aaff', '#a855f7'];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <Zap className="w-5 h-5 text-cyber-green" />
          <h1 className="text-xl font-semibold text-gray-100">Security Dashboard</h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">Real-time intrusion detection overview</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { icon: Activity, label: 'Total Scans', value: stats.totalPredictions.toLocaleString(), color: '#00ff41' },
          { icon: AlertTriangle, label: 'Attacks', value: totalAttacks.toLocaleString(), color: '#ff0040' },
          { icon: Shield, label: 'Benign', value: (stats.classDistribution['BENIGN'] || 0).toLocaleString(), color: '#00ff41' },
          { icon: TrendingUp, label: 'Attack Rate', value: `${attackRate}%`, color: '#ff8c00' },
          { icon: Clock, label: 'Avg Response', value: `${stats.avgResponseMs}ms`, color: '#00aaff' },
          { icon: Ban, label: '24h Attacks', value: stats.last24hAttacks.toString(), color: '#ff4060' },
        ].map((m, i) => (
          <div key={m.label} className={`animate-fade-up delay-${i + 1}`}>
            <MetricCard {...m} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution */}
        <div className="lg:col-span-2 glass-card p-6 animate-fade-up delay-2">
          <h2 className="text-sm font-semibold text-gray-300 tracking-wider mb-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
            Class Distribution
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={classData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontFamily: 'JetBrains Mono', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {classData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model Distribution */}
        <div className="glass-card p-6 animate-fade-up delay-3">
          <h2 className="text-sm font-semibold text-gray-300 tracking-wider mb-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue" />
            Model Usage
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={modelData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" nameKey="name" paddingAngle={4} strokeWidth={0}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {modelData.map((_, i) => <Cell key={i} fill={modelColors[i % modelColors.length]} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Chart */}
      {trend && trend.length > 0 && (
        <div className="glass-card p-6 animate-fade-up delay-4">
          <h2 className="text-sm font-semibold text-gray-300 tracking-wider mb-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
            Traffic Trend (24h)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff41" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#00ff41" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff0040" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#ff0040" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="hour" tick={{ fill: '#374151', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="total" stroke="#00ff41" strokeWidth={2} fill="url(#gradGreen)" />
              <Area type="monotone" dataKey="attacks" stroke="#ff0040" strokeWidth={2} fill="url(#gradRed)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center glass-card p-12 max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.1)' }}>
          <Shield className="w-10 h-10 text-cyber-green/30" />
        </div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">No Data Yet</h2>
        <p className="text-sm text-gray-500">Run an analysis to populate the dashboard.</p>
      </div>
    </div>
  );
}
