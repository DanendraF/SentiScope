'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Bot, User, Sparkles, X, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisChatbotProps {
  results: any[];
  statistics: any;
  aiInsights?: string | null;
  analysisId?: string;
}

export function AnalysisChatbot({ results, statistics, aiInsights, analysisId }: AnalysisChatbotProps) {
  // Generate contextual initial message
  const getInitialMessage = () => {
    const total = statistics.total || 0;
    const positive = statistics.positive || 0;
    const negative = statistics.negative || 0;
    const neutral = statistics.neutral || 0;
    const posPercent = ((positive / total) * 100).toFixed(1);
    const negPercent = ((negative / total) * 100).toFixed(1);
    const neuPercent = ((neutral / total) * 100).toFixed(1);

    const dominantSentiment =
      positive > negative && positive > neutral ? 'positive' :
      negative > positive && negative > neutral ? 'negative' : 'neutral';

    let message = `Hi! I've analyzed your **${total} text(s)**. Here's a quick summary:\n\n`;
    message += `### 📊 Results\n\n`;
    message += `- ${positive} Positive (${posPercent}%)\n`;
    message += `- ${negative} Negative (${negPercent}%)\n`;
    message += `- ${neutral} Neutral (${neuPercent}%)\n\n`;
    message += `### 🎯 Overall Sentiment\n\n`;
    message += `**${dominantSentiment.charAt(0).toUpperCase() + dominantSentiment.slice(1)}**\n\n`;

    if (aiInsights) {
      message += `### 💡 AI Insights\n\n`;
      message += `${aiInsights.substring(0, 200)}${aiInsights.length > 200 ? '...' : ''}\n\n`;
    }

    message += `### 💬 Feel free to ask me:\n\n`;
    message += `- "What are the main positive/negative themes?"\n`;
    message += `- "What should I improve?"\n`;
    message += `- "Give me detailed insights"\n`;
    message += `- Or any other questions about your analysis!`;

    return message;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component mounts (if analysisId exists)
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!analysisId) {
        // No analysisId, show initial message
        setMessages([
          {
            role: 'assistant',
            content: getInitialMessage(),
            timestamp: new Date(),
          },
        ]);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const response: any = await apiClient.getChatHistory(analysisId);
        if (response.success && response.data.messages && response.data.messages.length > 0) {
          // Load existing chat history
          const loadedMessages = response.data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
        } else {
          // No history, show initial message
          setMessages([
            {
              role: 'assistant',
              content: getInitialMessage(),
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // On error, show initial message
        setMessages([
          {
            role: 'assistant',
            content: getInitialMessage(),
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [analysisId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context for the chatbot
      const context = {
        statistics,
        aiInsights,
        sampleResults: results.slice(0, 10).map(r => ({
          text: r.text,
          sentiment: r.sentiment.label,
          keywords: r.keywords || [],
          productName: r.productName || undefined,
        })),
        totalResults: results.length,
      };

      const response: any = await apiClient.chatWithAnalysis(input, context, analysisId);

      if (response.success && response.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error: any) {
      console.error('Chatbot error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });

      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-8rem)] sm:h-[600px] shadow-2xl flex flex-col z-50">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-white">AI Assistant</CardTitle>
              <CardDescription className="text-white/80 text-xs">
                Ask me about your analysis
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading chat history...</span>
            </div>
          </div>
        ) : (
          <>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Sparkles className="h-4 w-4 text-white" />
              )}
            </div>
            <div
              className={`flex-1 p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 dark:bg-blue-950 text-right'
                  : 'bg-gray-100 dark:bg-gray-900'
              }`}
            >
              {message.role === 'user' ? (
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-p:text-sm prose-p:leading-relaxed prose-p:my-1
                  prose-ul:my-1 prose-ul:text-sm
                  prose-li:my-0.5
                  prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                  prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                  prose-h1:text-base prose-h1:font-bold prose-h1:mb-2
                  prose-h2:text-sm prose-h2:font-semibold prose-h2:mb-1 prose-h2:mt-2
                  prose-h3:text-sm prose-h3:font-medium prose-h3:mb-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 p-3 rounded-lg bg-gray-100 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
