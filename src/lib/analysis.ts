/**
 * Core data analysis library — column profiling, type detection, statistics.
 * Runs entirely in the browser; no server calls.
 */
import type { ColumnProfile } from '@/types';

/* ────────────────────── helpers ────────────────────── */

function isValidDate(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  const s = String(value).trim();
  if (/^\d+$/.test(s)) return false;          // plain numbers aren't dates
  const d = new Date(s);
  return d instanceof Date && !isNaN(d.getTime());
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/* ────────────────── type detection ─────────────────── */

function detectDataType(values: unknown[]): ColumnProfile['dataType'] {
  if (values.length === 0) return 'unknown';

  const sample = values.slice(0, Math.min(200, values.length));

  const boolCount = sample.filter(v => {
    const s = String(v).toLowerCase().trim();
    return ['true', 'false', '0', '1', 'yes', 'no'].includes(s);
  }).length;
  if (boolCount / sample.length > 0.9) return 'boolean';

  const numCount = sample.filter(v => toNumber(v) !== null).length;
  if (numCount / sample.length > 0.85) return 'numeric';

  const dateCount = sample.filter(v => isValidDate(v)).length;
  if (dateCount / sample.length > 0.85) return 'date';

  return 'categorical';
}

/* ─────────────── statistics helpers ────────────────── */

function numericValues(values: unknown[]): number[] {
  return values.map(toNumber).filter((n): n is number => n !== null);
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const counts: Record<number, number> = {};
  let maxCount = 0;
  let modeVal = nums[0];
  for (const n of nums) {
    counts[n] = (counts[n] || 0) + 1;
    if (counts[n] > maxCount) {
      maxCount = counts[n];
      modeVal = n;
    }
  }
  return modeVal;
}

function stdDev(nums: number[]): number | null {
  if (nums.length < 2) return null;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((sum, v) => sum + (v - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function topValues(values: unknown[], limit = 5): { value: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = String(v);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/* ─────────────── column profiling ──────────────────── */

export function profileColumn(data: Record<string, unknown>[], columnName: string): ColumnProfile {
  const raw = data.map(row => row[columnName]);
  const nonNull = raw.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  const uniqueSet = new Set(nonNull.map(String));
  const dataType = detectDataType(nonNull);
  const nums = numericValues(nonNull);

  return {
    name: columnName,
    dataType,
    uniqueValues: uniqueSet.size,
    nullCount: raw.length - nonNull.length,
    nullPercentage: ((raw.length - nonNull.length) / raw.length) * 100,
    totalCount: raw.length,
    cardinality: uniqueSet.size / Math.max(nonNull.length, 1) > 0.5 ? 'high' : 'low',
    isNumeric: dataType === 'numeric',
    isDate: dataType === 'date',
    min: nums.length > 0 ? Math.min(...nums) : null,
    max: nums.length > 0 ? Math.max(...nums) : null,
    mean: nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null,
    median: median(nums),
    mode: mode(nums),
    stdDev: stdDev(nums),
    sampleValues: nonNull.slice(0, 5),
    topValues: topValues(nonNull),
  };
}

export function profileAllColumns(data: Record<string, unknown>[]): ColumnProfile[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]).map(col => profileColumn(data, col));
}

/* ────────── numeric column helpers ─────────────────── */

export function getNumericColumns(profiles: ColumnProfile[]): string[] {
  return profiles.filter(p => p.dataType === 'numeric').map(p => p.name);
}

export function getCategoricalColumns(profiles: ColumnProfile[]): string[] {
  return profiles.filter(p => p.dataType === 'categorical').map(p => p.name);
}

export function getDateColumns(profiles: ColumnProfile[]): string[] {
  return profiles.filter(p => p.dataType === 'date').map(p => p.name);
}

/* ── aggregation for chart data ─────────────────────── */

export function aggregateData(
  data: Record<string, unknown>[],
  groupBy: string,
  measure: string,
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum',
): { name: string; value: number }[] {
  const groups: Record<string, number[]> = {};

  for (const row of data) {
    const key = String(row[groupBy] ?? 'Unknown');
    const val = toNumber(row[measure]);
    if (!groups[key]) groups[key] = [];
    if (val !== null) groups[key].push(val);
  }

  return Object.entries(groups).map(([name, vals]) => {
    let value = 0;
    switch (aggregation) {
      case 'sum':   value = vals.reduce((a, b) => a + b, 0); break;
      case 'avg':   value = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; break;
      case 'count': value = vals.length; break;
      case 'min':   value = vals.length > 0 ? Math.min(...vals) : 0; break;
      case 'max':   value = vals.length > 0 ? Math.max(...vals) : 0; break;
    }
    return { name, value: Math.round(value * 100) / 100 };
  });
}
