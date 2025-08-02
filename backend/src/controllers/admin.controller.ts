import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database/initialize';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

class AdminController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const db = getDb();

      // Find admin user
      const userResult = await db.query(
        'SELECT id, email, password_hash, name, role FROM admin_users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('Invalid credentials', 401);
      }

      const user = userResult.rows[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info(`Admin login successful: ${email}`);

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      // In a production app, you'd invalidate the refresh token here
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string };
      const db = getDb();

      const userResult = await db.query(
        'SELECT id, email, role FROM admin_users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = userResult.rows[0];
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  async getResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, surveyId, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const db = getDb();

      let query = `
        SELECT 
          r.id,
          r.survey_id,
          r.respondent_name,
          r.started_at,
          r.completed_at,
          s.name as survey_name,
          COUNT(DISTINCT a.id) as answer_count
        FROM responses r
        JOIN surveys s ON r.survey_id = s.id
        LEFT JOIN answers a ON r.id = a.response_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (surveyId) {
        params.push(surveyId);
        query += ` AND r.survey_id = $${++paramCount}`;
      }

      if (status === 'completed') {
        query += ` AND r.completed_at IS NOT NULL`;
      } else if (status === 'incomplete') {
        query += ` AND r.completed_at IS NULL`;
      }

      query += `
        GROUP BY r.id, s.name
        ORDER BY r.started_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(Number(limit), offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM responses r
        WHERE 1=1
      `;

      if (surveyId) {
        countQuery += ` AND r.survey_id = $1`;
      }
      if (status === 'completed') {
        countQuery += ` AND r.completed_at IS NOT NULL`;
      } else if (status === 'incomplete') {
        countQuery += ` AND r.completed_at IS NULL`;
      }

      const countResult = await db.query(countQuery, surveyId ? [surveyId] : []);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        responses: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getResponseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { responseId } = req.params;
      const db = getDb();

      // Get response details
      const responseQuery = `
        SELECT 
          r.*,
          s.name as survey_name
        FROM responses r
        JOIN surveys s ON r.survey_id = s.id
        WHERE r.id = $1
      `;

      const responseResult = await db.query(responseQuery, [responseId]);
      if (responseResult.rows.length === 0) {
        throw new AppError('Response not found', 404);
      }

      // Get all answers
      const answersQuery = `
        SELECT 
          a.*,
          q.question_text,
          q.question_type,
          q.order_index
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.response_id = $1
        ORDER BY q.order_index, a.answered_at
      `;

      const answersResult = await db.query(answersQuery, [responseId]);

      res.json({
        response: responseResult.rows[0],
        answers: answersResult.rows
      });
    } catch (error) {
      next(error);
    }
  }

  async exportResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const { surveyId, format = 'csv' } = req.query;

      if (format !== 'csv') {
        throw new AppError('Only CSV export is currently supported', 400);
      }

      // This would integrate with Google Drive API
      // For now, we'll return a CSV download

      const db = getDb();
      const query = `
        SELECT 
          r.id,
          r.respondent_name,
          r.started_at,
          r.completed_at,
          a.question_id,
          q.question_text,
          a.answer_text,
          a.video_url
        FROM responses r
        JOIN answers a ON r.id = a.response_id
        JOIN questions q ON a.question_id = q.id
        WHERE r.survey_id = $1
        ORDER BY r.id, q.order_index
      `;

      const result = await db.query(query, [surveyId]);

      // Format as CSV
      const csv = this.formatAsCSV(result.rows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey-export-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.query;
      const db = getDb();

      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT r.id) as total_responses,
          COUNT(DISTINCT CASE WHEN r.completed_at IS NOT NULL THEN r.id END) as completed_responses,
          AVG(EXTRACT(EPOCH FROM (r.completed_at - r.started_at))/60)::numeric(10,2) as avg_completion_time_minutes
        FROM responses r
        WHERE r.survey_id = $1
      `;

      const result = await db.query(summaryQuery, [surveyId]);

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  private formatAsCSV(data: any[]): string {
    if (data.length === 0) return '';

    // Group by response ID
    const responseMap = new Map();
    data.forEach(row => {
      if (!responseMap.has(row.id)) {
        responseMap.set(row.id, {
          id: row.id,
          respondent_name: row.respondent_name,
          started_at: row.started_at,
          completed_at: row.completed_at,
          answers: {}
        });
      }
      responseMap.get(row.id).answers[row.question_text] = row.answer_text || row.video_url || '';
    });

    // Get all unique questions
    const questions = [...new Set(data.map(row => row.question_text))];

    // Build CSV
    const headers = ['Response ID', 'Name', 'Started', 'Completed', ...questions];
    const rows = [headers.join(',')];

    responseMap.forEach(response => {
      const row = [
        response.id,
        response.respondent_name || '',
        response.started_at,
        response.completed_at || '',
        ...questions.map(q => `"${response.answers[q] || ''}"`)
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }
}

export const adminController = new AdminController();