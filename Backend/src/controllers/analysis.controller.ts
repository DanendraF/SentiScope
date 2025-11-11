import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sentimentService } from '../services/sentiment.service';
import { analysisDatabaseService } from '../services/analysis.database.service';
import { AppError } from '../utils/AppError';

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
