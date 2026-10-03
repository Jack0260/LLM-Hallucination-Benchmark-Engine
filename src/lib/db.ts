import { supabase } from '@/lib/supabase';
import type {
  ReasoningTask,
  ModelProfile,
  NoiseProfile,
  BenchmarkRun,
  TaskResult,
  RunSummary,
} from '@/types';
import { SEED_TASKS, SEED_MODELS, SEED_NOISE_PROFILES } from '@/data/seed';

// --- Row types matching database columns ---

interface TaskRow {
  id: string;
  category: string;
  prompt: string;
  expected_answer: string;
  difficulty: number;
  tags: string[];
  created_at: string;
}

interface ModelRow {
  id: string;
  name: string;
  description: string;
  accuracy_baseline: number;
  hallucination_rate: number;
  drift_tendency: number;
  confidence_calibration: number;
  latency_ms: number;
  color: string;
  created_at: string;
}

interface NoiseRow {
  id: string;
  name: string;
  noise_types: string[];
  intensity: number;
  injection_frequency: number;
  target_scope: string;
  created_at: string;
}

interface RunRow {
  id: string;
  name: string;
  status: string;
  noise_profile_id: string | null;
  noise_profile_name: string;
  model_ids: string[];
  task_ids: string[];
  intensity: number;
  summary: Record<string, unknown>;
  created_at: string;
}

interface TaskResultRow {
  id: string;
  run_id: string;
  task_id: string;
  task_category: string;
  model_id: string;
  model_name: string;
  original_prompt: string;
  injected_prompt: string;
  model_response: string;
  expected_answer: string;
  confidence_score: number;
  correctness_score: number;
  hallucination_flag: boolean;
  hallucination_severity: number;
  latency_ms: number;
  drift_delta: number;
  created_at: string;
}

// --- Mappers ---

function rowToTask(row: TaskRow): ReasoningTask {
  return {
    id: row.id,
    category: row.category as ReasoningTask['category'],
    prompt: row.prompt,
    expectedAnswer: row.expected_answer,
    difficulty: row.difficulty as 1 | 2 | 3 | 4 | 5,
    tags: row.tags ?? [],
  };
}

function taskToRow(task: ReasoningTask): TaskRow {
  return {
    id: task.id,
    category: task.category,
    prompt: task.prompt,
    expected_answer: task.expectedAnswer,
    difficulty: task.difficulty,
    tags: task.tags,
    created_at: new Date().toISOString(),
  };
}

function rowToModel(row: ModelRow): ModelProfile {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    accuracyBaseline: row.accuracy_baseline,
    hallucinationRate: row.hallucination_rate,
    driftTendency: row.drift_tendency,
    confidenceCalibration: row.confidence_calibration,
    latencyMs: row.latency_ms,
    color: row.color,
    createdAt: row.created_at,
  };
}

function modelToRow(model: ModelProfile): Partial<ModelRow> {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    accuracy_baseline: model.accuracyBaseline,
    hallucination_rate: model.hallucinationRate,
    drift_tendency: model.driftTendency,
    confidence_calibration: model.confidenceCalibration,
    latency_ms: model.latencyMs,
    color: model.color,
  };
}

function rowToNoise(row: NoiseRow): NoiseProfile {
  return {
    id: row.id,
    name: row.name,
    noiseTypes: (row.noise_types ?? []) as NoiseProfile['noiseTypes'],
    intensity: row.intensity,
    injectionFrequency: row.injection_frequency,
    targetScope: row.target_scope as NoiseProfile['targetScope'],
    createdAt: row.created_at,
  };
}

function noiseToRow(profile: NoiseProfile): Partial<NoiseRow> {
  return {
    id: profile.id,
    name: profile.name,
    noise_types: profile.noiseTypes,
    intensity: profile.intensity,
    injection_frequency: profile.injectionFrequency,
    target_scope: profile.targetScope,
  };
}

function rowToResult(row: TaskResultRow): TaskResult {
  return {
    taskId: row.task_id,
    taskCategory: row.task_category as TaskResult['taskCategory'],
    modelId: row.model_id,
    modelName: row.model_name,
    originalPrompt: row.original_prompt,
    injectedPrompt: row.injected_prompt,
    modelResponse: row.model_response,
    expectedAnswer: row.expected_answer,
    confidenceScore: row.confidence_score,
    correctnessScore: row.correctness_score,
    hallucinationFlag: row.hallucination_flag,
    hallucinationSeverity: row.hallucination_severity,
    latencyMs: row.latency_ms,
    driftDelta: row.drift_delta,
  };
}

