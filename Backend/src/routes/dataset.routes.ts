import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  fetchYoutubeComments,
  fetchAndAnalyzeYoutubeComments,
  fetchDataset,
  getDatasetInfo,
} from '../controllers/dataset.controller';

const router = Router();

/**
 * @route   GET /api/datasets/youtube-comments
 * @desc    Fetch YouTube comment sentiment dataset from HuggingFace
 * @access  Private
 * @query   limit (optional, default: 100, max: 500)
 * @query   offset (optional, default: 0)
 */
router.get('/youtube-comments', authenticateToken, fetchYoutubeComments);

/**
 * @route   POST /api/datasets/youtube-comments/analyze
 * @desc    Fetch and analyze YouTube comments with our sentiment model
 * @access  Private
 * @body    { limit?, offset?, keywords? }
 *          keywords: string | string[] - Filter comments by keywords
 */
router.post('/youtube-comments/analyze', authenticateToken, fetchAndAnalyzeYoutubeComments);

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
