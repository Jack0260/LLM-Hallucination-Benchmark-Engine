import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TASK_CATEGORY_LABELS } from '@/data/seed';
import type { TaskResult, TaskCategory } from '@/types';
import { Play, Grid3x3, X, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export function BenchmarkMatrix() {
  const { tasks, models, noiseProfiles, runs, runBenchmark } = useApp();

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set(tasks.map((t) => t.id)));
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set(models.map((m) => m.id)));
  const [selectedNoiseId, setSelectedNoiseId] = useState(noiseProfiles[0]?.id ?? '');
  const [runName, setRunName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ modelId: string; category: TaskCategory } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const latestRun = runs.length > 0 ? runs[0] : null;

  const toggleTask = (id: string) => {
    const next = new Set(selectedTaskIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTaskIds(next);
  };

  const toggleModel = (id: string) => {
    const next = new Set(selectedModelIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedModelIds(next);
  };

  const toggleSelectAllTasks = () => {
    if (selectedTaskIds.size === tasks.length) setSelectedTaskIds(new Set());
    else setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
  };

  const toggleSelectAllModels = () => {
    if (selectedModelIds.size === models.length) setSelectedModelIds(new Set());
    else setSelectedModelIds(new Set(models.map((m) => m.id)));
  };

  const handleRun = async () => {
    setRunError('');
    if (selectedTaskIds.size === 0) { setRunError('Select at least one task.'); return; }
    if (selectedModelIds.size === 0) { setRunError('Select at least one model.'); return; }
    if (!selectedNoiseId) { setRunError('Select a noise profile.'); return; }

    setIsRunning(true);
    try {
      const name = runName.trim() || `Run ${runs.length + 1}`;
      await runBenchmark(
        Array.from(selectedTaskIds),
        Array.from(selectedModelIds),
        selectedNoiseId,
        name
      );
      setRunName('');
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to run benchmark');
    } finally {
      setIsRunning(false);
    }
  };

  // Build matrix data from latest run
  const matrixData = useMemo(() => {
    if (!latestRun) return null;
    const categories = Array.from(new Set(latestRun.results.map((r) => r.taskCategory)));
    return {
      categories,
      models: latestRun.summary.perModel,
      cells: latestRun.results,
    };
  }, [latestRun]);

  const getCellData = (modelId: string, category: TaskCategory): { avgConfidence: number; avgCorrectness: number; hallucinationCount: number; count: number } => {
    if (!matrixData) return { avgConfidence: 0, avgCorrectness: 0, hallucinationCount: 0, count: 0 };
    const cellResults = matrixData.cells.filter((r) => r.modelId === modelId && r.taskCategory === category);
    const count = cellResults.length;
    if (count === 0) return { avgConfidence: 0, avgCorrectness: 0, hallucinationCount: 0, count: 0 };
    return {
      avgConfidence: Math.round(cellResults.reduce((s, r) => s + r.confidenceScore, 0) / count),
      avgCorrectness: Math.round(cellResults.reduce((s, r) => s + r.correctnessScore, 0) / count),
      hallucinationCount: cellResults.filter((r) => r.hallucinationFlag).length,
      count,
    };
  };

  const getCellColor = (confidence: number, correctness: number, hallucination: number): string => {
    if (hallucination > 0) return `rgba(239, 68, 68, ${0.15 + (hallucination / 5) * 0.35})`;
    const score = (confidence + correctness) / 2;
    if (score >= 80) return 'rgba(34, 197, 94, 0.25)';
    if (score >= 60) return 'rgba(34, 197, 94, 0.12)';
    if (score >= 40) return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(239, 68, 68, 0.1)';
  };

  const cellDetailResults: TaskResult[] = selectedCell && latestRun
    ? latestRun.results.filter((r) => r.modelId === selectedCell.modelId && r.taskCategory === selectedCell.category)
    : [];

  const toggleRow = (modelId: string) => {
    const next = new Set(expandedRows);
    if (next.has(modelId)) next.delete(modelId);
    else next.add(modelId);
    setExpandedRows(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Confidence Scoring Matrix
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Run benchmarks and analyze per-model confidence across reasoning categories.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Grid3x3 className="w-4 h-4" style={{ color: '#06b6d4' }} />
          Benchmark Configuration
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-1">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Run Name</label>
            <input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder={`Run ${runs.length + 1}`}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Noise Profile</label>
            <select value={selectedNoiseId} onChange={(e) => setSelectedNoiseId(e.target.value)} className="input-field">
              {noiseProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Tasks: {selectedTaskIds.size}/{tasks.length}
            </label>
            <button onClick={toggleSelectAllTasks} className="input-field text-left">
              {selectedTaskIds.size === tasks.length ? 'Deselect All' : 'Select All Tasks'}
            </button>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Models: {selectedModelIds.size}/{models.length}
            </label>
            <button onClick={toggleSelectAllModels} className="input-field text-left">
              {selectedModelIds.size === models.length ? 'Deselect All' : 'Select All Models'}
            </button>
          </div>
        </div>

        {/* Task checkboxes */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Tasks</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="badge transition-all duration-200 cursor-pointer text-left"
                style={{
                  backgroundColor: selectedTaskIds.has(task.id) ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-tertiary)',
                  color: selectedTaskIds.has(task.id) ? '#06b6d4' : 'var(--text-secondary)',
                  border: `1px solid ${selectedTaskIds.has(task.id) ? '#06b6d4' : 'var(--border-color)'}`,
                }}
              >
                {TASK_CATEGORY_LABELS[task.category]} · D{task.difficulty}
              </button>
            ))}
          </div>
        </div>

        {/* Model checkboxes */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Models</p>
          <div className="flex flex-wrap gap-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                className="badge transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: selectedModelIds.has(model.id) ? `${model.color}20` : 'var(--bg-tertiary)',
                  color: selectedModelIds.has(model.id) ? model.color : 'var(--text-secondary)',
                  border: `1px solid ${selectedModelIds.has(model.id) ? model.color : 'var(--border-color)'}`,
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model.color }} />
                {model.name}
              </button>
            ))}
          </div>
        </div>

        {runError && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{runError}</span>
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={isRunning || selectedTaskIds.size === 0 || selectedModelIds.size === 0 || !selectedNoiseId}
          className="btn-primary flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Benchmark
            </>
          )}
        </button>
      </div>

      {/* Matrix Heatmap */}
      {matrixData ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Confidence Matrix: {latestRun!.name}
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.25)' }} />
                <span style={{ color: 'var(--text-muted)' }}>High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Low/Hallucination</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '4px' }}>
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium p-2 sticky left-0" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)' }}>
                    Model
                  </th>
                  {matrixData.categories.map((cat) => (
                    <th key={cat} className="text-center text-xs font-medium p-2" style={{ color: 'var(--text-muted)' }}>
                      {TASK_CATEGORY_LABELS[cat]?.split(' ')[0] ?? cat}
                    </th>
                  ))}
                  <th className="text-center text-xs font-medium p-2" style={{ color: 'var(--text-muted)' }}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.models.map((model) => {
                  const isExpanded = expandedRows.has(model.modelId);
                  return (
                    <>
                      <tr key={model.modelId}>
                        <td className="p-2 sticky left-0" style={{ backgroundColor: 'var(--card-bg)' }}>
                          <button
                            onClick={() => toggleRow(model.modelId)}
                            className="flex items-center gap-2 text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.color }} />
                            {model.modelName}
                          </button>
                        </td>
                        {matrixData.categories.map((cat) => {
                          const cell = getCellData(model.modelId, cat);
                          return (
                            <td
                              key={cat}
                              className="heatmap-cell text-center p-1 rounded-lg cursor-pointer"
                              style={{ backgroundColor: getCellColor(cell.avgConfidence, cell.avgCorrectness, cell.hallucinationCount) }}
                              onClick={() => setSelectedCell({ modelId: model.modelId, category: cat })}
                            >
                              <div className="metric-value text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {cell.count > 0 ? `${cell.avgConfidence}%` : '—'}
                              </div>
                              {cell.hallucinationCount > 0 && (
                                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" style={{ color: '#ef4444' }} />
                                  <span className="text-[9px]" style={{ color: '#ef4444' }}>{cell.hallucinationCount}</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <span className="metric-value text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {model.avgConfidence}%
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={matrixData.categories.length + 2} className="p-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <div>
                                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Confidence</p>
                                <p className="metric-value text-lg font-bold" style={{ color: model.color }}>{model.avgConfidence}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Correctness</p>
                                <p className="metric-value text-lg font-bold" style={{ color: '#22c55e' }}>{model.avgCorrectness}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Hallucinations</p>
                                <p className="metric-value text-lg font-bold" style={{ color: model.hallucinationRate > 15 ? '#ef4444' : 'var(--text-primary)' }}>{model.hallucinationRate}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Avg Latency</p>
                                <p className="metric-value text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{model.avgLatency}ms</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Grid3x3 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No benchmark runs yet. Configure and run a benchmark above to see the confidence matrix.
          </p>
        </div>
      )}

      {/* Cell Detail Modal */}
      {selectedCell && latestRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setSelectedCell(null)}>
          <div className="card p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Detail: {models.find((m) => m.id === selectedCell.modelId)?.name} — {TASK_CATEGORY_LABELS[selectedCell.category]}
              </h3>
              <button onClick={() => setSelectedCell(null)} className="p-1 rounded-md" style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {cellDetailResults.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results for this cell.</p>
              ) : (
                cellDetailResults.map((result, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.hallucinationFlag ? (
                        <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      ) : result.correctnessScore >= 80 ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                      ) : (
                        <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
                      )}
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Task: {result.taskId}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className="text-xs metric-value" style={{ color: 'var(--text-primary)' }}>{result.confidenceScore}% conf</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className="text-xs metric-value" style={{ color: 'var(--text-primary)' }}>{result.correctnessScore}% correct</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className="text-xs metric-value" style={{ color: 'var(--text-primary)' }}>{result.latencyMs}ms</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>Injected Prompt</p>
                        <p className="font-mono p-2 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                          {result.injectedPrompt}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>Model Response</p>
                        <p className="font-mono p-2 rounded" style={{ backgroundColor: result.hallucinationFlag ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)', color: result.hallucinationFlag ? '#ef4444' : 'var(--text-primary)' }}>
                          {result.modelResponse}
                        </p>
                        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Expected: {result.expectedAnswer}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
