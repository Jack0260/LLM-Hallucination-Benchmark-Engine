import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TASK_CATEGORY_LABELS } from '@/data/seed';
import type { BenchmarkRun } from '@/types';
import { History, Trash2, X, ChevronRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export function RunHistory() {
  const { runs, deleteRun, clearRuns } = useApp();
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [detailRun, setDetailRun] = useState<BenchmarkRun | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const runA = runs.find((r) => r.id === compareA);
  const runB = runs.find((r) => r.id === compareB);

  const formatDate = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Run History
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Review past benchmark runs and compare results side by side.
          </p>
        </div>
        {runs.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="btn-danger flex items-center gap-2 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Clear confirmation */}
      {confirmClear && (
        <div className="card p-4 flex items-center justify-between" style={{ border: '1px solid #ef4444' }}>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Are you sure you want to delete all {runs.length} runs? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmClear(false)} className="btn-secondary text-xs">Cancel</button>
            <button onClick={() => { clearRuns().then(() => { setConfirmClear(false); setCompareA(null); setCompareB(null); }); }} className="btn-danger text-xs">Delete All</button>
          </div>
        </div>
      )}

      {/* Comparison selector */}
      {runA && runB && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Comparing: {runA.name} vs {runB.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Metric</th>
                  <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{runA.name}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{runB.name}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Delta</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Avg Confidence', a: runA.summary.avgConfidence, b: runB.summary.avgConfidence, unit: '%' },
                  { label: 'Avg Correctness', a: runA.summary.avgCorrectness, b: runB.summary.avgCorrectness, unit: '%' },
                  { label: 'Hallucination Rate', a: runA.summary.hallucinationRate, b: runB.summary.hallucinationRate, unit: '%' },
                  { label: 'Avg Latency', a: runA.summary.avgLatency, b: runB.summary.avgLatency, unit: 'ms' },
                  { label: 'Total Results', a: runA.summary.totalResults, b: runB.summary.totalResults, unit: '' },
                ].map((row) => {
                  const delta = row.b - row.a;
                  return (
                    <tr key={row.label} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{row.label}</td>
                      <td className="text-right py-2 px-3 metric-value" style={{ color: 'var(--text-primary)' }}>{row.a}{row.unit}</td>
                      <td className="text-right py-2 px-3 metric-value" style={{ color: 'var(--text-primary)' }}>{row.b}{row.unit}</td>
                      <td className="text-right py-2 px-3 metric-value" style={{ color: Math.abs(delta) > 10 ? '#f59e0b' : 'var(--text-secondary)' }}>
                        {delta > 0 ? '+' : ''}{delta}{row.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Run list */}
      {runs.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No benchmark runs recorded yet. Run a benchmark to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run, idx) => (
            <div key={run.id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                    <History className="w-5 h-5" style={{ color: '#06b6d4' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {run.name}
                      {idx === 0 && <span className="ml-2 badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>Latest</span>}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(run.timestamp)} · {run.noiseProfileName} · {run.intensity}% intensity
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Conf</span>
                      <span className="ml-1.5 metric-value font-semibold" style={{ color: '#06b6d4' }}>{run.summary.avgConfidence}%</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Correct</span>
                      <span className="ml-1.5 metric-value font-semibold" style={{ color: '#22c55e' }}>{run.summary.avgCorrectness}%</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Halluc</span>
                      <span className="ml-1.5 metric-value font-semibold" style={{ color: run.summary.hallucinationRate > 15 ? '#ef4444' : 'var(--text-primary)' }}>{run.summary.hallucinationRate}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCompareA(compareA === run.id ? null : run.id)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: compareA === run.id ? '#06b6d4' : 'var(--bg-tertiary)',
                        color: compareA === run.id ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setCompareB(compareB === run.id ? null : run.id)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: compareB === run.id ? '#a78bfa' : 'var(--bg-tertiary)',
                        color: compareB === run.id ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      B
                    </button>
                    <button
                      onClick={() => setDetailRun(run)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="View details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRun(run.id)}
                      className="p-1.5 rounded-md transition-colors text-red-500"
                      title="Delete run"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setDetailRun(null)}>
          <div className="card p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{detailRun.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(detailRun.timestamp)}</p>
              </div>
              <button onClick={() => setDetailRun(null)} className="p-1 rounded-md" style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Confidence</p>
                <p className="text-lg font-bold metric-value" style={{ color: '#06b6d4' }}>{detailRun.summary.avgConfidence}%</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Correctness</p>
                <p className="text-lg font-bold metric-value" style={{ color: '#22c55e' }}>{detailRun.summary.avgCorrectness}%</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Hallucinations</p>
                <p className="text-lg font-bold metric-value" style={{ color: detailRun.summary.hallucinationRate > 15 ? '#ef4444' : 'var(--text-primary)' }}>{detailRun.summary.hallucinationRate}%</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Latency</p>
                <p className="text-lg font-bold metric-value" style={{ color: 'var(--text-primary)' }}>{detailRun.summary.avgLatency}ms</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Task</th>
                    <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Model</th>
                    <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Conf</th>
                    <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Correct</th>
                    <th className="text-center py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRun.results.slice(0, 50).map((r, idx) => (
                    <tr key={idx} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="py-1.5 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {TASK_CATEGORY_LABELS[r.taskCategory]?.split(' ')[0]}
                      </td>
                      <td className="py-1.5 px-2 text-xs" style={{ color: 'var(--text-primary)' }}>{r.modelName}</td>
                      <td className="text-right py-1.5 px-2 text-xs metric-value" style={{ color: 'var(--text-primary)' }}>{r.confidenceScore}%</td>
                      <td className="text-right py-1.5 px-2 text-xs metric-value" style={{ color: 'var(--text-primary)' }}>{r.correctnessScore}%</td>
                      <td className="text-center py-1.5 px-2">
                        {r.hallucinationFlag ? (
                          <AlertTriangle className="w-3.5 h-3.5 inline" style={{ color: '#ef4444' }} />
                        ) : r.correctnessScore >= 80 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 inline" style={{ color: '#22c55e' }} />
                        ) : (
                          <Clock className="w-3.5 h-3.5 inline" style={{ color: '#f59e0b' }} />
                        )}
                      </td>
                      <td className="text-right py-1.5 px-2 text-xs metric-value" style={{ color: 'var(--text-secondary)' }}>{r.latencyMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detailRun.results.length > 50 && (
                <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                  Showing 50 of {detailRun.results.length} results
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
