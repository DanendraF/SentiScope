'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalysisResult {
  text: string;
  sentiment: {
    label: string;
    score: number;
  };
}

interface SentimentTrendChartProps {
  results: AnalysisResult[];
}

export function SentimentTrendChart({ results }: SentimentTrendChartProps) {
  // Create cumulative trend data from results
  const data = results.map((_, index) => {
    // Count sentiments up to current index
    const upToHere = results.slice(0, index + 1);
    const positive = upToHere.filter(r => r.sentiment.label === 'positive').length;
    const negative = upToHere.filter(r => r.sentiment.label === 'negative').length;
    const neutral = upToHere.filter(r => r.sentiment.label === 'neutral').length;

    return {
      index: `#${index + 1}`,
      positive,
      negative,
      neutral,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="index" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} />
        <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} />
        <Line type="monotone" dataKey="neutral" stroke="#6b7280" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
