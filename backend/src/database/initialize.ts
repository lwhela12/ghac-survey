import { Pool } from 'pg';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import surveyData from './survey-structure.json';

// Load environment variables before checking DATABASE_URL
dotenv.config();

let pool: Pool | null = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 50, // Increased for 2000 concurrent users
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    logger.info('Database pool created with connection string');
  } catch (error) {
    logger.warn('Failed to create database pool:', error);
  }
} else {
  logger.warn('No DATABASE_URL configured, running without database');
}

export const getDb = () => pool;

export const initializeDatabase = async () => {
  try {
    if (!pool) {
      logger.warn('Database pool not initialized');
      return;
    }
    // Test connection
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      logger.info('Database connected:', result.rows[0].now);
      client.release();
    } catch (connError: any) {
      logger.warn('Database connection failed, running without database:', connError.message);
      pool = null; // Clear the pool if connection fails
      return;
    }

    // Load initial survey structure
    try {
      await loadSurveyStructure();
    } catch (error: any) {
      if (error.code === '42P01') { // relation does not exist
        logger.warn('Database tables not found. Run migrations first: npm run migrate');
      } else {
        logger.error('Failed to load survey structure:', error);
      }
    }
    
    logger.info('Database initialization complete');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

const loadSurveyStructure = async () => {
  try {

    // Check if survey already exists
    const { rows } = await pool!.query(
      'SELECT id FROM surveys WHERE name = $1',
      [surveyData.survey.name]
    );

    if (rows.length > 0) {
      const existingId = rows[0].id;
      if (existingId !== surveyData.survey.id) {
        logger.info(`Updating survey ID from ${existingId} to ${surveyData.survey.id}`);
        await pool!.query(
          'UPDATE surveys SET id = $1 WHERE id = $2',
          [surveyData.survey.id, existingId]
        );
      } else {
        logger.info('Survey structure already loaded');
      }
      return;
    }


    // Insert survey
    await pool!.query(
      'INSERT INTO surveys (id, name, description) VALUES ($1, $2, $3)',
      [surveyData.survey.id, surveyData.survey.name, surveyData.survey.description]
    );

    logger.info('Survey structure loaded successfully');
  } catch (error) {
    logger.error('Failed to load survey structure:', error);
    // Non-critical error, don't throw
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
});
