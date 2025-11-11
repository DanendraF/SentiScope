'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Smile, Frown, Meh } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface AnalysisItem {
  id: string;
  textContent: string;
  sentimentLabel: string;
  confidenceScore: number;
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
  createdAt: string;
  items: AnalysisItem[];
}

export default function AnalysisDetailPage() {
  useAuth(true); // Require authentication

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);

  useEffect(() => {
    if (params.id) {
      loadAnalysis(params.id as string);
    }
  }, [params.id]);

  const loadAnalysis = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAnalysisById(id);

      if (response.success && response.data) {
        setAnalysis(response.data.analysis);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load analysis',
        description: error.message || 'Could not load analysis details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <Frown className="h-5 w-5 text-red-500" />;
      case 'neutral':
        return <Meh className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInputTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800';
      case 'batch':
        return 'bg-purple-100 text-purple-800';
      case 'keywords':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Analysis not found</h3>
            <Button onClick={() => router.push('/analysis/history')}>
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const positivePercentage = (analysis.positiveCount / analysis.totalItems) * 100;
  const negativePercentage = (analysis.negativeCount / analysis.totalItems) * 100;
  const neutralPercentage = (analysis.neutralCount / analysis.totalItems) * 100;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/analysis/history')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to History
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{analysis.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge className={getInputTypeColor(analysis.inputType)}>
                {analysis.inputType.toUpperCase()}
              </Badge>
              <span>•</span>
              <span>{formatDate(analysis.createdAt)}</span>
              <span>•</span>
              <span>{analysis.totalItems} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{analysis.totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analysis.positiveCount}</div>
              <div className="text-sm text-muted-foreground">
                Positive ({positivePercentage.toFixed(1)}%)
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{analysis.negativeCount}</div>
              <div className="text-sm text-muted-foreground">
                Negative ({negativePercentage.toFixed(1)}%)
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{analysis.neutralCount}</div>
              <div className="text-sm text-muted-foreground">
                Neutral ({neutralPercentage.toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex h-4 rounded-full overflow-hidden">
              {analysis.positiveCount > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${positivePercentage}%` }}
                />
              )}
              {analysis.negativeCount > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${negativePercentage}%` }}
                />
              )}
              {analysis.neutralCount > 0 && (
                <div
                  className="bg-gray-400"
                  style={{ width: `${neutralPercentage}%` }}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Items ({analysis.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.items.map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">#{index + 1}</div>
                    <div className="text-sm">{item.textContent}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(item.sentimentLabel)}
                      <Badge className={getSentimentColor(item.sentimentLabel)}>
                        {item.sentimentLabel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(item.confidenceScore * 100).toFixed(2)}% confidence
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
