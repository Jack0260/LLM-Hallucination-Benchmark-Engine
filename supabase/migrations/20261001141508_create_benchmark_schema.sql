/*
# Create Probabilistic Hallucination Benchmark Engine schema

This migration creates the complete database schema for the PHBE application,
a research benchmarking tool for testing LLM reasoning stability and drift.

## New Tables

1. **reasoning_tasks** — Library of reasoning tasks used in benchmarks
   - id (uuid PK), category, prompt, expected_answer, difficulty (1-5), tags (text[]), created_at

2. **model_profiles** — Simulated LLM model definitions
   - id (uuid PK), name, description, accuracy_baseline, hallucination_rate,
     drift_tendency, confidence_calibration, latency_ms, color, created_at

3. **noise_profiles** — Noise injection configuration profiles
   - id (uuid PK), name, noise_types (text[]), intensity, injection_frequency,
     target_scope, created_at

4. **benchmark_runs** — Records of benchmark execution sessions
   - id (uuid PK), name, status, noise_profile_id (FK→noise_profiles),
     noise_profile_name, model_ids (text[]), task_ids (text[]), intensity,
     summary (jsonb for aggregated metrics), created_at

5. **task_results** — Individual per-task-per-model results within a run
   - id (uuid PK), run_id (FK→benchmark_runs ON DELETE CASCADE),
     task_id, task_category, model_id, model_name, original_prompt,
     injected_prompt, model_response, expected_answer, confidence_score,
     correctness_score, hallucination_flag, hallucination_severity,
     latency_ms, drift_delta, created_at

## Security

- RLS enabled on all tables.
- Single-tenant app (no sign-in screen): all policies use `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` because all data is intentionally shared/public.
- 4 separate CRUD policies per table (select/insert/update/delete).

## Notes

- Indexes added on run_id (task_results) and noise_profile_id (benchmark_runs) for query performance.
- task_results cascades on delete of its parent run.
- summary column on benchmark_runs stores pre-computed RunSummary as jsonb.
*/

-- reasoning_tasks
CREATE TABLE IF NOT EXISTS reasoning_tasks (
  id text PRIMARY KEY,
  category text NOT NULL,
  prompt text NOT NULL,
  expected_answer text NOT NULL,
  difficulty smallint NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reasoning_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON reasoning_tasks;
CREATE POLICY "anon_select_tasks" ON reasoning_tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON reasoning_tasks;
CREATE POLICY "anon_insert_tasks" ON reasoning_tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON reasoning_tasks;
CREATE POLICY "anon_update_tasks" ON reasoning_tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON reasoning_tasks;
CREATE POLICY "anon_delete_tasks" ON reasoning_tasks FOR DELETE
  TO anon, authenticated USING (true);

-- model_profiles
CREATE TABLE IF NOT EXISTS model_profiles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  accuracy_baseline integer NOT NULL DEFAULT 75 CHECK (accuracy_baseline >= 0 AND accuracy_baseline <= 100),
  hallucination_rate integer NOT NULL DEFAULT 10 CHECK (hallucination_rate >= 0 AND hallucination_rate <= 100),
  drift_tendency integer NOT NULL DEFAULT 30 CHECK (drift_tendency >= 0 AND drift_tendency <= 100),
  confidence_calibration integer NOT NULL DEFAULT 70 CHECK (confidence_calibration >= 0 AND confidence_calibration <= 100),
  latency_ms integer NOT NULL DEFAULT 500,
  color text NOT NULL DEFAULT '#06b6d4',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE model_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_models" ON model_profiles;
CREATE POLICY "anon_select_models" ON model_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_models" ON model_profiles;
CREATE POLICY "anon_insert_models" ON model_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_models" ON model_profiles;
CREATE POLICY "anon_update_models" ON model_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_models" ON model_profiles;
CREATE POLICY "anon_delete_models" ON model_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- noise_profiles
CREATE TABLE IF NOT EXISTS noise_profiles (
  id text PRIMARY KEY,
  name text NOT NULL,
  noise_types text[] NOT NULL DEFAULT '{}',
  intensity integer NOT NULL DEFAULT 50 CHECK (intensity >= 0 AND intensity <= 100),
  injection_frequency integer NOT NULL DEFAULT 30 CHECK (injection_frequency >= 0 AND injection_frequency <= 100),
  target_scope text NOT NULL DEFAULT 'prompts',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE noise_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_noise" ON noise_profiles;
CREATE POLICY "anon_select_noise" ON noise_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_noise" ON noise_profiles;
CREATE POLICY "anon_insert_noise" ON noise_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_noise" ON noise_profiles;
CREATE POLICY "anon_update_noise" ON noise_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_noise" ON noise_profiles;
CREATE POLICY "anon_delete_noise" ON noise_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- benchmark_runs
CREATE TABLE IF NOT EXISTS benchmark_runs (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  noise_profile_id text REFERENCES noise_profiles(id) ON DELETE SET NULL,
  noise_profile_name text NOT NULL DEFAULT '',
  model_ids text[] NOT NULL DEFAULT '{}',
  task_ids text[] NOT NULL DEFAULT '{}',
  intensity integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE benchmark_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_runs" ON benchmark_runs;
CREATE POLICY "anon_select_runs" ON benchmark_runs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_runs" ON benchmark_runs;
CREATE POLICY "anon_insert_runs" ON benchmark_runs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_runs" ON benchmark_runs;
CREATE POLICY "anon_update_runs" ON benchmark_runs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_runs" ON benchmark_runs;
CREATE POLICY "anon_delete_runs" ON benchmark_runs FOR DELETE
  TO anon, authenticated USING (true);

-- task_results
CREATE TABLE IF NOT EXISTS task_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL REFERENCES benchmark_runs(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  task_category text NOT NULL,
  model_id text NOT NULL,
  model_name text NOT NULL,
  original_prompt text NOT NULL,
  injected_prompt text NOT NULL,
  model_response text NOT NULL,
  expected_answer text NOT NULL,
  confidence_score integer NOT NULL DEFAULT 0,
  correctness_score integer NOT NULL DEFAULT 0,
  hallucination_flag boolean NOT NULL DEFAULT false,
  hallucination_severity integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  drift_delta integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_results" ON task_results;
CREATE POLICY "anon_select_results" ON task_results FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_results" ON task_results;
CREATE POLICY "anon_insert_results" ON task_results FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_results" ON task_results;
CREATE POLICY "anon_update_results" ON task_results FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_results" ON task_results;
CREATE POLICY "anon_delete_results" ON task_results FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_results_run_id ON task_results(run_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_noise_profile ON benchmark_runs(noise_profile_id);
CREATE INDEX IF NOT EXISTS idx_task_results_model ON task_results(model_id);
CREATE INDEX IF NOT EXISTS idx_task_results_category ON task_results(task_category);
