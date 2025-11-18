import { Router } from 'express';
import authRoutes from './auth.routes';
import analysisRoutes from './analysis.routes';
import datasetRoutes from './dataset.routes';

const router = Router();

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'SentiScope API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      analysis: '/api/analysis',
      datasets: '/api/datasets',
      users: '/api/users',
    },
    status: 'online',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/analysis', analysisRoutes);
router.use('/datasets', datasetRoutes);
// router.use('/users', userRoutes); // TODO: Implement

export default router;

