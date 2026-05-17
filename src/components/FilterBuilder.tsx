/**
 * Filter Builder — create, edit, remove data filters.
 */
import { useState } from 'react';
import { Filter as FilterIcon, Plus, X, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Filter, FilterOperator } from '@/types';

function uid() { return Math.random().toString(36).slice(2, 10); }

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: '==', label: 'Equals' },
  { value: '!=', label: 'Not equals' },
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: '≥' },
  { value: '<=', label: '≤' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'between', label: 'Between' },
  { value: 'isEmpty', label: 'Is empty' },
  { value: 'isNotEmpty', label: 'Is not empty' },
];

export default function FilterBuilder() {
  const profiles = useAppStore(s => s.columnProfiles);
  const filters = useAppStore(s => s.filters);
  const data = useAppStore(s => s.rawData);
  const filteredData = useAppStore(s => s.filteredData);
  const addFilter = useAppStore(s => s.addFilter);
  const removeFilter = useAppStore(s => s.removeFilter);
  const clearFilters = useAppStore(s => s.clearFilters);

  const [col, setCol] = useState('');
  const [op, setOp] = useState<FilterOperator>('==');
  const [val, setVal] = useState('');
  const [val2, setVal2] = useState('');

  const handleAdd = () => {
    if (!col) return;
    const f: Filter = { id: uid(), column: col, operator: op, value: val, value2: val2 || undefined };
    addFilter(f);
    setVal('');
    setVal2('');
  };

  if (profiles.length === 0) {
    return (
      <div className="empty-state">
        <FilterIcon size={48} />
        <p>Upload a file to start filtering data</p>
      </div>
    );
  }

  const needsValue = !['isEmpty', 'isNotEmpty'].includes(op);

  return (
    <div className="filter-page">
      <div className="filter-header">
        <div>
          <h2><FilterIcon size={20} /> Filter Builder</h2>
          <p className="page-subtitle">
            Showing {filteredData.length.toLocaleString()} of {data.length.toLocaleString()} rows
            {filters.length > 0 && ` · ${filters.length} active filter${filters.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {filters.length > 0 && (
          <button className="btn-ghost" onClick={clearFilters}><Trash2 size={14} /> Clear all</button>
        )}
      </div>

      {/* add filter */}
      <div className="glass-card filter-form">
        <div className="form-row">
          <div className="form-group">
            <label>Column</label>
            <select value={col} onChange={e => setCol(e.target.value)}>
              <option value="">Select…</option>
              {profiles.map(p => <option key={p.name} value={p.name}>{p.name} ({p.dataType})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Operator</label>
            <select value={op} onChange={e => setOp(e.target.value as FilterOperator)}>
              {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {needsValue && (
            <div className="form-group">
              <label>Value</label>
              <input value={val} onChange={e => setVal(e.target.value)} placeholder="Value…" />
            </div>
          )}
          {op === 'between' && (
            <div className="form-group">
              <label>Value 2</label>
              <input value={val2} onChange={e => setVal2(e.target.value)} placeholder="Max…" />
            </div>
          )}
          <button className="btn-primary btn-icon" onClick={handleAdd} disabled={!col}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* active filters */}
      {filters.length > 0 && (
        <div className="active-filters">
          {filters.map(f => (
            <div key={f.id} className="filter-tag">
              <span className="filter-tag-col">{f.column}</span>
              <span className="filter-tag-op">{f.operator}</span>
              {f.value !== undefined && f.operator !== 'isEmpty' && f.operator !== 'isNotEmpty' && (
                <span className="filter-tag-val">{String(f.value)}</span>
              )}
              {f.value2 !== undefined && <span className="filter-tag-val">– {String(f.value2)}</span>}
              <button onClick={() => removeFilter(f.id)}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {/* filtered data preview */}
      {filteredData.length > 0 && (
        <div className="glass-card data-preview">
          <h3>Preview (first 10 rows)</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{Object.keys(filteredData[0]).map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j}>{String(v ?? '').slice(0, 30)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
