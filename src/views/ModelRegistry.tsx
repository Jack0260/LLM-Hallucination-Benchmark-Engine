import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { ModelProfile } from '@/types';
import { Plus, Trash2, Edit3, X, Save, Boxes, Cpu } from 'lucide-react';

const MODEL_COLORS = ['#2dd4bf', '#38bdf8', '#f59e0b', '#a78bfa', '#f87171', '#4ade80', '#fb923c', '#e879f9'];

export function ModelRegistry() {
  const { models, addModel, updateModel, deleteModel } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    accuracyBaseline: 75,
    hallucinationRate: 10,
    driftTendency: 30,
    confidenceCalibration: 70,
    latencyMs: 500,
    color: MODEL_COLORS[0],
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      accuracyBaseline: 75,
      hallucinationRate: 10,
      driftTendency: 30,
      confidenceCalibration: 70,
      latencyMs: 500,
      color: MODEL_COLORS[models.length % MODEL_COLORS.length],
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateModel(editingId, form).then(() => {
        resetForm();
        setShowForm(false);
      });
    } else {
      addModel(form).then(() => {
        resetForm();
        setShowForm(false);
      });
    }
  };

  const handleEdit = (model: ModelProfile) => {
    setEditingId(model.id);
    setForm({
      name: model.name,
      description: model.description,
      accuracyBaseline: model.accuracyBaseline,
      hallucinationRate: model.hallucinationRate,
      driftTendency: model.driftTendency,
      confidenceCalibration: model.confidenceCalibration,
      latencyMs: model.latencyMs,
      color: model.color,
    });
    setShowForm(true);
  };

  const sliders: { key: keyof typeof form; label: string; min: number; max: number; unit: string; color: string }[] = [
    { key: 'accuracyBaseline', label: 'Accuracy Baseline', min: 0, max: 100, unit: '%', color: '#22c55e' },
    { key: 'hallucinationRate', label: 'Hallucination Rate', min: 0, max: 100, unit: '%', color: '#ef4444' },
    { key: 'driftTendency', label: 'Drift Tendency', min: 0, max: 100, unit: '%', color: '#f59e0b' },
    { key: 'confidenceCalibration', label: 'Confidence Calibration', min: 0, max: 100, unit: '%', color: '#06b6d4' },
    { key: 'latencyMs', label: 'Latency', min: 50, max: 2000, unit: 'ms', color: '#a78bfa' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Model Registry
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Define and configure LLM profiles for benchmark evaluation.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Model'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Cpu className="w-4 h-4" style={{ color: '#06b6d4' }} />
            {editingId ? 'Edit Model' : 'Register New Model'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Model Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Aether-7B"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Color</label>
              <div className="flex flex-wrap gap-2">
                {MODEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    className="w-8 h-8 rounded-lg transition-transform"
                    style={{
                      backgroundColor: color,
                      transform: form.color === color ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: form.color === color ? `0 0 0 2px var(--card-bg), 0 0 0 4px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the model"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {sliders.map(({ key, label, min, max, unit, color }) => (
              <div key={key}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  {label}: <span className="metric-value font-semibold" style={{ color }}>{form[key] as number}{unit}</span>
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={form[key] as number}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: color }}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Register'} Model
            </button>
          </div>
        </div>
      )}

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <div key={model.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${model.color}1a` }}>
                  <Boxes className="w-5 h-5" style={{ color: model.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{model.name}</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(model.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(model)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-muted)' }} title="Edit">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteModel(model.id)} className="p-1.5 rounded-md transition-colors text-red-500" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>{model.description}</p>

            <div className="space-y-2.5">
              {[
                { label: 'Accuracy', value: model.accuracyBaseline, color: '#22c55e', max: 100 },
                { label: 'Hallucination', value: model.hallucinationRate, color: '#ef4444', max: 100 },
                { label: 'Drift Tendency', value: model.driftTendency, color: '#f59e0b', max: 100 },
                { label: 'Calibration', value: model.confidenceCalibration, color: '#06b6d4', max: 100 },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>{metric.label}</span>
                    <span className="metric-value" style={{ color: 'var(--text-primary)' }}>{metric.value}{metric.max === 100 ? '%' : ''}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(metric.value / metric.max) * 100}%`, backgroundColor: metric.color }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs pt-1">
                <span style={{ color: 'var(--text-muted)' }}>Latency</span>
                <span className="metric-value" style={{ color: 'var(--text-primary)' }}>{model.latencyMs}ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {models.length === 0 && !showForm && (
        <div className="card p-12 text-center">
          <Boxes className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No models registered. Add a model to start benchmarking.
          </p>
        </div>
      )}
    </div>
  );
}
