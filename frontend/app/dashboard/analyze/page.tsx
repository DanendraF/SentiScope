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

export default function AnalyzePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const reviewsData = [
    { id: 1, text: 'Great product! Highly recommend it.', sentiment: 'Positive', score: 0.95 },
    { id: 2, text: 'Not satisfied with the quality.', sentiment: 'Negative', score: 0.82 },
    { id: 3, text: 'Average experience, nothing special.', sentiment: 'Neutral', score: 0.55 },
    { id: 4, text: 'Excellent customer service!', sentiment: 'Positive', score: 0.92 },
    { id: 5, text: 'Delivery was very slow.', sentiment: 'Negative', score: 0.78 },
  ];

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
                  placeholder="Type or paste your text here... (e.g., customer reviews, social media posts, feedback)"
                  className="min-h-[200px]"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
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
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Drop your CSV file here</p>
                <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                <Input type="file" accept=".csv" className="max-w-xs mx-auto" />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze CSV
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Drop your image here</p>
                <p className="text-xs text-muted-foreground mb-4">PNG, JPG, or JPEG (max 10MB)</p>
                <Input type="file" accept="image/*" className="max-w-xs mx-auto" />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Image
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showResults && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">😊 Positive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">67.8%</div>
                <p className="text-xs text-muted-foreground mt-1">678 mentions</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">😠 Negative</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">18.3%</div>
                <p className="text-xs text-muted-foreground mt-1">183 mentions</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-500/20 bg-gray-50/50 dark:bg-gray-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">😐 Neutral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">13.9%</div>
                <p className="text-xs text-muted-foreground mt-1">139 mentions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
                <CardDescription>Overall sentiment breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentPieChart />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>Sentiment changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentTrendChart />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Keyword Analysis</CardTitle>
              <CardDescription>Sentiment by key topics</CardDescription>
            </CardHeader>
            <CardContent>
              <KeywordBarChart />
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
              <CardDescription>Key insights from your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm">
                  Overall sentiment is <span className="font-bold text-green-600">strongly positive</span> with
                  67.8% positive mentions. The main drivers of positive sentiment are <span className="font-semibold">quality</span> and
                  <span className="font-semibold"> customer service</span>.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <p className="text-sm">
                  Areas of concern include <span className="font-semibold">delivery times</span> and <span className="font-semibold">pricing</span>,
                  which account for most negative feedback.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm">
                  Positive sentiment is trending upward, with a <span className="font-bold">5.2% improvement</span> over
                  the previous period.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Reviews</CardTitle>
              <CardDescription>Individual sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Text</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewsData.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.text}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            review.sentiment === 'Positive'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : review.sentiment === 'Negative'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
                          }`}
                        >
                          {review.sentiment === 'Positive' ? '😊 ' : review.sentiment === 'Negative' ? '😠 ' : '😐 '}
                          {review.sentiment}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{(review.score * 100).toFixed(0)}%</TableCell>
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
