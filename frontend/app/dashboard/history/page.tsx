'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, FileText, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Analysis {
  id: string;
  title: string;
  inputType: string;
  totalItems: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageScore: number;
  createdAt: string;
  originalFileName?: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: any = await apiClient.getAnalysisHistory(50, 0);

      if (response.success && response.data) {
        setAnalyses(response.data.analyses);
      }
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setError(err.message || 'Failed to load history');
      toast({
        title: 'Error',
        description: 'Failed to load analysis history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getDominantSentiment = (analysis: Analysis) => {
    const { positiveCount, negativeCount, neutralCount } = analysis;
    const max = Math.max(positiveCount, negativeCount, neutralCount);

    if (max === positiveCount) return 'Positive';
    if (max === negativeCount) return 'Negative';
    return 'Neutral';
  };

  const getInputTypeLabel = (inputType: string) => {
    switch (inputType) {
      case 'text': return 'Text Analysis';
      case 'batch': return 'Batch Analysis';
      case 'csv': return 'CSV Upload';
      case 'keywords': return 'Keyword Analysis';
      default: return 'Analysis';
    }
  };

  const getDescription = (analysis: Analysis) => {
    if (analysis.originalFileName) {
      return `Processed ${analysis.originalFileName} with ${analysis.totalItems} entries`;
    }
    return `Analyzed ${analysis.totalItems} item${analysis.totalItems > 1 ? 's' : ''}`;
  };

  const handleViewAnalysis = (id: string) => {
    router.push(`/dashboard/history/${id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">Track all your analysis activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your complete analysis history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading history...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="font-semibold text-destructive">Failed to load history</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={fetchHistory} variant="outline">
                Retry
              </Button>
            </div>
          ) : analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">No analysis history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start analyzing text, CSV files, or images to see your history here
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard/analyze')}>
                Start Analyzing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => {
                const sentiment = getDominantSentiment(analysis);

                return (
                  <div
                    key={analysis.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      {analysis.inputType === 'csv' ? (
                        <FileText className="h-5 w-5 text-white" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{analysis.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sentiment === 'Positive'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : sentiment === 'Negative'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
                          }`}
                        >
                          {sentiment}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getDescription(analysis)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeAgo(analysis.createdAt)}
                        </div>
                        <div>
                          <span className="text-green-600 dark:text-green-400">
                            ↑ {analysis.positiveCount}
                          </span>
                          {' · '}
                          <span className="text-red-600 dark:text-red-400">
                            ↓ {analysis.negativeCount}
                          </span>
                          {' · '}
                          <span className="text-gray-600 dark:text-gray-400">
                            − {analysis.neutralCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAnalysis(analysis.id)}
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
