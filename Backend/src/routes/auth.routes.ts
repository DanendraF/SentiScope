import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  verifyEmail,
  changePassword,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

/**
 * Validation schemas
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('First name must be between 1 and 255 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Last name must be between 1 and 255 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

/**
 * Public routes
 */

// POST /api/auth/register - Register a new user
router.post('/register', registerValidation, validate, register);

// POST /api/auth/login - Login user
router.post('/login', loginValidation, validate, login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refreshTokenValidation, validate, refreshToken);

/**
 * Protected routes (require authentication)
 */

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, logout);

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateToken, getCurrentUser);

// POST /api/auth/verify-email - Verify email
router.post('/verify-email', authenticateToken, verifyEmail);

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticateToken, changePasswordValidation, validate, changePassword);

export default router;
