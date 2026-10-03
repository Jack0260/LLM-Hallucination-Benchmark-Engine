import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { NOISE_TYPE_LABELS, TASK_CATEGORY_LABELS } from '@/data/seed';
import { injectNoise } from '@/lib/benchmark';
import type { NoiseType, NoiseProfile } from '@/types';
import { Plus, Trash2, Eye, Save, X, Radio, Settings2, FileDown } from 'lucide-react';

export function NoiseInjection() {
  const { noiseProfiles, addNoiseProfile, deleteNoiseProfile, tasks } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<NoiseProfile | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? '');

  const [form, setForm] = useState({
    name: '',
    noiseTypes: [] as NoiseType[],
    intensity: 50,
    injectionFrequency: 30,
    targetScope: 'prompts' as 'all' | 'prompts' | 'answers',
  });

  const previewTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId), [tasks, selectedTaskId]);

  const previewResults = useMemo(() => {
    if (!previewTask || !previewProfile) return null;
    const injected = injectNoise(previewTask.prompt, previewProfile, 12345);
    return { original: previewTask.prompt, injected };
  }, [previewTask, previewProfile]);

  const toggleNoiseType = (type: NoiseType) => {
    setForm((prev) => ({
      ...prev,
      noiseTypes: prev.noiseTypes.includes(type)
        ? prev.noiseTypes.filter((t) => t !== type)
        : [...prev.noiseTypes, type],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (form.noiseTypes.length === 0) return;
    addNoiseProfile({
      name: form.name.trim(),
      noiseTypes: form.noiseTypes,
      intensity: form.intensity,
      injectionFrequency: form.injectionFrequency,
      targetScope: form.targetScope,
    }).then(() => {
      setForm({ name: '', noiseTypes: [], intensity: 50, injectionFrequency: 30, targetScope: 'prompts' });
      setShowForm(false);
    });
  };

  const exportProfile = (profile: NoiseProfile) => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, '_')}_noise_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const noiseTypeOptions: NoiseType[] = ['typographical', 'semantic', 'structural', 'adversarial'];
  const scopeOptions: { value: 'all' | 'prompts' | 'answers'; label: string }[] = [
    { value: 'prompts', label: 'Prompts Only' },
    { value: 'answers', label: 'Answers Only' },
    { value: 'all', label: 'All Content' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Noise Injection Tool
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configure perturbation profiles to inject synthetic noise into reasoning tasks.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Profile'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Settings2 className="w-4 h-4" style={{ color: '#06b6d4' }} />
            Create Noise Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Profile Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Heavy Adversarial Stress"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Target Scope</label>
              <select
                value={form.targetScope}
                onChange={(e) => setForm({ ...form, targetScope: e.target.value as 'all' | 'prompts' | 'answers' })}
                className="input-field"
              >
                {scopeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                Intensity: {form.intensity}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.intensity}
                onChange={(e) => setForm({ ...form, intensity: Number(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                Injection Frequency: {form.injectionFrequency}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.injectionFrequency}
                onChange={(e) => setForm({ ...form, injectionFrequency: Number(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Noise Types</label>
            <div className="flex flex-wrap gap-2">
              {noiseTypeOptions.map((type) => {
                const active = form.noiseTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleNoiseType(type)}
                    className="badge transition-all duration-200"
                    style={{
                      backgroundColor: active ? '#06b6d4' : 'var(--bg-tertiary)',
                      color: active ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${active ? '#06b6d4' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {NOISE_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || form.noiseTypes.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Profile List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {noiseProfiles.map((profile) => (
          <div key={profile.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
                  <Radio className="w-4 h-4" style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.name}</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Intensity</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${profile.intensity}%`, backgroundColor: profile.intensity > 70 ? '#ef4444' : profile.intensity > 40 ? '#f59e0b' : '#22c55e' }} />
                  </div>
                  <span className="metric-value" style={{ color: 'var(--text-primary)' }}>{profile.intensity}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Frequency</span>
                <span className="metric-value" style={{ color: 'var(--text-primary)' }}>{profile.injectionFrequency}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Scope</span>
                <span style={{ color: 'var(--text-primary)' }}>{profile.targetScope}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {profile.noiseTypes.map((type) => (
                <span key={type} className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {NOISE_TYPE_LABELS[type]}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewProfile(previewProfile?.id === profile.id ? null : profile)}
                className="btn-secondary flex items-center gap-1.5 flex-1 justify-center text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                {previewProfile?.id === profile.id ? 'Hide' : 'Preview'}
              </button>
              <button
                onClick={() => exportProfile(profile)}
                className="btn-secondary flex items-center gap-1.5 text-xs px-2"
                title="Export"
              >
                <FileDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteNoiseProfile(profile.id)}
                className="btn-danger flex items-center gap-1.5 text-xs px-2"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {noiseProfiles.length === 0 && !showForm && (
        <div className="card p-12 text-center">
          <Radio className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No noise profiles yet. Create one to start injecting perturbations.
          </p>
        </div>
      )}

      {/* Preview Panel */}
      {previewProfile && previewResults && (
        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Eye className="w-4 h-4" style={{ color: '#06b6d4' }} />
            Noise Preview: {previewProfile.name}
          </h3>
          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Select Task</label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="input-field"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{TASK_CATEGORY_LABELS[t.category]}] {t.prompt.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Original Prompt</p>
              <div className="p-4 rounded-lg text-sm font-mono" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                {previewResults.original}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#f59e0b' }}>Injected Prompt</p>
              <div className="p-4 rounded-lg text-sm font-mono" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', color: 'var(--text-primary)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                {previewResults.injected}
              </div>
            </div>
          </div>
          {previewTask && (
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold">Expected Answer:</span> {previewTask.expectedAnswer}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold">Category:</span> {TASK_CATEGORY_LABELS[previewTask.category]} ·
                <span className="font-semibold"> Difficulty:</span> {previewTask.difficulty}/5
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
