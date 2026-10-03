import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { LineChart } from '@/components/charts/LineChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { BarChart } from '@/components/charts/BarChart';
import { TASK_CATEGORY_LABELS } from '@/data/seed';
import type { TaskCategory, PerModelSummary } from '@/types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

export function DriftAnalysis() {
  const { runs, models } = useApp();

  const hasRuns = runs.length > 0;
  const hasMultipleRuns = runs.length >= 2;

  // Confidence drift across runs per model
  const driftSeries = useMemo(() => {
    if (runs.length === 0) return [];
    const reversed = [...runs].reverse();
    return models.map((model) => ({
      name: model.name,
      color: model.color,
      data: reversed.map((run) => {
        const modelSummary = run.summary.perModel.find((m) => m.modelId === model.id);
        return modelSummary?.avgConfidence ?? 0;
      }),
    }));
  }, [runs, models]);

  const runLabels = useMemo(() => {
    return [...runs].reverse().slice(0, 10).map((r) => r.name);
  }, [runs]);

  // Correctness drift
  const correctnessSeries = useMemo(() => {
    if (runs.length === 0) return [];
    const reversed = [...runs].reverse();
    return models.map((model) => ({
      name: model.name,
      color: model.color,
      data: reversed.map((run) => {
        const modelSummary = run.summary.perModel.find((m) => m.modelId === model.id);
        return modelSummary?.avgCorrectness ?? 0;
      }),
    }));
  }, [runs, models]);

  // Radar chart data: latest run per-category performance per model
  const radarData = useMemo(() => {
    if (runs.length === 0) return [];
    const latestRun = runs[0];
    const categories = Array.from(new Set(latestRun.results.map((r) => r.taskCategory)));
    return categories.map((cat) => {
      const label = TASK_CATEGORY_LABELS[cat] ?? cat;
      const values = models.map((model) => {
        const catResults = latestRun.results.filter((r) => r.modelId === model.id && r.taskCategory === cat);
        const avgConf = catResults.length > 0
          ? Math.round(catResults.reduce((s, r) => s + r.confidenceScore, 0) / catResults.length)
          : 0;
        return { name: model.name, color: model.color, value: avgConf };
      });
      return { label, values };
    });
  }, [runs, models]);

  // Hallucination rate comparison
  const hallucinationBars = useMemo(() => {
    if (runs.length === 0) return [];
    const latestRun = runs[0];
    return latestRun.summary.perModel.map((m) => ({
      label: m.modelName,
      value: m.hallucinationRate,
      color: m.hallucinationRate > 20 ? '#ef4444' : m.hallucinationRate > 10 ? '#f59e0b' : '#22c55e',
    }));
  }, [runs]);

  // Drift table data
  const driftTableData = useMemo(() => {
    if (runs.length < 2) return [];
    const latest = runs[0];
    const previous = runs[1];
    return latest.summary.perModel.map((latestModel: PerModelSummary) => {
      const prevModel = previous.summary.perModel.find((m) => m.modelId === latestModel.modelId);
      return {
        modelId: latestModel.modelId,
        modelName: latestModel.modelName,
        color: latestModel.color,
        confidenceDelta: prevModel ? latestModel.avgConfidence - prevModel.avgConfidence : 0,
        correctnessDelta: prevModel ? latestModel.avgCorrectness - prevModel.avgCorrectness : 0,
        hallucinationDelta: prevModel ? latestModel.hallucinationRate - prevModel.hallucinationRate : 0,
        latencyDelta: prevModel ? latestModel.avgLatency - prevModel.avgLatency : 0,
      };
    });
  }, [runs]);

  // Per-category drift
  const categoryDrift = useMemo(() => {
    if (runs.length < 2) return [];
    const latest = runs[0];
    const previous = runs[1];
    const categories = Array.from(new Set(latest.results.map((r) => r.taskCategory)));
    return categories.map((cat: TaskCategory) => {
      const latestCat = latest.summary.perCategory.find((c) => c.category === cat);
      const prevCat = previous.summary.perCategory.find((c) => c.category === cat);
      return {
        category: cat,
        label: TASK_CATEGORY_LABELS[cat] ?? cat,
        confidenceDelta: prevCat && latestCat ? latestCat.avgConfidence - prevCat.avgConfidence : 0,
        correctnessDelta: prevCat && latestCat ? latestCat.avgCorrectness - prevCat.avgCorrectness : 0,
        hallucinationDelta: prevCat && latestCat ? latestCat.hallucinationCount - prevCat.hallucinationCount : 0,
      };
    });
  }, [runs]);

  const getDriftIcon = (delta: number, threshold = 5) => {
    if (Math.abs(delta) < threshold) return <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />;
    return delta > 0
      ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
      : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Drift Analysis
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Track reasoning stability and confidence drift across sequential benchmark runs.
        </p>
      </div>

      {!hasRuns ? (
        <div className="card p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No benchmark runs to analyze. Run at least one benchmark to see drift data.
          </p>
        </div>
      ) : !hasMultipleRuns ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: '#f59e0b' }} />
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Need More Runs</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            You have 1 run. Run a second benchmark to start tracking drift across runs.
          </p>
        </div>
      ) : (
        <>
          {/* Drift Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Confidence Drift Across Runs
              </h3>
              <LineChart
                labels={runLabels}
                series={driftSeries}
                yLabel="Confidence (%)"
              />
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Correctness Drift Across Runs
              </h3>
              <LineChart
                labels={runLabels}
                series={correctnessSeries}
                yLabel="Correctness (%)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar chart */}
            {radarData.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Category Performance Radar (Latest Run)
                </h3>
                <RadarChart data={radarData} max={100} size={320} />
              </div>
            )}

            {/* Hallucination comparison */}
            {hallucinationBars.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Hallucination Rate by Model (Latest Run)
                </h3>
                <BarChart data={hallucinationBars} max={100} />
              </div>
            )}
          </div>

          {/* Per-Model Drift Table */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Per-Model Drift: Latest vs Previous Run
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Model</th>
                    <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Confidence Δ</th>
                    <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Correctness Δ</th>
                    <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Hallucination Δ</th>
                    <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Latency Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {driftTableData.map((row) => (
                    <tr key={row.modelId} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                          <span style={{ color: 'var(--text-primary)' }}>{row.modelName}</span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {getDriftIcon(row.confidenceDelta)}
                          <span className="metric-value" style={{ color: Math.abs(row.confidenceDelta) > 15 ? '#f59e0b' : 'var(--text-primary)' }}>
                            {row.confidenceDelta > 0 ? '+' : ''}{row.confidenceDelta}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {getDriftIcon(row.correctnessDelta)}
                          <span className="metric-value" style={{ color: Math.abs(row.correctnessDelta) > 15 ? '#f59e0b' : 'var(--text-primary)' }}>
                            {row.correctnessDelta > 0 ? '+' : ''}{row.correctnessDelta}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {getDriftIcon(row.hallucinationDelta, 2)}
                          <span className="metric-value" style={{ color: row.hallucinationDelta > 0 ? '#ef4444' : '#22c55e' }}>
                            {row.hallucinationDelta > 0 ? '+' : ''}{row.hallucinationDelta}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {getDriftIcon(row.latencyDelta, 50)}
                          <span className="metric-value" style={{ color: 'var(--text-secondary)' }}>
                            {row.latencyDelta > 0 ? '+' : ''}{row.latencyDelta}ms
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Category Drift */}
          {categoryDrift.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Per-Category Drift Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryDrift.map((cat) => (
                  <div key={cat.category} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{cat.label}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
                        <div className="flex items-center gap-1">
                          {getDriftIcon(cat.confidenceDelta)}
                          <span className="metric-value" style={{ color: Math.abs(cat.confidenceDelta) > 10 ? '#f59e0b' : 'var(--text-primary)' }}>
                            {cat.confidenceDelta > 0 ? '+' : ''}{cat.confidenceDelta}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Correctness</span>
                        <div className="flex items-center gap-1">
                          {getDriftIcon(cat.correctnessDelta)}
                          <span className="metric-value" style={{ color: Math.abs(cat.correctnessDelta) > 10 ? '#f59e0b' : 'var(--text-primary)' }}>
                            {cat.correctnessDelta > 0 ? '+' : ''}{cat.correctnessDelta}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Hallucinations</span>
                        <div className="flex items-center gap-1">
                          {getDriftIcon(cat.hallucinationDelta, 1)}
                          <span className="metric-value" style={{ color: cat.hallucinationDelta > 0 ? '#ef4444' : '#22c55e' }}>
                            {cat.hallucinationDelta > 0 ? '+' : ''}{cat.hallucinationDelta}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
