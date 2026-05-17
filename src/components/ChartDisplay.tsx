/**
 * Reusable chart renderer — takes a PivotGroup (or ChartConfig)
 * and data, then renders via Recharts.
 */
import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, BarChart, AreaChart, ScatterChart, PieChart,
  Line, Bar, Area, Scatter, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { aggregateData } from '@/lib/analysis';

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
  '#a855f7', '#14b8a6',
];

interface Props {
  data: Record<string, unknown>[];
  chartType: string;
  dimensions: string[];
  measures: string[];
  height?: number;
  id?: string;
}

export default function ChartDisplay({ data, chartType, dimensions, measures, height = 360, id }: Props) {
  const chartData = useMemo(() => {
    if (data.length === 0 || measures.length === 0) return [];

    /* scatter / correlation — raw x,y pairs */
    if (chartType === 'scatter' && measures.length >= 2) {
      return data.slice(0, 500).map(row => ({
        x: Number(row[measures[0]]) || 0,
        y: Number(row[measures[1]]) || 0,
      }));
    }

    /* pie / doughnut — aggregate by dimension */
    if ((chartType === 'pie' || chartType === 'doughnut') && dimensions.length > 0) {
      return aggregateData(data, dimensions[0], measures[0]).slice(0, 20);
    }

    /* time-series or category bar/line/area — aggregate */
    if (dimensions.length > 0) {
      return aggregateData(data, dimensions[0], measures[0]).slice(0, 80);
    }

    /* distribution — bucket numeric values */
    const vals = data.map(r => Number(r[measures[0]])).filter(n => !isNaN(n));
    if (vals.length === 0) return [];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const bucketCount = Math.min(20, Math.ceil(Math.sqrt(vals.length)));
    const step = (max - min) / bucketCount || 1;
    const buckets: Record<string, number> = {};
    for (const v of vals) {
      const key = `${(Math.floor((v - min) / step) * step + min).toFixed(1)}`;
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [data, chartType, dimensions, measures]);

  if (chartData.length === 0) {
    return <div className="chart-empty">No data to display</div>;
  }

  const tooltipStyle = {
    contentStyle: { background: '#1a1e2e', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 13 },
    labelStyle: { color: '#a0a4b8' },
  };

  return (
    <div className="chart-container" id={id}>
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="name" tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="value" name={measures[0]} stroke={PALETTE[0]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
          </LineChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="name" tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Area type="monotone" dataKey="value" name={measures[0]} stroke={PALETTE[0]} fill={`${PALETTE[0]}33`} strokeWidth={2} />
          </AreaChart>
        ) : chartType === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="name" tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Bar dataKey="value" name={measures[0]} fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chartType === 'scatter' ? (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis type="number" dataKey="x" name={measures[0]} tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name={measures[1]} tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Scatter name={`${measures[0]} vs ${measures[1]}`} data={chartData} fill={PALETTE[0]} />
          </ScatterChart>
        ) : chartType === 'pie' || chartType === 'doughnut' ? (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'doughnut' ? 60 : 0}
              outerRadius={height / 2 - 40}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#5c6070' }}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="name" tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b90a0', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
