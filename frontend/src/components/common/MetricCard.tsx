import type { LucideIcon } from 'lucide-react';

interface Props { icon: LucideIcon; label: string; value: string | number; color: string; trend?: string; }

export default function MetricCard({ icon: Icon, label, value, color, trend }: Props) {
  return (
    <div className="glass-card p-5 group cursor-default">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
          <Icon className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color }} />
        </div>
        {trend && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}10`, color }}>{trend}</span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 tracking-wider uppercase font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
    </div>
  );
}
