'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { keyword: 'Quality', positive: 85, negative: 15 },
  { keyword: 'Service', positive: 70, negative: 30 },
  { keyword: 'Price', positive: 60, negative: 40 },
  { keyword: 'Delivery', positive: 75, negative: 25 },
  { keyword: 'Support', positive: 80, negative: 20 },
];

export function KeywordBarChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="keyword" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Legend />
        <Bar dataKey="positive" fill="#10b981" />
        <Bar dataKey="negative" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}
