/**
 * Calculated Columns — create new columns from expressions.
 * Uses expr-eval for safe expression parsing.
 */
import { useState } from 'react';
import { Calculator, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { Parser } from 'expr-eval';

const parser = new Parser();

export default function CalculatedColumns() {
  const rawData = useAppStore(s => s.rawData);
  const profiles = useAppStore(s => s.columnProfiles);
  const calcs = useAppStore(s => s.calculatedColumns);
  const addCalc = useAppStore(s => s.addCalculatedColumn);
  const removeCalc = useAppStore(s => s.removeCalculatedColumn);
  const setData = useAppStore(s => s.setData);
  const fileName = useAppStore(s => s.fileName);

  const [name, setName] = useState('');
  const [expr, setExpr] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState('');

  const allCols = profiles.map(p => p.name);

  const handlePreview = () => {
    setError('');
    setPreview([]);
    if (!expr.trim()) return;

    try {
      const parsed = parser.parse(expr);
      const results = rawData.slice(0, 5).map(row => {
        const scope: Record<string, number> = {};
        for (const col of allCols) {
          const v = Number(row[col]);
          // Replace spaces/special chars with underscores for the expression
          const safeName = col.replace(/[^a-zA-Z0-9_]/g, '_');
          scope[safeName] = isNaN(v) ? 0 : v;
        }
        try {
          return String(parsed.evaluate(scope));
        } catch {
          return 'ERR';
        }
      });
      setPreview(results);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleApply = () => {
    if (!name.trim() || !expr.trim()) return;
    setError('');

    try {
      const parsed = parser.parse(expr);
      const newData = rawData.map(row => {
        const scope: Record<string, number> = {};
        for (const col of allCols) {
          const v = Number(row[col]);
          const safeName = col.replace(/[^a-zA-Z0-9_]/g, '_');
          scope[safeName] = isNaN(v) ? 0 : v;
        }
        try {
          return { ...row, [name]: parsed.evaluate(scope) };
        } catch {
          return { ...row, [name]: null };
        }
      });

      addCalc({ id: name, name, expression: expr });
      setData(newData, fileName);
      setName('');
      setExpr('');
      setPreview([]);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="empty-state">
        <Calculator size={48} />
        <p>Upload a file to create calculated columns</p>
      </div>
    );
  }

  return (
    <div className="calc-page">
      <h2><Calculator size={20} /> Calculated Columns</h2>
      <p className="page-subtitle">Create new columns using mathematical expressions</p>

      <div className="glass-card calc-form">
        <div className="form-row">
          <div className="form-group">
            <label>Column Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Profit_Margin" />
          </div>
        </div>
        <div className="form-group">
          <label>Expression</label>
          <input value={expr} onChange={e => setExpr(e.target.value)} placeholder="e.g. Revenue - Cost" className="mono" />
          <span className="form-hint">
            Use column names (spaces → underscores). Operators: + - * / ^ % sin cos sqrt abs
          </span>
        </div>

        <div className="available-cols">
          <span className="detail-label">Available columns:</span>
          <div className="col-tags">
            {allCols.map(c => (
              <button key={c} className="col-tag" onClick={() => setExpr(e => e + ' ' + c.replace(/[^a-zA-Z0-9_]/g, '_'))}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={handlePreview}>Preview</button>
          <button className="btn-primary btn-icon" onClick={handleApply} disabled={!name || !expr}>
            <Plus size={16} /> Apply Column
          </button>
        </div>

        {error && <div className="calc-error"><AlertCircle size={14} /> {error}</div>}

        {preview.length > 0 && (
          <div className="calc-preview">
            <span className="detail-label">Preview (first 5 rows):</span>
            <div className="preview-values">
              {preview.map((v, i) => <span key={i} className="preview-val">{v}</span>)}
            </div>
          </div>
        )}
      </div>

      {calcs.length > 0 && (
        <div className="calc-list">
          <h3>Applied Columns</h3>
          {calcs.map(c => (
            <div key={c.id} className="calc-item glass-card">
              <div className="calc-item-info">
                <CheckCircle2 size={14} className="text-success" />
                <strong>{c.name}</strong>
                <code>{c.expression}</code>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => removeCalc(c.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
