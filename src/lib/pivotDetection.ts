/**
 * Pivot Detection Engine — the core smart-chart algorithm.
 *
 * Workflow:
 *   1. Classify columns → dimensions, measures, dates
 *   2. Generate candidate pivot groups
 *   3. Score each with a confidence heuristic
 *   4. Return sorted recommendations
 */
import type { ColumnProfile, PivotGroup, ChartKind } from '@/types';
import { pearsonCorrelation } from './correlations';

/* ─────────── confidence helpers ────────────────────── */

function timeSeriesConfidence(dateCol: ColumnProfile, measureCol: ColumnProfile, dataLen: number): number {
  let c = 0.7;
  if (dateCol.uniqueValues > 4) c += 0.1;
  if (dateCol.uniqueValues > 10) c += 0.05;
  if (measureCol.stdDev !== null && measureCol.mean !== null && measureCol.mean !== 0) {
    const cv = measureCol.stdDev / Math.abs(measureCol.mean);
    if (cv > 0.1) c += 0.05;           // meaningful variation
  }
  if (dataLen > 20) c += 0.05;
  return Math.min(c, 0.98);
}

function categoryConfidence(dim: ColumnProfile, measure: ColumnProfile): number {
  let c = 0.65;
  if (dim.uniqueValues >= 2 && dim.uniqueValues <= 12) c += 0.15;
  else if (dim.uniqueValues <= 25) c += 0.05;
  if (dim.cardinality === 'low') c += 0.05;
  if (measure.stdDev !== null && measure.mean !== null && measure.mean !== 0) {
    const cv = measure.stdDev / Math.abs(measure.mean);
    if (cv > 0.2) c += 0.05;
  }
  return Math.min(c, 0.95);
}

function correlationConfidence(corrValue: number): number {
  return Math.abs(corrValue) * 0.85 + 0.1;
}

/* ─────────── main detection ────────────────────────── */

