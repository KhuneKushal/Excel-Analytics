/**
 * Dashboard Builder — shows charts from Smart Analytics and
 * lets users manually create & manage custom charts.
 */
import { useState } from 'react';
import { Plus, Trash2, LayoutDashboard, Sparkles, Pencil, Check } from 'lucide-react';
import { useAppStore } from '@/store';
import type { ChartConfig, ChartKind } from '@/types';
import ChartDisplay from './ChartDisplay';
import { exportPNG, exportPDF } from '@/lib/exports';

function uid() { return Math.random().toString(36).slice(2, 10); }

function SourceBadge({ source, confidence }: { source?: string; confidence?: number }) {
  if (source === 'smart-analytics') {
    return (
      <span className="source-badge source-smart">
        <Sparkles size={10} />
        Smart · {confidence ? `${Math.round(confidence * 100)}%` : ''}
      </span>
    );
  }
  return (
    <span className="source-badge source-manual">
      <Pencil size={10} />
      Custom
    </span>
  );
}

export default function DashboardBuilder() {
  const data = useAppStore(s => s.filteredData);
  const profiles = useAppStore(s => s.columnProfiles);
  const configs = useAppStore(s => s.chartConfigs);
  const addConfig = useAppStore(s => s.addChartConfig);
  const removeConfig = useAppStore(s => s.removeChartConfig);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChartKind>('bar');
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [showForm, setShowForm] = useState(false);

  const allCols = profiles.map(p => p.name);
  const numCols = profiles.filter(p => p.dataType === 'numeric').map(p => p.name);

  const smartCharts = configs.filter(c => c.source === 'smart-analytics');
  const customCharts = configs.filter(c => c.source !== 'smart-analytics');

  const handleAdd = () => {
    if (type === 'scatter') {
      if (!xCol || !yCol) return;
      // For scatter, both x and y are measures
      addConfig({
        id: uid(),
        title: title || `${xCol} vs ${yCol}`,
        type,
        xAxisColumn: '', // unused for scatter
        yAxisColumn: xCol,
        yAxisColumn2: yCol,
        source: 'manual',
      });
    } else {
      if (!xCol || !yCol) return;
      addConfig({
        id: uid(),
        title: title || `${yCol} by ${xCol}`,
        type,
        xAxisColumn: xCol,
        yAxisColumn: yCol,
        source: 'manual',
      });
    }
    setTitle('');
    setXCol('');
    setYCol('');
    setShowForm(false);
  };

  if (profiles.length === 0) {
    return (
      <div className="empty-state">
        <LayoutDashboard size={48} />
        <p>Upload a file to start building dashboards</p>
      </div>
    );
  }

  const renderChart = (c: ChartConfig) => {
    const measures = c.yAxisColumn2 ? [c.yAxisColumn, c.yAxisColumn2] : [c.yAxisColumn];
    const dims = c.type === 'scatter' && c.yAxisColumn2 ? [] : [c.xAxisColumn];

    return (
      <div key={c.id} className="glass-card db-chart-card">
        <div className="db-chart-header">
          <div className="db-chart-header-left">
            <span className="db-chart-title">{c.title}</span>
            <SourceBadge source={c.source} confidence={c.confidence} />
          </div>
          <button className="btn-ghost btn-sm" onClick={() => removeConfig(c.id)} title="Remove from dashboard">
            <Trash2 size={14} />
          </button>
        </div>
        <ChartDisplay
          data={data}
          chartType={c.type}
          dimensions={dims}
          measures={measures}
          height={280}
        />
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="db-page-header">
        <div>
          <h2><LayoutDashboard size={20} /> Dashboard</h2>
          <p className="page-subtitle">
            {configs.length} chart{configs.length !== 1 ? 's' : ''}
            {smartCharts.length > 0 && ` · ${smartCharts.length} from Smart Analytics`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {configs.length > 0 && (
            <>
              <button className="btn-secondary btn-icon" onClick={() => exportPDF('dashboard-grid', 'dashboard')}>
                Export PDF
              </button>
              <button className="btn-secondary btn-icon" onClick={() => exportPNG('dashboard-grid', 'dashboard')}>
                Export PNG
              </button>
            </>
          )}
          <button
            className={`btn-primary btn-icon ${showForm ? 'btn-active' : ''}`}
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={16} /> Create Chart
          </button>
        </div>
      </div>

      {/* create form (collapsible) */}
      {showForm && (
        <div className="glass-card db-form animate-slideDown">
          <div className="form-row">
            <div className="form-group">
              <label>Title (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Chart" />
            </div>
            <div className="form-group">
              <label>Chart Type</label>
              <select value={type} onChange={e => setType(e.target.value as ChartKind)}>
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
                <option value="scatter">Scatter</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            {type === 'scatter' ? (
              <>
                <div className="form-group">
                  <label>X Axis (Numeric)</label>
                  <select value={xCol} onChange={e => setXCol(e.target.value)}>
                    <option value="">Select column…</option>
                    {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Y Axis (Numeric)</label>
                  <select value={yCol} onChange={e => setYCol(e.target.value)}>
                    <option value="">Select column…</option>
                    {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>X Axis / Category</label>
                  <select value={xCol} onChange={e => setXCol(e.target.value)}>
                    <option value="">Select column…</option>
                    {allCols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Y Axis / Measure</label>
                  <select value={yCol} onChange={e => setYCol(e.target.value)}>
                    <option value="">Select column…</option>
                    {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}
            <button className="btn-primary btn-icon" onClick={handleAdd} disabled={!xCol || !yCol}>
              <Check size={16} /> Add
            </button>
          </div>
        </div>
      )}

      {/* chart grid */}
      {configs.length === 0 ? (
        <div className="empty-state small">
          <LayoutDashboard size={36} />
          <p>No charts yet — add from Smart Analytics or create your own above</p>
        </div>
      ) : (
        <div className="db-grid" id="dashboard-grid">
          {configs.map(renderChart)}
        </div>
      )}
    </div>
  );
}
