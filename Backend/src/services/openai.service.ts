import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Validate OpenAI API Key
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY is not defined in environment variables');
}

class OpenAIService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI service initialized');
    } else {
      console.warn('⚠️ OpenAI service not initialized - API key missing');
    }
  }

  /**
   * Check if OpenAI is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Detect the correct column name for text content in CSV
   * Uses AI to analyze column names and sample data
   */
  async detectTextColumn(
    columns: string[],
    sampleRows: Record<string, any>[]
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI service is not available');
    }

    console.log('🤖 Using AI to detect text column...');
    console.log('📋 Available columns:', columns);

    try {
      const prompt = `You are a data analysis assistant. I have a CSV file with the following columns:

${columns.map((col, i) => `${i + 1}. ${col}`).join('\n')}

Here are 3 sample rows of data:
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Which column contains the main text/comment/review content that should be analyzed for sentiment analysis?
Return ONLY the exact column name, nothing else.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages: [
          {
            role: 'system',
            content:
              'You are a data analysis assistant that identifies the correct column for text analysis. Return only the exact column name.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      });

      const detectedColumn = response.choices[0].message.content?.trim() || '';

      // Validate the detected column exists
      if (columns.includes(detectedColumn)) {
        console.log(`✅ AI detected text column: "${detectedColumn}"`);
        return detectedColumn;
      } else {
        console.warn(`⚠️ AI returned invalid column: "${detectedColumn}"`);
        throw new Error(`Invalid column detected: ${detectedColumn}`);
      }
    } catch (error: any) {
      console.error('❌ AI column detection failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate AI-powered insights from sentiment analysis results
   */
  async generateInsights(results: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
    sampleTexts: { text: string; sentiment: string; score: number }[];
  }): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI service is not available');
    }

    console.log('🤖 Generating AI insights...');

    try {
      const positiveRate = ((results.positive / results.total) * 100).toFixed(1);
      const negativeRate = ((results.negative / results.total) * 100).toFixed(1);
      const neutralRate = ((results.neutral / results.total) * 100).toFixed(1);

      const prompt = `You are a professional sentiment analysis consultant providing insights for business decision-making.

ANALYSIS DATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Analyzed: ${results.total} items
✅ Positive: ${results.positive} (${positiveRate}%)
❌ Negative: ${results.negative} (${negativeRate}%)
➖ Neutral: ${results.neutral} (${neutralRate}%)
📈 Average Sentiment Score: ${results.averageScore.toFixed(3)}

SAMPLE FEEDBACK:
${results.sampleTexts
  .slice(0, 8)
  .map((item, i) => `${i + 1}. [${item.sentiment.toUpperCase()}] "${item.text.substring(0, 120)}"`)
  .join('\n')}

TASK:
Provide a comprehensive analysis structured as follows:

1. OVERALL SENTIMENT: One clear sentence about the dominant sentiment and what it means
2. KEY FINDINGS: 2-3 specific observations from the data (mention percentages, patterns, or trends)
3. ACTIONABLE RECOMMENDATIONS: 2-3 concrete, specific actions to improve sentiment or maintain positive trends
4. PRIORITY AREAS: What should be addressed first based on the negative/neutral feedback

Make it professional, data-driven, and immediately actionable for business stakeholders. Use clear formatting with bullet points or numbered lists where appropriate.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert business analyst specializing in sentiment analysis and customer experience insights. Provide clear, actionable, and professional insights that help businesses make data-driven decisions. Use structured formatting and be specific with recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const insights = response.choices[0].message.content?.trim() || '';
      console.log('✅ AI insights generated');

      return insights;
    } catch (error: any) {
      console.error('❌ AI insights generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Explain why a specific text has a certain sentiment
   */
  async explainSentiment(
    text: string,
    sentiment: string,
    score: number
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI service is not available');
    }

    console.log('🤖 Generating sentiment explanation...');

    try {
      const prompt = `Analyze and explain the sentiment classification for this text:

TEXT: "${text}"

CLASSIFICATION: ${sentiment.toUpperCase()}
CONFIDENCE: ${(score * 100).toFixed(1)}%

Provide a clear explanation that includes:
1. The main reason for this sentiment classification
2. Specific words or phrases that contributed (quote them)
3. Any emotional tone or context that influenced the decision

Keep it concise (2-3 sentences) but insightful.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a sentiment analysis expert who explains classifications with specific evidence. Always quote key words/phrases from the text that influenced the sentiment decision.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      const explanation = response.choices[0].message.content?.trim() || '';
      console.log('✅ Sentiment explanation generated');

      return explanation;
    } catch (error: any) {
      console.error('❌ Sentiment explanation failed:', error.message);
      throw error;
    }
  }

  /**
   * Deep sentiment analysis using GPT-4 for complex context understanding
   */
  async deepSentimentAnalysis(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    explanation: string;
    keyPhrases: string[];
  }> {
    if (!this.openai) {
      throw new Error('OpenAI service is not available');
    }

    console.log('🤖 Performing deep sentiment analysis with AI...');

    try {
      const prompt = `Perform deep sentiment analysis on this text with advanced context understanding:

TEXT: "${text}"

TASK:
Analyze the sentiment considering:
- Explicit emotional words and tone
- Implicit meaning and context
- Sarcasm, irony, or nuanced language
- Overall message and intent

Return a JSON object with these fields:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": <confidence score 0.0 to 1.0>,
  "explanation": "<2-3 sentences explaining the classification with specific evidence from the text>",
  "keyPhrases": ["<phrase 1>", "<phrase 2>", "<phrase 3>", "<phrase 4>"]
}

Guidelines:
- Score should reflect confidence (0.9-1.0 = very confident, 0.6-0.8 = moderately confident, 0.5-0.6 = uncertain)
- keyPhrases should be actual quotes from the text that most influenced the sentiment
- Explanation should quote specific words/phrases and explain their emotional impact

Return ONLY valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert sentiment analyst with deep understanding of language nuances, context, sarcasm, and emotional tone. Provide accurate sentiment analysis with clear evidence. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content?.trim() || '{}';
      const result = JSON.parse(content);

      console.log('✅ Deep sentiment analysis completed');

      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0.5,
        explanation: result.explanation || '',
        keyPhrases: result.keyPhrases || [],
      };
    } catch (error: any) {
      console.error('❌ Deep sentiment analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Batch deep sentiment analysis (for multiple texts)
   */
  async batchDeepSentimentAnalysis(
    texts: string[]
  ): Promise<
    Array<{
      text: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      explanation: string;
      keyPhrases: string[];
    }>
  > {
    if (!this.openai) {
      throw new Error('OpenAI service is not available');
    }

    console.log(`🤖 Performing batch deep sentiment analysis on ${texts.length} texts...`);

    const results = [];
    const BATCH_SIZE = 10; // Process 10 at a time to avoid rate limits

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map((text) => this.deepSentimentAnalysis(text));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(
          ...batchResults.map((result, idx) => ({
            text: batch[idx],
            ...result,
          }))
        );

        // Small delay between batches to respect rate limits
        if (i + BATCH_SIZE < texts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
        // Add failed texts with default values
        batch.forEach((text) => {
          results.push({
            text,
            sentiment: 'neutral' as const,
            score: 0.5,
            explanation: 'Analysis failed',
            keyPhrases: [],
          });
        });
      }
    }

    console.log(`✅ Batch deep sentiment analysis completed`);
    return results;
  }

  /**
   * Parse comments from OCR extracted text (for YouTube, social media screenshots)
   * Returns structured data with username, timestamp, and comment text
   */
  async parseCommentsFromOCR(ocrText: string): Promise<
    Array<{
      username: string;
      timestamp: string;
      comment: string;
    }>
  > {
    if (!this.openai) {
      throw new Error('OpenAI service is not available');
    }

    console.log('🤖 Parsing comments from OCR text with AI...');

    try {
      const prompt = `You are an expert at parsing social media comments from OCR-extracted text across ALL platforms.

OCR EXTRACTED TEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ocrText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK:
Parse this OCR text and extract individual comments with their metadata. This text may be from ANY social media platform including:
- **YouTube** - comments with username, timestamp, like count
- **Instagram** - posts/stories comments with username, timestamp
- **Twitter/X** - tweets/replies with @username, timestamp, engagement metrics
- **Facebook** - post comments with name, time posted
- **TikTok** - video comments with username, timestamp
- **LinkedIn** - post comments with name, job title, timestamp
- **Reddit** - posts/comments with u/username, subreddit, timestamp
- **Discord** - messages with username#tag, timestamp
- **Telegram** - channel/group messages with username, timestamp
- **WhatsApp** - chat messages (if screenshot contains multiple messages)
- **Google Reviews** - reviews with reviewer name, star rating, date
- **Amazon Reviews** - product reviews with reviewer name, rating, date
- **Other platforms** - any comment/review system

Each comment typically has:
- **Username/Name** (may have @, u/, #tag, or plain name)
- **Timestamp** (e.g., "5 days ago", "2 months ago", "3 hours ago", "Jan 15, 2024", "12:45 PM")
- **Comment text** (the actual content/message/review)

Ignore UI elements like: "Reply", "Translate to English", "like", "dislike", "share", "retweet", "follow", "subscribe", "view replies", "show more", "edited", button labels, navigation elements, etc.

Return a JSON object with comments array like this:
{
  "comments": [
    {
      "username": "username_here",
      "timestamp": "time_ago_here",
      "comment": "actual_comment_text_here"
    }
  ]
}

Guidelines:
- **Platform Recognition**: Automatically detect which platform based on format (YouTube style, Instagram style, Twitter/X style, etc.)
- **Username Extraction**: Extract username/name even if it has @, u/, #tag, or no prefix
- **Timestamp Flexibility**: Handle all timestamp formats (relative like "5 days ago", absolute like "Jan 15, 2024", time only like "12:45 PM")
- **Comment Content**: Only include actual comment/message/review text, not UI elements or metadata
- **Multi-line Comments**: Merge multi-line comments into single comment field, preserve line breaks if part of content
- **Ratings/Stars**: If platform has ratings (Google Reviews, Amazon), you can include in comment like "⭐⭐⭐⭐⭐ [comment text]"
- **Emojis**: Preserve emojis in comment text
- **Missing Data**: If username is missing use "Unknown User", if timestamp missing use "Unknown Time"
- **Skip Empty**: Skip empty, meaningless, or UI-only text

Return ONLY valid JSON object with comments array, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at parsing and structuring social media comments from OCR text. You accurately identify usernames, timestamps, and comment content while filtering out UI elements. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content?.trim() || '{}';
      const result = JSON.parse(content);

      // Handle both array directly or { comments: array } structure
      const comments = Array.isArray(result) ? result : result.comments || [];

      console.log(`✅ Parsed ${comments.length} comments from OCR text`);

      return comments;
    } catch (error: any) {
      console.error('❌ Comment parsing failed:', error.message);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
export default openaiService;
