import { Router } from 'express';
import authRoutes from './auth.routes';
import analysisRoutes from './analysis.routes';
import userRoutes from './user.routes';

const router = Router();

// Route handlers
router.use('/auth', authRoutes);
router.use('/analysis', analysisRoutes);
router.use('/users', userRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'SentiScope API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      analysis: '/api/analysis',
      users: '/api/users',
    },
  });
});

export default router;

