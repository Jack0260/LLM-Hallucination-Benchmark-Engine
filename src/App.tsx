import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { NoiseInjection } from '@/views/NoiseInjection';
import { ModelRegistry } from '@/views/ModelRegistry';
import { BenchmarkMatrix } from '@/views/BenchmarkMatrix';
import { DriftAnalysis } from '@/views/DriftAnalysis';
import { Reports } from '@/views/Reports';
import { RunHistory } from '@/views/RunHistory';
import type { ViewKey } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';

function AppContent() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const { loading, error } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: '#06b6d4' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading benchmark data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar currentView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto h-screen p-6 lg:p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {view === 'dashboard' && <Dashboard onNavigate={setView} />}
        {view === 'noise-injection' && <NoiseInjection />}
        {view === 'model-registry' && <ModelRegistry />}
        {view === 'benchmark-matrix' && <BenchmarkMatrix />}
        {view === 'drift-analysis' && <DriftAnalysis />}
        {view === 'reports' && <Reports />}
        {view === 'run-history' && <RunHistory />}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
