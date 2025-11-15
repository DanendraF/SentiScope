import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  fetchTokopediaReviews,
  fetchAndAnalyzeTokopediaReviews,
  fetchDataset,
  getDatasetInfo,
} from '../controllers/dataset.controller';

const router = Router();

/**
 * @route   GET /api/datasets/tokopedia-reviews
 * @desc    Fetch Tokopedia product reviews dataset from HuggingFace
 * @access  Private
 * @query   limit (optional, default: 100, max: 500)
 * @query   offset (optional, default: 0)
 */
router.get('/tokopedia-reviews', authenticateToken, fetchTokopediaReviews);

/**
 * @route   POST /api/datasets/tokopedia-reviews/analyze
 * @desc    Fetch and analyze Tokopedia reviews with our sentiment model
 * @access  Private
 * @body    { limit?, offset?, keywords? }
 *          keywords: string | string[] - Filter reviews by keywords
 */
router.post('/tokopedia-reviews/analyze', authenticateToken, fetchAndAnalyzeTokopediaReviews);

/**
 * @route   POST /api/datasets/fetch
 * @desc    Fetch any HuggingFace dataset
 * @access  Private
 * @body    { datasetName, config?, split?, limit?, offset? }
 */
router.post('/fetch', authenticateToken, fetchDataset);

/**
 * @route   GET /api/datasets/info/:datasetName
 * @desc    Get dataset metadata/info
 * @access  Private
 */
router.get('/info/:datasetName', authenticateToken, getDatasetInfo);

export default router;
