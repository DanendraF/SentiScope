import { Request, Response, NextFunction } from 'express';
import { analysisService } from '../services/analysis.service';

export const analysisController = {
  analyzeText: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;
      const userId = (req as any).user?.id;
      const result = await analysisService.analyzeText(text, userId);
      res.status(201).json({
        message: 'Analysis completed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { page = 1, limit = 10 } = req.query;
      const history = await analysisService.getHistory(
        userId,
        Number(page),
        Number(limit)
      );
      res.json({
        message: 'History retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },

  getAnalysisById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const analysis = await analysisService.getAnalysisById(id, userId);
      res.json({
        message: 'Analysis retrieved successfully',
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteAnalysis: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      await analysisService.deleteAnalysis(id, userId);
      res.json({
        message: 'Analysis deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  getReports: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { startDate, endDate } = req.query;
      const reports = await analysisService.getReports(
        userId,
        startDate as string,
        endDate as string
      );
      res.json({
        message: 'Reports retrieved successfully',
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  },
};

