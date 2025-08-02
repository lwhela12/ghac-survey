import bcrypt from 'bcryptjs';
import { getDb } from './initialize';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    const db = getDb();
    
    // Create admin user
    const email = 'admin@ghac.org';
    const password = 'ghac2024!'; // Change this in production
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.query(
      `INSERT INTO admin_users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [email, hashedPassword, 'GHAC Admin', 'admin']
    );
    
    logger.info('Database seeded successfully');
    logger.info(`Admin user created: ${email} (password: ${password})`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();