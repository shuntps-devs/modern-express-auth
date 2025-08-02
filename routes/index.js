/**
 * Routes Central Hub
 * Centralizes all route mounting and exports
 */

import express from 'express';
import authRoutes from './auth_routes.js';
import userRoutes from './user_routes.js';
import { env } from '../config/env_config.js';
import { ERROR_MESSAGES } from '../constants/index.js';

// Create main API router
const apiRouter = express.Router();

// Mount all API routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/user', userRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// 404 handler for API routes (Express 5.x compatible)
apiRouter.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: ERROR_MESSAGES.API_ENDPOINT_NOT_FOUND,
      path: req.originalUrl,
    },
  });
});

// Export the main API router
export default apiRouter;
