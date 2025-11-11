'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smile, Frown, Meh, Send } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface SentimentResult {
  label: string;
  score: number;
}

interface AnalysisResult {
  text: string;
  sentiment: SentimentResult;
}

interface Statistics {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  averageScore: number;
}

export default function AnalysisPage() {
  useAuth(true); // Require authentication

  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');

  // Single text
  const [singleText, setSingleText] = useState('');
  const [singleResult, setSingleResult] = useState<AnalysisResult | null>(null);
  const [singleStats, setSingleStats] = useState<Statistics | null>(null);

  // Batch
  const [batchTexts, setBatchTexts] = useState('');
  const [batchResults, setBatchResults] = useState<AnalysisResult[]>([]);
  const [batchStats, setBatchStats] = useState<Statistics | null>(null);

  // Keywords
  const [keywords, setKeywords] = useState('');
  const [keywordResults, setKeywordResults] = useState<AnalysisResult[]>([]);
  const [keywordStats, setKeywordStats] = useState<Statistics | null>(null);

  const handleAnalyzeSingle = async () => {
    console.log('🎯 Button clicked! Text:', singleText);

    if (!singleText.trim()) {
      console.log('⚠️ No text entered');
      toast({
        title: 'Error',
        description: 'Please enter text to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    console.log('⏳ Loading started');
    try {
      console.log('🔍 Analyzing text:', singleText);
      const response = await apiClient.analyzeText(singleText, true);
      console.log('✅ API Response:', response);

      if (response.success && response.data) {
        console.log('📊 Result:', response.data.result);
        console.log('📈 Statistics:', response.data.statistics);

        setSingleResult(response.data.result);
        setSingleStats(response.data.statistics);

        toast({
          title: 'Success',
          description: 'Text analyzed and saved successfully',
        });
      }
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze text',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeBatch = async () => {
    const texts = batchTexts.split('\n').filter(t => t.trim());

    if (texts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter texts to analyze (one per line)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.analyzeBatch(texts, true);

      if (response.success && response.data) {
        setBatchResults(response.data.results);
        setBatchStats(response.data.statistics);

        toast({
          title: 'Success',
          description: `Analyzed ${texts.length} texts successfully`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze texts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeKeywords = async () => {
    const kwds = keywords.split(',').map(k => k.trim()).filter(k => k);

    if (kwds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter keywords (comma-separated)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.analyzeKeywords(kwds, true);

      if (response.success && response.data) {
        setKeywordResults(response.data.results);
        setKeywordStats(response.data.statistics);

        toast({
          title: 'Success',
          description: `Analyzed ${kwds.length} keywords successfully`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze keywords',
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

  const renderStatistics = (stats: Statistics | null) => {
    if (!stats) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
              <div className="text-sm text-muted-foreground">Positive ({stats.positivePercentage.toFixed(1)}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
              <div className="text-sm text-muted-foreground">Negative ({stats.negativePercentage.toFixed(1)}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.neutral}</div>
              <div className="text-sm text-muted-foreground">Neutral ({stats.neutralPercentage.toFixed(1)}%)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sentiment Analysis</h1>
          <p className="text-muted-foreground">Analyze text sentiment using AI</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/analysis/history')}>
          View History
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Text</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        {/* Single Text Tab */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Single Text</CardTitle>
              <CardDescription>Enter text to analyze its sentiment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your text here..."
                value={singleText}
                onChange={(e) => setSingleText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <Button
                onClick={handleAnalyzeSingle}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>

              {singleResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getSentimentIcon(singleResult.sentiment.label)}
                      Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Sentiment:</span>
                        <Badge className={getSentimentColor(singleResult.sentiment.label)}>
                          {singleResult.sentiment.label.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Confidence:</span>
                        <span>{(singleResult.sentiment.score * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {renderStatistics(singleStats)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Tab */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Analysis</CardTitle>
              <CardDescription>Enter multiple texts (one per line, max 100)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter texts, one per line..."
                value={batchTexts}
                onChange={(e) => setBatchTexts(e.target.value)}
                rows={10}
                className="resize-none font-mono text-sm"
              />
              <Button
                onClick={handleAnalyzeBatch}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze Batch
                  </>
                )}
              </Button>

              {batchResults.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="font-semibold">Results ({batchResults.length} items)</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {batchResults.map((result, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 text-sm truncate">{result.text}</div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getSentimentIcon(result.sentiment.label)}
                            <Badge className={getSentimentColor(result.sentiment.label)}>
                              {result.sentiment.label}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {renderStatistics(batchStats)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keywords Analysis</CardTitle>
              <CardDescription>Enter keywords (comma-separated, max 50)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="keyword1, keyword2, keyword3..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <Button
                onClick={handleAnalyzeKeywords}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze Keywords
                  </>
                )}
              </Button>

              {keywordResults.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="font-semibold">Results ({keywordResults.length} keywords)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {keywordResults.map((result, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm">{result.text}</div>
                          <div className="flex items-center gap-2">
                            {getSentimentIcon(result.sentiment.label)}
                            <Badge className={getSentimentColor(result.sentiment.label)}>
                              {result.sentiment.label}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {renderStatistics(keywordStats)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
