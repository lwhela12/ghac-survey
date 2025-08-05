const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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
        /^https:\/\/ghac-survey-.*\.vercel\.app$/,  // Allow Vercel preview deployments
        /^https:\/\/.*-lwhela12s-projects\.vercel\.app$/  // Allow your project deployments
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

// Import routes and middleware from bundled dist
const { initializeDatabase } = require('./dist/database/initialize');
const surveyRoutes = require('./dist/routes/survey.routes').default;
const adminMockRoutes = require('./dist/routes/admin-mock.routes').default;
const clerkAdminRoutes = require('./dist/routes/clerkAdmin.routes').default;
const webhookRoutes = require('./dist/routes/webhook.routes').default;
const { errorHandler } = require('./dist/middleware/errorHandler');
const { logger } = require('./dist/utils/logger');

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - add /api prefix for Vercel
app.use('/api/survey', surveyRoutes);
app.use('/api/admin', adminMockRoutes);
app.use('/api/clerk-admin', clerkAdminRoutes);
app.use('/api/webhook', webhookRoutes);

// Error handling
app.use(errorHandler);

// Initialize database (non-blocking for serverless)
initializeDatabase().catch(err => {
  logger.error('Failed to initialize database:', err);
});

// Export for Vercel
module.exports = app;