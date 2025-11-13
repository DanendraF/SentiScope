'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalAnalyses: number;
  totalItems: number;
  totalPositive: number;
  totalNegative: number;
  totalNeutral: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  averageScore: number;
}

interface RecentAnalysis {
  id: string;
  title: string;
  inputType: string;
  totalItems: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all analyses to calculate aggregate stats
      const response: any = await apiClient.getAnalysisHistory(100, 0);

      if (response.success && response.data) {
        const analyses = response.data.analyses;

        // Calculate aggregate statistics
        let totalItems = 0;
        let totalPositive = 0;
        let totalNegative = 0;
        let totalNeutral = 0;
        let totalScore = 0;

        analyses.forEach((analysis: RecentAnalysis) => {
          totalItems += analysis.totalItems;
          totalPositive += analysis.positiveCount;
          totalNegative += analysis.negativeCount;
          totalNeutral += analysis.neutralCount;
          totalScore += analysis.totalItems > 0 ?
            ((analysis.positiveCount - analysis.negativeCount) / analysis.totalItems) : 0;
        });

        const total = totalPositive + totalNegative + totalNeutral;

        setStats({
          totalAnalyses: analyses.length,
          totalItems,
          totalPositive,
          totalNegative,
          totalNeutral,
          positivePercentage: total > 0 ? (totalPositive / total) * 100 : 0,
          negativePercentage: total > 0 ? (totalNegative / total) * 100 : 0,
          neutralPercentage: total > 0 ? (totalNeutral / total) * 100 : 0,
          averageScore: analyses.length > 0 ? totalScore / analyses.length : 0,
        });

        setRecentAnalyses(analyses.slice(0, 5));
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
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

  const getDominantSentiment = (analysis: RecentAnalysis) => {
    const { positiveCount, negativeCount, neutralCount } = analysis;
    const max = Math.max(positiveCount, negativeCount, neutralCount);

    if (max === positiveCount) return { label: 'Positive', emoji: '😊', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' };
    if (max === negativeCount) return { label: 'Negative', emoji: '😠', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' };
    return { label: 'Neutral', emoji: '😐', color: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400' };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your sentiment overview.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your sentiment overview.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <p className="font-semibold text-destructive">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your sentiment overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalAnalyses} {stats.totalAnalyses === 1 ? 'analysis' : 'analyses'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">😊 Positive Sentiment</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.positivePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPositive.toLocaleString()} positive items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">😠 Negative Sentiment</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.negativePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalNegative.toLocaleString()} negative items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">😐 Neutral Sentiment</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.neutralPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalNeutral.toLocaleString()} neutral items
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start analyzing your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/analyze" className="block">
              <Button className="w-full justify-start" variant="outline">
                Analyze New Text
              </Button>
            </Link>
            <Link href="/dashboard/analyze" className="block">
              <Button className="w-full justify-start" variant="outline">
                Upload CSV File
              </Button>
            </Link>
            <Link href="/dashboard/analyze" className="block">
              <Button className="w-full justify-start" variant="outline">
                Upload Image
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnalyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No analyses yet</p>
                <Link href="/dashboard/analyze">
                  <Button variant="link" size="sm" className="mt-2">
                    Start your first analysis
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => {
                  const sentiment = getDominantSentiment(analysis);
                  return (
                    <Link
                      key={analysis.id}
                      href={`/dashboard/history/${analysis.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0 hover:bg-muted/50 -mx-2 px-2 py-2 rounded transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{analysis.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getTimeAgo(analysis.createdAt)} · {analysis.totalItems} items
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${sentiment.color}`}
                        >
                          {sentiment.emoji} {sentiment.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
