/**
 * Export Panel — download data and charts.
 */
import { Download, FileJson, FileText, Image, FileDown } from 'lucide-react';
import { useAppStore } from '@/store';
import { exportJSON, exportCSV, exportPNG, exportPDF } from '@/lib/exports';

export default function ExportPanel() {
  const data = useAppStore(s => s.filteredData);
  const fileName = useAppStore(s => s.fileName);

  const baseName = fileName.replace(/\.[^.]+$/, '') || 'analytics';

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <Download size={48} />
        <p>Upload and analyse a file to enable exports</p>
      </div>
    );
  }

  return (
    <div className="export-page">
      <h2><Download size={20} /> Export</h2>
      <p className="page-subtitle">Download your data or chart snapshots</p>

      <div className="export-grid">
        <button className="export-card glass-card" onClick={() => exportJSON(data, baseName)}>
          <FileJson size={32} className="export-icon text-blue" />
          <span className="export-title">JSON</span>
          <span className="export-desc">Full structured data</span>
        </button>

        <button className="export-card glass-card" onClick={() => exportCSV(data as Record<string, unknown>[], baseName)}>
          <FileText size={32} className="export-icon text-green" />
          <span className="export-title">CSV</span>
          <span className="export-desc">Spreadsheet-compatible</span>
        </button>

        <button className="export-card glass-card" onClick={() => exportPNG('auto-chart-canvas', baseName)}>
          <Image size={32} className="export-icon text-purple" />
          <span className="export-title">PNG</span>
          <span className="export-desc">Chart screenshot</span>
        </button>

        <button className="export-card glass-card" onClick={() => exportPDF('auto-chart-canvas', baseName)}>
          <FileDown size={32} className="export-icon text-red" />
          <span className="export-title">PDF</span>
          <span className="export-desc">Printable chart</span>
        </button>
      </div>

      <div className="glass-card export-info">
        <p>
          <strong>{data.length.toLocaleString()}</strong> rows ×{' '}
          <strong>{data.length > 0 ? Object.keys(data[0]).length : 0}</strong> columns will be exported.
          <br /><br />
          <strong>Note:</strong> PNG/PDF exports on this page capture the currently visible <em>Smart Analytics</em> chart.
          To export your full custom dashboard, please navigate to the <strong>Dashboard</strong> view and use the export buttons there.
        </p>
      </div>
    </div>
  );
}
