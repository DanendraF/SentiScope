import axios from 'axios';
import { AppError } from '../utils/AppError';

const HUGGINGFACE_DATASETS_API = 'https://datasets-server.huggingface.co/rows';

interface HuggingFaceDatasetRow {
  row: {
    // YouTube comment dataset fields
    CommentText?: string;
    Sentiment?: string;
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
}

/**
 * Dataset Service
 * Handles fetching datasets from HuggingFace
 */
class DatasetService {
  /**
   * Fetch YouTube Comment Sentiment dataset from HuggingFace
   * Dataset: AmaanP314/youtube-comment-sentiment
   */
  async fetchYoutubeCommentDataset(limit: number = 100, offset: number = 0): Promise<DatasetItem[]> {
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
            dataset: 'AmaanP314/youtube-comment-sentiment',
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

          // Extract text (YouTube dataset uses CommentText field)
          const text = row.CommentText || row.text || row.comment || row.content || row.sentence || '';

          // Extract label (YouTube dataset uses Sentiment field with string values)
          const label = row.Sentiment || (row.label !== undefined ? row.label : (row.sentiment || 'unknown'));

          // Map labels to sentiment strings
          let sentiment: string | undefined;
          if (typeof label === 'number') {
            // Common mapping: 0=negative, 1=neutral, 2=positive
            if (label === 0) sentiment = 'negative';
            else if (label === 1) sentiment = 'neutral';
            else if (label === 2) sentiment = 'positive';
          } else if (typeof label === 'string') {
            sentiment = label.toLowerCase();
          }

          return {
            text: text.toString(),
            originalLabel: label,
            sentiment,
          };
        });

        const validItems = items.filter(item => item.text.trim().length > 0);
        allItems.push(...validItems);

        // If we got fewer items than requested, we've reached the end
        if (response.data.rows.length < batchSize) {
          break;
        }

        remainingLimit -= batchSize;
        currentOffset += batchSize;
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

        // Try to find text field (include CommentText for YouTube dataset)
        const text = row.CommentText || row.text || row.comment || row.content || row.sentence || row.review || '';

        // Try to find label field (include Sentiment for YouTube dataset)
        const label = row.Sentiment || (row.label !== undefined ? row.label : (row.sentiment || row.rating || 'unknown'));

        // Map numeric labels to sentiment strings if needed
        let sentiment: string | undefined;
        if (typeof label === 'number') {
          if (label === 0) sentiment = 'negative';
          else if (label === 1) sentiment = 'neutral';
          else if (label === 2) sentiment = 'positive';
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
