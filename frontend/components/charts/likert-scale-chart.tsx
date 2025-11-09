'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { scale: '😡 1 - Very Dissatisfied', value: 45, label: '😡 1', emoji: '😡', color: '#ef4444' },
  { scale: '😞 2 - Dissatisfied', value: 78, label: '😞 2', emoji: '😞', color: '#f97316' },
  { scale: '😐 3 - Neutral', value: 139, label: '😐 3', emoji: '😐', color: '#6b7280' },
  { scale: '😊 4 - Satisfied', value: 312, label: '😊 4', emoji: '😊', color: '#3b82f6' },
  { scale: '😄 5 - Very Satisfied', value: 366, label: '😄 5', emoji: '😄', color: '#10b981' },
];

export function LikertScaleChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" />
        <YAxis dataKey="label" type="category" width={100} className="text-xs" />
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

