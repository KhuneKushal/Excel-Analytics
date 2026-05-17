import { useMemo, useState } from 'react';
import { BarChart3, Hash, Calendar, Type, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '@/store';

const typeIcon = (t: string) => {
  switch (t) {
    case 'numeric':     return <Hash size={14} />;
    case 'date':        return <Calendar size={14} />;
    case 'categorical': return <Type size={14} />;
    default:            return <BarChart3 size={14} />;
  }
};

const typeColor = (t: string) => {
  switch (t) {
    case 'numeric':     return 'badge-blue';
    case 'date':        return 'badge-purple';
    case 'categorical': return 'badge-amber';
    case 'boolean':     return 'badge-green';
    default:            return 'badge-gray';
  }
};

export default function DataSummary() {
  const profiles = useAppStore(s => s.columnProfiles);
  const data = useAppStore(s => s.rawData);
  const fileName = useAppStore(s => s.fileName);
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(() => ({
    rows: data.length,
    cols: profiles.length,
    numeric: profiles.filter(p => p.dataType === 'numeric').length,
    categorical: profiles.filter(p => p.dataType === 'categorical').length,
    dates: profiles.filter(p => p.dataType === 'date').length,
    totalNulls: profiles.reduce((s, p) => s + p.nullCount, 0),
  }), [data, profiles]);

  if (profiles.length === 0) {
    return (
      <div className="empty-state">
        <BarChart3 size={48} />
        <p>Upload a file to see data summary</p>
      </div>
    );
  }

  return (
    <div className="data-summary-page">
      <h2>Data Summary</h2>
      <p className="page-subtitle">{fileName} — {stats.rows.toLocaleString()} rows × {stats.cols} columns</p>

      {/* overview cards */}
      <div className="stat-cards">
        <div className="stat-card"><span className="stat-value">{stats.rows.toLocaleString()}</span><span className="stat-label">Rows</span></div>
        <div className="stat-card"><span className="stat-value">{stats.cols}</span><span className="stat-label">Columns</span></div>
        <div className="stat-card accent"><span className="stat-value">{stats.numeric}</span><span className="stat-label">Numeric</span></div>
        <div className="stat-card"><span className="stat-value">{stats.categorical}</span><span className="stat-label">Categorical</span></div>
        <div className="stat-card"><span className="stat-value">{stats.dates}</span><span className="stat-label">Dates</span></div>
        <div className="stat-card warn"><span className="stat-value">{stats.totalNulls}</span><span className="stat-label">Missing</span></div>
      </div>

      {/* column profiles */}
      <div className="profile-list">
        {profiles.map(p => {
          const isOpen = expanded === p.name;
          return (
            <div key={p.name} className={`profile-card ${isOpen ? 'open' : ''}`}>
              <button className="profile-header" onClick={() => setExpanded(isOpen ? null : p.name)}>
                <div className="profile-name">
                  {typeIcon(p.dataType)}
                  <span>{p.name}</span>
                  <span className={`badge ${typeColor(p.dataType)}`}>{p.dataType}</span>
                </div>
                <div className="profile-quick">
                  <span>{p.uniqueValues} unique</span>
                  {p.nullCount > 0 && (
                    <span className="null-indicator">
                      <AlertTriangle size={12} /> {p.nullPercentage.toFixed(1)}% null
                    </span>
                  )}
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              {isOpen && (
                <div className="profile-details">
                  {p.isNumeric && (
                    <div className="detail-grid">
                      <div><span className="detail-label">Min</span><span className="detail-value">{p.min?.toLocaleString()}</span></div>
                      <div><span className="detail-label">Max</span><span className="detail-value">{p.max?.toLocaleString()}</span></div>
                      <div><span className="detail-label">Mean</span><span className="detail-value">{p.mean?.toFixed(2)}</span></div>
                      <div><span className="detail-label">Median</span><span className="detail-value">{p.median?.toFixed(2)}</span></div>
                      <div><span className="detail-label">Mode</span><span className="detail-value">{p.mode?.toFixed(2) ?? 'N/A'}</span></div>
                      <div><span className="detail-label">Std Dev</span><span className="detail-value">{p.stdDev?.toFixed(2)}</span></div>
                    </div>
                  )}
                  <div className="top-values">
                    <span className="detail-label">Top Values</span>
                    <div className="top-values-list">
                      {p.topValues.map((tv, i) => (
                        <div key={i} className="top-value-row">
                          <span>{tv.value}</span>
                          <div className="top-value-bar">
                            <div style={{ width: `${(tv.count / p.totalCount) * 100}%` }} />
                          </div>
                          <span className="top-value-count">{tv.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sample-values">
                    <span className="detail-label">Sample</span>
                    <span>{p.sampleValues.map(String).join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
