import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initializeDatabase } from '../backend/src/database/initialize';
import surveyRoutes from '../backend/src/routes/survey.routes';
import adminMockRoutes from '../backend/src/routes/admin-mock.routes';
import clerkAdminRoutes from '../backend/src/routes/clerkAdmin.routes';
import webhookRoutes from '../backend/src/routes/webhook.routes';
import { errorHandler } from '../backend/src/middleware/errorHandler';
import { logger } from '../backend/src/utils/logger';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://ghac-survey.vercel.app',
        /^https:\/\/ghac-survey-.*\.vercel\.app$/  // Allow Vercel preview deployments
      ].filter(Boolean);
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/survey', surveyRoutes);
app.use('/api/admin', adminMockRoutes);
app.use('/api/clerk-admin', clerkAdminRoutes);
app.use('/api/webhook', webhookRoutes);

// Error handling
app.use(errorHandler);

// Initialize database
initializeDatabase().catch(err => {
  logger.error('Failed to initialize database:', err);
  // Don't crash the server if database init fails
  // The app can still run with limited functionality
});

// Export for Vercel
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}