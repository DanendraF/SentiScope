'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SentimentPieChartProps {
  positive: number;
  negative: number;
  neutral: number;
}

export function SentimentPieChart({ positive, negative, neutral }: SentimentPieChartProps) {
  const data = [
    { name: 'Positive', value: positive, color: '#10b981' },
    { name: 'Negative', value: negative, color: '#ef4444' },
    { name: 'Neutral', value: neutral, color: '#6b7280' },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
