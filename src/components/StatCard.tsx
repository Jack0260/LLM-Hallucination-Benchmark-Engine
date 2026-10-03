import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: number;
  accentColor?: string;
}

export function StatCard({ label, value, unit, icon, trend, accentColor = '#06b6d4' }: StatCardProps) {
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}1a` }}>
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold metric-value" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className="text-xs font-semibold"
            style={{ color: trend >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            vs previous
          </span>
        </div>
      )}
    </div>
  );
}
