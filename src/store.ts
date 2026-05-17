/**
 * Global application store — powered by Zustand.
 * Replaces Angular's DashboardService + DashboardActionsService.
 * Persists chart configs, filters, and recent files to localStorage.
 */
import { create } from 'zustand';
import type {
  ActiveView, ChartConfig, Filter, CalculatedColumn,
  ColumnProfile, PivotGroup, UploadedFileMetadata,
} from '@/types';
import type { CorrelationEntry } from '@/lib/correlations';
import { profileAllColumns } from '@/lib/analysis';
import { detectPivotGroups } from '@/lib/pivotDetection';
import { correlationMatrix } from '@/lib/correlations';

interface AppState {
  /* ── data ─────────────────────────────────────────── */
  rawData: Record<string, unknown>[];
  filteredData: Record<string, unknown>[];
  fileName: string;

  /* ── analysis results ────────────────────────────── */
  columnProfiles: ColumnProfile[];
  pivotGroups: PivotGroup[];
  correlations: CorrelationEntry[];

  /* ── user-created dashboards ─────────────────────── */
  chartConfigs: ChartConfig[];

  /* ── filters ─────────────────────────────────────── */
  filters: Filter[];

  /* ── calculated columns ──────────────────────────── */
  calculatedColumns: CalculatedColumn[];

  /* ── metadata ────────────────────────────────────── */
  recentFiles: UploadedFileMetadata[];

  /* ── UI ──────────────────────────────────────────── */
  activeView: ActiveView;
  theme: 'dark' | 'light';
  isAnalysing: boolean;

  /* ── actions ─────────────────────────────────────── */
  setData: (rows: Record<string, unknown>[], fileName: string) => void;
  runAnalysis: () => void;
  applyFilters: () => void;

  addChartConfig: (c: ChartConfig) => void;
  removeChartConfig: (id: string) => void;
  updateChartConfig: (id: string, c: Partial<ChartConfig>) => void;
  addPivotToDashboard: (pivot: PivotGroup) => void;
  isChartOnDashboard: (pivotId: string) => boolean;

  addFilter: (f: Filter) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;

  addCalculatedColumn: (c: CalculatedColumn) => void;
  removeCalculatedColumn: (id: string) => void;

  setActiveView: (v: ActiveView) => void;
  toggleTheme: () => void;
  resetAll: () => void;
}

