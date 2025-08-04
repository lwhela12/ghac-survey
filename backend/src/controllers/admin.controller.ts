// @ts-nocheck
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

  exportResponses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { surveyId, format = 'csv' } = req.query;

      if (format !== 'csv') {
        throw new AppError('Only CSV export is currently supported', 400);
      }

      // This would integrate with Google Drive API
      // For now, we'll return a CSV download

      const db = getDb();
      
      if (!db) {
        // Return empty CSV if no database
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="survey-export-${Date.now()}.csv"`);
        res.send('No data available');
        return;
      }
      
      const query = `
        SELECT 
          r.id,
          r.respondent_name,
          r.started_at,
          r.completed_at,
          a.question_id,
          a.answer_text,
          a.answer_choice_ids,
          a.video_url,
          a.metadata
        FROM responses r
        LEFT JOIN answers a ON r.id = a.response_id
        WHERE r.survey_id = $1
        ORDER BY r.id, a.answered_at
      `;

      const result = await db.query(query, [surveyId]);

      // Format as CSV
      const csv = this.formatAsCSV(result.rows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey-export-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
      return;
    }
  }

  async getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.query;
      const db = getDb();
      
      // If no database, return mock analytics
      if (!db) {
        const mockAnalytics = {
          total_responses: '25',
          completed_responses: '20',
          avg_completion_time_minutes: '8.5'
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

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
      return;
    }
  }

  private formatAsCSV(data: any[]): string {
    if (data.length === 0) return 'No data available';

    // Import question mapping
    const questionMapping: Record<string, string> = {
      'b1': 'Welcome Video',
      'b2': 'Ready to Start?',
      'b3': 'Name',
      'b4': 'Connection Type',
      'b5': 'Arts Involvement',
      'b6': 'Arts Importance (1-5)',
      'b7': 'GHAC Understanding',
      'b8': 'Program Participation',
      'b9': 'GHAC Perception (Scales)',
      'b10': 'Satisfaction Level',
      'b11': 'Most Valuable Programs',
      'b12': 'Improvement Suggestions',
      'b13': 'Underserved Communities',
      'b14': 'Impact Areas Ranking',
      'b15': 'Giving Decision Factors',
      'b16': 'Communication Preference',
      'b17': 'Recommendation Likelihood (1-5)',
      'b18': 'Demographics Consent',
      'b19': 'Demographics'
    };

    // Group by response ID
    const responseMap = new Map();
    data.forEach(row => {
      if (!responseMap.has(row.id)) {
        responseMap.set(row.id, {
          id: row.id,
          respondent_name: row.respondent_name || 'Anonymous',
          started_at: new Date(row.started_at).toLocaleString(),
          completed_at: row.completed_at ? new Date(row.completed_at).toLocaleString() : 'In Progress',
          answers: {}
        });
      }
      
      // Get block ID from metadata
      const blockId = row.metadata?.blockId || row.question_id;
      
      // Format the answer based on type
      let formattedAnswer = '';
      
      if (row.video_url) {
        formattedAnswer = row.video_url;
      } else if (row.answer_choice_ids && row.answer_choice_ids.length > 0) {
        formattedAnswer = row.answer_choice_ids.join('; ');
      } else if (row.metadata && blockId === 'b9') {
        // Semantic differential
        const scales = ['traditional_innovative', 'corporate_community', 'transactional_relationship', 
                       'behind_visible', 'exclusive_inclusive'];
        formattedAnswer = scales.map(scale => 
          `${scale.replace(/_/g, '-')}: ${row.metadata[scale] || 'N/A'}`
        ).join('; ');
      } else if (row.metadata && blockId === 'b19') {
        // Demographics
        const demo = row.metadata;
        const parts = [];
        if (demo.user_age) parts.push(`Age: ${demo.user_age}`);
        if (demo.user_zip) parts.push(`ZIP: ${demo.user_zip}`);
        if (demo.giving_level) parts.push(`Giving: $${demo.giving_level}`);
        if (demo.race_ethnicity) {
          parts.push(`Race: ${Array.isArray(demo.race_ethnicity) ? demo.race_ethnicity.join(', ') : demo.race_ethnicity}`);
        }
        if (demo.gender_identity) parts.push(`Gender: ${demo.gender_identity}`);
        formattedAnswer = parts.join('; ');
      } else if (row.answer_text) {
        formattedAnswer = row.answer_text;
      }
      
      responseMap.get(row.id).answers[blockId] = formattedAnswer;
    });

    // Get all unique block IDs in survey order
    const blockOrder = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 
                       'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18', 'b19'];
    const presentBlocks = [...new Set(data.map(row => row.metadata?.blockId || row.question_id))]
      .filter(id => blockOrder.includes(id))
      .sort((a, b) => blockOrder.indexOf(a) - blockOrder.indexOf(b));

    // Build CSV with proper escaping
    const headers = ['Response ID', 'Name', 'Started', 'Completed', 
                    ...presentBlocks.map(id => questionMapping[id] || id)];
    
    const rows = [headers.map(h => `"${h}"`).join(',')];

    responseMap.forEach(response => {
      const row = [
        response.id,
        response.respondent_name,
        response.started_at,
        response.completed_at,
        ...presentBlocks.map(blockId => {
          const answer = response.answers[blockId] || '';
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          const escaped = answer.toString().replace(/"/g, '""');
          return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
        })
      ];
      rows.push(row.map(cell => {
        const str = cell.toString();
        const escaped = str.replace(/"/g, '""');
        return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(','));
    });

    return rows.join('\n');
  }
}

export const adminController = new AdminController();