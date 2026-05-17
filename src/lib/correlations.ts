/**
 * Pearson correlation and correlation-matrix utilities.
 */

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX  += x[i];
    sumY  += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return den === 0 ? 0 : num / den;
}

export interface CorrelationEntry {
  columnA: string;
  columnB: string;
  value: number;
}

export function correlationMatrix(
  data: Record<string, unknown>[],
  numericCols: string[],
): CorrelationEntry[] {
  const results: CorrelationEntry[] = [];
  const vectors: Record<string, number[]> = {};

  for (const col of numericCols) {
    vectors[col] = data.map(row => {
      const v = Number(row[col]);
      return isNaN(v) ? 0 : v;
    });
  }

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i; j < numericCols.length; j++) {
      const value = i === j ? 1 : pearsonCorrelation(vectors[numericCols[i]], vectors[numericCols[j]]);
      results.push({
        columnA: numericCols[i],
        columnB: numericCols[j],
        value: Math.round(value * 1000) / 1000,
      });
      if (i !== j) {
        results.push({
          columnA: numericCols[j],
          columnB: numericCols[i],
          value: Math.round(value * 1000) / 1000,
        });
      }
    }
  }

  return results;
}
