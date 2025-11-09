'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Jan 1', positive: 65, negative: 20, neutral: 15 },
  { date: 'Jan 5', positive: 68, negative: 18, neutral: 14 },
  { date: 'Jan 10', positive: 70, negative: 17, neutral: 13 },
  { date: 'Jan 15', positive: 67, negative: 19, neutral: 14 },
  { date: 'Jan 20', positive: 72, negative: 16, neutral: 12 },
  { date: 'Jan 25', positive: 75, negative: 15, neutral: 10 },
  { date: 'Jan 30', positive: 68, negative: 18, neutral: 14 },
];

export function SentimentTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
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
