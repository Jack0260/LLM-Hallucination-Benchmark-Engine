import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TASK_CATEGORY_LABELS } from '@/data/seed';
import { generateInsights, rankModels } from '@/lib/benchmark';
import type { BenchmarkRun, ReportConfig } from '@/types';
import { FileText, FileDown, Settings2, Lightbulb, Trophy, AlertTriangle, BarChart3, X } from 'lucide-react';

export function Reports() {
  const { runs, settings, updateSettings } = useApp();
  const [selectedRunId, setSelectedRunId] = useState(runs[0]?.id ?? '');
  const [showConfig, setShowConfig] = useState(false);

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );

  const reportConfig: ReportConfig = settings.defaultReportConfig;

  const updateReportConfig = (updates: Partial<ReportConfig>) => {
    updateSettings({ defaultReportConfig: { ...reportConfig, ...updates } });
  };

  const insights = useMemo(() => selectedRun ? generateInsights(selectedRun) : [], [selectedRun]);
  const rankings = useMemo(() => selectedRun ? rankModels(selectedRun) : [], [selectedRun]);

  const exportHTML = () => {
    if (!selectedRun) return;
    const html = generateReportHTML(selectedRun, reportConfig, insights, rankings);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRun.name.replace(/\s+/g, '_')}_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!selectedRun) return;
    const blob = new Blob([JSON.stringify(selectedRun, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRun.name.replace(/\s+/g, '_')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!selectedRun) return;
    const headers = ['Task ID', 'Category', 'Model', 'Confidence', 'Correctness', 'Hallucination', 'Severity', 'Latency(ms)', 'Drift Delta'];
    const rows = selectedRun.results.map((r) => [
      r.taskId, r.taskCategory, r.modelName, r.confidenceScore, r.correctnessScore,
      r.hallucinationFlag, r.hallucinationSeverity, r.latencyMs, r.driftDelta,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRun.name.replace(/\s+/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const configOptions: { key: keyof ReportConfig; label: string }[] = [
    { key: 'includeExecutiveSummary', label: 'Executive Summary' },
    { key: 'includePerModelBreakdown', label: 'Per-Model Breakdown' },
    { key: 'includeDriftAnalysis', label: 'Drift Analysis' },
    { key: 'includeHallucinationLog', label: 'Hallucination Incident Log' },
    { key: 'includeComparativeRankings', label: 'Comparative Rankings' },
    { key: 'includeCategoryAnalysis', label: 'Category Analysis' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Evaluation Reports
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Generate and export automated evaluation reports from benchmark runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowConfig(!showConfig)} className="btn-secondary flex items-center gap-2">
            {showConfig ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            {showConfig ? 'Close' : 'Configure'}
          </button>
        </div>
      </div>

      {/* Run selector */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Select Run:</label>
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="input-field flex-1 max-w-xs"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {new Date(r.timestamp).toLocaleString()}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={exportHTML} disabled={!selectedRun} className="btn-primary flex items-center gap-2 text-xs">
              <FileDown className="w-3.5 h-3.5" /> HTML
            </button>
            <button onClick={exportJSON} disabled={!selectedRun} className="btn-secondary flex items-center gap-2 text-xs">
              <FileDown className="w-3.5 h-3.5" /> JSON
            </button>
            <button onClick={exportCSV} disabled={!selectedRun} className="btn-secondary flex items-center gap-2 text-xs">
              <FileDown className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Report Sections</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {configOptions.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig[key]}
                  onChange={(e) => updateReportConfig({ [key]: e.target.checked } as Partial<ReportConfig>)}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      {selectedRun ? (
        <div className="card p-8 space-y-6" style={{ maxWidth: 900 }}>
          {/* Header */}
          <div className="text-center pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-5 h-5" style={{ color: '#06b6d4' }} />
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Benchmark Evaluation Report
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {selectedRun.name} · {new Date(selectedRun.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Executive Summary */}
          {reportConfig.includeExecutiveSummary && (
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BarChart3 className="w-4 h-4" style={{ color: '#06b6d4' }} />
                Executive Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Avg Confidence</p>
                  <p className="text-lg font-bold metric-value" style={{ color: '#06b6d4' }}>{selectedRun.summary.avgConfidence}%</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Avg Correctness</p>
                  <p className="text-lg font-bold metric-value" style={{ color: '#22c55e' }}>{selectedRun.summary.avgCorrectness}%</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Hallucination Rate</p>
                  <p className="text-lg font-bold metric-value" style={{ color: selectedRun.summary.hallucinationRate > 15 ? '#ef4444' : 'var(--text-primary)' }}>{selectedRun.summary.hallucinationRate}%</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Avg Latency</p>
                  <p className="text-lg font-bold metric-value" style={{ color: 'var(--text-primary)' }}>{selectedRun.summary.avgLatency}ms</p>
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Configuration</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Noise Profile: <span className="font-medium">{selectedRun.noiseProfileName}</span> ·
                  Intensity: <span className="font-medium">{selectedRun.intensity}%</span> ·
                  Models: <span className="font-medium">{selectedRun.modelIds.length}</span> ·
                  Tasks: <span className="font-medium">{selectedRun.summary.totalTasks}</span>
                </p>
              </div>
            </section>
          )}

          {/* Auto-generated Insights */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Lightbulb className="w-4 h-4" style={{ color: '#f59e0b' }} />
              Auto-Generated Insights
            </h2>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <span className="mt-0.5" style={{ color: '#f59e0b' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{insight}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Comparative Rankings */}
          {reportConfig.includeComparativeRankings && rankings.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} />
                Comparative Rankings
              </h2>
              <div className="space-y-2">
                {rankings.map((model, idx) => (
                  <div key={model.modelId} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                      backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-tertiary)',
                      color: idx === 0 ? '#f59e0b' : 'var(--text-muted)',
                    }}>
                      {idx + 1}
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.color }} />
                    <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{model.modelName}</span>
                    <span className="text-xs metric-value" style={{ color: 'var(--text-muted)' }}>
                      Conf: {model.avgConfidence}% · Correct: {model.avgCorrectness}% · Halluc: {model.hallucinationRate}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Per-Model Breakdown */}
          {reportConfig.includePerModelBreakdown && (
            <section>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Per-Model Performance Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Model</th>
                      <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Confidence</th>
                      <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Correctness</th>
                      <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Hallucinations</th>
                      <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Latency</th>
                      <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Drift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRun.summary.perModel.map((m) => (
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
                        <td className="text-right py-2 px-2 metric-value" style={{ color: 'var(--text-secondary)' }}>{m.avgLatency}ms</td>
                        <td className="text-right py-2 px-2 metric-value" style={{ color: Math.abs(m.driftDelta) > 15 ? '#f59e0b' : 'var(--text-secondary)' }}>
                          {m.driftDelta > 0 ? '+' : ''}{m.driftDelta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Category Analysis */}
          {reportConfig.includeCategoryAnalysis && selectedRun.summary.perCategory.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Category Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedRun.summary.perCategory.map((cat) => (
                  <div key={cat.category} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {TASK_CATEGORY_LABELS[cat.category] ?? cat.category}
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
                        <span className="metric-value" style={{ color: 'var(--text-primary)' }}>{cat.avgConfidence}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Correctness</span>
                        <span className="metric-value" style={{ color: 'var(--text-primary)' }}>{cat.avgCorrectness}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Hallucinations</span>
                        <span className="metric-value" style={{ color: cat.hallucinationCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>{cat.hallucinationCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Total Results</span>
                        <span className="metric-value" style={{ color: 'var(--text-secondary)' }}>{cat.totalResults}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Drift Analysis */}
          {reportConfig.includeDriftAnalysis && (
            <section>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Drift Analysis
              </h2>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Drift is measured as the change in confidence score between consecutive benchmark runs for the same model-task pair.
                  A negative drift indicates degrading performance.
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedRun.summary.perModel.map((m) => (
                    <div key={m.modelId} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.modelName}</span>
                      </div>
                      <span className="text-sm metric-value font-semibold" style={{ color: Math.abs(m.driftDelta) > 15 ? '#f59e0b' : 'var(--text-secondary)' }}>
                        {m.driftDelta > 0 ? '+' : ''}{m.driftDelta} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Hallucination Log */}
          {reportConfig.includeHallucinationLog && (
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                Hallucination Incident Log
              </h2>
              {selectedRun.results.filter((r) => r.hallucinationFlag).length === 0 ? (
                <p className="text-sm p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  No hallucination incidents detected in this run.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedRun.results.filter((r) => r.hallucinationFlag).map((r, idx) => (
                    <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {r.modelName} — {TASK_CATEGORY_LABELS[r.taskCategory]}
                        </span>
                        <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                          Severity: {r.hallucinationSeverity}%
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>Injected Prompt</p>
                          <p className="font-mono p-2 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                            {r.injectedPrompt}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>Hallucinated Response</p>
                          <p className="font-mono p-2 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                            {r.modelResponse}
                          </p>
                          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Expected: {r.expectedAnswer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No benchmark runs available. Run a benchmark first to generate reports.
          </p>
        </div>
      )}
    </div>
  );
}

function generateReportHTML(
  run: BenchmarkRun,
  config: ReportConfig,
  insights: string[],
  rankings: ReturnType<typeof rankModels>
): string {
  const rows = run.results.map((r) => `
    <tr>
      <td>${r.taskId}</td>
      <td>${r.taskCategory}</td>
      <td>${r.modelName}</td>
      <td>${r.confidenceScore}%</td>
      <td>${r.correctnessScore}%</td>
      <td>${r.hallucinationFlag ? 'Yes' : 'No'}</td>
      <td>${r.latencyMs}ms</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${run.name} - Evaluation Report</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; color: #1e293b; }
  h1 { color: #0f172a; border-bottom: 2px solid #06b6d4; padding-bottom: 10px; }
  h2 { color: #334155; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  th { background: #f1f5f9; font-weight: 600; }
  .metric { font-family: monospace; font-weight: 600; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
  .summary div { background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; }
  .summary .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
  .summary .value { font-size: 24px; font-weight: 700; font-family: monospace; }
  .insight { background: #fffbeb; padding: 10px 14px; border-radius: 8px; margin: 6px 0; font-size: 14px; }
  .rank { display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; margin: 4px 0; }
</style></head><body>
<h1>Benchmark Evaluation Report</h1>
<p><strong>${run.name}</strong> — ${new Date(run.timestamp).toLocaleString()}</p>
${config.includeExecutiveSummary ? `
<h2>Executive Summary</h2>
<div class="summary">
  <div><div class="label">Avg Confidence</div><div class="value" style="color:#06b6d4">${run.summary.avgConfidence}%</div></div>
  <div><div class="label">Avg Correctness</div><div class="value" style="color:#22c55e">${run.summary.avgCorrectness}%</div></div>
  <div><div class="label">Hallucination Rate</div><div class="value" style="color:#ef4444">${run.summary.hallucinationRate}%</div></div>
  <div><div class="label">Avg Latency</div><div class="value">${run.summary.avgLatency}ms</div></div>
</div>
<p>Noise Profile: ${run.noiseProfileName} · Intensity: ${run.intensity}% · Models: ${run.modelIds.length} · Tasks: ${run.summary.totalTasks}</p>` : ''}
<h2>Insights</h2>
${insights.map((i) => `<div class="insight">${i}</div>`).join('')}
${config.includeComparativeRankings ? `
<h2>Comparative Rankings</h2>
${rankings.map((m, i) => `<div class="rank"><strong>${i + 1}.</strong> ${m.modelName} — Conf: ${m.avgConfidence}% · Correct: ${m.avgCorrectness}% · Halluc: ${m.hallucinationRate}%</div>`).join('')}` : ''}
${config.includePerModelBreakdown ? `
<h2>Per-Model Breakdown</h2>
<table><tr><th>Model</th><th>Confidence</th><th>Correctness</th><th>Hallucinations</th><th>Latency</th><th>Drift</th></tr>
${run.summary.perModel.map((m) => `<tr><td>${m.modelName}</td><td class="metric">${m.avgConfidence}%</td><td class="metric">${m.avgCorrectness}%</td><td class="metric">${m.hallucinationRate}%</td><td class="metric">${m.avgLatency}ms</td><td class="metric">${m.driftDelta > 0 ? '+' : ''}${m.driftDelta}</td></tr>`).join('')}
</table>` : ''}
<h2>Full Results</h2>
<table><tr><th>Task</th><th>Category</th><th>Model</th><th>Confidence</th><th>Correctness</th><th>Hallucination</th><th>Latency</th></tr>
${rows}
</table>
</body></html>`;
}
