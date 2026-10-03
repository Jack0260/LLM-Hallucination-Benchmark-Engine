import type { ViewKey } from '@/types';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useApp } from '@/context/AppContext';
import { Brain, Activity, Radio, Boxes, Grid3x3, TrendingUp, FileText, History, Gauge } from 'lucide-react';

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof Brain }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Gauge },
  { key: 'noise-injection', label: 'Noise Injection', icon: Radio },
  { key: 'model-registry', label: 'Model Registry', icon: Boxes },
  { key: 'benchmark-matrix', label: 'Confidence Matrix', icon: Grid3x3 },
  { key: 'drift-analysis', label: 'Drift Analysis', icon: TrendingUp },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'run-history', label: 'Run History', icon: History },
];

interface SidebarProps {
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { runs, models, tasks, noiseProfiles } = useApp();

  const badgeCounts: Partial<Record<ViewKey, number>> = {
    'model-registry': models.length,
    'noise-injection': noiseProfiles.length,
    'run-history': runs.length,
  };

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-screen border-r"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      <div className="px-5 py-5 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)' }}>
          <Brain className="w-5 h-5" style={{ color: '#06b6d4' }} />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            PHBE
          </h1>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
            Hallucination Benchmark
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Analysis Tools
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = currentView === key;
            const badge = badgeCounts[key];
            return (
              <li key={key}>
                <button
                  onClick={() => onNavigate(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? 'text-white' : ''
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: '#06b6d4' }
                      : { color: 'var(--text-secondary)' }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={
                        isActive
                          ? { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }
                          : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }
                      }
                    >
                      {badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Theme
          </span>
        </div>
        <ThemeSwitcher />
        <div className="mt-3 flex items-center gap-2 px-1">
          <Activity className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {tasks.length} tasks · {models.length} models
          </span>
        </div>
      </div>
    </aside>
  );
}
