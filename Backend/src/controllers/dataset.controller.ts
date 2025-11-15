import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { datasetService } from '../services/dataset.service';
import { sentimentService } from '../services/sentiment.service';
import { AppError } from '../utils/AppError';

/**
 * Fetch Tokopedia product reviews dataset
 * GET /api/datasets/tokopedia-reviews
 */
export const fetchTokopediaReviews = async (
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

    const items = await datasetService.fetchTokopediaReviewsDataset(limit, offset);

    res.status(200).json({
      success: true,
      message: `Fetched ${items.length} items from Tokopedia reviews dataset`,
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
 * Fetch and analyze Tokopedia reviews with our model
 * POST /api/datasets/tokopedia-reviews/analyze
 */
export const fetchAndAnalyzeTokopediaReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit, offset = 0, keywords } = req.body;

    // Fetch dataset to ensure we get keyword matches
    // Default: 500 items (good balance of coverage vs rate limits)
    // Users can specify higher limit if needed, but default is conservative
    const fetchLimit = keywords && keywords.length > 0 ? 1000 : (limit || 1000);
    const items = await datasetService.fetchTokopediaReviewsDataset(fetchLimit, offset);
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
        const productNameLower = item.productName ? item.productName.toLowerCase() : '';

        // Search in both text review AND product name
        return keywordArray.some((keyword: string) => {
          const keywordLower = keyword.toLowerCase();
          return textLower.includes(keywordLower) || productNameLower.includes(keywordLower);
        });
      });
      console.log(`🔍 Filtered by keywords [${keywordArray.join(', ')}]:`, filteredItems.length, 'items');

      if (filteredItems.length === 0) {
        throw new AppError(`No reviews found containing keywords: ${keywordArray.join(', ')}`, 404);
      }

      // Apply limit only if specified, otherwise cap at 100 (sentiment service limit)
      if (limit) {
        filteredItems = filteredItems.slice(0, limit);
      } else if (filteredItems.length > 100) {
        console.log(`⚠️ Filtered results (${filteredItems.length}) exceed max batch size, limiting to 100`);
        filteredItems = filteredItems.slice(0, 100);
      }
    } else if (!limit && filteredItems.length > 100) {
      // No keywords, no limit specified - cap at 100 items
      console.log(`⚠️ Dataset items (${filteredItems.length}) exceed max batch size, limiting to 100`);
      filteredItems = filteredItems.slice(0, 100);
    }

    // Extract texts to analyze
    const texts = filteredItems.map(item => item.text).filter(text => text && text.trim().length > 0);
    console.log('📝 Texts to analyze:', texts.length);

    if (texts.length === 0) {
      throw new AppError('No valid text found in dataset items', 400);
    }

    // Final safety check - sentiment service has 100 texts limit
    if (texts.length > 100) {
      throw new AppError('Maximum 100 texts can be analyzed per request', 400);
    }

    // Analyze with our sentiment model
    const analysisResults = await sentimentService.analyzeBatchTexts(texts);
    const statistics = sentimentService.getSentimentStatistics(analysisResults);

    // Add product name to results
    const results = analysisResults.map((result, index) => ({
      ...result,
      productName: filteredItems[index].productName,
    }));

    // Compare with original labels if available
    const comparison = filteredItems.map((item, index) => ({
      text: item.text,
      productName: item.productName,
      originalLabel: item.sentiment || item.originalLabel,
      predictedSentiment: analysisResults[index].sentiment,
      match: item.sentiment === analysisResults[index].sentiment.label,
    }));

    const accuracy = comparison.filter(c => c.match).length / comparison.length * 100;

    const message = keywords && keywords.length > 0
      ? `Analyzed ${results.length} Tokopedia reviews containing keywords: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}`
      : `Analyzed ${results.length} Tokopedia reviews`;

    res.status(200).json({
      success: true,
      message,
      data: {
        results,
        statistics,
        comparison,
        accuracy: accuracy.toFixed(2) + '%',
        source: 'Tokopedia Product Reviews Dataset',
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
