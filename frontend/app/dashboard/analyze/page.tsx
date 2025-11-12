'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Image as ImageIcon, Sparkles, Download, Loader2 } from 'lucide-react';
import { SentimentPieChart } from '@/components/charts/sentiment-pie-chart';
import { SentimentTrendChart } from '@/components/charts/sentiment-trend-chart';
import { KeywordBarChart } from '@/components/charts/keyword-bar-chart';
import { LikertScaleChart } from '@/components/charts/likert-scale-chart';
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

interface AnalysisResult {
  text: string;
  sentiment: {
    label: string;
    score: number;
  };
  keywords?: string[];
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
  const [datasetKeywords, setDatasetKeywords] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvColumn, setCsvColumn] = useState('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AnalysisResult[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [keywordFilter, setKeywordFilter] = useState('');

  const handleAnalyze = async () => {
    if (!textInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    console.log('🔍 Analyzing text:', textInput);

    try {
      // Split by newlines for batch analysis
      const texts = textInput.split('\n').filter(t => t.trim());

      let response: any;
      if (texts.length === 1) {
        // Single text analysis
        response = await apiClient.analyzeText(texts[0], true);
        console.log('✅ API Response:', response);

        if (response.success && response.data) {
          setResults([response.data.result]);
          setFilteredResults([response.data.result]);
          setStatistics(response.data.statistics);
        }
      } else {
        // Batch analysis
        response = await apiClient.analyzeBatch(texts, true);
        console.log('✅ API Response:', response);

        if (response.success && response.data) {
          setResults(response.data.results);
          setFilteredResults(response.data.results);
          setStatistics(response.data.statistics);
        }
      }

      setShowResults(true);
      toast({
        title: 'Success',
        description: 'Analysis completed successfully',
      });
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

  const handleLoadDataset = async () => {
    setIsAnalyzing(true);
    const keywordsInput = datasetKeywords.trim();
    const keywords = keywordsInput ? keywordsInput.split(',').map(k => k.trim()).filter(k => k) : undefined;

    console.log('📊 Loading YouTube dataset with keywords:', keywords);

    try {
      const response: any = await apiClient.analyzeYoutubeComments(50, 0, keywords);
      console.log('✅ Dataset Response:', response);

      if (response.success && response.data) {
        setResults(response.data.results);
        setFilteredResults(response.data.results);
        setStatistics(response.data.statistics);
        setShowResults(true);

        const description = keywords
          ? `Analyzed ${response.data.results.length} YouTube comments containing "${keywords.join(', ')}" with ${response.data.accuracy} accuracy`
          : `Analyzed ${response.data.results.length} YouTube comments with ${response.data.accuracy} accuracy`;

        toast({
          title: 'Dataset Loaded',
          description,
        });
      }
    } catch (error: any) {
      console.error('❌ Dataset error:', error);
      toast({
        title: 'Failed to load dataset',
        description: error.message || 'Failed to fetch YouTube dataset',
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
      const response: any = await apiClient.analyzeCsv(csvFile, true, undefined, csvColumn);
      console.log('✅ CSV Response:', response);

      if (response.success && response.data) {
        setResults(response.data.results);
        setFilteredResults(response.data.results);
        setStatistics(response.data.statistics);
        setShowResults(true);

        toast({
          title: 'CSV Analyzed Successfully',
          description: `Analyzed ${response.data.analyzedRows} rows from ${response.data.fileName}`,
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
      const response: any = await apiClient.analyzeImage(imageFile, true);
      console.log('✅ Image Response:', response);

      if (response.success && response.data) {
        setResults(response.data.results);
        setFilteredResults(response.data.results);
        setStatistics(response.data.statistics);
        setShowResults(true);

        toast({
          title: 'Image Analyzed Successfully',
          description: `Extracted and analyzed ${response.data.analyzedLines} text lines from ${response.data.fileName}`,
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
                <Label htmlFor="text-input">Enter text or keywords</Label>
                <Textarea
                  id="text-input"
                  placeholder="Type or paste your text here... (e.g., customer reviews, social media posts, feedback)&#10;&#10;💡 Tip: Enter one text per line for batch analysis"
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
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Sentiment
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="dataset-keywords">Or analyze YouTube Dataset by keywords (optional)</Label>
                  <Input
                    id="dataset-keywords"
                    placeholder="Enter keywords separated by commas (e.g., great, amazing, terrible)"
                    value={datasetKeywords}
                    onChange={(e) => setDatasetKeywords(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to analyze random comments, or enter keywords to filter comments
                  </p>
                </div>
                <Button
                  onClick={handleLoadDataset}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 mt-3"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Dataset...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Load YouTube Dataset
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
                        Leave as &quot;text&quot; or enter the column name containing text data
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
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF Report
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
                  {statistics.positivePercentage.toFixed(1)}%
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
                  {statistics.negativePercentage.toFixed(1)}%
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
                  {statistics.neutralPercentage.toFixed(1)}%
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

          {/* Real Data - Keyword Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Keyword Analysis</CardTitle>
              <CardDescription>Sentiment by key topics</CardDescription>
            </CardHeader>
            <CardContent>
              <KeywordBarChart results={results} />
            </CardContent>
          </Card>

          {/* Dummy Data - Likert Scale */}
          <Card>
            <CardHeader>
              <CardTitle>Emotional Sentiment - Likert Scale</CardTitle>
              <CardDescription>Distribution of emotional responses on a 1-5 scale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="text-center p-4 rounded-lg border-2 border-red-500/20 bg-red-50/50 dark:bg-red-950/20">
                  <div className="text-4xl mb-2">😡</div>
                  <div className="text-2xl font-bold text-red-600 mb-1">1</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Very Dissatisfied</div>
                  <div className="text-2xl font-bold text-red-600">45</div>
                  <div className="text-xs text-muted-foreground mt-1">4.8%</div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="text-4xl mb-2">😞</div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">2</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Dissatisfied</div>
                  <div className="text-2xl font-bold text-orange-600">78</div>
                  <div className="text-xs text-muted-foreground mt-1">8.3%</div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-gray-500/20 bg-gray-50/50 dark:bg-gray-950/20">
                  <div className="text-4xl mb-2">😐</div>
                  <div className="text-2xl font-bold text-gray-600 mb-1">3</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Neutral</div>
                  <div className="text-2xl font-bold text-gray-600">139</div>
                  <div className="text-xs text-muted-foreground mt-1">14.8%</div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="text-4xl mb-2">😊</div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">4</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Satisfied</div>
                  <div className="text-2xl font-bold text-blue-600">312</div>
                  <div className="text-xs text-muted-foreground mt-1">33.2%</div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
                  <div className="text-4xl mb-2">😄</div>
                  <div className="text-2xl font-bold text-green-600 mb-1">5</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Very Satisfied</div>
                  <div className="text-2xl font-bold text-green-600">366</div>
                  <div className="text-xs text-muted-foreground mt-1">39.0%</div>
                </div>
              </div>
              <div className="pt-4">
                <LikertScaleChart />
              </div>
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Average Score</div>
                  <div className="text-2xl font-bold">3.94</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Total Responses</div>
                  <div className="text-2xl font-bold">940</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Satisfaction Rate</div>
                  <div className="text-2xl font-bold text-green-600">72.1%</div>
                  <div className="text-xs text-muted-foreground">(Scale 4-5)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dummy Data - AI Summary */}
          <Card>
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
              <CardDescription>Key insights from your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm">
                  Overall sentiment is <span className="font-bold text-green-600">
                    {statistics.positivePercentage > 50 ? 'strongly positive' : statistics.negativePercentage > 50 ? 'strongly negative' : 'mixed'}
                  </span> with {statistics.positivePercentage.toFixed(1)}% positive mentions.
                  The analysis is based on real-time AI sentiment detection from HuggingFace.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <p className="text-sm">
                  Analyzed <span className="font-semibold">{statistics.total} text(s)</span> with
                  an average confidence score of <span className="font-semibold">{(statistics.averageScore * 100).toFixed(1)}%</span>.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm">
                  The sentiment analysis uses advanced multilingual AI model capable of detecting
                  sentiment in <span className="font-bold">multiple languages</span> including English, Indonesian, and more.
                </p>
              </div>
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
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-md">
                        {result.text}
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
