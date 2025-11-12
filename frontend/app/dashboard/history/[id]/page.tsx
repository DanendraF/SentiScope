'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileText
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AnalysisItem {
  id: string;
  textContent: string;
  sentimentLabel: string;
  confidenceScore: number;
  createdAt: string;
}

interface AnalysisDetail {
  id: string;
  title: string;
  inputType: string;
  totalItems: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageScore: number;
  filePath?: string;
  fileUrl?: string;
  originalFileName?: string;
  createdAt: string;
  items: AnalysisItem[];
}

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchAnalysisDetail(params.id as string);
    }
  }, [params.id]);

  const fetchAnalysisDetail = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response: any = await apiClient.getAnalysisById(id);

      if (response.success && response.data) {
        setAnalysis(response.data.analysis);
      } else {
        setError('Analysis not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch analysis:', err);
      setError(err.message || 'Failed to load analysis');
      toast({
        title: 'Error',
        description: 'Failed to load analysis details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      case 'negative':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPercentage = (count: number, total: number) => {
    return ((count / total) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading analysis...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <p className="font-semibold text-destructive">Failed to load analysis</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={() => router.push('/dashboard/history')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/history')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{analysis.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(analysis.createdAt)}
              {analysis.originalFileName && (
                <span className="ml-2">
                  <FileText className="inline h-3 w-3 mr-1" />
                  {analysis.originalFileName}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analysis.totalItems}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Positive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analysis.positiveCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getPercentage(analysis.positiveCount, analysis.totalItems)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Negative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analysis.negativeCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getPercentage(analysis.negativeCount, analysis.totalItems)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Neutral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {analysis.neutralCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getPercentage(analysis.neutralCount, analysis.totalItems)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Items */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Detailed sentiment analysis for each text item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className={getSentimentColor(item.sentimentLabel)}
                      >
                        <span className="mr-1">{getSentimentIcon(item.sentimentLabel)}</span>
                        {item.sentimentLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(item.confidenceScore * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{item.textContent}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {analysis.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No analysis items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
