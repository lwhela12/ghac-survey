// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database/initialize';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import QueryStream from 'pg-query-stream';
import { format, Transform } from 'fast-csv';

class AdminController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const db = getDb();
      logger.info(`Login attempt - email: ${email}, db: ${db}`);

      let user;
      
      // If no database, use mock admin user
      if (!db) {
        logger.info(`Using mock auth for ${email}`);
        if (email === 'admin@ghac.org' && password === 'ghac2024!') {
          user = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'admin@ghac.org',
            name: 'GHAC Admin',
            role: 'admin'
          };
        } else {
          logger.warn(`Invalid credentials for ${email}`);
          throw new AppError('Invalid credentials', 401);
        }
      } else {
        // Find admin user in database
        const userResult = await db.query(
          'SELECT id, email, password_hash, name, role FROM admin_users WHERE email = $1',
          [email]
        );

        if (userResult.rows.length === 0) {
          throw new AppError('Invalid credentials', 401);
        }

        const dbUser = userResult.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, dbUser.password_hash);
        if (!isValid) {
          throw new AppError('Invalid credentials', 401);
        }
        
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role
        };
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
      return;
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      // In a production app, you'd invalidate the refresh token here
      res.json({ success: true });
    } catch (error) {
      next(error);
      return;
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

      let user;
      
      if (!db) {
        // Mock user for testing
        if (decoded.userId === '11111111-1111-1111-1111-111111111111') {
          user = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'admin@ghac.org',
            role: 'admin'
          };
        } else {
          throw new AppError('User not found', 404);
        }
      } else {
        const userResult = await db.query(
          'SELECT id, email, role FROM admin_users WHERE id = $1',
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          throw new AppError('User not found', 404);
        }
        
        user = userResult.rows[0];
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    } catch (error) {
      next(error);
      return;
    }
  }

  async getResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, surveyId, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const db = getDb();
      
      // If no database, return mock data
      if (!db) {
        const mockResponses = [
          {
            id: 'resp-001',
            survey_id: '11111111-1111-1111-1111-111111111111',
            respondent_name: 'Jane Doe',
            started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            survey_name: 'GHAC Donor Survey',
            answer_count: 15
          },
          {
            id: 'resp-002',
            survey_id: '11111111-1111-1111-1111-111111111111',
            respondent_name: 'John Smith',
            started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            completed_at: null,
            survey_name: 'GHAC Donor Survey',
            answer_count: 8
          },
          {
            id: 'resp-003',
            survey_id: '11111111-1111-1111-1111-111111111111',
            respondent_name: 'Anonymous',
            started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            survey_name: 'GHAC Donor Survey',
            answer_count: 20
          }
        ];
        
        // Filter by status if provided
        let filtered = mockResponses;
        if (status === 'completed') {
          filtered = mockResponses.filter(r => r.completed_at !== null);
        } else if (status === 'incomplete') {
          filtered = mockResponses.filter(r => r.completed_at === null);
        }
        
        const total = filtered.length;
        const start = offset;
        const end = start + Number(limit);
        const paginated = filtered.slice(start, end);
        
        return res.json({
          responses: paginated,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        });
      }

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
      return;
    }
  }

  async getResponseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { responseId } = req.params;
      const db = getDb();
      
      // If no database, return mock data
      if (!db) {
        const mockResponses: Record<string, any> = {
          'resp-001': {
            id: 'resp-001',
            survey_id: '11111111-1111-1111-1111-111111111111',
            respondent_name: 'Jane Doe',
            started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            survey_name: 'GHAC Donor Survey'
          },
          'resp-002': {
            id: 'resp-002',
            survey_id: '11111111-1111-1111-1111-111111111111',
            respondent_name: 'John Smith',
            started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            completed_at: null,
            survey_name: 'GHAC Donor Survey'
          },
          'resp-003': {
            id: 'resp-003',
            survey_id: '11111111-1111-1111-1111-111111111111',
            respondent_name: 'Anonymous',
            started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            survey_name: 'GHAC Donor Survey'
          }
        };
        
        const response = mockResponses[responseId];
        if (!response) {
          throw new AppError('Response not found', 404);
        }
        
        const mockAnswers = [
          {
            id: 'ans-001',
            response_id: responseId,
            question_id: 'b2',
            question_text: 'How are you connected to the Greater Hartford Arts Council (GHAC)?',
            question_type: 'single-choice',
            answer_text: 'Individual donor',
            video_url: null as string | null,
            answered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            order_index: 1
          },
          {
            id: 'ans-002',
            response_id: responseId,
            question_id: 'b8',
            question_text: 'Overall, how satisfied are you with GHAC\'s work?',
            question_type: 'scale',
            answer_text: 'Very Satisfied',
            video_url: null as string | null,
            answered_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
            order_index: 5
          },
          {
            id: 'ans-003',
            response_id: responseId,
            question_id: 'b12',
            question_text: 'Is there anything else you would like to share with us?',
            question_type: 'mixed-media',
            answer_text: null,
            video_url: 'https://videoask.com/response/sample-video',
            answered_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            order_index: 10
          }
        ];
        
        return res.json({
          response,
          answers: mockAnswers
        });
      }

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

      // Get all answers - no need to join with questions table
      const answersQuery = `
        SELECT 
          a.id,
          a.response_id,
          a.question_id,
          a.answer_text,
          a.answer_choice_ids,
          a.video_url,
          a.metadata,
          a.answered_at
        FROM answers a
        WHERE a.response_id = $1
        ORDER BY a.answered_at
      `;

      const answersResult = await db.query(answersQuery, [responseId]);

      res.json({
        response: responseResult.rows[0],
        answers: answersResult.rows
      });
    } catch (error) {
      next(error);
      return;
    }
  }

    async exportResponses(req: Request, res: Response, next: NextFunction) {
    const db = getDb();
    if (!db) {
      return res.status(503).send('Database not connected');
    }

    const { surveyId } = req.query;
    if (!surveyId) {
      return res.status(400).send('surveyId is required');
    }

    const client = await db.connect().catch(err => {
      logger.error('Failed to connect to database client', err);
      next(err);
    });

    if (!client) return;

    try {
      const query = new QueryStream(`
        SELECT 
          r.id as response_id,
          r.respondent_name,
          r.started_at,
          r.completed_at,
          a.metadata->>'blockId' as question_id,
          a.answer_text,
          a.answer_choice_ids,
          a.video_url,
          a.metadata
        FROM responses r
        LEFT JOIN answers a ON r.id = a.response_id
        WHERE r.survey_id = $1
        ORDER BY r.started_at, a.answered_at
      `, [surveyId]);

      const queryStream = client.query(query);
      const csvStream = format({ headers: true });

      const transformer = new Transform({
        objectMode: true,
        transform(row, _encoding, callback) {
          // This simplified transform creates one CSV row per answer.
          // The original implementation tried to pivot data, which is complex and slow.
          // This format is much more performant and standard for data analysis.
          const flatRow = {
            response_id: row.response_id,
            respondent_name: row.respondent_name,
            question_id: row.question_id,
            answer: this._formatAnswer(row),
            started_at: row.started_at ? new Date(row.started_at).toISOString() : '',
            completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : '',
          };
          callback(null, flatRow);
        },
        _formatAnswer(row) {
          if (row.video_url) return row.video_url;
          if (row.answer_choice_ids && row.answer_choice_ids.length > 0) return row.answer_choice_ids.join('; ');
          if (row.metadata && row.question_id === 'b9') {
            const scales = ['traditional_innovative', 'corporate_community', 'transactional_relationship', 'behind_visible', 'exclusive_inclusive'];
            return scales.map(scale => `${scale.replace(/_/g, '-')}: ${row.metadata[scale] || 'N/A'}`).join('; ');
          }
          if (row.metadata && row.question_id === 'b19') {
            const demo = row.metadata;
            const parts = [];
            if (demo.user_age) parts.push(`Age: ${demo.user_age}`);
            if (demo.user_zip) parts.push(`ZIP: ${demo.user_zip}`);
            if (demo.giving_level) parts.push(`Giving: ${demo.giving_level}`);
            if (demo.race_ethnicity) parts.push(`Race: ${Array.isArray(demo.race_ethnicity) ? demo.race_ethnicity.join(', ') : demo.race_ethnicity}`);
            if (demo.gender_identity) parts.push(`Gender: ${demo.gender_identity}`);
            return parts.join('; ');
          }
          return row.answer_text || '';
        }
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey-export-${surveyId}-${Date.now()}.csv"`);

      queryStream.pipe(transformer).pipe(csvStream).pipe(res);

      queryStream.on('error', (err) => {
        logger.error('Error streaming from database', { error: err });
        client.release();
        if (!res.headersSent) {
          res.status(500).send('Error streaming data');
        }
      });

      queryStream.on('end', () => {
        logger.info('Database stream finished successfully.');
        client.release();
      });

    } catch (error) {
      logger.error('Error setting up CSV export stream', { error });
      client.release();
      next(error);
    }
  }

    async getQuestionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDb();
      if (!db) {
        return res.json({ questionStats: [] });
      }

      const surveyStructure = require('../database/survey-structure.json');
      const questions = Object.entries(surveyStructure.blocks)
        .filter(([, block]) => {
          const b = block as any;
          return ['single-choice', 'multi-choice', 'yes-no', 'quick-reply', 'scale'].includes(b.type);
        })
        .map(([blockId, block]) => {
          const b = block as any;
          return {
            id: blockId,
            text: typeof b.content === 'string' ? b.content : b.content?.default || b.content?.['non-supporter'] || '',
            type: b.type,
            options: b.options || []
          };
        });

      const questionIds = questions.map(q => q.id);
      if (questionIds.length === 0) {
        return res.json({ questionStats: [] });
      }

      const statsQuery = `
        SELECT 
          metadata->>'blockId' as "questionId",
          answer_text,
          answer_choice_ids,
          COUNT(*) as count
        FROM answers
        WHERE metadata->>'blockId' = ANY($1::text[])
        GROUP BY metadata->>'blockId', answer_text, answer_choice_ids
      `;
      
      const result = await db.query(statsQuery, [questionIds]);
      
      const statsByQuestion = result.rows.reduce((acc, row) => {
        const questionId = row.questionId;
        if (!acc[questionId]) {
          acc[questionId] = [];
        }
        acc[questionId].push(row);
        return acc;
      }, {});

      const questionStats = questions.map(question => {
        const stats = statsByQuestion[question.id] || [];
        if (stats.length === 0) return null;

        const totalResponses = stats.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
        const distribution = {};

        stats.forEach(row => {
          const count = parseInt(row.count, 10);
          if (row.answer_choice_ids && row.answer_choice_ids.length > 0) {
            row.answer_choice_ids.forEach(choiceId => {
              distribution[choiceId] = (distribution[choiceId] || 0) + count;
            });
          } else if (row.answer_text) {
            distribution[row.answer_text] = (distribution[row.answer_text] || 0) + count;
          }
        });

        const answerDistribution = {};
        if (question.options && question.options.length > 0) {
          question.options.forEach(option => {
            const optionData = option as any;
            const value = optionData.value !== undefined ? String(optionData.value) : String(optionData.id);
            const count = distribution[value] || 0;
            answerDistribution[optionData.label] = {
              count,
              percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0
            };
          });
        } else {
          Object.entries(distribution).forEach(([answer, count]) => {
            answerDistribution[answer] = {
              count: count as number,
              percentage: totalResponses > 0 ? Math.round(((count as number) / totalResponses) * 100) : 0
            };
          });
        }

        return {
          questionId: question.id,
          questionText: question.text,
          questionType: question.type,
          totalResponses,
          answerDistribution
        };
      }).filter(q => q !== null);
      
      res.json({ questionStats });
    } catch (error) {
      console.error('Error getting question stats:', error);
      next(error);
    }
  }

  async getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.query;
      const db = getDb();
      
      // If no database, return mock analytics
      if (!db) {
        const mockAnalytics = {
          totalResponses: 25,
          completedResponses: 20,
          avgCompletionTime: 8.5
        };
        
        return res.json(mockAnalytics);
      }

      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT r.id) as total_responses,
          COUNT(DISTINCT CASE WHEN r.completed_at IS NOT NULL THEN r.id END) as completed_responses,
          AVG(EXTRACT(EPOCH FROM (r.completed_at - r.started_at))/60)::numeric(10,2) as avg_completion_time_minutes
        FROM responses r
        WHERE r.survey_id = $1
      `;

      const result = await db.query(summaryQuery, [surveyId]);
      
      const data = result.rows[0];
      res.json({
        totalResponses: parseInt(data.total_responses) || 0,
        completedResponses: parseInt(data.completed_responses) || 0,
        avgCompletionTime: parseFloat(data.avg_completion_time_minutes) || 0
      });
    } catch (error) {
      next(error);
      return;
    }
  }

  
}

export const adminController = new AdminController();