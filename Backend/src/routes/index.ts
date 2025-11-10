import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

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
    status: 'online',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
// router.use('/analysis', analysisRoutes); // TODO: Implement
// router.use('/users', userRoutes); // TODO: Implement

export default router;

