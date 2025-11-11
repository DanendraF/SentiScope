'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Trash2, ArrowLeft, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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
}

export default function AnalysisHistoryPage() {
  useAuth(true); // Require authentication

  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAnalysisHistory(50, 0);

      if (response.success && response.data) {
        setAnalyses(response.data.analyses);
        setTotal(response.data.pagination.total);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load history',
        description: error.message || 'Could not load analysis history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      const response = await apiClient.deleteAnalysis(id);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Analysis deleted successfully',
        });

        // Reload list
        loadAnalyses();
      }
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete analysis',
        variant: 'destructive',
      });
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
      month: 'short',
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/analysis')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="text-muted-foreground">{total} total analyses</p>
        </div>
        <Button onClick={() => router.push('/analysis')}>
          New Analysis
        </Button>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first sentiment analysis
            </p>
            <Button onClick={() => router.push('/analysis')}>
              Create Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{analysis.title}</CardTitle>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/analysis/${analysis.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(analysis.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.totalItems}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.positiveCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Positive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analysis.negativeCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Negative</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {analysis.neutralCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Neutral</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
