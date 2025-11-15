import axios from 'axios';
import { AppError } from '../utils/AppError';

const HUGGINGFACE_DATASETS_API = 'https://datasets-server.huggingface.co/rows';

interface HuggingFaceDatasetRow {
  row: {
    // Tokopedia product review dataset fields
    review?: string;
    rating?: number;
    product_name?: string;
    // Generic fields
    text?: string;
    comment?: string;
    content?: string;
    sentence?: string;
    label?: number | string;
    sentiment?: string;
    [key: string]: any;
  };
}

interface DatasetItem {
  text: string;
  originalLabel: string | number;
  sentiment?: string;
  productName?: string;
}

/**
 * Dataset Service
 * Handles fetching datasets from HuggingFace
 */
class DatasetService {
  /**
   * Fetch Tokopedia Product Reviews dataset from HuggingFace
   * Dataset: farhan999/tokopedia-product-reviews
   */
  async fetchTokopediaReviewsDataset(limit: number = 100, offset: number = 0): Promise<DatasetItem[]> {
    try {
      // HuggingFace API has max length of 100 per request
      // If we need more, we'll make multiple requests
      const maxPerRequest = 100;
      const allItems: DatasetItem[] = [];

      let remainingLimit = limit;
      let currentOffset = offset;

      while (remainingLimit > 0) {
        const batchSize = Math.min(remainingLimit, maxPerRequest);

        const response = await axios.get(HUGGINGFACE_DATASETS_API, {
          params: {
            dataset: 'farhamu/tokopedia-product-reviews-2019',
            config: 'default',
            split: 'train',
            offset: currentOffset,
            length: batchSize,
          },
          timeout: 30000,
        });

        if (!response.data || !response.data.rows) {
          throw new AppError('Invalid response from HuggingFace API', 500);
        }

        // Map dataset rows to our format
        const items: DatasetItem[] = response.data.rows.map((item: HuggingFaceDatasetRow) => {
          const row = item.row;

          // Extract text (Tokopedia dataset uses 'review' field)
          const text = row.review || row.text || row.comment || row.content || '';

          // Extract rating (Tokopedia dataset uses 'rating' field - 1-5 stars)
          const rating = row.rating || (row.label !== undefined ? row.label : 0);

          // Extract product name
          const productName = row.product_name || undefined;

          // Map rating to sentiment strings
          // Rating 1-2: negative, Rating 3: neutral, Rating 4-5: positive
          let sentiment: string;
          if (typeof rating === 'number') {
            if (rating <= 2) sentiment = 'negative';
            else if (rating === 3) sentiment = 'neutral';
            else sentiment = 'positive';
          } else {
            sentiment = 'neutral';
          }

          return {
            text: text.toString(),
            originalLabel: rating,
            sentiment,
            productName,
          };
        });

        const validItems = items.filter(item => item.text.trim().length > 0);
        allItems.push(...validItems);

        console.log(`📦 Fetched batch: ${allItems.length}/${limit} items`);

        // If we got fewer items than requested, we've reached the end
        if (response.data.rows.length < batchSize) {
          console.log('✅ Reached end of dataset');
          break;
        }

        remainingLimit -= batchSize;
        currentOffset += batchSize;

        // Add delay between requests to avoid rate limiting (HuggingFace has rate limits)
        if (remainingLimit > 0) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      }

      return allItems;
    } catch (error: any) {
      if (error.response) {
        throw new AppError(
          `HuggingFace API error: ${error.response.data?.error || error.message}`,
          error.response.status
        );
      }
      throw new AppError('Failed to fetch dataset from HuggingFace', 500);
    }
  }

  /**
   * Fetch generic HuggingFace dataset
   */
  async fetchHuggingFaceDataset(
    datasetName: string,
    config: string = 'default',
    split: string = 'train',
    limit: number = 100,
    offset: number = 0
  ): Promise<DatasetItem[]> {
    try {
      const response = await axios.get(HUGGINGFACE_DATASETS_API, {
        params: {
          dataset: datasetName,
          config,
          split,
          offset,
          length: limit,
        },
        timeout: 30000,
      });

      if (!response.data || !response.data.rows) {
        throw new AppError('Invalid response from HuggingFace API', 500);
      }

      // Map dataset rows to our format
      const items: DatasetItem[] = response.data.rows.map((item: HuggingFaceDatasetRow) => {
        const row = item.row;

        // Try to find text field (prioritize 'review' for Tokopedia dataset)
        const text = row.review || row.text || row.comment || row.content || row.sentence || '';

        // Try to find label/rating field
        const label = row.rating || (row.label !== undefined ? row.label : (row.sentiment || 'unknown'));

        // Extract product name if available
        const productName = row.product_name || undefined;

        // Map labels to sentiment strings
        let sentiment: string | undefined;
        if (typeof label === 'number') {
          // For rating systems (1-5 stars like Tokopedia)
          if (label <= 2) sentiment = 'negative';
          else if (label === 3) sentiment = 'neutral';
          else if (label >= 4) sentiment = 'positive';
        } else if (typeof label === 'string') {
          const lowerLabel = label.toLowerCase();
          if (lowerLabel.includes('positive')) sentiment = 'positive';
          else if (lowerLabel.includes('negative')) sentiment = 'negative';
          else if (lowerLabel.includes('neutral')) sentiment = 'neutral';
        }

        return {
          text: text.toString(),
          originalLabel: label,
          sentiment,
          productName,
        };
      });

      return items.filter(item => item.text.trim().length > 0);
    } catch (error: any) {
      if (error.response) {
        throw new AppError(
          `HuggingFace API error: ${error.response.data?.error || error.message}`,
          error.response.status
        );
      }
      throw new AppError('Failed to fetch dataset from HuggingFace', 500);
    }
  }

  /**
   * Get dataset info/metadata
   */
  async getDatasetInfo(datasetName: string) {
    try {
      const response = await axios.get(`https://datasets-server.huggingface.co/info`, {
        params: {
          dataset: datasetName,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      throw new AppError('Failed to fetch dataset info', 500);
    }
  }
}

export const datasetService = new DatasetService();
