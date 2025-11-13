'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WordFrequencyChartProps {
  results: Array<{
    text: string;
    sentiment: {
      label: string;
      score: number;
    };
    keyPhrases?: string[];
  }>;
  maxWords?: number;
}

export function WordFrequencyChart({ results, maxWords = 15 }: WordFrequencyChartProps) {
  // Extract and count words from all texts and key phrases
  const wordCount: Record<string, { count: number; sentiment: string }> = {};

  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
    'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
    'and', 'or', 'but', 'not', 'with', 'from', 'by', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'who', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'too', 'very', 'just', 'than', 'so'
  ]);

  results.forEach((result) => {
    const sentiment = result.sentiment.label;

    // Process key phrases first (they're more important)
    if (result.keyPhrases && result.keyPhrases.length > 0) {
      result.keyPhrases.forEach((phrase) => {
        const words = phrase.toLowerCase().split(/\s+/);
        words.forEach((word) => {
          const cleanWord = word.replace(/[^a-z0-9]/g, '');
          if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
            if (!wordCount[cleanWord]) {
              wordCount[cleanWord] = { count: 0, sentiment };
            }
            wordCount[cleanWord].count += 2; // Key phrases get double weight
          }
        });
      });
    }

    // Process full text
    const words = result.text.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        if (!wordCount[cleanWord]) {
          wordCount[cleanWord] = { count: 0, sentiment };
        }
        wordCount[cleanWord].count += 1;
      }
    });
  });

  // Convert to array and sort by frequency
  const data = Object.entries(wordCount)
    .map(([word, { count, sentiment }]) => ({
      word,
      frequency: count,
      sentiment,
      color: sentiment === 'positive' ? '#10b981' : sentiment === 'negative' ? '#ef4444' : '#6b7280'
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, maxWords);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No word data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" />
        <YAxis dataKey="word" type="category" width={90} className="text-xs" />
        <Tooltip
          formatter={(value: number) => [`${value} occurrences`, 'Frequency']}
        />
        <Bar dataKey="frequency" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
