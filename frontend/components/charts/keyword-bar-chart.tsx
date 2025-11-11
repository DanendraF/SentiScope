'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalysisResult {
  text: string;
  sentiment: {
    label: string;
    score: number;
  };
}

interface KeywordBarChartProps {
  results: AnalysisResult[];
}

export function KeywordBarChart({ results }: KeywordBarChartProps) {
  // Extract top keywords/words from texts and count sentiments
  const wordSentiments = new Map<string, { positive: number; negative: number; neutral: number }>();

  results.forEach(result => {
    // Extract words (longer than 3 characters, alphanumeric only)
    const words = result.text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && /^[a-z0-9]+$/.test(word));

    words.forEach(word => {
      if (!wordSentiments.has(word)) {
        wordSentiments.set(word, { positive: 0, negative: 0, neutral: 0 });
      }
      const counts = wordSentiments.get(word)!;
      if (result.sentiment.label === 'positive') counts.positive++;
      else if (result.sentiment.label === 'negative') counts.negative++;
      else counts.neutral++;
    });
  });

  // Sort by total mentions and take top 5
  const data = Array.from(wordSentiments.entries())
    .map(([word, counts]) => ({
      keyword: word,
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral,
      total: counts.positive + counts.negative + counts.neutral,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

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
        <Bar dataKey="neutral" fill="#6b7280" />
      </BarChart>
    </ResponsiveContainer>
  );
}
