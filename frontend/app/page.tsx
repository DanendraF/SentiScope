import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart3, FileText, TrendingUp, Zap, Download, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Zap className="h-4 w-4 mr-2" />
            AI-Powered Sentiment Analysis
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Monitor Public Sentiment in Real-Time
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Understand what people think about your brand with AI-powered sentiment analysis.
            Analyze text, CSV files, and images to get actionable insights instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-lg px-8">
                Start Analyzing Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-blue-600">99%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-600">1M+</div>
              <div className="text-sm text-muted-foreground">Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">50+</div>
              <div className="text-sm text-muted-foreground">Languages</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-600">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to understand public sentiment</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-lg">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle>Social Monitoring</CardTitle>
                <CardDescription>
                  Track mentions and sentiment across social media platforms in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-cyan-500 transition-all hover:shadow-lg">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-cyan-500 mb-4" />
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>
                  AI-powered analysis to detect positive, negative, and neutral sentiments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-lg">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle>Trend Analytics</CardTitle>
                <CardDescription>
                  Visualize sentiment trends over time with interactive charts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-cyan-500 transition-all hover:shadow-lg">
              <CardHeader>
                <Download className="h-12 w-12 text-cyan-500 mb-4" />
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>
                  Download comprehensive PDF reports with all your insights
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple, fast, and powerful</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Your Data</h3>
              <p className="text-muted-foreground">
                Upload text, keywords, CSV files, or images for analysis
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">AI Analyzes</h3>
              <p className="text-muted-foreground">
                Our AI processes your data and extracts sentiment insights
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Get Insights</h3>
              <p className="text-muted-foreground">
                View visual analytics and download detailed reports
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">SentiScope</span>
            </div>
            <div className="text-muted-foreground text-sm">
              © 2025 SentiScope. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
