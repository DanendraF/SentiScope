import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

export default router;

