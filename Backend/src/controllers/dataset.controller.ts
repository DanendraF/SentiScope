import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { datasetService } from '../services/dataset.service';
import { sentimentService } from '../services/sentiment.service';
import { AppError } from '../utils/AppError';

/**
 * Fetch YouTube comment sentiment dataset
 * GET /api/datasets/youtube-comments
 */
export const fetchYoutubeComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit > 500) {
      throw new AppError('Maximum limit is 500 items', 400);
    }

    const items = await datasetService.fetchYoutubeCommentDataset(limit, offset);

    res.status(200).json({
      success: true,
      message: `Fetched ${items.length} items from YouTube comment dataset`,
      data: {
        items,
        count: items.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch and analyze YouTube comments with our model
 * POST /api/datasets/youtube-comments/analyze
 */
export const fetchAndAnalyzeYoutubeComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 50, offset = 0, keywords } = req.body;

    if (limit > 100) {
      throw new AppError('Maximum limit is 100 items for analysis', 400);
    }

    // Fetch larger dataset if keywords are provided (need more data to filter)
    const fetchLimit = keywords && keywords.length > 0 ? Math.min(limit * 10, 500) : limit;
    const items = await datasetService.fetchYoutubeCommentDataset(fetchLimit, offset);
    console.log('📊 Fetched dataset items:', items.length);

    if (items.length === 0) {
      throw new AppError('No data found in dataset', 404);
    }

    // Filter by keywords if provided
    let filteredItems = items;
    if (keywords && keywords.length > 0) {
      const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
      filteredItems = items.filter(item => {
        const textLower = item.text.toLowerCase();
        return keywordArray.some((keyword: string) => textLower.includes(keyword.toLowerCase()));
      });
      console.log(`🔍 Filtered by keywords [${keywordArray.join(', ')}]:`, filteredItems.length, 'items');

      if (filteredItems.length === 0) {
        throw new AppError(`No comments found containing keywords: ${keywordArray.join(', ')}`, 404);
      }

      // Limit filtered results
      filteredItems = filteredItems.slice(0, limit);
    }

    // Extract texts to analyze
    const texts = filteredItems.map(item => item.text).filter(text => text && text.trim().length > 0);
    console.log('📝 Texts to analyze:', texts.length);

    if (texts.length === 0) {
      throw new AppError('No valid text found in dataset items', 400);
    }

    // Analyze with our sentiment model
    const results = await sentimentService.analyzeBatchTexts(texts);
    const statistics = sentimentService.getSentimentStatistics(results);

    // Compare with original labels if available
    const comparison = filteredItems.map((item, index) => ({
      text: item.text,
      originalLabel: item.sentiment || item.originalLabel,
      predictedSentiment: results[index].sentiment,
      match: item.sentiment === results[index].sentiment.label,
    }));

    const accuracy = comparison.filter(c => c.match).length / comparison.length * 100;

    const message = keywords && keywords.length > 0
      ? `Analyzed ${results.length} YouTube comments containing keywords: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}`
      : `Analyzed ${results.length} YouTube comments`;

    res.status(200).json({
      success: true,
      message,
      data: {
        results,
        statistics,
        comparison,
        accuracy: accuracy.toFixed(2) + '%',
        source: 'YouTube Comments Dataset',
        keywords: keywords || null,
        totalFetched: items.length,
        filteredCount: filteredItems.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch generic HuggingFace dataset
 * POST /api/datasets/fetch
 */
export const fetchDataset = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { datasetName, config = 'default', split = 'train', limit = 100, offset = 0 } = req.body;

    if (!datasetName) {
      throw new AppError('Dataset name is required', 400);
    }

    if (limit > 500) {
      throw new AppError('Maximum limit is 500 items', 400);
    }

    const items = await datasetService.fetchHuggingFaceDataset(
      datasetName,
      config,
      split,
      limit,
      offset
    );

    res.status(200).json({
      success: true,
      message: `Fetched ${items.length} items from ${datasetName}`,
      data: {
        datasetName,
        items,
        count: items.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dataset info/metadata
 * GET /api/datasets/info/:datasetName
 */
export const getDatasetInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { datasetName } = req.params;

    if (!datasetName) {
      throw new AppError('Dataset name is required', 400);
    }

    const info = await datasetService.getDatasetInfo(datasetName);

    res.status(200).json({
      success: true,
      message: 'Dataset info retrieved successfully',
      data: info,
    });
  } catch (error) {
    next(error);
  }
};