function resultToRow(result: TaskResult, runId: string): Omit<TaskResultRow, 'id' | 'created_at'> {
  return {
    run_id: runId,
    task_id: result.taskId,
    task_category: result.taskCategory,
    model_id: result.modelId,
    model_name: result.modelName,
    original_prompt: result.originalPrompt,
    injected_prompt: result.injectedPrompt,
    model_response: result.modelResponse,
    expected_answer: result.expectedAnswer,
    confidence_score: result.confidenceScore,
    correctness_score: result.correctnessScore,
    hallucination_flag: result.hallucinationFlag,
    hallucination_severity: result.hallucinationSeverity,
    latency_ms: result.latencyMs,
    drift_delta: result.driftDelta,
  };
}

function rowToRun(row: RunRow, results: TaskResult[]): BenchmarkRun {
  return {
    id: row.id,
    name: row.name,
    timestamp: row.created_at,
    status: row.status as BenchmarkRun['status'],
    noiseProfileId: row.noise_profile_id ?? '',
    noiseProfileName: row.noise_profile_name,
    modelIds: row.model_ids ?? [],
    taskIds: row.task_ids ?? [],
    intensity: row.intensity,
    results,
    summary: row.summary as unknown as RunSummary,
  };
}

// --- Seed data ---

export async function seedDatabaseIfEmpty(): Promise<void> {
  // Check tasks
  const { count: taskCount } = await supabase
    .from('reasoning_tasks')
    .select('*', { count: 'exact', head: true });

  if (taskCount === 0) {
    const rows = SEED_TASKS.map(taskToRow);
    await supabase.from('reasoning_tasks').insert(rows);
  }

  // Check models
  const { count: modelCount } = await supabase
    .from('model_profiles')
    .select('*', { count: 'exact', head: true });

  if (modelCount === 0) {
    const rows = SEED_MODELS.map((m) => ({
      ...modelToRow(m),
      created_at: m.createdAt,
    })) as ModelRow[];
    await supabase.from('model_profiles').insert(rows);
  }

  // Check noise profiles
  const { count: noiseCount } = await supabase
    .from('noise_profiles')
    .select('*', { count: 'exact', head: true });

  if (noiseCount === 0) {
    const rows = SEED_NOISE_PROFILES.map((p) => ({
      ...noiseToRow(p),
      created_at: p.createdAt,
    })) as NoiseRow[];
    await supabase.from('noise_profiles').insert(rows);
  }
}

// --- Tasks CRUD ---

export async function fetchTasks(): Promise<ReasoningTask[]> {
  const { data, error } = await supabase.from('reasoning_tasks').select('*');
  if (error) throw error;
  return (data as TaskRow[]).map(rowToTask);
}

export async function insertTask(task: ReasoningTask): Promise<void> {
  const { error } = await supabase.from('reasoning_tasks').insert(taskToRow(task));
  if (error) throw error;
}

export async function updateTaskDb(id: string, updates: Partial<ReasoningTask>): Promise<void> {
  const row: Partial<TaskRow> = {};
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.prompt !== undefined) row.prompt = updates.prompt;
  if (updates.expectedAnswer !== undefined) row.expected_answer = updates.expectedAnswer;
  if (updates.difficulty !== undefined) row.difficulty = updates.difficulty;
  if (updates.tags !== undefined) row.tags = updates.tags;
  const { error } = await supabase.from('reasoning_tasks').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteTaskDb(id: string): Promise<void> {
  const { error } = await supabase.from('reasoning_tasks').delete().eq('id', id);
  if (error) throw error;
}

// --- Models CRUD ---

export async function fetchModels(): Promise<ModelProfile[]> {
  const { data, error } = await supabase.from('model_profiles').select('*');
  if (error) throw error;
  return (data as ModelRow[]).map(rowToModel);
}

export async function insertModel(model: ModelProfile): Promise<void> {
  const { error } = await supabase.from('model_profiles').insert({
    ...modelToRow(model),
    created_at: model.createdAt,
  });
  if (error) throw error;
}

