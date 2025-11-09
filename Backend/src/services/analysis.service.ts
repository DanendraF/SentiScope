import { AppError } from '../utils/AppError';

// Mock data store (replace with actual database)
const analysisStore: any[] = [];

export const analysisService = {
  async analyzeText(text: string, userId?: string) {
    if (!text || text.trim().length === 0) {
      throw new AppError('Text is required', 400);
    }

    // Simple sentiment analysis (replace with actual ML model)
    const sentiment = this.calculateSentiment(text);
    const keywords = this.extractKeywords(text);
    const score = this.calculateScore(sentiment);

    const analysis = {
      id: Date.now().toString(),
      userId,
      text,
      sentiment,
      score,
      keywords,
      createdAt: new Date().toISOString(),
    };

    analysisStore.push(analysis);

    return analysis;
  },

  async getHistory(userId: string, page: number = 1, limit: number = 10) {
    const userAnalyses = analysisStore
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = userAnalyses.slice(startIndex, endIndex);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total: userAnalyses.length,
        totalPages: Math.ceil(userAnalyses.length / limit),
      },
    };
  },

  async getAnalysisById(id: string, userId: string) {
    const analysis = analysisStore.find(
      (a) => a.id === id && a.userId === userId
    );

    if (!analysis) {
      throw new AppError('Analysis not found', 404);
    }

    return analysis;
  },

  async deleteAnalysis(id: string, userId: string) {
    const index = analysisStore.findIndex(
      (a) => a.id === id && a.userId === userId
    );

    if (index === -1) {
      throw new AppError('Analysis not found', 404);
    }

    analysisStore.splice(index, 1);
  },

  async getReports(userId: string, startDate?: string, endDate?: string) {
    let userAnalyses = analysisStore.filter((a) => a.userId === userId);

    if (startDate || endDate) {
      userAnalyses = userAnalyses.filter((a) => {
        const date = new Date(a.createdAt);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      });
    }

    const total = userAnalyses.length;
    const positive = userAnalyses.filter((a) => a.sentiment === 'positive').length;
    const negative = userAnalyses.filter((a) => a.sentiment === 'negative').length;
    const neutral = userAnalyses.filter((a) => a.sentiment === 'neutral').length;
    const averageScore = userAnalyses.reduce((sum, a) => sum + a.score, 0) / total || 0;

    return {
      total,
      positive,
      negative,
      neutral,
      averageScore: Math.round(averageScore * 100) / 100,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  },

  // Helper methods for sentiment analysis
  calculateSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'horrible', 'worst', 'disappointed'];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach((word) => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach((word) => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  },

  extractKeywords(text: string): string[] {
    // Simple keyword extraction (replace with actual NLP)
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const keywords = words
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10);
    return [...new Set(keywords)];
  },

  calculateScore(sentiment: string): number {
    switch (sentiment) {
      case 'positive':
        return 0.7 + Math.random() * 0.3; // 0.7 - 1.0
      case 'negative':
        return Math.random() * 0.3; // 0.0 - 0.3
      default:
        return 0.3 + Math.random() * 0.4; // 0.3 - 0.7
    }
  },
};

