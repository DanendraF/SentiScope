'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, FileText, Loader2, AlertCircle, Search, Filter } from 'lucide-react';
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
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const { toast } = useToast();
  const router = useRouter();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [inputTypeFilter, setInputTypeFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  // Apply filters whenever analyses or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [analyses, searchQuery, sentimentFilter, inputTypeFilter, dateFromFilter, dateToFilter]);

  const fetchHistory = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const offset = (page - 1) * itemsPerPage;
      const response: any = await apiClient.getAnalysisHistory(itemsPerPage, offset);

      if (response.success && response.data) {
        setAnalyses(response.data.analyses);
        setTotalCount(response.data.pagination.total);
        setTotalPages(Math.ceil(response.data.pagination.total / itemsPerPage));
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

  const applyFilters = () => {
    let filtered = [...analyses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(analysis =>
        analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.originalFileName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sentiment filter
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(analysis => {
        const dominant = getDominantSentiment(analysis).toLowerCase();
        return dominant === sentimentFilter;
      });
    }

    // Input type filter
    if (inputTypeFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.inputType === inputTypeFilter);
    }

    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(analysis => {
        const analysisDate = new Date(analysis.createdAt);
        const fromDate = new Date(dateFromFilter);
        return analysisDate >= fromDate;
      });
    }

    if (dateToFilter) {
      filtered = filtered.filter(analysis => {
        const analysisDate = new Date(analysis.createdAt);
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // End of day
        return analysisDate <= toDate;
      });
    }

    setFilteredAnalyses(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSentimentFilter('all');
    setInputTypeFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
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

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>Filter your analysis history</CardDescription>
            </div>
            {(searchQuery || sentimentFilter !== 'all' || inputTypeFilter !== 'all' || dateFromFilter || dateToFilter) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Title or filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Sentiment Filter */}
            <div className="space-y-2">
              <Label>Sentiment</Label>
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All sentiments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input Type Filter */}
            <div className="space-y-2">
              <Label>Input Type</Label>
              <Select value={inputTypeFilter} onValueChange={setInputTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="keywords">Keywords</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold">{filteredAnalyses.length}</span> of{' '}
              <span className="font-semibold">{analyses.length}</span> results
            </p>
          </div>
        </CardContent>
      </Card>

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
              <Button onClick={() => fetchHistory(currentPage)} variant="outline">
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
          ) : filteredAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Search className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">No results found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters to see more results
                </p>
              </div>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => {
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

          {/* Pagination */}
          {!isLoading && !error && analyses.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
