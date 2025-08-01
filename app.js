import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';

// Import routes
import apiRouter from './routes/index.js';

// Import configuration
import { env } from './config/index.js';

// Import middleware
import { errorHandler } from './middleware/index.js';

// Get directory path - compatible with both Node.js and Jest
const __dirname = process.cwd();

// Initialize Express app
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['self'],
        styleSrc: ['self', 'unsafe-inline'],
        scriptSrc: ['self'],
        imgSrc: ['self', 'data:', 'https:'],
      },
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount all API routes through centralized router (with rate limiting integrated)
app.use('/api', apiRouter);

// Serve static files from the React app in production
if (env.isProduction) {
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Catch all handler: send back React's index.html file for any non-API routes (Express 5.x compatible)
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
