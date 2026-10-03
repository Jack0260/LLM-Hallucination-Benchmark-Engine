import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  ReasoningTask,
  ModelProfile,
  NoiseProfile,
  BenchmarkRun,
  AppSettings,
} from '@/types';
import { SEED_TASKS, SEED_MODELS, SEED_NOISE_PROFILES } from '@/data/seed';
import { storage, generateId } from '@/lib/storage';
import { executeBenchmark } from '@/lib/benchmark';
import {
  seedDatabaseIfEmpty,
  fetchTasks,
  insertTask,
  updateTaskDb,
  deleteTaskDb,
  fetchModels,
  insertModel,
  updateModelDb,
  deleteModelDb,
  fetchNoiseProfiles,
  insertNoiseProfile,
  updateNoiseProfileDb,
  deleteNoiseProfileDb,
  fetchRuns,
  insertRun,
  deleteRunDb,
  clearRunsDb,
} from '@/lib/db';

interface AppContextValue {
  tasks: ReasoningTask[];
  models: ModelProfile[];
  noiseProfiles: NoiseProfile[];
  runs: BenchmarkRun[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;

  addTask: (task: Omit<ReasoningTask, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<ReasoningTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addModel: (model: Omit<ModelProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateModel: (id: string, updates: Partial<ModelProfile>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;

  addNoiseProfile: (profile: Omit<NoiseProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateNoiseProfile: (id: string, updates: Partial<NoiseProfile>) => Promise<void>;
  deleteNoiseProfile: (id: string) => Promise<void>;

  runBenchmark: (
    taskIds: string[],
    modelIds: string[],
    noiseProfileId: string,
    name: string
  ) => Promise<BenchmarkRun>;
  deleteRun: (id: string) => Promise<void>;
  clearRuns: () => Promise<void>;

  updateSettings: (updates: Partial<AppSettings>) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultNoiseProfileId: null,
  defaultReportConfig: {
    includeExecutiveSummary: true,
    includePerModelBreakdown: true,
    includeDriftAnalysis: true,
    includeHallucinationLog: true,
    includeComparativeRankings: true,
    includeCategoryAnalysis: true,
  },
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<ReasoningTask[]>(SEED_TASKS);
  const [models, setModels] = useState<ModelProfile[]>(SEED_MODELS);
  const [noiseProfiles, setNoiseProfiles] = useState<NoiseProfile[]>(SEED_NOISE_PROFILES);
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = storage.getSettings(DEFAULT_SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      defaultReportConfig: {
        ...DEFAULT_SETTINGS.defaultReportConfig,
        ...stored?.defaultReportConfig,
      },
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load from Supabase
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        await seedDatabaseIfEmpty();

        const [dbTasks, dbModels, dbNoise, dbRuns] = await Promise.all([
          fetchTasks(),
          fetchModels(),
          fetchNoiseProfiles(),
          fetchRuns(),
        ]);

        if (cancelled) return;

        if (dbTasks.length > 0) setTasks(dbTasks);
        if (dbModels.length > 0) setModels(dbModels);
        if (dbNoise.length > 0) setNoiseProfiles(dbNoise);
        setRuns(dbRuns);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data from database');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // --- Tasks ---

  const addTask = useCallback(async (task: Omit<ReasoningTask, 'id'>) => {
    const newTask: ReasoningTask = { ...task, id: generateId('task') };
    setTasks((prev) => [...prev, newTask]);
    try {
      await insertTask(newTask);
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== newTask.id));
      setError(err instanceof Error ? err.message : 'Failed to add task');
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<ReasoningTask>) => {
    const prev = tasks;
    setTasks(prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try {
      await updateTaskDb(id, updates);
    } catch (err) {
      setTasks(prev);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const prev = tasks;
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      await deleteTaskDb(id);
    } catch (err) {
      setTasks(prev);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }, [tasks]);

  // --- Models ---

  const addModel = useCallback(async (model: Omit<ModelProfile, 'id' | 'createdAt'>) => {
    const newModel: ModelProfile = {
      ...model,
      id: generateId('model'),
      createdAt: new Date().toISOString(),
    };
    setModels((prev) => [...prev, newModel]);
    try {
      await insertModel(newModel);
    } catch (err) {
      setModels((prev) => prev.filter((m) => m.id !== newModel.id));
      setError(err instanceof Error ? err.message : 'Failed to add model');
    }
  }, []);

  const updateModel = useCallback(async (id: string, updates: Partial<ModelProfile>) => {
    const prev = models;
    setModels(models.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    try {
      await updateModelDb(id, updates);
    } catch (err) {
      setModels(prev);
      setError(err instanceof Error ? err.message : 'Failed to update model');
    }
  }, [models]);

  const deleteModel = useCallback(async (id: string) => {
    const prev = models;
    setModels(models.filter((m) => m.id !== id));
    try {
      await deleteModelDb(id);
    } catch (err) {
      setModels(prev);
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    }
  }, [models]);

  // --- Noise Profiles ---

  const addNoiseProfile = useCallback(async (profile: Omit<NoiseProfile, 'id' | 'createdAt'>) => {
    const newProfile: NoiseProfile = {
      ...profile,
      id: generateId('noise'),
      createdAt: new Date().toISOString(),
    };
    setNoiseProfiles((prev) => [...prev, newProfile]);
    try {
      await insertNoiseProfile(newProfile);
    } catch (err) {
      setNoiseProfiles((prev) => prev.filter((p) => p.id !== newProfile.id));
      setError(err instanceof Error ? err.message : 'Failed to add noise profile');
    }
  }, []);

  const updateNoiseProfile = useCallback(async (id: string, updates: Partial<NoiseProfile>) => {
    const prev = noiseProfiles;
    setNoiseProfiles(noiseProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    try {
      await updateNoiseProfileDb(id, updates);
    } catch (err) {
      setNoiseProfiles(prev);
      setError(err instanceof Error ? err.message : 'Failed to update noise profile');
    }
  }, [noiseProfiles]);

  const deleteNoiseProfile = useCallback(async (id: string) => {
    const prev = noiseProfiles;
    setNoiseProfiles(noiseProfiles.filter((p) => p.id !== id));
    try {
      await deleteNoiseProfileDb(id);
    } catch (err) {
      setNoiseProfiles(prev);
      setError(err instanceof Error ? err.message : 'Failed to delete noise profile');
    }
  }, [noiseProfiles]);

  // --- Benchmark Runs ---

  const runBenchmark = useCallback(async (
    taskIds: string[],
    modelIds: string[],
    noiseProfileId: string,
    name: string
  ): Promise<BenchmarkRun> => {
    const selectedTasks = tasks.filter((t) => taskIds.includes(t.id));
    const selectedModels = models.filter((m) => modelIds.includes(m.id));
    const noiseProfile = noiseProfiles.find((p) => p.id === noiseProfileId);

    if (!noiseProfile) {
      throw new Error('Noise profile not found');
    }

    const previousRun = runs.length > 0 ? runs[0] : null;
    const run = executeBenchmark(selectedTasks, selectedModels, noiseProfile, previousRun, name);

    setRuns((prev) => [run, ...prev]);

    try {
      await insertRun(run);
    } catch (err) {
      setRuns((prev) => prev.filter((r) => r.id !== run.id));
      setError(err instanceof Error ? err.message : 'Failed to save benchmark run');
      throw err;
    }

    return run;
  }, [tasks, models, noiseProfiles, runs]);

  const deleteRun = useCallback(async (id: string) => {
    const prev = runs;
    setRuns(runs.filter((r) => r.id !== id));
    try {
      await deleteRunDb(id);
    } catch (err) {
      setRuns(prev);
      setError(err instanceof Error ? err.message : 'Failed to delete run');
    }
  }, [runs]);

  const clearRuns = useCallback(async () => {
    const prev = runs;
    setRuns([]);
    try {
      await clearRunsDb();
    } catch (err) {
      setRuns(prev);
      setError(err instanceof Error ? err.message : 'Failed to clear runs');
    }
  }, [runs]);

  // --- Settings (still localStorage — user preference, not shared data) ---

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      storage.setSettings(next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        tasks,
        models,
        noiseProfiles,
        runs,
        settings,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        addModel,
        updateModel,
        deleteModel,
        addNoiseProfile,
        updateNoiseProfile,
        deleteNoiseProfile,
        runBenchmark,
        deleteRun,
        clearRuns,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
