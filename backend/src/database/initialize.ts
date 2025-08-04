import { Pool } from 'pg';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables before checking DATABASE_URL
dotenv.config();

let pool: Pool | null = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
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
      ['GHAC Donor Survey V1']
    );

    if (rows.length > 0) {
      logger.info('Survey structure already loaded');
      return;
    }

    // Load survey structure from JSON
    const surveyDataPath = path.join(__dirname, 'survey-structure.json');
    const surveyData = JSON.parse(await fs.readFile(surveyDataPath, 'utf-8'));

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