export async function updateModelDb(id: string, updates: Partial<ModelProfile>): Promise<void> {
  const row: Partial<ModelRow> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.accuracyBaseline !== undefined) row.accuracy_baseline = updates.accuracyBaseline;
  if (updates.hallucinationRate !== undefined) row.hallucination_rate = updates.hallucinationRate;
  if (updates.driftTendency !== undefined) row.drift_tendency = updates.driftTendency;
  if (updates.confidenceCalibration !== undefined) row.confidence_calibration = updates.confidenceCalibration;
  if (updates.latencyMs !== undefined) row.latency_ms = updates.latencyMs;
  if (updates.color !== undefined) row.color = updates.color;
  const { error } = await supabase.from('model_profiles').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteModelDb(id: string): Promise<void> {
  const { error } = await supabase.from('model_profiles').delete().eq('id', id);
  if (error) throw error;
}

// --- Noise Profiles CRUD ---

export async function fetchNoiseProfiles(): Promise<NoiseProfile[]> {
  const { data, error } = await supabase.from('noise_profiles').select('*');
  if (error) throw error;
  return (data as NoiseRow[]).map(rowToNoise);
}

export async function insertNoiseProfile(profile: NoiseProfile): Promise<void> {
  const { error } = await supabase.from('noise_profiles').insert({
    ...noiseToRow(profile),
    created_at: profile.createdAt,
  });
  if (error) throw error;
}

export async function updateNoiseProfileDb(id: string, updates: Partial<NoiseProfile>): Promise<void> {
  const row: Partial<NoiseRow> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.noiseTypes !== undefined) row.noise_types = updates.noiseTypes;
  if (updates.intensity !== undefined) row.intensity = updates.intensity;
  if (updates.injectionFrequency !== undefined) row.injection_frequency = updates.injectionFrequency;
  if (updates.targetScope !== undefined) row.target_scope = updates.targetScope;
  const { error } = await supabase.from('noise_profiles').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteNoiseProfileDb(id: string): Promise<void> {
  const { error } = await supabase.from('noise_profiles').delete().eq('id', id);
  if (error) throw error;
}

// --- Benchmark Runs ---

export async function fetchRuns(): Promise<BenchmarkRun[]> {
  const { data: runRows, error: runErr } = await supabase
    .from('benchmark_runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (runErr) throw runErr;
  if (!runRows || runRows.length === 0) return [];

  const runIds = (runRows as RunRow[]).map((r) => r.id);

  const { data: resultRows, error: resultErr } = await supabase
    .from('task_results')
    .select('*')
    .in('run_id', runIds);

  if (resultErr) throw resultErr;

  const resultsByRun = new Map<string, TaskResult[]>();
  for (const row of (resultRows as TaskResultRow[]) ?? []) {
    const list = resultsByRun.get(row.run_id) ?? [];
    list.push(rowToResult(row));
    resultsByRun.set(row.run_id, list);
  }

  return (runRows as RunRow[]).map((row) =>
    rowToRun(row, resultsByRun.get(row.id) ?? [])
  );
}

export async function insertRun(run: BenchmarkRun): Promise<void> {
  const runRow = {
    id: run.id,
    name: run.name,
    status: run.status,
    noise_profile_id: run.noiseProfileId || null,
    noise_profile_name: run.noiseProfileName,
    model_ids: run.modelIds,
    task_ids: run.taskIds,
    intensity: run.intensity,
    summary: run.summary as unknown as Record<string, unknown>,
    created_at: run.timestamp,
  };

  const { error: runErr } = await supabase.from('benchmark_runs').insert(runRow);
  if (runErr) throw runErr;

  const resultRows = run.results.map((r) => resultToRow(r, run.id));
  if (resultRows.length > 0) {
    const { error: resultErr } = await supabase.from('task_results').insert(resultRows);
    if (resultErr) throw resultErr;
  }
}

export async function deleteRunDb(id: string): Promise<void> {
  const { error } = await supabase.from('benchmark_runs').delete().eq('id', id);
  if (error) throw error;
}

export async function clearRunsDb(): Promise<void> {
  const { error } = await supabase.from('benchmark_runs').delete().neq('id', '');
  if (error) throw error;
}
