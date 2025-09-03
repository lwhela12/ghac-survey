import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { errorHandler } from './middleware/errorHandler';
import surveyRoutes from './routes/survey.routes';
import adminRoutes from './routes/admin.routes';
import clerkAdminRoutes from './routes/clerkAdmin.routes';
import webhookRoutes from './routes/webhook.routes';
// import adminMockRoutes from './routes/admin-mock.routes';
import { initializeDatabase, getDb } from './database/initialize';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Debug endpoint
app.get('/debug/db', (_req, res) => {
  const db = getDb();
  res.json({ 
    hasDb: !!db,
    dbType: typeof db,
    dbNull: db === null,
    databaseUrl: process.env.DATABASE_URL || 'not set',
    dbKeys: db ? Object.keys(db).slice(0, 5) : []
  });
});

// Routes
app.use('/api/survey', surveyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clerk-admin', clerkAdminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Try to initialize database but don't fail if it's not available
    try {
      await initializeDatabase();
    } catch (dbError) {
      logger.warn('Database initialization failed, running without database:', dbError);
      logger.warn('Some features may not work properly');
    }
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;