/* ─── localStorage helpers ──────────────────────────── */

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJSON(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

/* ─── filter engine ─────────────────────────────────── */

function runFilters(data: Record<string, unknown>[], filters: Filter[]): Record<string, unknown>[] {
  if (filters.length === 0) return data;
  return data.filter(row =>
    filters.every(f => {
      const v = row[f.column];
      const s = String(v ?? '');
      switch (f.operator) {
        case '==':         return v == f.value; // eslint-disable-line eqeqeq
        case '!=':         return v != f.value; // eslint-disable-line eqeqeq
        case '>':          return Number(v) > Number(f.value);
        case '<':          return Number(v) < Number(f.value);
        case '>=':         return Number(v) >= Number(f.value);
        case '<=':         return Number(v) <= Number(f.value);
        case 'contains':   return s.toLowerCase().includes(String(f.value).toLowerCase());
        case 'startsWith': return s.toLowerCase().startsWith(String(f.value).toLowerCase());
        case 'endsWith':   return s.toLowerCase().endsWith(String(f.value).toLowerCase());
        case 'between':    return Number(v) >= Number(f.value) && Number(v) <= Number(f.value2);
        case 'isEmpty':    return v === null || v === undefined || s.trim() === '';
        case 'isNotEmpty': return v !== null && v !== undefined && s.trim() !== '';
        default:           return true;
      }
    }),
  );
}

/* ─── store ─────────────────────────────────────────── */

export const useAppStore = create<AppState>((set, get) => ({
  rawData: [],
  filteredData: [],
  fileName: '',

  columnProfiles: [],
  pivotGroups: [],
  correlations: [],

  chartConfigs: loadJSON('ea_chartConfigs', []),
  filters: loadJSON('ea_filters', []),
  calculatedColumns: loadJSON('ea_calcCols', []),
  recentFiles: loadJSON('ea_recentFiles', []),

  activeView: 'upload',
  theme: (loadJSON<string>('ea_theme', 'dark') as 'dark' | 'light'),
  isAnalysing: false,

  /* ── set data + auto-analyse ─────────────────────── */
  setData: (rows, fileName) => {
    const meta: UploadedFileMetadata = {
      fileName,
      fileExtension: fileName.split('.').pop() ?? '',
      uploadTimestamp: Date.now(),
      rowCount: rows.length,
      columnCount: rows.length > 0 ? Object.keys(rows[0]).length : 0,
    };
    const recent = [meta, ...get().recentFiles].slice(0, 10);
    saveJSON('ea_recentFiles', recent);

    set({ rawData: rows, fileName, recentFiles: recent, isAnalysing: true });

    // run analysis async to keep the UI responsive
    requestAnimationFrame(() => {
      get().runAnalysis();
      get().applyFilters();
      set({ isAnalysing: false, activeView: 'auto-analytics' });
    });
  },

  runAnalysis: () => {
    const { rawData } = get();
    if (rawData.length === 0) return;

    const profiles = profileAllColumns(rawData);
    const pivots = detectPivotGroups(rawData, profiles);
    const numCols = profiles.filter(p => p.dataType === 'numeric').map(p => p.name);
    const corrs = numCols.length >= 2 ? correlationMatrix(rawData, numCols) : [];

    set({ columnProfiles: profiles, pivotGroups: pivots, correlations: corrs });
  },

  applyFilters: () => {
    const { rawData, filters } = get();
    set({ filteredData: runFilters(rawData, filters) });
  },

  /* ── chart configs ───────────────────────────────── */
  addChartConfig: c => {
    const configs = [...get().chartConfigs, c];
    set({ chartConfigs: configs });
    saveJSON('ea_chartConfigs', configs);
  },
  removeChartConfig: id => {
    const configs = get().chartConfigs.filter(c => c.id !== id);
    set({ chartConfigs: configs });
    saveJSON('ea_chartConfigs', configs);
  },
  updateChartConfig: (id, partial) => {
    const configs = get().chartConfigs.map(c => c.id === id ? { ...c, ...partial } : c);
    set({ chartConfigs: configs });
    saveJSON('ea_chartConfigs', configs);
  },

  addPivotToDashboard: (pivot) => {
    const dashId = `pivot_${pivot.id}`;
    // prevent duplicate
    if (get().chartConfigs.some(c => c.id === dashId)) return;
    const config: ChartConfig = {
      id: dashId,
      title: pivot.name,
      type: pivot.chartType,
      xAxisColumn: pivot.dimensions[0] ?? pivot.measures[0] ?? '',
      yAxisColumn: pivot.measures[0] ?? '',
      yAxisColumn2: pivot.measures[1],
      source: 'smart-analytics',
      confidence: pivot.confidence,
    };
    const configs = [...get().chartConfigs, config];
    set({ chartConfigs: configs });
    saveJSON('ea_chartConfigs', configs);
  },

  isChartOnDashboard: (pivotId) => {
    return get().chartConfigs.some(c => c.id === `pivot_${pivotId}`);
  },

  /* ── filters ─────────────────────────────────────── */
  addFilter: f => {
    const filters = [...get().filters.filter(x => x.id !== f.id), f];
    set({ filters });
    saveJSON('ea_filters', filters);
    get().applyFilters();
  },
  removeFilter: id => {
    const filters = get().filters.filter(f => f.id !== id);
    set({ filters });
    saveJSON('ea_filters', filters);
    get().applyFilters();
  },
  clearFilters: () => {
    set({ filters: [] });
    saveJSON('ea_filters', []);
    get().applyFilters();
  },

  /* ── calculated columns ──────────────────────────── */
  addCalculatedColumn: c => {
    const cols = [...get().calculatedColumns.filter(x => x.id !== c.id), c];
    set({ calculatedColumns: cols });
    saveJSON('ea_calcCols', cols);
  },
  removeCalculatedColumn: id => {
    const cols = get().calculatedColumns.filter(c => c.id !== id);
    set({ calculatedColumns: cols });
    saveJSON('ea_calcCols', cols);
  },

  /* ── UI ──────────────────────────────────────────── */
  setActiveView: v => set({ activeView: v }),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    saveJSON('ea_theme', next);
  },

  resetAll: () => {
    set({
      rawData: [], filteredData: [], fileName: '',
      columnProfiles: [], pivotGroups: [], correlations: [],
      chartConfigs: [], filters: [], calculatedColumns: [],
      activeView: 'upload', isAnalysing: false,
    });
    localStorage.removeItem('ea_chartConfigs');
    localStorage.removeItem('ea_filters');
    localStorage.removeItem('ea_calcCols');
  },
}));
