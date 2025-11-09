import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Analysis routes (protected)
router.use(authenticateToken);

router.post('/analyze', analysisController.analyzeText);
router.get('/history', analysisController.getHistory);
router.get('/history/:id', analysisController.getAnalysisById);
router.delete('/history/:id', analysisController.deleteAnalysis);
router.get('/reports', analysisController.getReports);

export default router;

