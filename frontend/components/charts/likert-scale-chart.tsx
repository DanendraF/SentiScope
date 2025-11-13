'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface LikertScaleChartProps {
  positive: number;
  negative: number;
  neutral: number;
}

export function LikertScaleChart({ positive, negative, neutral }: LikertScaleChartProps) {
  const data = [
    { scale: '😠 Negative - Unhappy', value: negative, label: '😠 Negative', emoji: '😠', color: '#ef4444' },
    { scale: '😐 Neutral - Indifferent', value: neutral, label: '😐 Neutral', emoji: '😐', color: '#6b7280' },
    { scale: '😊 Positive - Happy', value: positive, label: '😊 Positive', emoji: '😊', color: '#10b981' },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" />
        <YAxis dataKey="label" type="category" width={120} className="text-xs" />
        <Tooltip
          formatter={(value: number) => [`${value} responses`, 'Count']}
          labelFormatter={(label) => data.find(d => d.label === label)?.scale || label}
        />
        <Legend />
        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

