#!/bin/bash

# Build script for Vercel API
echo "Building API for Vercel deployment..."

# Create api/dist directory
mkdir -p api/dist

# Copy backend distribution files
cp -r backend/dist/* api/dist/

# Copy node_modules from backend (for runtime dependencies)
mkdir -p api/node_modules
cp -r backend/node_modules/* api/node_modules/ 2>/dev/null || true

# Create a standalone index.js that doesn't rely on relative paths
cat > api/index.js << 'EOF'
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
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://ghac-survey.vercel.app',
      /^https:\/\/ghac-survey-.*\.vercel\.app$/,
      /^https:\/\/.*-lwhela12s-projects\.vercel\.app$/
    ].filter(Boolean);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.error('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
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

// Import routes from dist
try {
  const surveyRoutes = require('./dist/routes/survey.routes').default;
  const adminMockRoutes = require('./dist/routes/admin-mock.routes').default;
  const clerkAdminRoutes = require('./dist/routes/clerkAdmin.routes').default;
  const webhookRoutes = require('./dist/routes/webhook.routes').default;
  const { errorHandler } = require('./dist/middleware/errorHandler');

  // API Routes
  app.use('/api/survey', surveyRoutes);
  app.use('/api/admin', adminMockRoutes);
  app.use('/api/clerk-admin', clerkAdminRoutes);
  app.use('/api/webhook', webhookRoutes);
  
  // Error handling
  app.use(errorHandler);
} catch (error) {
  console.error('Failed to load routes:', error);
  
  // Fallback error response
  app.use('/api/*', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      path: req.path
    });
  });
}

// Export for Vercel
module.exports = app;
EOF

echo "API build complete!"