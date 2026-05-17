/**
 * Sidebar navigation
 */
import {
  Upload, Sparkles, LayoutDashboard, BarChart3,
  Filter, Calculator, GitCompareArrows, Download,
  Sun, Moon, RotateCcw, Shield,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { ActiveView } from '@/types';

const NAV: { view: ActiveView; icon: React.ReactNode; label: string }[] = [
  { view: 'upload',              icon: <Upload size={18} />,              label: 'Upload' },
  { view: 'auto-analytics',     icon: <Sparkles size={18} />,            label: 'Smart Analytics' },
  { view: 'dashboard',          icon: <LayoutDashboard size={18} />,     label: 'Dashboard' },
  { view: 'data-summary',       icon: <BarChart3 size={18} />,           label: 'Data Summary' },
  { view: 'filters',            icon: <Filter size={18} />,              label: 'Filters' },
  { view: 'calculated-columns', icon: <Calculator size={18} />,          label: 'Calculated' },
  { view: 'correlation',        icon: <GitCompareArrows size={18} />,    label: 'Correlation' },
  { view: 'export',             icon: <Download size={18} />,            label: 'Export' },
];

export default function Sidebar() {
  const activeView = useAppStore(s => s.activeView);
  const setActiveView = useAppStore(s => s.setActiveView);
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const resetAll = useAppStore(s => s.resetAll);
  const hasData = useAppStore(s => s.rawData.length > 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BarChart3 size={24} className="brand-icon" />
        <span className="brand-text">Excel Analytics</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(n => (
          <button
            key={n.view}
            className={`nav-item ${activeView === n.view ? 'active' : ''} ${
              !hasData && n.view !== 'upload' ? 'disabled' : ''
            }`}
            onClick={() => { if (hasData || n.view === 'upload') setActiveView(n.view); }}
          >
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        {hasData && (
          <button className="nav-item danger" onClick={resetAll} title="Reset all data">
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>
        )}
        <div className="privacy-note">
          <Shield size={12} />
          <span>All data stays in your browser</span>
        </div>
      </div>
    </aside>
  );
}
