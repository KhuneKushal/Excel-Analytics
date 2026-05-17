/**
 * Auto Analytics page — displays pivot-detection results
 * with confidence scores, reasoning, interactive chart switching,
 * and "Add to Dashboard" functionality.
 */
import { useState } from 'react';
import {
  Sparkles, TrendingUp, ChevronRight, BarChart3,
  LineChart as LineIcon, PieChart as PieIcon, ScatterChart as ScatterIcon,
  LayoutDashboard, Check,
} from 'lucide-react';
import { useAppStore } from '@/store';
import ChartDisplay from './ChartDisplay';

const chartIcon = (type: string, size = 16) => {
  switch (type) {
    case 'line': case 'area': return <LineIcon size={size} />;
    case 'pie':  case 'doughnut': return <PieIcon size={size} />;
    case 'scatter': return <ScatterIcon size={size} />;
    default: return <BarChart3 size={size} />;
  }
};

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls = pct >= 85 ? 'conf-high' : pct >= 70 ? 'conf-mid' : 'conf-low';
  return <span className={`confidence-badge ${cls}`}>{pct}%</span>;
}

export default function AutoAnalytics() {
  const pivots = useAppStore(s => s.pivotGroups);
  const data = useAppStore(s => s.filteredData);
  const fileName = useAppStore(s => s.fileName);
  const addPivotToDashboard = useAppStore(s => s.addPivotToDashboard);
  const isChartOnDashboard = useAppStore(s => s.isChartOnDashboard);
  const chartConfigs = useAppStore(s => s.chartConfigs); // subscribe to re-render on change
  const setActiveView = useAppStore(s => s.setActiveView);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  if (pivots.length === 0) {
    return (
      <div className="empty-state">
        <Sparkles size={48} />
        <p>Upload a file to see smart chart recommendations</p>
      </div>
    );
  }

  const selected = pivots.find(p => p.id === selectedId) || pivots[0];
  const alreadyOnDashboard = isChartOnDashboard(selected.id);

  const handleAddToDashboard = () => {
    addPivotToDashboard(selected);
    setJustAdded(selected.id);
    setTimeout(() => setJustAdded(null), 2000);
  };

  // Suppress unused var warning
  void chartConfigs;

  return (
    <div className="auto-analytics-page">
      <div className="aa-header">
        <div>
          <h2><Sparkles size={20} /> Smart Analytics</h2>
          <p className="page-subtitle">{pivots.length} chart recommendations for {fileName}</p>
        </div>
      </div>

      <div className="aa-layout">
        {/* Recommendation list */}
        <div className="aa-sidebar">
          {pivots.map(p => {
            const onDash = isChartOnDashboard(p.id);
            return (
              <button
                key={p.id}
                className={`aa-card ${selected.id === p.id ? 'active' : ''}`}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="aa-card-top">
                  <span className="aa-card-icon">{chartIcon(p.chartType)}</span>
                  <span className="aa-card-title">{p.name}</span>
                  {onDash && <span className="aa-on-dash" title="On dashboard"><Check size={12} /></span>}
                  <ConfidenceBadge value={p.confidence} />
                </div>
                <p className="aa-card-type">{p.chartType} chart · {p.type.replace(/-/g, ' ')}</p>
                <ChevronRight size={14} className="aa-card-arrow" />
              </button>
            );
          })}
        </div>

        {/* Selected chart + insight */}
        <div className="aa-main">
          <div className="aa-insight glass-card">
            <div className="aa-insight-header">
              <TrendingUp size={16} />
              <span>Why this chart?</span>
              <ConfidenceBadge value={selected.confidence} />
            </div>
            <p>{selected.reason}</p>
            {selected.alternativeChartType && (
              <p className="aa-alt">
                💡 Alternative: try a <strong>{selected.alternativeChartType}</strong> chart for a different perspective.
              </p>
            )}
          </div>

          <div className="aa-chart-wrapper glass-card" id="auto-chart-display">
            <div className="aa-chart-title">
              {chartIcon(selected.chartType, 18)}
              <span>{selected.name}</span>
              <span className="chart-type-label">{selected.chartType}</span>
              <div className="aa-chart-actions">
                {alreadyOnDashboard || justAdded === selected.id ? (
                  <button className="btn-on-dash" onClick={() => setActiveView('dashboard')}>
                    <Check size={14} />
                    <span>On Dashboard</span>
                  </button>
                ) : (
                  <button className="btn-add-dash" onClick={handleAddToDashboard}>
                    <LayoutDashboard size={14} />
                    <span>Add to Dashboard</span>
                  </button>
                )}
              </div>
            </div>
            <ChartDisplay
              data={data}
              chartType={selected.chartType}
              dimensions={selected.dimensions}
              measures={selected.measures}
              height={400}
              id="auto-chart-canvas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
