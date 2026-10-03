// Core domain types for the Probabilistic Hallucination Benchmark Engine

export type ThemeMode = 'dark' | 'light' | 'system';

export type NoiseType = 'typographical' | 'semantic' | 'structural' | 'adversarial';

export type TaskCategory =
  | 'logical_deduction'
  | 'mathematical_reasoning'
  | 'factual_recall'
  | 'multi_step_inference'
  | 'counterfactual_reasoning';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ReasoningTask {
  id: string;
  category: TaskCategory;
  prompt: string;
  expectedAnswer: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface NoiseProfile {
  id: string;
  name: string;
  noiseTypes: NoiseType[];
  intensity: number; // 0-100
  injectionFrequency: number; // 0-100, percentage of tokens affected
  targetScope: 'all' | 'prompts' | 'answers';
  createdAt: string;
}

export interface ModelProfile {
  id: string;
  name: string;
  description: string;
  accuracyBaseline: number; // 0-100
  hallucinationRate: number; // 0-100
  driftTendency: number; // 0-100
  confidenceCalibration: number; // 0-100, higher = better calibrated
  latencyMs: number; // simulated response latency
  color: string; // for charts
  createdAt: string;
}

export interface TaskResult {
  taskId: string;
  taskCategory: TaskCategory;
  modelId: string;
  modelName: string;
  originalPrompt: string;
  injectedPrompt: string;
  modelResponse: string;
  expectedAnswer: string;
  confidenceScore: number; // 0-100
  correctnessScore: number; // 0-100
  hallucinationFlag: boolean;
  hallucinationSeverity: number; // 0-100
  latencyMs: number;
  driftDelta: number; // change from previous run for this model+task
}

export interface BenchmarkRun {
  id: string;
  name: string;
  timestamp: string;
  status: RunStatus;
  noiseProfileId: string;
  noiseProfileName: string;
  modelIds: string[];
  taskIds: string[];
  intensity: number;
  results: TaskResult[];
  summary: RunSummary;
}

export interface RunSummary {
  totalTasks: number;
  totalResults: number;
  avgConfidence: number;
  avgCorrectness: number;
  hallucinationCount: number;
  hallucinationRate: number;
  avgLatency: number;
  perModel: PerModelSummary[];
  perCategory: PerCategorySummary[];
}

export interface PerModelSummary {
  modelId: string;
  modelName: string;
  color: string;
  avgConfidence: number;
  avgCorrectness: number;
  hallucinationCount: number;
  hallucinationRate: number;
  avgLatency: number;
  driftDelta: number;
}

export interface PerCategorySummary {
  category: TaskCategory;
  avgConfidence: number;
  avgCorrectness: number;
  hallucinationCount: number;
  totalResults: number;
}

export interface ReportConfig {
  includeExecutiveSummary: boolean;
  includePerModelBreakdown: boolean;
  includeDriftAnalysis: boolean;
  includeHallucinationLog: boolean;
  includeComparativeRankings: boolean;
  includeCategoryAnalysis: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  defaultNoiseProfileId: string | null;
  defaultReportConfig: ReportConfig;
}

export type ViewKey =
  | 'dashboard'
  | 'noise-injection'
  | 'model-registry'
  | 'benchmark-matrix'
  | 'drift-analysis'
  | 'reports'
  | 'run-history';