export function detectPivotGroups(
  data: Record<string, unknown>[],
  profiles: ColumnProfile[],
): PivotGroup[] {
  const pivots: PivotGroup[] = [];

  const dimensions = profiles.filter(p => p.dataType === 'categorical');
  const measures   = profiles.filter(p => p.dataType === 'numeric');
  const dates      = profiles.filter(p => p.dataType === 'date');

  /* ── 0. Business Intelligence (BI) Detection ────── */
  const biMeasures = measures.filter(m => /sale|revenue|profit|margin|cost/i.test(m.name));
  const biDates = dates.concat(dimensions.filter(d => /year|quarter|month|date/i.test(d.name)));
  const biCategories = dimensions.filter(d => /region|country|category|product|segment/i.test(d.name));

  for (const measure of biMeasures) {
    for (const dateCol of biDates) {
      pivots.push({
        id: `bi_ts_${dateCol.name}_${measure.name}`,
        name: `BI: ${measure.name} by ${dateCol.name}`,
        type: 'time-series',
        chartType: 'line',
        dimensions: [dateCol.name],
        measures: [measure.name],
        timeDimension: dateCol.dataType === 'date' ? dateCol.name : undefined,
        confidence: 0.99, // Extremely high confidence
        reason: `Auto-detected Business pattern. Shows financial trajectory of "${measure.name}" over "${dateCol.name}".`,
        alternativeChartType: 'bar',
      });
    }

    for (const catCol of biCategories) {
      pivots.push({
        id: `bi_cat_${catCol.name}_${measure.name}`,
        name: `BI: ${measure.name} by ${catCol.name}`,
        type: 'category-comparison',
        chartType: catCol.uniqueValues <= 5 ? 'pie' : 'bar',
        dimensions: [catCol.name],
        measures: [measure.name],
        confidence: 0.98,
        reason: `Auto-detected Business pattern. Breaks down "${measure.name}" by "${catCol.name}".`,
        alternativeChartType: 'doughnut',
      });
    }
  }

  /* ── 1. Time-series pivots ──────────────────────── */
  for (const dateCol of dates) {
    for (const measure of measures.slice(0, 3)) {
      const conf = timeSeriesConfidence(dateCol, measure, data.length);
      pivots.push({
        id: `ts_${dateCol.name}_${measure.name}`,
        name: `${measure.name} over time`,
        type: 'time-series',
        chartType: 'line',
        dimensions: [dateCol.name],
        measures: [measure.name],
        timeDimension: dateCol.name,
        confidence: conf,
        reason: `Shows the trend of "${measure.name}" across "${dateCol.name}". Line charts excel at revealing temporal patterns and seasonality.`,
        alternativeChartType: 'area',
      });
    }
  }

  /* ── 2. Category comparisons ────────────────────── */
  for (const dim of dimensions.slice(0, 4)) {
    for (const measure of measures.slice(0, 3)) {
      const conf = categoryConfidence(dim, measure);
      const best: ChartKind = dim.uniqueValues <= 6 ? 'pie' : 'bar';
      const alt: ChartKind  = best === 'pie' ? 'doughnut' : 'bar';

      pivots.push({
        id: `cat_${dim.name}_${measure.name}`,
        name: `${measure.name} by ${dim.name}`,
        type: 'category-comparison',
        chartType: best,
        dimensions: [dim.name],
        measures: [measure.name],
        confidence: conf,
        reason: `Compares "${measure.name}" across ${dim.uniqueValues} categories of "${dim.name}".${best === 'pie' ? ' Pie chart works well because there are few categories.' : ' Bar chart is ideal for comparing many categories.'}`,
        alternativeChartType: alt,
      });
    }
  }

  /* ── 3. Distribution (single numeric) ───────────── */
  for (const measure of measures.slice(0, 2)) {
    if (measure.uniqueValues > 5) {
      pivots.push({
        id: `dist_${measure.name}`,
        name: `${measure.name} distribution`,
        type: 'distribution',
        chartType: 'bar',
        dimensions: [measure.name],
        measures: [measure.name],
        confidence: 0.70,
        reason: `Shows the distribution of "${measure.name}" values. Useful for spotting outliers, skew, and data spread.`,
        alternativeChartType: 'area',
      });
    }
  }

  /* ── 4. Correlation / scatter ───────────────────── */
  for (let i = 0; i < measures.length && i < 4; i++) {
    for (let j = i + 1; j < measures.length && j < 4; j++) {
      const xVals = data.map(r => Number(r[measures[i].name])).filter(n => !isNaN(n));
      const yVals = data.map(r => Number(r[measures[j].name])).filter(n => !isNaN(n));
      const corr = pearsonCorrelation(xVals, yVals);

      if (Math.abs(corr) > 0.2) {
        pivots.push({
          id: `corr_${measures[i].name}_${measures[j].name}`,
          name: `${measures[i].name} vs ${measures[j].name}`,
          type: 'correlation',
          chartType: 'scatter',
          dimensions: [],
          measures: [measures[i].name, measures[j].name],
          confidence: correlationConfidence(corr),
          reason: `Pearson r = ${(corr * 100).toFixed(0)}%. ${
            Math.abs(corr) > 0.7 ? 'Strong' : Math.abs(corr) > 0.4 ? 'Moderate' : 'Weak'
          } ${corr > 0 ? 'positive' : 'negative'} correlation between "${measures[i].name}" and "${measures[j].name}".`,
        });
      }
    }
  }

  /* ── 5. Multi-dimensional ───────────────────────── */
  if (dimensions.length >= 2 && measures.length >= 1) {
    pivots.push({
      id: `multi_${dimensions[0].name}_${dimensions[1].name}`,
      name: `${dimensions[0].name} × ${dimensions[1].name}`,
      type: 'multi-dimensional',
      chartType: 'bar',
      dimensions: [dimensions[0].name, dimensions[1].name],
      measures: [measures[0].name],
      confidence: 0.72,
      reason: `Cross-analysis of "${measures[0].name}" broken down by two dimensions: "${dimensions[0].name}" and "${dimensions[1].name}".`,
    });
  }

  /* ── Sort by confidence (highest first) and deduplicate ── */
  pivots.sort((a, b) => b.confidence - a.confidence);

  return pivots.slice(0, 10);
}
