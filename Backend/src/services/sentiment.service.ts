import axios from 'axios';
import { AppError } from '../utils/AppError';

const HUGGINGFACE_API_URL = 'https://router.huggingface.co/hf-inference/models/tabularisai/multilingual-sentiment-analysis';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

export interface SentimentResult {
  label: string; // 'positive', 'negative', 'neutral'
  score: number; // confidence score (0-1)
}

export interface TextAnalysisResult {
  text: string;
  sentiment: SentimentResult;
  keywords?: string[];
  language?: string;
}

/**
 * Sentiment Analysis Service
 * Uses HuggingFace Inference API with tabularisai/multilingual-sentiment-analysis model
 */
class SentimentService {
  /**
   * Map HuggingFace sentiment labels to our database labels
   * Database constraint: 'positive', 'negative', 'neutral'
   */
  private mapSentimentLabel(label: string): string {
    // Map various label formats to our three categories
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('positive')) {
      return 'positive';
    } else if (lowerLabel.includes('negative')) {
      return 'negative';
    } else if (lowerLabel.includes('neutral') || lowerLabel.includes('mixed')) {
      // Map 'mixed' to 'neutral' since mixed sentiment is essentially neutral
      return 'neutral';
    }

    // Default to neutral if unknown
    console.warn(`⚠️ Unknown sentiment label: "${label}", mapping to neutral`);
    return 'neutral';
  }

  /**
   * Extract important keywords from text
   * Simple implementation: extract words longer than 3 chars, exclude common stopwords
   */
  private extractKeywords(text: string): string[] {
    // Common stopwords (English & Indonesian)
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by',
      'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'ini', 'itu', 'dengan', 'adalah', 'ada', 'juga',
      'tidak', 'akan', 'bisa', 'sudah', 'telah', 'dapat', 'harus', 'saya', 'aku', 'kamu', 'mereka',
      'this', 'that', 'very', 'so', 'just', 'now', 'been', 'have', 'has', 'had', 'do', 'does', 'did'
    ]);

    // Extract words (alphanumeric, > 3 chars)
    const words = text.toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 3 && !stopwords.has(w));

    // Remove duplicates and return
    return [...new Set(words)];
  }

  /**
   * Analyze sentiment of a single text
   */
  async analyzeSingleText(text: string): Promise<TextAnalysisResult> {
    if (!text || text.trim().length === 0) {
      throw new AppError('Text cannot be empty', 400);
    }

    if (!HUGGINGFACE_API_KEY) {
      throw new AppError('HuggingFace API key is not configured', 500);
    }

    try {
      const response = await axios.post(
        HUGGINGFACE_API_URL,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      // HuggingFace returns array of results
      // Format: [[{ label: 'positive', score: 0.99 }, { label: 'negative', score: 0.01 }, ...]]
      const results = response.data[0];

      if (!results || results.length === 0) {
        throw new AppError('No sentiment results returned from API', 500);
      }

      // Get the sentiment with highest score
      const topSentiment = results.reduce((prev: SentimentResult, current: SentimentResult) => {
        return (current.score > prev.score) ? current : prev;
      });

      // Normalize label to lowercase and map to valid labels
      const normalizedLabel = this.mapSentimentLabel(topSentiment.label.toLowerCase());

      // Extract keywords from text
      const keywords = this.extractKeywords(text);

      return {
        text,
        sentiment: {
          label: normalizedLabel,
          score: topSentiment.score,
        },
        keywords,
      };
    } catch (error: any) {
      if (error.response) {
        // HuggingFace API error
        const status = error.response.status;
        const message = error.response.data?.error || 'HuggingFace API error';

        if (status === 401) {
          throw new AppError('Invalid HuggingFace API key', 500);
        } else if (status === 503) {
          throw new AppError('Model is loading, please try again in a moment', 503);
        } else {
          throw new AppError(`HuggingFace API error: ${message}`, status);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new AppError('Request timeout - text may be too long', 408);
      } else if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError('Failed to analyze sentiment', 500);
      }
    }
  }

  /**
   * Analyze sentiment of multiple texts (batch)
   */
  async analyzeBatchTexts(texts: string[]): Promise<TextAnalysisResult[]> {
    if (!texts || texts.length === 0) {
      throw new AppError('Text array cannot be empty', 400);
    }

    if (texts.length > 100) {
      throw new AppError('Maximum 100 texts per batch', 400);
    }

    // Filter out empty texts
    const validTexts = texts.filter(text => text && text.trim().length > 0);

    if (validTexts.length === 0) {
      throw new AppError('No valid texts to analyze', 400);
    }

    // Analyze each text sequentially
    // TODO: Implement parallel processing with rate limiting
    const results: TextAnalysisResult[] = [];

    for (const text of validTexts) {
      try {
        const result = await this.analyzeSingleText(text);
        results.push(result);
      } catch (error) {
        // If one fails, add error result
        results.push({
          text,
          sentiment: {
            label: 'error',
            score: 0,
          },
        });
      }
    }

    return results;
  }

  /**
   * Get sentiment statistics from results
   */
  getSentimentStatistics(results: TextAnalysisResult[]): {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    error: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    averageScore: number;
  } {
    const total = results.length;
    const positive = results.filter(r => r.sentiment.label === 'positive').length;
    const negative = results.filter(r => r.sentiment.label === 'negative').length;
    const neutral = results.filter(r => r.sentiment.label === 'neutral').length;
    const error = results.filter(r => r.sentiment.label === 'error').length;

    const validResults = total - error;

    return {
      total,
      positive,
      negative,
      neutral,
      error,
      positivePercentage: validResults > 0 ? (positive / validResults) * 100 : 0,
      negativePercentage: validResults > 0 ? (negative / validResults) * 100 : 0,
      neutralPercentage: validResults > 0 ? (neutral / validResults) * 100 : 0,
      averageScore: results.reduce((sum, r) => sum + r.sentiment.score, 0) / total,
    };
  }
}

export const sentimentService = new SentimentService();
