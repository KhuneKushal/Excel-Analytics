import { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Clock } from 'lucide-react';
import { useAppStore } from '@/store';

export default function FileUpload() {
  const setData = useAppStore(s => s.setData);
  const recentFiles = useAppStore(s => s.recentFiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback(async (file: File) => {
    setError('');
    try {
      let data: Record<string, unknown>[] = [];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(ws);
      } else if (ext === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = result.data as Record<string, unknown>[];
      } else {
        setError('Unsupported file type. Please upload .csv, .xlsx, or .xls');
        return;
      }

      if (data.length === 0) {
        setError('The file appears to be empty.');
        return;
      }

      setData(data, file.name);
    } catch (e) {
      setError('Failed to read file: ' + (e as Error).message);
    }
  }, [setData]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="upload-page">
      <div className="upload-hero">
        <div className="hero-icon"><FileSpreadsheet size={48} /></div>
        <h1>Excel Analytics</h1>
        <p className="hero-subtitle">
          Upload your Excel or CSV file to get instant, intelligent chart recommendations.
          <br />
          <span className="privacy-badge">🔒 100% private — your data never leaves this browser</span>
        </p>
      </div>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="upload-icon" size={36} />
        <p className="upload-label">Drop your file here, or click to browse</p>
        <p className="upload-hint">.csv, .xlsx, .xls — up to 100 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          hidden
        />
      </div>

      {error && <div className="upload-error">{error}</div>}

      {recentFiles.length > 0 && (
        <div className="recent-files">
          <h3><Clock size={16} /> Recent Files</h3>
          <div className="recent-list">
            {recentFiles.slice(0, 5).map((f, i) => (
              <div key={i} className="recent-item">
                <FileSpreadsheet size={14} />
                <span className="recent-name">{f.fileName}</span>
                <span className="recent-meta">{f.rowCount} rows · {f.columnCount} cols</span>
                <span className="recent-time">{new Date(f.uploadTimestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
