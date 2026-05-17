import { useAppStore } from './store';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import AutoAnalytics from './components/AutoAnalytics';
import DashboardBuilder from './components/DashboardBuilder';
import DataSummary from './components/DataSummary';
import FilterBuilder from './components/FilterBuilder';
import CalculatedColumns from './components/CalculatedColumns';
import CorrelationMatrix from './components/CorrelationMatrix';
import ExportPanel from './components/ExportPanel';

function MainContent() {
  const view = useAppStore(s => s.activeView);
  const isAnalysing = useAppStore(s => s.isAnalysing);

  if (isAnalysing) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Analysing your data…</p>
      </div>
    );
  }

  switch (view) {
    case 'upload':              return <FileUpload />;
    case 'auto-analytics':     return <AutoAnalytics />;
    case 'dashboard':          return <DashboardBuilder />;
    case 'data-summary':       return <DataSummary />;
    case 'filters':            return <FilterBuilder />;
    case 'calculated-columns': return <CalculatedColumns />;
    case 'correlation':        return <CorrelationMatrix />;
    case 'export':             return <ExportPanel />;
    default:                   return <FileUpload />;
  }
}

export default function App() {
  const theme = useAppStore(s => s.theme);

  return (
    <div className={`app-shell ${theme}`}>
      <Sidebar />
      <main className="main-area">
        <MainContent />
      </main>
    </div>
  );
}
