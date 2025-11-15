'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Image as ImageIcon, Sparkles, Download, Loader2, FileDown } from 'lucide-react';
import { SentimentPieChart } from '@/components/charts/sentiment-pie-chart';
import { SentimentTrendChart } from '@/components/charts/sentiment-trend-chart';
import { KeywordBarChart } from '@/components/charts/keyword-bar-chart';
import { LikertScaleChart } from '@/components/charts/likert-scale-chart';
import { WordFrequencyChart } from '@/components/charts/word-frequency-chart';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AnalysisChatbot } from '@/components/chatbot/analysis-chatbot';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisResult {
  text: string;
  sentiment: {
    label: string;
    score: number;
  };
  keywords?: string[];
  explanation?: string;
  keyPhrases?: string[];
  username?: string;
  timestamp?: string;
  productName?: string;
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

export default function AnalyzePage() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [inputType, setInputType] = useState<'comment' | 'product'>('comment');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvColumn, setCsvColumn] = useState('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AnalysisResult[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleAnalyze = async () => {
    if (!textInput.trim()) {
      toast({
        title: 'Error',
        description: inputType === 'comment' ? 'Please enter text to analyze' : 'Please enter product name to search',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    const modeLabel = inputType === 'comment' ? 'Analyzing comments' : 'Searching products';
    console.log(`🔍 ${modeLabel}:`, textInput);

    try {
      let allResults: AnalysisResult[] = [];
      let insights: string | null = null;

      if (inputType === 'comment') {
        // MODE 1: Analyze user comments/reviews directly
        const texts = textInput.split('\n').filter(t => t.trim());

        // Extract keywords from user input for dataset search
        const keywords = texts.flatMap(text =>
          text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3) // Only words longer than 3 chars
        );

        // 1. Analyze user's text input with AI (limit to 20 for cost control)
        const textsToAnalyze = texts.slice(0, 20);
        if (textsToAnalyze.length > 0) {
          console.log('🤖 Using AI Deep Analysis for user input...');
          // Create descriptive title with first keywords
          const firstKeywords = keywords.slice(0, 3).join(', ');
          const analysisTitle = firstKeywords
            ? `Comment Analysis - ${firstKeywords}`
            : `Comment Analysis - ${new Date().toLocaleDateString()}`;

          const response: any = await apiClient.deepAnalysis(
            textsToAnalyze.length === 1 ? textsToAnalyze[0] : undefined,
            textsToAnalyze.length > 1 ? textsToAnalyze : undefined,
            true,
            analysisTitle
          );
          console.log('✅ AI Analysis Response:', response);

          if (response.success && response.data) {
            allResults.push(...response.data.results);
            insights = response.data.insights || null;
            // Save analysisId if available
            if (response.data.analysisId) {
              setAnalysisId(response.data.analysisId);
            }
          }
        }

        // 2. Search and analyze dataset with keywords
        if (keywords.length > 0) {
          console.log('🔍 Searching dataset with keywords:', keywords.slice(0, 5));
          const datasetResponse: any = await apiClient.analyzeTokopediaReviews(
            undefined, // No limit - analyze ALL matching items
            0,
            keywords.slice(0, 5) // Limit to first 5 keywords
          );
          console.log('✅ Dataset Response:', datasetResponse);

          if (datasetResponse.success && datasetResponse.data) {
            allResults.push(...datasetResponse.data.results);
          }
        }
      } else {
        // MODE 2: Search by product name in dataset
        const productNames = textInput.split('\n').filter(t => t.trim());
        console.log('🛍️ Searching for products:', productNames);

        const datasetResponse: any = await apiClient.analyzeTokopediaReviews(
          undefined, // No limit - analyze ALL reviews for the product
          0,
          productNames // Use product names as keywords
        );
        console.log('✅ Dataset Response:', datasetResponse);

        if (datasetResponse.success && datasetResponse.data) {
          allResults.push(...datasetResponse.data.results);
        }
      }

      // Combine and calculate statistics
      if (allResults.length > 0) {
        setResults(allResults);
        setFilteredResults(allResults);
        setCurrentPage(1); // Reset to first page

        // Calculate combined statistics
        const combinedStats = {
          total: allResults.length,
          positive: allResults.filter(r => r.sentiment.label === 'positive').length,
          negative: allResults.filter(r => r.sentiment.label === 'negative').length,
          neutral: allResults.filter(r => r.sentiment.label === 'neutral').length,
          positivePercentage: 0,
          negativePercentage: 0,
          neutralPercentage: 0,
          averageScore: allResults.reduce((sum, r) => sum + r.sentiment.score, 0) / allResults.length,
        };

        combinedStats.positivePercentage = (combinedStats.positive / combinedStats.total) * 100;
        combinedStats.negativePercentage = (combinedStats.negative / combinedStats.total) * 100;
        combinedStats.neutralPercentage = (combinedStats.neutral / combinedStats.total) * 100;

        setStatistics(combinedStats);
        setAiInsights(insights);
        setShowResults(true);

        const successMsg = inputType === 'comment'
          ? `Analyzed ${allResults.length} text(s)${insights ? ' with AI insights' : ''}`
          : `Found ${allResults.length} reviews for the product(s)`;

        toast({
          title: insights ? 'AI Analysis Complete' : 'Analysis Complete',
          description: successMsg,
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
      setIsAnalyzing(false);
    }
  };


  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast({
        title: 'Error',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    console.log('📁 Uploading CSV:', csvFile.name);

    try {
      // Create descriptive title from filename
      const fileName = csvFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const csvTitle = `CSV Analysis - ${fileName}`;

      const response: any = await apiClient.analyzeCsv(csvFile, true, csvTitle, csvColumn);
      console.log('✅ CSV Response:', response);

      if (response.success && response.data) {
        setResults(response.data.results);
        setFilteredResults(response.data.results);

        // Calculate percentages if not provided by backend
        const stats = response.data.statistics;
        if (stats && (!stats.positivePercentage || !stats.negativePercentage || !stats.neutralPercentage)) {
          const total = stats.positive + stats.negative + stats.neutral;
          stats.positivePercentage = total > 0 ? (stats.positive / total) * 100 : 0;
          stats.negativePercentage = total > 0 ? (stats.negative / total) * 100 : 0;
          stats.neutralPercentage = total > 0 ? (stats.neutral / total) * 100 : 0;
        }

        setStatistics(stats);
        setAiInsights(response.data.insights || null);
        setCurrentPage(1); // Reset to first page
        setShowResults(true);

        toast({
          title: response.data.usedAI ? 'CSV Analyzed with AI' : 'CSV Analyzed Successfully',
          description: `Analyzed ${response.data.analyzedRows} rows from ${response.data.fileName}${response.data.usedAI ? ' using AI' : ''}`,
        });
      }
    } catch (error: any) {
      console.error('❌ CSV error:', error);
      toast({
        title: 'Failed to analyze CSV',
        description: error.message || 'Failed to process CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }

      setCsvFile(file);
      toast({
        title: 'File selected',
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPG, PNG, GIF, BMP, WEBP)',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      toast({
        title: 'Image selected',
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      });
    }
  };

  const handleExportPDF = async () => {
    if (!statistics || results.length === 0) return;

    try {
      await exportToPDF({
        title: 'Sentiment Analysis Report',
        date: new Date().toLocaleDateString(),
        results: results,
        statistics: statistics,
        aiInsights: aiInsights || undefined,
      });

      toast({
        title: 'Success',
        description: 'Report exported to PDF successfully',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    }
  };

  const handleExportExcel = () => {
    if (!statistics || results.length === 0) return;

    try {
      exportToExcel({
        title: 'Sentiment Analysis Report',
        date: new Date().toLocaleDateString(),
        results: results,
        statistics: statistics,
        aiInsights: aiInsights || undefined,
      });

      toast({
        title: 'Success',
        description: 'Report exported to Excel successfully',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export Excel',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    if (!statistics || results.length === 0) return;

    try {
      exportToCSV({
        title: 'Sentiment Analysis Report',
        date: new Date().toLocaleDateString(),
        results: results,
        statistics: statistics,
        aiInsights: aiInsights || undefined,
      });

      toast({
        title: 'Success',
        description: 'Report exported to CSV successfully',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    console.log('🖼️ Uploading image:', imageFile.name);

    try {
      // Create descriptive title from filename
      const fileName = imageFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const imageTitle = `Image Analysis - ${fileName}`;

      const response: any = await apiClient.analyzeImage(imageFile, true, imageTitle);
      console.log('✅ Image Response:', response);

      if (response.success && response.data) {
        setResults(response.data.results);
        setFilteredResults(response.data.results);

        // Calculate percentages if not provided by backend
        const stats = response.data.statistics;
        if (stats && (!stats.positivePercentage || !stats.negativePercentage || !stats.neutralPercentage)) {
          const total = stats.positive + stats.negative + stats.neutral;
          stats.positivePercentage = total > 0 ? (stats.positive / total) * 100 : 0;
          stats.negativePercentage = total > 0 ? (stats.negative / total) * 100 : 0;
          stats.neutralPercentage = total > 0 ? (stats.neutral / total) * 100 : 0;
        }

        setStatistics(stats);
        setAiInsights(response.data.insights || null);
        setCurrentPage(1); // Reset to first page
        setShowResults(true);

        toast({
          title: response.data.usedAI ? 'Image Analyzed with AI' : 'Image Analyzed Successfully',
          description: `Extracted and analyzed ${response.data.analyzedLines} text lines from ${response.data.fileName}${response.data.usedAI ? ' using AI' : ''}`,
        });
      }
    } catch (error: any) {
      console.error('❌ Image error:', error);
      toast({
        title: 'Failed to analyze image',
        description: error.message || 'Failed to process image file',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeywordFilter = (keyword: string) => {
    setKeywordFilter(keyword);
    setCurrentPage(1); // Reset to first page when filtering

    if (!keyword.trim()) {
      setFilteredResults(results);
      return;
    }

    const filtered = results.filter(result => {
      const lowerKeyword = keyword.toLowerCase();
      const textMatch = result.text.toLowerCase().includes(lowerKeyword);
      const keywordsMatch = result.keywords?.some(k => k.toLowerCase().includes(lowerKeyword));
      return textMatch || keywordsMatch;
    });

    setFilteredResults(filtered);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sentiment Analyzer</h1>
        <p className="text-muted-foreground">Analyze sentiment from text, CSV files, or images</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Data</CardTitle>
          <CardDescription>Choose your input method and start analyzing</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger value="csv">
                <Upload className="h-4 w-4 mr-2" />
                CSV File
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon className="h-4 w-4 mr-2" />
                Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-type">Input Type</Label>
                <Select value={inputType} onValueChange={(value: 'comment' | 'product') => setInputType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select input type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comment">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Comment / Review</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="product">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Product Name</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inputType === 'comment'
                    ? 'Analyze sentiment of your own comments/reviews with AI'
                    : 'Search and analyze reviews by product name'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-input">
                  {inputType === 'comment' ? 'Enter Comments/Reviews' : 'Enter Product Name(s)'}
                </Label>
                <Textarea
                  id="text-input"
                  placeholder={
                    inputType === 'comment'
                      ? "Type or paste your text here... (e.g., customer reviews, social media posts, feedback)\n\n💡 Tip: Enter one text per line for batch analysis"
                      : "Enter product name to search...\n(e.g., Sepatu Nike, Tas Wanita)\n\n💡 Tip: Enter one product per line to search multiple products"
                  }
                  className="min-h-[200px]"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !textInput}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {inputType === 'comment' ? 'Analyzing...' : 'Searching...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {inputType === 'comment' ? 'Analyze Sentiment' : 'Search Product Reviews'}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">Upload CSV File</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    CSV file should contain a column with text data (max 10MB)
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <FileText className="mr-2 h-4 w-4" />
                        {csvFile ? csvFile.name : 'Choose CSV File'}
                      </span>
                    </Button>
                  </label>
                </div>

                {csvFile && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="csv-column">Text Column Name (optional)</Label>
                      <Input
                        id="csv-column"
                        placeholder="text, comment, review, content..."
                        value={csvColumn}
                        onChange={(e) => setCsvColumn(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave as &quot;text&quot; or enter the column name containing text data (AI will auto-detect if enabled)
                      </p>
                    </div>

                    <Button
                      onClick={handleCsvUpload}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing CSV...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze CSV
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">Upload Image with Text</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    OCR will extract text from your image and analyze sentiment (max 10MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {imageFile ? imageFile.name : 'Choose Image File'}
                      </span>
                    </Button>
                  </label>
                </div>

                {imageFile && (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> OCR will extract text from the image. Supported formats: JPG, PNG, GIF, BMP, WEBP
                      </p>
                    </div>

                    <Button
                      onClick={handleImageUpload}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Extracting & Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Extract & Analyze Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showResults && statistics && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Filter by keyword..."
                value={keywordFilter}
                onChange={(e) => handleKeywordFilter(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" onClick={handleExportPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <FileDown className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Real Data - Sentiment Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">😊 Positive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {(statistics.positivePercentage || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{statistics.positive} mentions</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">😠 Negative</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {(statistics.negativePercentage || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{statistics.negative} mentions</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-500/20 bg-gray-50/50 dark:bg-gray-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">😐 Neutral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">
                  {(statistics.neutralPercentage || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{statistics.neutral} mentions</p>
              </CardContent>
            </Card>
          </div>

          {/* Real Data - Charts */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
                <CardDescription>Overall sentiment breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentPieChart
                  positive={statistics.positive}
                  negative={statistics.negative}
                  neutral={statistics.neutral}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>Sentiment changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentTrendChart results={results} />
              </CardContent>
            </Card>
          </div>

          {/* Real Data - Keyword Analysis & Word Frequency */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Keyword Analysis</CardTitle>
                <CardDescription>Sentiment by key topics</CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordBarChart results={results} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Word Frequency</CardTitle>
                <CardDescription>Most common words with sentiment color coding</CardDescription>
              </CardHeader>
              <CardContent>
                <WordFrequencyChart results={results} maxWords={15} />
              </CardContent>
            </Card>
          </div>

          {/* Dummy Data - Likert Scale */}
          <Card>
            <CardHeader>
              <CardTitle>Emotional Sentiment - Likert Scale</CardTitle>
              <CardDescription>Distribution of emotional responses on a 1-5 scale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg border-2 border-red-500/20 bg-red-50/50 dark:bg-red-950/20">
                  <div className="text-4xl mb-2">😠</div>
                  <div className="text-2xl font-bold text-red-600 mb-1">Negative</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Unhappy/Dissatisfied</div>
                  <div className="text-2xl font-bold text-red-600">{statistics.negative}</div>
                  <div className="text-xs text-muted-foreground mt-1">{(statistics.negativePercentage || 0).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-gray-500/20 bg-gray-50/50 dark:bg-gray-950/20">
                  <div className="text-4xl mb-2">😐</div>
                  <div className="text-2xl font-bold text-gray-600 mb-1">Neutral</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Indifferent/Okay</div>
                  <div className="text-2xl font-bold text-gray-600">{statistics.neutral}</div>
                  <div className="text-xs text-muted-foreground mt-1">{(statistics.neutralPercentage || 0).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
                  <div className="text-4xl mb-2">😊</div>
                  <div className="text-2xl font-bold text-green-600 mb-1">Positive</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Happy/Satisfied</div>
                  <div className="text-2xl font-bold text-green-600">{statistics.positive}</div>
                  <div className="text-xs text-muted-foreground mt-1">{(statistics.positivePercentage || 0).toFixed(1)}%</div>
                </div>
              </div>
              <div className="pt-4">
                <LikertScaleChart
                  positive={statistics.positive}
                  negative={statistics.negative}
                  neutral={statistics.neutral}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Average Confidence</div>
                  <div className="text-2xl font-bold">{(statistics.averageScore * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Total Analyzed</div>
                  <div className="text-2xl font-bold">{statistics.total}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Satisfaction Rate</div>
                  <div className="text-2xl font-bold text-green-600">{(statistics.positivePercentage || 0).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">(Positive)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real AI Summary from OpenAI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                AI Summary
              </CardTitle>
              <CardDescription>
                {aiInsights ? 'AI-powered insights and recommendations' : 'Key insights from your data'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights ? (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:text-blue-900 dark:prose-headings:text-blue-100
                    prose-h1:text-xl prose-h1:font-bold prose-h1:mb-3
                    prose-h2:text-lg prose-h2:font-semibold prose-h2:mb-2 prose-h2:mt-4
                    prose-h3:text-base prose-h3:font-medium prose-h3:mb-2
                    prose-p:text-sm prose-p:leading-relaxed prose-p:my-2
                    prose-ul:my-2 prose-ul:text-sm
                    prose-li:my-1
                    prose-strong:text-blue-800 dark:prose-strong:text-blue-200 prose-strong:font-semibold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInsights}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="text-sm">
                      Overall sentiment is <span className="font-bold text-green-600">
                        {statistics.positivePercentage > 50 ? 'strongly positive' : statistics.negativePercentage > 50 ? 'strongly negative' : 'mixed'}
                      </span> with {(statistics.positivePercentage || 0).toFixed(1)}% positive mentions.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <p className="text-sm">
                      Analyzed <span className="font-semibold">{statistics.total} text(s)</span> with
                      an average confidence score of <span className="font-semibold">{(statistics.averageScore * 100).toFixed(1)}%</span>.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                    <p className="text-sm text-muted-foreground">
                      💡 Tip: Upload CSV or Image files to get AI-powered deep insights from OpenAI GPT-4
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Real Data - Detailed Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Reviews</CardTitle>
              <CardDescription>
                Individual sentiment analysis ({filteredResults.length} of {results.length} items
                {keywordFilter && ` - filtered by: "${keywordFilter}"`})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-md">
                        {result.text}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        {result.productName ? (
                          <div className="font-medium text-purple-600 dark:text-purple-400 truncate" title={result.productName}>
                            {result.productName}
                          </div>
                        ) : result.username || result.timestamp ? (
                          <div className="space-y-1">
                            {result.username && (
                              <div className="font-medium text-blue-600">@{result.username}</div>
                            )}
                            {result.timestamp && (
                              <div className="text-xs text-muted-foreground">{result.timestamp}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.sentiment.label === 'positive'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : result.sentiment.label === 'negative'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
                          }`}
                        >
                          {result.sentiment.label === 'positive' ? '😊 ' : result.sentiment.label === 'negative' ? '😠 ' : '😐 '}
                          {result.sentiment.label.charAt(0).toUpperCase() + result.sentiment.label.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {result.keywords && result.keywords.length > 0 ? (
                            result.keywords.slice(0, 5).map((keyword, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded text-xs"
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(result.sentiment.score * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredResults.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results
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
                      {Array.from({ length: Math.min(5, Math.ceil(filteredResults.length / itemsPerPage)) }, (_, i) => {
                        const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
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
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredResults.length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(filteredResults.length / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chatbot - only show when results are available */}
      {showResults && statistics && (
        <AnalysisChatbot
          results={results}
          statistics={statistics}
          aiInsights={aiInsights}
          analysisId={analysisId}
        />
      )}
    </div>
  );
}
