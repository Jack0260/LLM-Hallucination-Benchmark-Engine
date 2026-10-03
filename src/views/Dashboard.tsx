import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { TASK_CATEGORY_LABELS } from '@/data/seed';
import type { ViewKey } from '@/types';
import { Activity, AlertTriangle, Gauge, Zap, TrendingUp, Target, ChevronRight, Play } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: ViewKey) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { runs, models, tasks, noiseProfiles } = useApp();

  const latestRun = runs.length > 0 ? runs[0] : null;
  const previousRun = runs.length > 1 ? runs[1] : null;

  const avgConfidence = latestRun?.summary.avgConfidence ?? 0;
  const avgCorrectness = latestRun?.summary.avgCorrectness ?? 0;
  const hallucinationRate = latestRun?.summary.hallucinationRate ?? 0;
  const avgLatency = latestRun?.summary.avgLatency ?? 0;

  const confidenceTrend = latestRun && previousRun
    ? avgConfidence - previousRun.summary.avgConfidence
    : undefined;
  const correctnessTrend = latestRun && previousRun
    ? avgCorrectness - previousRun.summary.avgCorrectness
    : undefined;
  const hallucinationTrend = latestRun && previousRun
    ? hallucinationRate - previousRun.summary.hallucinationRate
    : undefined;

  const quickActions: { label: string; desc: string; view: ViewKey; icon: typeof Activity; color: string }[] = [
    { label: 'Configure Noise', desc: 'Set up perturbation profiles', view: 'noise-injection', icon: Zap, color: '#f59e0b' },
    { label: 'Register Models', desc: 'Define model profiles', view: 'model-registry', icon: Target, color: '#2dd4bf' },
    { label: 'Run Benchmark', desc: 'Execute evaluation', view: 'benchmark-matrix', icon: Play, color: '#06b6d4' },
    { label: 'View Reports', desc: 'Generate evaluation reports', view: 'reports', icon: TrendingUp, color: '#a78bfa' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Benchmark Dashboard
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Monitor LLM reasoning stability and hallucination metrics across benchmark runs.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(({ label, desc, view, icon: Icon, color }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className="card p-5 text-left hover:scale-[1.02] transition-transform duration-200 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}1a` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
              {label}
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Confidence" value={avgConfidence} unit="%" icon={<Gauge className="w-4 h-4" />} trend={confidenceTrend} accentColor="#06b6d4" />
        <StatCard label="Avg Correctness" value={avgCorrectness} unit="%" icon={<Activity className="w-4 h-4" />} trend={correctnessTrend} accentColor="#22c55e" />
        <StatCard label="Hallucination Rate" value={hallucinationRate} unit="%" icon={<AlertTriangle className="w-4 h-4" />} trend={hallucinationTrend} accentColor="#ef4444" />
        <StatCard label="Avg Latency" value={avgLatency} unit="ms" icon={<Zap className="w-4 h-4" />} accentColor="#f59e0b" />
      </div>

      {latestRun ? (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Confidence Trend Across Runs
              </h3>
              <LineChart
                labels={runs.slice(0, 10).reverse().map((r) => r.name)}
                series={[{
                  name: 'Avg Confidence',
                  color: '#06b6d4',
                  data: runs.slice(0, 10).reverse().map((r) => r.summary.avgConfidence),
                }, {
                  name: 'Avg Correctness',
                  color: '#22c55e',
                  data: runs.slice(0, 10).reverse().map((r) => r.summary.avgCorrectness),
                }]}
                yLabel="Score (%)"
              />
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Hallucination Rate by Run
              </h3>
              <BarChart
                data={runs.slice(0, 8).reverse().map((r) => ({
                  label: r.name,
                  value: r.summary.hallucinationRate,
                  color: r.summary.hallucinationRate > 20 ? '#ef4444' : r.summary.hallucinationRate > 10 ? '#f59e0b' : '#22c55e',
                }))}
                max={100}
              />
            </div>
          </div>

          {/* Latest Run Summary */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Latest Run: {latestRun.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Noise Profile</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{latestRun.noiseProfileName}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Intensity</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{latestRun.intensity}%</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Models Tested</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{latestRun.modelIds.length}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Tasks Evaluated</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{latestRun.summary.totalTasks}</p>
              </div>
            </div>

            {/* Per-model mini table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Model</th>
                    <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Confidence</th>
                    <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Correctness</th>
                    <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Hallucinations</th>
                    <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Drift</th>
                  </tr>
                </thead>
                <tbody>
                  {latestRun.summary.perModel.map((m) => (
                    <tr key={m.modelId} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                          <span style={{ color: 'var(--text-primary)' }}>{m.modelName}</span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-2 metric-value" style={{ color: 'var(--text-primary)' }}>{m.avgConfidence}%</td>
                      <td className="text-right py-2 px-2 metric-value" style={{ color: 'var(--text-primary)' }}>{m.avgCorrectness}%</td>
                      <td className="text-right py-2 px-2 metric-value" style={{ color: m.hallucinationRate > 15 ? '#ef4444' : 'var(--text-primary)' }}>{m.hallucinationRate}%</td>
                      <td className="text-right py-2 px-2 metric-value" style={{ color: Math.abs(m.driftDelta) > 15 ? '#f59e0b' : 'var(--text-secondary)' }}>
                        {m.driftDelta > 0 ? '+' : ''}{m.driftDelta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
            <Play className="w-8 h-8" style={{ color: '#06b6d4' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No Benchmark Runs Yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            You have {models.length} models, {tasks.length} tasks, and {noiseProfiles.length} noise profiles ready.
            Run your first benchmark to see results here.
          </p>
          <button onClick={() => onNavigate('benchmark-matrix')} className="btn-primary">
            Start Benchmark
          </button>
        </div>
      )}
    </div>
  );
}
