/**
 * Correlation Matrix — heatmap-style grid of Pearson correlations.
 */
import { useMemo } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { useAppStore } from '@/store';

function corrColor(v: number): string {
  if (v >= 0.7)  return 'rgba(34,197,94,.8)';
  if (v >= 0.4)  return 'rgba(34,197,94,.45)';
  if (v >= 0.1)  return 'rgba(34,197,94,.2)';
  if (v > -0.1)  return 'rgba(255,255,255,.05)';
  if (v > -0.4)  return 'rgba(239,68,68,.2)';
  if (v > -0.7)  return 'rgba(239,68,68,.45)';
  return 'rgba(239,68,68,.8)';
}

export default function CorrelationMatrix() {
  const correlations = useAppStore(s => s.correlations);
  const profiles = useAppStore(s => s.columnProfiles);

  const numCols = useMemo(
    () => profiles.filter(p => p.dataType === 'numeric').map(p => p.name),
    [profiles],
  );

  const matrix = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const c of correlations) {
      if (!map[c.columnA]) map[c.columnA] = {};
      map[c.columnA][c.columnB] = c.value;
    }
    return map;
  }, [correlations]);

  if (numCols.length < 2) {
    return (
      <div className="empty-state">
        <GitCompareArrows size={48} />
        <p>Need at least 2 numeric columns for correlation analysis</p>
      </div>
    );
  }

  return (
    <div className="correlation-page">
      <h2><GitCompareArrows size={20} /> Correlation Matrix</h2>
      <p className="page-subtitle">Pearson correlation between numeric columns</p>

      <div className="corr-legend">
        <span className="corr-leg-item"><span style={{ background: 'rgba(34,197,94,.8)' }} /> Strong +</span>
        <span className="corr-leg-item"><span style={{ background: 'rgba(34,197,94,.3)' }} /> Moderate +</span>
        <span className="corr-leg-item"><span style={{ background: 'rgba(255,255,255,.05)' }} /> Weak</span>
        <span className="corr-leg-item"><span style={{ background: 'rgba(239,68,68,.3)' }} /> Moderate −</span>
        <span className="corr-leg-item"><span style={{ background: 'rgba(239,68,68,.8)' }} /> Strong −</span>
      </div>

      <div className="glass-card corr-table-wrapper">
        <div className="table-wrapper">
          <table className="corr-table">
            <thead>
              <tr>
                <th></th>
                {numCols.map(c => <th key={c} className="corr-col-header">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {numCols.map(row => (
                <tr key={row}>
                  <td className="corr-row-header">{row}</td>
                  {numCols.map(col => {
                    const v = matrix[row]?.[col] ?? 0;
                    return (
                      <td key={col} className="corr-cell" style={{ background: corrColor(v) }}>
                        {v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
