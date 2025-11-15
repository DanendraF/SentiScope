import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sentimentService } from '../services/sentiment.service';
import { analysisDatabaseService } from '../services/analysis.database.service';
import { storageService } from '../services/storage.service';
import { openaiService } from '../services/openai.service';
import { AppError } from '../utils/AppError';
import Papa from 'papaparse';
import fs from 'fs';
import Tesseract from 'tesseract.js';
import OpenAI from 'openai';
import { supabase } from '../config/database';

/**
 * Analyze single text
 * POST /api/analysis/text
 */
export const analyzeSingleText = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, saveToDatabase = false, title } = req.body;

    if (!text || typeof text !== 'string') {
      throw new AppError('Text is required and must be a string', 400);
    }

    // Analyze sentiment
    const result = await sentimentService.analyzeSingleText(text);
    const statistics = sentimentService.getSentimentStatistics([result]);

    // Save to database if requested
    let savedAnalysis = null;
    if (saveToDatabase && req.user?.userId) {
      const analysisTitle = title || `Analysis - ${new Date().toLocaleString()}`;
      savedAnalysis = await analysisDatabaseService.saveAnalysis(
        req.user.userId,
        analysisTitle,
        'text',
        [result]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Text analyzed successfully',
      data: {
        result,
        statistics,
        ...(savedAnalysis && { analysis: savedAnalysis }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze multiple texts (batch)
 * POST /api/analysis/batch
 */
export const analyzeBatchTexts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { texts, saveToDatabase = false, title } = req.body;

    if (!texts || !Array.isArray(texts)) {
      throw new AppError('Texts must be an array', 400);
    }

    if (texts.length === 0) {
      throw new AppError('Texts array cannot be empty', 400);
    }

    if (texts.length > 100) {
      throw new AppError('Maximum 100 texts per batch', 400);
    }

    // Analyze all texts
    const results = await sentimentService.analyzeBatchTexts(texts);
    const statistics = sentimentService.getSentimentStatistics(results);

    // Save to database if requested
    let savedAnalysis = null;
    if (saveToDatabase && req.user?.userId) {
      const analysisTitle = title || `Batch Analysis - ${new Date().toLocaleString()}`;
      savedAnalysis = await analysisDatabaseService.saveAnalysis(
        req.user.userId,
        analysisTitle,
        'batch',
        results
      );
    }

    res.status(200).json({
      success: true,
      message: `Analyzed ${results.length} texts successfully`,
      data: {
        results,
        statistics,
        ...(savedAnalysis && { analysis: savedAnalysis }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze keywords
 * POST /api/analysis/keywords
 */
export const analyzeKeywords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { keywords, saveToDatabase = false, title } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      throw new AppError('Keywords must be an array', 400);
    }

    if (keywords.length === 0) {
      throw new AppError('Keywords array cannot be empty', 400);
    }

    if (keywords.length > 50) {
      throw new AppError('Maximum 50 keywords per request', 400);
    }

    // Analyze each keyword as text
    const results = await sentimentService.analyzeBatchTexts(keywords);
    const statistics = sentimentService.getSentimentStatistics(results);

    // Save to database if requested
    let savedAnalysis = null;
    if (saveToDatabase && req.user?.userId) {
      const analysisTitle = title || `Keywords Analysis - ${new Date().toLocaleString()}`;
      savedAnalysis = await analysisDatabaseService.saveAnalysis(
        req.user.userId,
        analysisTitle,
        'keywords',
        results
      );
    }

    res.status(200).json({
      success: true,
      message: `Analyzed ${results.length} keywords successfully`,
      data: {
        results,
        statistics,
        ...(savedAnalysis && { analysis: savedAnalysis }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deep sentiment analysis with AI explanations
 * POST /api/analysis/deep
 */
export const deepSentimentAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, texts, saveToDatabase = false, title } = req.body;

    if (!openaiService.isAvailable()) {
      throw new AppError('AI service is not available. Please configure OPENAI_API_KEY', 503);
    }

    let results: any[] = [];
    let inputType = 'text';

    // Handle single text
    if (text && typeof text === 'string') {
      console.log('🤖 Performing deep AI sentiment analysis...');
      const aiResult = await openaiService.deepSentimentAnalysis(text);

      results.push({
        text: text,
        sentiment: {
          label: aiResult.sentiment,
          score: aiResult.score,
        },
        explanation: aiResult.explanation,
        keyPhrases: aiResult.keyPhrases,
      });
    }
    // Handle batch texts
    else if (texts && Array.isArray(texts)) {
      if (texts.length === 0) {
        throw new AppError('Texts array cannot be empty', 400);
      }

      if (texts.length > 20) {
        throw new AppError('Maximum 20 texts for deep analysis (due to API costs)', 400);
      }

      console.log(`🤖 Performing batch deep AI sentiment analysis on ${texts.length} texts...`);
      inputType = 'batch';

      const aiResults = await openaiService.batchDeepSentimentAnalysis(texts);

      results = aiResults.map((result) => ({
        text: result.text,
        sentiment: {
          label: result.sentiment,
          score: result.score,
        },
        explanation: result.explanation,
        keyPhrases: result.keyPhrases,
      }));
    } else {
      throw new AppError('Either "text" or "texts" is required', 400);
    }

    // Calculate statistics
    const statistics = {
      total: results.length,
      positive: results.filter((r) => r.sentiment.label === 'positive').length,
      negative: results.filter((r) => r.sentiment.label === 'negative').length,
      neutral: results.filter((r) => r.sentiment.label === 'neutral').length,
      averageScore:
        results.reduce((sum, r) => sum + r.sentiment.score, 0) / results.length,
    };

    // Generate AI insights
    console.log('🤖 Generating AI insights...');
    const insights = await openaiService.generateInsights({
      total: statistics.total,
      positive: statistics.positive,
      negative: statistics.negative,
      neutral: statistics.neutral,
      averageScore: statistics.averageScore,
      sampleTexts: results.map((r) => ({
        text: r.text,
        sentiment: r.sentiment.label,
        score: r.sentiment.score,
      })),
    });

    // Save to database if requested
    let savedAnalysis = null;
    if (saveToDatabase && req.user) {
      const analysisTitle = title || `Deep AI Analysis - ${new Date().toLocaleDateString()}`;

      // Convert to format expected by saveAnalysis
      const formattedResults = results.map((r) => ({
        text: r.text,
        sentiment: r.sentiment,
      }));

      savedAnalysis = await analysisDatabaseService.saveAnalysis(
        req.user.userId,
        analysisTitle,
        inputType as 'text' | 'batch' | 'keywords' | 'csv',
        formattedResults,
        undefined, // filePath
        undefined, // fileUrl
        undefined, // originalFileName
        insights // aiInsights
      );
    }

    res.status(200).json({
      success: true,
      message: `Deep AI analysis completed for ${results.length} text(s)`,
      data: {
        results,
        statistics,
        insights,
        ...(savedAnalysis && { analysis: savedAnalysis }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analysis statistics
 * POST /api/analysis/statistics
 */
export const getStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { results } = req.body;

    if (!results || !Array.isArray(results)) {
      throw new AppError('Results must be an array', 400);
    }

    const statistics = sentimentService.getSentimentStatistics(results);

    res.status(200).json({
      success: true,
      message: 'Statistics calculated successfully',
      data: {
        statistics,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user analysis history
 * GET /api/analysis/history
 */
export const getAnalysisHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const analyses = await analysisDatabaseService.getUserAnalyses(userId, limit, offset);
    const totalCount = await analysisDatabaseService.getUserAnalysisCount(userId);

    res.status(200).json({
      success: true,
      message: 'Analysis history retrieved successfully',
      data: {
        analyses,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single analysis by ID
 * GET /api/analysis/:id
 */
export const getAnalysisById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const analysisId = req.params.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!analysisId) {
      throw new AppError('Analysis ID is required', 400);
    }

    const analysis = await analysisDatabaseService.getAnalysisById(analysisId, userId);

    if (!analysis) {
      throw new AppError('Analysis not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Analysis retrieved successfully',
      data: {
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete analysis by ID
 * DELETE /api/analysis/:id
 */
export const deleteAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const analysisId = req.params.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!analysisId) {
      throw new AppError('Analysis ID is required', 400);
    }

    const deleted = await analysisDatabaseService.deleteAnalysis(analysisId, userId);

    if (!deleted) {
      throw new AppError('Analysis not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function: Fallback column detection (manual)
 */
const fallbackColumnDetection = (columns: string[]): string => {
  // Try common column names (including plural variations)
  const commonNames = [
    'text', 'texts',
    'comment', 'comments',
    'review', 'reviews',
    'content', 'contents',
    'message', 'messages',
    'description', 'descriptions',
    'feedback', 'feedbacks',
    'opinion', 'opinions',
    'sentence', 'sentences',
  ];

  // Try exact match first
  let foundColumn = commonNames.find(name => columns.includes(name));

  // If no exact match, try case-insensitive match
  if (!foundColumn) {
    foundColumn = columns.find(col =>
      commonNames.some(name => col.toLowerCase() === name.toLowerCase())
    );
  }

  // If still no match, try partial match (e.g., "user_comment" contains "comment")
  if (!foundColumn) {
    foundColumn = columns.find(col => {
      const lowerCol = col.toLowerCase();
      return commonNames.some(name => lowerCol.includes(name.toLowerCase()));
    });
  }

  if (foundColumn) {
    return foundColumn;
  }

  // Use first column if no match found
  return columns[0];
};

/**
 * Analyze CSV file
 * POST /api/analysis/csv
 */
export const analyzeCsvFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!req.file) {
      throw new AppError('CSV file is required', 400);
    }

    const { saveToDatabase = false, title, textColumn = 'text' } = req.body;

    // Read and parse CSV file
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');

    const parseResult = Papa.parse<Record<string, any>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      quoteChar: '"',
      escapeChar: '"',
      delimitersToGuess: [',', '\t', '|', ';'],
      transform: (value: string) => {
        // Clean up any problematic quotes
        return value.replace(/^["']|["']$/g, '').trim();
      },
    });

    // Filter out critical errors only (ignore minor quote warnings)
    const criticalErrors = (parseResult.errors || []).filter(
      (error: any) => error.type === 'FieldMismatch' || error.type === 'Delimiter'
    );

    if (criticalErrors.length > 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      throw new AppError(`CSV parsing error: ${criticalErrors[0].message}`, 400);
    }

    // Log warnings if any (but don't fail)
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn(`⚠️ CSV parsing warnings (${parseResult.errors.length}):`,
        parseResult.errors.slice(0, 3).map((e: any) => e.message)
      );
    }

    const rows = parseResult.data as Record<string, any>[];

    if (rows.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      throw new AppError('CSV file is empty', 400);
    }

    // Get available columns
    const columns = Object.keys(rows[0]);
    let selectedColumn = textColumn;

    // AI-assisted column detection if OpenAI is available and column not specified
    if (!columns.includes(textColumn) && openaiService.isAvailable()) {
      try {
        console.log('🤖 Using AI to detect text column...');
        selectedColumn = await openaiService.detectTextColumn(columns, rows.slice(0, 3));
        console.log(`✅ AI detected column: "${selectedColumn}"`);
      } catch (aiError: any) {
        console.warn('⚠️ AI column detection failed, falling back to manual detection');
        console.warn('   Error:', aiError.message);

        // Fallback to manual detection
        selectedColumn = fallbackColumnDetection(columns);
      }
    } else if (!columns.includes(textColumn)) {
      // Fallback to manual detection if AI not available
      console.log('📊 Using manual column detection...');
      selectedColumn = fallbackColumnDetection(columns);
    }

    console.log(`📊 CSV columns found:`, columns);
    console.log(`📝 Using column: "${selectedColumn}" for text extraction`);

    // Extract texts from selected column
    const texts = rows
      .map(row => row[selectedColumn])
      .filter(text => text && typeof text === 'string' && text.trim().length > 0)
      .map(text => String(text).trim());

    console.log(`📝 Sample texts extracted (first 3):`);
    texts.slice(0, 3).forEach((text, i) => {
      console.log(`   ${i + 1}. "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    });

    if (texts.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      throw new AppError(`No valid text found in column "${selectedColumn}"`, 400);
    }

    // Always use AI analysis if available
    let results: any[] = [];
    let statistics: any;
    let aiInsights: string | undefined;

    if (openaiService.isAvailable()) {
      // AI Analysis Mode - analyze all texts
      const textsToAnalyze = texts;

      console.log(`🤖 Analyzing ${textsToAnalyze.length} texts from CSV with AI...`);

      // Use AI for deep analysis
      const aiResults = await openaiService.batchDeepSentimentAnalysis(textsToAnalyze);

      results = aiResults.map((result) => ({
        text: result.text,
        sentiment: {
          label: result.sentiment,
          score: result.score,
        },
        explanation: result.explanation,
        keyPhrases: result.keyPhrases,
      }));

      // Calculate statistics
      statistics = {
        total: results.length,
        positive: results.filter((r) => r.sentiment.label === 'positive').length,
        negative: results.filter((r) => r.sentiment.label === 'negative').length,
        neutral: results.filter((r) => r.sentiment.label === 'neutral').length,
        averageScore: results.reduce((sum, r) => sum + r.sentiment.score, 0) / results.length,
      };

      // Generate AI insights
      console.log('🤖 Generating AI insights for CSV data...');
      aiInsights = await openaiService.generateInsights({
        total: statistics.total,
        positive: statistics.positive,
        negative: statistics.negative,
        neutral: statistics.neutral,
        averageScore: statistics.averageScore,
        sampleTexts: results.slice(0, 5).map((r) => ({
          text: r.text,
          sentiment: r.sentiment.label,
          score: r.sentiment.score,
        })),
      });

    } else {
      // Traditional Analysis Mode - analyze all texts (FREE with IndoBERT)
      const textsToAnalyze = texts;

      console.log(`🔍 Analyzing ${textsToAnalyze.length} texts from CSV with IndoBERT (FREE)...`);

      // Analyze texts in batches of 100 (API limit)
      const BATCH_SIZE = 100;
      const allResults: any[] = [];

      for (let i = 0; i < textsToAnalyze.length; i += BATCH_SIZE) {
        const batch = textsToAnalyze.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(textsToAnalyze.length / BATCH_SIZE);

        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)...`);

        const batchResults = await sentimentService.analyzeBatchTexts(batch);
        allResults.push(...batchResults);

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < textsToAnalyze.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      results = allResults;
      statistics = sentimentService.getSentimentStatistics(results);
    }

    // Upload file to Supabase Storage
    let filePath: string | undefined;
    let fileUrl: string | undefined;

    try {
      const uploadResult = await storageService.uploadFile(
        req.file.path,
        req.file.originalname,
        userId,
        'csv'
      );

      if (uploadResult) {
        filePath = uploadResult.path;
        fileUrl = uploadResult.url;
        console.log(`✅ CSV file uploaded to storage: ${filePath}`);
      } else {
        console.warn('⚠️ Failed to upload CSV file to storage, continuing without file storage');
      }
    } catch (uploadError: any) {
      console.error('❌ Failed to upload file to storage:', uploadError.message);
      console.warn('⚠️ Continuing without file storage');
    }

    // Save to database if requested
    let savedAnalysis = null;
    if (saveToDatabase) {
      const analysisTitle = title || `CSV Analysis - ${req.file.originalname}`;
      savedAnalysis = await analysisDatabaseService.saveAnalysis(
        userId,
        analysisTitle,
        'csv',
        results,
        filePath,
        fileUrl,
        req.file.originalname,
        aiInsights // Add AI insights
      );
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `Analyzed ${results.length} texts from CSV successfully${aiInsights ? ' with AI' : ''}`,
      data: {
        fileName: req.file.originalname,
        totalRows: rows.length,
        analyzedRows: results.length,
        columnUsed: selectedColumn,
        availableColumns: columns,
        usedAI: !!aiInsights,
        results,
        statistics,
        ...(aiInsights && { insights: aiInsights }),
        ...(savedAnalysis && { analysis: savedAnalysis }),
      },
    });
  } catch (error) {
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Analyze Image file with OCR
 * POST /api/analysis/image
 */
export const analyzeImageFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!req.file) {
      throw new AppError('Image file is required', 400);
    }

    const { saveToDatabase = false, title } = req.body;

    console.log(`🖼️ Processing image: ${req.file.originalname}`);

    // Perform OCR on the image
    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`📝 OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
          }
        },
      }
    );

    console.log(`✅ OCR completed. Extracted ${text.length} characters`);

    // Clean extracted text
    const cleanedText = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    if (cleanedText.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      throw new AppError('No text found in image', 400);
    }

    console.log(`📝 Cleaned text (${cleanedText.length} chars):\n${cleanedText.substring(0, 200)}...`);

    // Use AI to parse comments structure (username, timestamp, comment)
    let texts: string[] = [];
    let parsedComments: Array<{ username: string; timestamp: string; comment: string }> = [];

    if (openaiService.isAvailable()) {
      try {
        console.log('🤖 Using AI to parse comment structure...');
        parsedComments = await openaiService.parseCommentsFromOCR(cleanedText);

        if (parsedComments.length > 0) {
          texts = parsedComments.map(c => c.comment);
          console.log(`✅ AI parsed ${parsedComments.length} comments successfully`);
        } else {
          console.log('⚠️ AI parsing returned no comments, falling back to line-by-line');
          texts = cleanedText
            .split('\n')
            .filter(t => t.trim().length > 10);
        }
      } catch (error) {
        console.error('❌ AI comment parsing failed, falling back to line-by-line:', error);
        texts = cleanedText
          .split('\n')
          .filter(t => t.trim().length > 10);
      }
    } else {
      // Fallback if AI not available
      texts = cleanedText
        .split('\n')
        .filter(t => t.trim().length > 10);
    }

    if (texts.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      throw new AppError('No valid text extracted from image', 400);
    }

    console.log(`🔍 Analyzing ${texts.length} text lines from image...`);

    // Always use AI analysis if available
    let results: any[] = [];
    let statistics: any;
    let aiInsights: string | undefined;

    if (openaiService.isAvailable()) {
      // AI Analysis Mode - analyze all texts (may incur OpenAI costs)
      const textsToAnalyze = texts;

      console.log(`🤖 Analyzing ${textsToAnalyze.length} text lines with AI (OpenAI costs may apply)...`);

      // Use AI for deep analysis
      const aiResults = await openaiService.batchDeepSentimentAnalysis(textsToAnalyze);

      results = aiResults.map((result, index) => {
        // Find matching parsed comment for metadata
        const parsedComment = parsedComments[index];

        return {
          text: result.text,
          sentiment: {
            label: result.sentiment,
            score: result.score,
          },
          explanation: result.explanation,
          keyPhrases: result.keyPhrases,
          // Add metadata if available from parsed comments
          ...(parsedComment && {
            username: parsedComment.username,
            timestamp: parsedComment.timestamp,
          }),
        };
      });

      // Calculate statistics
      statistics = {
        total: results.length,
        positive: results.filter((r) => r.sentiment.label === 'positive').length,
        negative: results.filter((r) => r.sentiment.label === 'negative').length,
        neutral: results.filter((r) => r.sentiment.label === 'neutral').length,
        averageScore: results.reduce((sum, r) => sum + r.sentiment.score, 0) / results.length,
      };

      // Generate AI insights
      console.log('🤖 Generating AI insights for OCR text...');
      aiInsights = await openaiService.generateInsights({
        total: statistics.total,
        positive: statistics.positive,
        negative: statistics.negative,
        neutral: statistics.neutral,
        averageScore: statistics.averageScore,
        sampleTexts: results.slice(0, 5).map((r) => ({
          text: r.text,
          sentiment: r.sentiment.label,
          score: r.sentiment.score,
        })),
      });

    } else {
      // Traditional Analysis Mode
      results = await sentimentService.analyzeBatchTexts(texts);
      statistics = sentimentService.getSentimentStatistics(results);
    }

    // Upload file to Supabase Storage
    let filePath: string | undefined;
    let fileUrl: string | undefined;

    try {
      const uploadResult = await storageService.uploadFile(
        req.file.path,
        req.file.originalname,
        userId,
        'image'
      );

      if (uploadResult) {
        filePath = uploadResult.path;
        fileUrl = uploadResult.url;
        console.log(`✅ Image file uploaded to storage: ${filePath}`);
      } else {
        console.warn('⚠️ Failed to upload image file to storage, continuing without file storage');
      }
    } catch (uploadError: any) {
      console.error('❌ Failed to upload file to storage:', uploadError.message);
      console.warn('⚠️ Continuing without file storage');
    }

    // Save to database if requested
    let savedAnalysis = null;
    if (saveToDatabase) {
      const analysisTitle = title || `Image Analysis - ${req.file.originalname}`;
      savedAnalysis = await analysisDatabaseService.saveAnalysis(
        userId,
        analysisTitle,
        'image', // Use 'image' type for image uploads
        results,
        filePath,
        fileUrl,
        req.file.originalname,
        aiInsights // Add AI insights
      );
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `Analyzed ${results.length} text lines from image successfully${aiInsights ? ' with AI' : ''}`,
      data: {
        fileName: req.file.originalname,
        extractedText: cleanedText,
        analyzedLines: results.length,
        usedAI: !!aiInsights,
        results,
        statistics,
        ...(aiInsights && { insights: aiInsights }),
        ...(savedAnalysis && { analysis: savedAnalysis }),
      },
    });
  } catch (error) {
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Chat with AI about analysis results
 * POST /api/analysis/chat
 */
export const chatWithAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { question, context, analysisId } = req.body;

    if (!question || typeof question !== 'string') {
      throw new AppError('Question is required and must be a string', 400);
    }

    if (!context || typeof context !== 'object') {
      throw new AppError('Analysis context is required', 400);
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare context summary for the AI
    const { statistics, aiInsights, sampleResults, totalResults } = context;

    const positivePercentage = statistics.positivePercentage || 0;
    const negativePercentage = statistics.negativePercentage || 0;
    const neutralPercentage = statistics.neutralPercentage || 0;
    const averageScore = statistics.averageScore || 0;

    const sampleResultsText = sampleResults.map((r: any, i: number) => {
      const truncatedText = r.text.substring(0, 100);
      const suffix = r.text.length > 100 ? '...' : '';
      const productInfo = r.productName ? ` (Product: ${r.productName})` : '';
      return `${i + 1}. [${r.sentiment.toUpperCase()}]${productInfo} ${truncatedText}${suffix}`;
    }).join('\n');

    const hasProductNames = sampleResults.some((r: any) => r.productName);
    const dataSource = hasProductNames ? 'Tokopedia Product Reviews' : 'User-provided text';

    const contextSummary = `Analysis Context:
- Data Source: ${dataSource}
- Total analyzed items: ${totalResults}
- Positive: ${statistics.positive} (${positivePercentage.toFixed(1)}%)
- Negative: ${statistics.negative} (${negativePercentage.toFixed(1)}%)
- Neutral: ${statistics.neutral} (${neutralPercentage.toFixed(1)}%)
- Average confidence: ${(averageScore * 100).toFixed(1)}%

${aiInsights ? `Previous AI Insights:\n${aiInsights}\n` : ''}

Sample Results (first 10):
${sampleResultsText}`;

    // Create chat completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant specialized in sentiment analysis for e-commerce and general text. You help users understand their sentiment analysis results by answering questions about the data, providing insights, and making recommendations. When analyzing product reviews, provide specific insights about products and customer satisfaction. Be concise, friendly, and actionable in your responses. Use the provided analysis context to answer questions accurately.',
        },
        {
          role: 'user',
          content: `${contextSummary}\n\nUser Question: ${question}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Save chat messages to database if analysisId is provided
    if (analysisId) {
      try {
        // Save user message
        await supabase.from('analysis_chat_messages').insert({
          analysis_id: analysisId,
          role: 'user',
          content: question,
        });

        // Save assistant response
        await supabase.from('analysis_chat_messages').insert({
          analysis_id: analysisId,
          role: 'assistant',
          content: response,
        });
      } catch (dbError) {
        console.error('⚠️ Failed to save chat messages:', dbError);
        // Don't fail the request if saving messages fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Chat response generated successfully',
      data: {
        response,
        question,
      },
    });
  } catch (error: any) {
    console.error('❌ Chatbot error:', error);

    if (error.status === 429) {
      throw new AppError('OpenAI API rate limit exceeded. Please try again later.', 429);
    }

    if (error.code === 'insufficient_quota') {
      throw new AppError('OpenAI API quota exceeded. Please contact administrator.', 503);
    }

    next(error);
  }
};

/**
 * Get chat history for an analysis
 * GET /api/analysis/:id/chat-history
 */
export const getChatHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Verify user owns this analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      throw new AppError('Analysis not found', 404);
    }

    // Get chat messages
    const { data: messages, error: messagesError } = await supabase
      .from('analysis_chat_messages')
      .select('*')
      .eq('analysis_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new AppError('Failed to fetch chat history', 500);
    }

    res.status(200).json({
      success: true,
      message: 'Chat history retrieved successfully',
      data: {
        messages: messages || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
