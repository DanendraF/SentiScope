import { Router } from 'express';
import { body } from 'express-validator';
import {
  analyzeSingleText,
  analyzeBatchTexts,
  analyzeKeywords,
  analyzeCsvFile,
  analyzeImageFile,
  getStatistics,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
} from '../controllers/analysis.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { csvUpload, imageUpload } from '../middleware/upload';

const router = Router();

/**
 * Validation schemas
 */
const analyzeSingleTextValidation = [
  body('text')
    .notEmpty()
    .withMessage('Text is required')
    .isString()
    .withMessage('Text must be a string')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
];

const analyzeBatchTextsValidation = [
  body('texts')
    .isArray({ min: 1, max: 100 })
    .withMessage('Texts must be an array with 1-100 items'),
  body('texts.*')
    .notEmpty()
    .withMessage('Each text must not be empty')
    .isString()
    .withMessage('Each text must be a string')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Each text must be between 1 and 5000 characters'),
];

const analyzeKeywordsValidation = [
  body('keywords')
    .isArray({ min: 1, max: 50 })
    .withMessage('Keywords must be an array with 1-50 items'),
  body('keywords.*')
    .notEmpty()
    .withMessage('Each keyword must not be empty')
    .isString()
    .withMessage('Each keyword must be a string')
    .isLength({ min: 1, max: 200 })
    .withMessage('Each keyword must be between 1 and 200 characters'),
];

/**
 * Public routes (for testing - no authentication required)
 */

// POST /api/analysis/test - Test analyze single text (public)
router.post(
  '/test',
  analyzeSingleTextValidation,
  validate,
  analyzeSingleText
);

/**
 * Protected routes (require authentication)
 */

// POST /api/analysis/text - Analyze single text
router.post(
  '/text',
  authenticateToken,
  analyzeSingleTextValidation,
  validate,
  analyzeSingleText
);

// POST /api/analysis/batch - Analyze multiple texts
router.post(
  '/batch',
  authenticateToken,
  analyzeBatchTextsValidation,
  validate,
  analyzeBatchTexts
);

// POST /api/analysis/keywords - Analyze keywords
router.post(
  '/keywords',
  authenticateToken,
  analyzeKeywordsValidation,
  validate,
  analyzeKeywords
);

// POST /api/analysis/csv - Analyze CSV file
router.post(
  '/csv',
  authenticateToken,
  csvUpload.single('file'),
  analyzeCsvFile
);

// POST /api/analysis/image - Analyze Image file with OCR
router.post(
  '/image',
  authenticateToken,
  imageUpload.single('file'),
  analyzeImageFile
);

// POST /api/analysis/statistics - Get statistics from results
router.post(
  '/statistics',
  authenticateToken,
  getStatistics
);

// GET /api/analysis/history - Get user's analysis history
router.get(
  '/history',
  authenticateToken,
  getAnalysisHistory
);

// GET /api/analysis/:id - Get single analysis by ID
router.get(
  '/:id',
  authenticateToken,
  getAnalysisById
);

// DELETE /api/analysis/:id - Delete analysis by ID
router.delete(
  '/:id',
  authenticateToken,
  deleteAnalysis
);

export default router;
