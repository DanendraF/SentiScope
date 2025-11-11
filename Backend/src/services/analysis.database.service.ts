import { supabase } from '../config/database';
import { TextAnalysisResult } from './sentiment.service';
import { AppError } from '../utils/AppError';

export interface Analysis {
  id: string;
  userId: string;
  title: string;
  inputType: string;
  totalItems: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisItem {
  id: string;
  analysisId: string;
  textContent: string;
  sentimentLabel: string;
  confidenceScore: number;
  createdAt: Date;
}

export interface AnalysisWithItems extends Analysis {
  items: AnalysisItem[];
}

/**
 * Database service for managing analyses
 */
class AnalysisDatabaseService {
  /**
   * Save analysis to database
   */
  async saveAnalysis(
    userId: string,
    title: string,
    inputType: 'text' | 'batch' | 'keywords',
    results: TextAnalysisResult[]
  ): Promise<AnalysisWithItems> {
    try {
      // Calculate statistics
      const totalItems = results.length;
      const positiveCount = results.filter(r => r.sentiment.label === 'positive').length;
      const negativeCount = results.filter(r => r.sentiment.label === 'negative').length;
      const neutralCount = results.filter(r => r.sentiment.label === 'neutral').length;
      const averageScore = results.reduce((sum, r) => sum + r.sentiment.score, 0) / totalItems;

      // Insert analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          user_id: userId,
          title,
          input_type: inputType,
          total_items: totalItems,
          positive_count: positiveCount,
          negative_count: negativeCount,
          neutral_count: neutralCount,
          average_score: averageScore,
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Failed to save analysis:', analysisError);
        throw new AppError('Failed to save analysis to database', 500);
      }

      const analysis = this.mapAnalysisRow(analysisData);

      // Insert analysis items
      const itemsToInsert = results.map(result => ({
        analysis_id: analysis.id,
        text_content: result.text,
        sentiment_label: result.sentiment.label,
        confidence_score: result.sentiment.score,
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from('analysis_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Failed to save analysis items:', itemsError);
        // Rollback: delete the analysis
        await supabase.from('analyses').delete().eq('id', analysis.id);
        throw new AppError('Failed to save analysis items to database', 500);
      }

      const items = itemsData.map(row => this.mapAnalysisItemRow(row));

      return {
        ...analysis,
        items,
      };
    } catch (error: any) {
      console.error('Failed to save analysis:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to save analysis to database', 500);
    }
  }

  /**
   * Get all analyses for a user
   */
  async getUserAnalyses(userId: string, limit: number = 50, offset: number = 0): Promise<Analysis[]> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get user analyses:', error);
        throw new AppError('Failed to retrieve analyses', 500);
      }

      return (data || []).map(row => this.mapAnalysisRow(row));
    } catch (error: any) {
      console.error('Failed to get user analyses:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve analyses', 500);
    }
  }

  /**
   * Get single analysis with items
   */
  async getAnalysisById(analysisId: string, userId: string): Promise<AnalysisWithItems | null> {
    try {
      // Get analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .single();

      if (analysisError || !analysisData) {
        return null;
      }

      const analysis = this.mapAnalysisRow(analysisData);

      // Get items
      const { data: itemsData, error: itemsError } = await supabase
        .from('analysis_items')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('Failed to get analysis items:', itemsError);
        throw new AppError('Failed to retrieve analysis items', 500);
      }

      const items = (itemsData || []).map(row => this.mapAnalysisItemRow(row));

      return {
        ...analysis,
        items,
      };
    } catch (error: any) {
      console.error('Failed to get analysis by ID:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve analysis', 500);
    }
  }

  /**
   * Delete analysis
   */
  async deleteAnalysis(analysisId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete analysis:', error);
        throw new AppError('Failed to delete analysis', 500);
      }

      return true;
    } catch (error: any) {
      console.error('Failed to delete analysis:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete analysis', 500);
    }
  }

  /**
   * Get analysis count for user
   */
  async getUserAnalysisCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to get analysis count:', error);
        throw new AppError('Failed to get analysis count', 500);
      }

      return count || 0;
    } catch (error: any) {
      console.error('Failed to get analysis count:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get analysis count', 500);
    }
  }

  /**
   * Map database row to Analysis object
   */
  private mapAnalysisRow(row: any): Analysis {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      inputType: row.input_type,
      totalItems: row.total_items,
      positiveCount: row.positive_count,
      negativeCount: row.negative_count,
      neutralCount: row.neutral_count,
      averageScore: parseFloat(row.average_score),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Map database row to AnalysisItem object
   */
  private mapAnalysisItemRow(row: any): AnalysisItem {
    return {
      id: row.id,
      analysisId: row.analysis_id,
      textContent: row.text_content,
      sentimentLabel: row.sentiment_label,
      confidenceScore: parseFloat(row.confidence_score),
      createdAt: new Date(row.created_at),
    };
  }
}

export const analysisDatabaseService = new AnalysisDatabaseService();
