// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database/initialize';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { format } from 'fast-csv';
import surveyStructure from '../database/survey-structure.json';

// Helper: Remove Handlebars-style template tokens from content used in admin UI
function sanitizeQuestionText(input: string): string {
  if (!input) return '';
  let s = input;
  // Remove conditional blocks like {{#if var}} ... {{/if}}
  s = s.replace(/{{#if[^}]*}}[\s\S]*?{{\/if}}/g, '');
  // Remove any remaining handlebars expressions like {{user_name}} or {{else}}
  s = s.replace(/{{[^}]+}}/g, '');
  // Collapse multiple spaces
  s = s.replace(/\s{2,}/g, ' ');
  // Remove space before punctuation
  s = s.replace(/\s+([,.!?;:])/g, '$1');
  return s.trim();
}

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
      const { page = 1, limit = 20, surveyId, status, tests } = req.query;
      const cohort = (req.query as any).cohort as string | undefined;
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
          COALESCE(name_answer.answer_text, r.respondent_name) as respondent_name,
          r.started_at,
          r.completed_at,
          r.metadata->>'cohort' as cohort,
          s.name as survey_name,
          (r.metadata->>'is_test')::boolean as is_test,
          COUNT(DISTINCT CASE 
            WHEN a.metadata->>'blockId' NOT IN (
              'b0', 'b0a', 'b1a', 'b1a-skip', 'b1b', 'b1c',
              'b2-info', 'b2-info-1', 'b2-info-2', 'b2-info-goodbye',
              'b3-response', 'b5-response', 'b5-thanks-gif', 'b5-thanks', 'b5-normal-response',
              'b6-response', 'b7-thanks-gif', 'b7-response', 'b7-permission-yes', 'b7-permission-no',
              'b9-response', 'b10-response', 'b12-response', 'b12-permission-yes', 'b12-permission-no',
              'b15-learn-more', 'b16-contact-confirm', 'b16-contact-great', 'b16-contact-preface',
              'b16-skip-contact', 'b16-contact-skip', 'b16-no-updates', 'b16-chat-again',
              'b17-response', 'b18-no-share-transition', 'b18-congratulations',
              'b19.5-celebration-gif', 'b19.5-celebration-gif-no-share', 'b20', 'b20-no-share'
            ) THEN a.id 
            ELSE NULL 
          END) as answer_count
        FROM responses r
        JOIN surveys s ON r.survey_id = s.id
        LEFT JOIN answers a ON r.id = a.response_id
        LEFT JOIN answers name_answer ON r.id = name_answer.response_id 
          AND name_answer.metadata->>'blockId' = 'b3'
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

      // tests filter: default exclude tests; tests=include to include both; tests=only to show only tests
      if (tests === 'only') {
        query += ` AND (r.metadata->>'is_test')::boolean IS TRUE`;
      } else if (tests === 'include') {
        // no filter
      } else {
        // default exclude
        query += ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS FALSE`;
      }

      if (cohort) {
        params.push(cohort);
        query += ` AND r.metadata->>'cohort' = $${++paramCount}`;
      }

      query += `
        GROUP BY r.id, s.name, name_answer.answer_text
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
      const countParams: any[] = [];
      let countParamCount = 0;
      if (surveyId) {
        countParams.push(surveyId);
        countQuery += ` AND r.survey_id = $${++countParamCount}`;
      }
      if (status === 'completed') {
        countQuery += ` AND r.completed_at IS NOT NULL`;
      } else if (status === 'incomplete') {
        countQuery += ` AND r.completed_at IS NULL`;
      }
      if (tests === 'only') {
        countQuery += ` AND (r.metadata->>'is_test')::boolean IS TRUE`;
      } else if (tests === 'include') {
        // no filter
      } else {
        countQuery += ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS FALSE`;
      }
      if (cohort) {
        countParams.push(cohort);
        countQuery += ` AND r.metadata->>'cohort' = $${++countParamCount}`;
      }

      const countResult = await db.query(countQuery, countParams);
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

  async markResponseTest(req: Request, res: Response, next: NextFunction) {
    try {
      const { responseId } = req.params;
      const { isTest } = req.body as { isTest: boolean };
      const db = getDb();
      if (!db) return res.status(503).json({ status: 'error', message: 'Database not connected' });

      const query = `
        UPDATE responses
        SET metadata = jsonb_set(COALESCE(metadata,'{}')::jsonb, '{is_test}', $1::jsonb)
        WHERE id = $2
        RETURNING id, (metadata->>'is_test')::boolean as is_test
      `;
      const result = await db.query(query, [JSON.stringify(!!isTest), responseId]);
      if (result.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Response not found' });
      return res.json({ status: 'ok', responseId, is_test: result.rows[0].is_test });
    } catch (error) {
      next(error);
    }
  }

  async deleteResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const { responseId } = req.params;
      const db = getDb();
      if (!db) return res.status(503).json({ status: 'error', message: 'Database not connected' });
      const result = await db.query('DELETE FROM responses WHERE id = $1', [responseId]);
      if (result.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Response not found' });
      return res.json({ status: 'ok', deleted: 1 });
    } catch (error) {
      next(error);
    }
  }

  async deleteResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const { all, onlyTest, confirm } = req.query as any;
      const db = getDb();
      if (!db) return res.status(503).json({ status: 'error', message: 'Database not connected' });

      if (all === 'true') {
        if (confirm !== 'DELETE ALL') return res.status(400).json({ status: 'error', message: 'Confirmation phrase required' });
        const result = await db.query('DELETE FROM responses');
        return res.json({ status: 'ok', deleted: result.rowCount || 0 });
      }
      if (onlyTest === 'true') {
        if (confirm !== 'DELETE TEST') return res.status(400).json({ status: 'error', message: 'Confirmation phrase required' });
        const result = await db.query("DELETE FROM responses WHERE COALESCE((metadata->>'is_test')::boolean, FALSE) IS TRUE");
        return res.json({ status: 'ok', deleted: result.rowCount || 0 });
      }
      return res.status(400).json({ status: 'error', message: 'Specify all=true or onlyTest=true' });
    } catch (error) {
      next(error);
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
          r.id,
          r.survey_id,
          r.session_id,
          COALESCE(name_answer.answer_text, r.respondent_name) as respondent_name,
          r.started_at,
          r.completed_at,
          r.metadata,
          s.name as survey_name
        FROM responses r
        JOIN surveys s ON r.survey_id = s.id
        LEFT JOIN answers name_answer ON r.id = name_answer.response_id 
          AND name_answer.metadata->>'blockId' = 'b3'
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

    const { surveyId, tests, cohort } = req.query as any;
    if (!surveyId) {
      return res.status(400).send('surveyId is required');
    }

    try {
      const questionOrder = surveyStructure.survey.sections.flatMap(s => s.blocks);
      const questionTextMap = new Map(Object.entries(surveyStructure.blocks).map(([id, block]) => [id, block.content || id]));

      let query = `
        SELECT 
          r.id as response_id,
          COALESCE(name_answer.answer_text, r.respondent_name) as respondent_name,
          r.started_at,
          r.completed_at,
          r.metadata->>'cohort' as cohort,
          a.metadata->>'blockId' as question_id,
          a.answer_text,
          a.answer_choice_ids,
          a.video_url,
          a.metadata
        FROM responses r
        LEFT JOIN answers a ON r.id = a.response_id
        LEFT JOIN answers name_answer ON r.id = name_answer.response_id 
          AND name_answer.metadata->>'blockId' = 'b3'
        WHERE r.survey_id = $1
      `;
      const params: any[] = [surveyId];
      let paramCount = 1;
      if (tests === 'only') {
        query += ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS TRUE`;
      } else if (tests === 'include') {
        // no-op include both
      } else {
        // default exclude
        query += ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS FALSE`;
      }
      if (cohort) {
        params.push(cohort);
        query += ` AND r.metadata->>'cohort' = $${++paramCount}`;
      }
      query += ` ORDER BY r.started_at, a.answered_at`;

      const { rows } = await db.query(query, params);

      if (rows.length === 0) {
        return res.status(404).send('No responses found for this survey.');
      }

      const formatAnswer = (row) => {
        if (!row) return '';
        if (row.video_url) return row.video_url;
        if (row.answer_choice_ids && Array.isArray(row.answer_choice_ids) && row.answer_choice_ids.length > 0) {
          return row.answer_choice_ids.join('; ');
        }
        if (row.metadata && typeof row.metadata === 'object') {
          if (row.question_id === 'b16a-contact') {
            const m = row.metadata || {};
            const parts: string[] = [];
            const first = m.firstName || m.first_name;
            const last = m.lastName || m.last_name;
            const fullName = [first, last].filter(Boolean).join(' ').trim();
            if (fullName) parts.push(`Name: ${fullName}`);
            if (m.email) parts.push(`Email: ${m.email}`);
            if (m.phone) parts.push(`Phone: ${m.phone}`);
            const address = [m.address1, m.address2].filter(Boolean).join(', ');
            const citystatezip = [m.city, m.state, m.zip].filter(Boolean).join(', ');
            if (address) parts.push(`Address: ${address}`);
            if (citystatezip) parts.push(`Location: ${citystatezip}`);
            if (m.type === 'skipped') return 'Contact form skipped';
            return parts.join(' | ');
          }
          if (row.question_id === 'b9') {
            const scales = ['traditional_innovative', 'corporate_community', 'transactional_relationship', 'behind_visible', 'exclusive_inclusive'];
            return scales.map(scale => `${scale.replace(/_/g, '-')}: ${row.metadata[scale] || 'N/A'}`).join('; ');
          }
          if (row.question_id === 'b19') {
            const demo = row.metadata;
            const parts = [];
            if (demo.user_age) parts.push(`Age: ${demo.user_age}`);
            if (demo.user_zip) parts.push(`ZIP: ${demo.user_zip}`);
            if (demo.giving_level) parts.push(`Giving: ${demo.giving_level}`);
            if (demo.race_ethnicity) parts.push(`Race: ${Array.isArray(demo.race_ethnicity) ? demo.race_ethnicity.join(', ') : demo.race_ethnicity}`);
            if (demo.gender_identity) parts.push(`Gender: ${demo.gender_identity}`);
            return parts.join('; ');
          }
        }
        return row.answer_text || '';
      };

      const responses = new Map();
      const allQuestionIds = new Set();

      for (const row of rows) {
        if (row.question_id) {
          allQuestionIds.add(row.question_id);
        }

        if (!responses.has(row.response_id)) {
          responses.set(row.response_id, {
            response_id: row.response_id,
            respondent_name: row.respondent_name,
            started_at: row.started_at ? new Date(row.started_at).toISOString() : '',
            completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : '',
          });
        }
        
        const response = responses.get(row.response_id);
        if (row.question_id) {
          response[row.question_id] = formatAnswer(row);
        }
      }

      const sortedQuestionIds = questionOrder.filter(id => allQuestionIds.has(id));
      const headers = ['response_id', 'respondent_name', 'started_at', 'completed_at', 'cohort', ...sortedQuestionIds.map(id => questionTextMap.get(id) || id)];
      
      const data = Array.from(responses.values()).map(response => {
        const row = {
          response_id: response.response_id,
          respondent_name: response.respondent_name,
          started_at: response.started_at,
          completed_at: response.completed_at,
          cohort: '',
        };
        for (const qid of sortedQuestionIds) {
          row[questionTextMap.get(qid) || qid] = response[qid] || '';
        }
        return row;
      });

      // fill cohort values from the source rows
      rows.forEach(r => {
        const target = data.find(d => d.response_id === r.response_id);
        if (target && !target.cohort) target.cohort = r.cohort || '';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey-export-${surveyId}-${Date.now()}.csv"`);
      
      const csvStream = format({ headers });
      csvStream.pipe(res);
      data.forEach(row => csvStream.write(row));
      csvStream.end();

    } catch (error) {
      logger.error('Error exporting responses', { error });
      next(error);
    }
  }

  async getQuestionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const db = getDb();
      if (!db) {
        return res.json({ questionStats: [] });
      }

      const questions = Object.entries(surveyStructure.blocks)
        .filter(([, block]) => {
          const b = block as any;
          return ['single-choice', 'multi-choice', 'yes-no', 'quick-reply', 'scale', 'ranking', 'mixed-media', 'semantic-differential'].includes(b.type);
        })
        .map(([blockId, block]) => {
          const b = block as any;
          const raw = typeof b.content === 'string' ? b.content : b.content?.default || b.content?.['non-supporter'] || '';
          return {
            id: blockId,
            text: sanitizeQuestionText(raw),
            type: b.type,
            options: b.options || []
          };
        });

      const questionIds = questions.map(q => q.id);
      if (questionIds.length === 0) {
        return res.json({ questionStats: [] });
      }

      const { tests } = req.query as any;
      let statsQuery = `
        SELECT 
          a.metadata->>'blockId' as "questionId",
          a.answer_text,
          a.answer_choice_ids,
          a.metadata->>'type' as answer_type,
          COUNT(*) as count
        FROM answers a
        JOIN responses r ON r.id = a.response_id
        WHERE a.metadata->>'blockId' = ANY($1::text[])
      `;
      if (tests === 'only') {
        statsQuery += ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS TRUE`;
      } else if (tests === 'include') {
        // include both
      } else {
        statsQuery += ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS FALSE`;
      }
      statsQuery += ` GROUP BY a.metadata->>'blockId', a.answer_text, a.answer_choice_ids, a.metadata->>'type'`;

      const result = await db.query(statsQuery, [questionIds]);
      
      const statsByQuestion = result.rows.reduce((acc, row) => {
        const questionId = row.questionId;
        if (!acc[questionId]) {
          acc[questionId] = [];
        }
        acc[questionId].push(row);
        return acc;
      }, {});

      const questionStats = await Promise.all(questions.map(async (question) => {
        const stats = statsByQuestion[question.id] || [];
        if (stats.length === 0) return null;

        const totalResponses = stats.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
        const distribution: Record<string, number> = {};

        stats.forEach((row: any) => {
          const count = parseInt(row.count, 10);
          if (question.type === 'mixed-media') {
            const t = row.answer_type || 'unknown';
            distribution[t] = (distribution[t] || 0) + count;
          } else if (row.answer_choice_ids && row.answer_choice_ids.length > 0) {
            (row.answer_choice_ids as string[]).forEach((choiceId: string) => {
              const key = String(choiceId);
              distribution[key] = (distribution[key] || 0) + count;
            });
          } else if (row.answer_text) {
            distribution[row.answer_text] = (distribution[row.answer_text] || 0) + count;
          }
        });

        const answerDistribution: Record<string, { count: number; percentage: number }> = {};
        if (question.type === 'mixed-media') {
          const keys = ['video', 'audio', 'text', 'skip'];
          keys.forEach(k => {
            const cnt = distribution[k] || 0;
            answerDistribution[k] = {
              count: cnt,
              percentage: totalResponses > 0 ? Math.round((cnt / totalResponses) * 100) : 0
            };
          });
        } else if (question.type === 'ranking') {
          // Compute position-weighted scores for ranking question.
          // Weight scheme: position 1 = N, 2 = N-1, ..., where N = length of that response's list.
          const scoreByChoice: Record<string, number> = {};
          let totalPossiblePoints = 0;
          stats.forEach((row: any) => {
            const count = parseInt(row.count, 10);
            const arr: string[] = Array.isArray(row.answer_choice_ids) ? row.answer_choice_ids : [];
            const n = arr.length;
            if (n === 0 || count === 0) return;
            // Sum of weights 1..n = n*(n+1)/2
            totalPossiblePoints += (n * (n + 1)) / 2 * count;
            arr.forEach((choiceId: string, idx: number) => {
              const weight = n - idx; // top gets highest
              const key = String(choiceId);
              scoreByChoice[key] = (scoreByChoice[key] || 0) + weight * count;
            });
          });

          if (question.options && question.options.length > 0) {
            question.options.forEach(option => {
              const optionData = option as any;
              const value = optionData.value !== undefined ? String(optionData.value) : String(optionData.id);
              const label = optionData.label || value;
              const score = Math.round(scoreByChoice[value] || 0);
              const pct = totalPossiblePoints > 0 ? Math.round((scoreByChoice[value] || 0) * 100 / totalPossiblePoints) : 0;
              answerDistribution[label] = {
                count: score,
                percentage: pct
              };
            });
          } else {
            Object.entries(scoreByChoice).forEach(([value, score]) => {
              answerDistribution[value] = {
                count: Math.round(score as number),
                percentage: totalPossiblePoints > 0 ? Math.round((score as number) * 100 / totalPossiblePoints) : 0
              };
            });
          }
        } else if (question.options && question.options.length > 0) {
          question.options.forEach(option => {
            const optionData = option as any;
            const value = optionData.value !== undefined ? String(optionData.value) : String(optionData.id);
            const label = optionData.label || value;
            const cnt = distribution[value] || 0;
            answerDistribution[label] = {
              count: cnt,
              percentage: totalResponses > 0 ? Math.round((cnt / totalResponses) * 100) : 0
            };
          });
        } else {
          Object.entries(distribution).forEach(([answer, cnt]) => {
            answerDistribution[answer] = {
              count: cnt as number,
              percentage: totalResponses > 0 ? Math.round(((cnt as number) / totalResponses) * 100) : 0
            };
          });
        }

        const base: any = {
          questionId: question.id,
          questionText: question.text,
          questionType: question.type,
          totalResponses,
          answerDistribution
        };
        // Provide semantic averages for b9
        if (question.type === 'semantic-differential') {
          const avgQuery = `
            SELECT 
              AVG((a.metadata->>'traditional_innovative')::numeric) as traditional_innovative,
              AVG((a.metadata->>'corporate_community')::numeric) as corporate_community,
              AVG((a.metadata->>'transactional_relationship')::numeric) as transactional_relationship,
              AVG((a.metadata->>'behind_visible')::numeric) as behind_visible,
              AVG((a.metadata->>'exclusive_inclusive')::numeric) as exclusive_inclusive
            FROM answers a
            JOIN responses r ON r.id = a.response_id
            WHERE a.metadata->>'blockId' = 'b9'
          `;
          const avgRes = await db.query(avgQuery);
          const row = avgRes.rows[0] || {};
          base.semanticSummary = {
            traditional_innovative: parseFloat(row.traditional_innovative || 0),
            corporate_community: parseFloat(row.corporate_community || 0),
            transactional_relationship: parseFloat(row.transactional_relationship || 0),
            behind_visible: parseFloat(row.behind_visible || 0),
            exclusive_inclusive: parseFloat(row.exclusive_inclusive || 0)
          };
        }

        return base;
      }));

      res.json({ questionStats: questionStats.filter(Boolean) });
    } catch (error) {
      console.error('Error getting question stats:', error);
      next(error);
    }
  }

  async getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { surveyId, tests } = req.query as any;
      const db = getDb();
      
      // If no database, return mock analytics
      if (!db) {
        const mockAnalytics = {
          totalResponses: 25,
          completedResponses: 20,
          avgCompletionTime: 8.5,
          demographicsOptInCount: 12,
          demographicsOptInRate: 0.6,
          avgDonation: 250
        };
        
        return res.json(mockAnalytics);
      }

      // Build tests filter clause
      let testsClause = '';
      if (tests === 'only') {
        testsClause = ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS TRUE`;
      } else if (tests === 'include') {
        // include both - no clause
      } else {
        testsClause = ` AND COALESCE((r.metadata->>'is_test')::boolean, FALSE) IS FALSE`;
      }

      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT r.id) as total_responses,
          COUNT(DISTINCT CASE WHEN r.completed_at IS NOT NULL THEN r.id END) as completed_responses,
          AVG(EXTRACT(EPOCH FROM (r.completed_at - r.started_at))/60)::numeric(10,2) as avg_completion_time_minutes
        FROM responses r
        WHERE r.survey_id = $1
          ${testsClause}
      `;

      const result = await db.query(summaryQuery, [surveyId]);
      
      const data = result.rows[0];
      if (!data) {
        return res.json({
          totalResponses: 0,
          completedResponses: 0,
          avgCompletionTime: 0,
          demographicsOptInCount: 0,
          demographicsOptInRate: 0,
          avgDonation: 0
        });
      }

      let totalResponses = parseInt(data.total_responses) || 0;
      let completedResponses = parseInt(data.completed_responses) || 0;
      let avgCompletionTime = parseFloat(data.avg_completion_time_minutes) || 0;

      // If filtered by surveyId returns zero (common in dev when surveyId differs),
      // fall back to all responses with the same tests filter to avoid blank dashboard.
      if (totalResponses === 0 && completedResponses === 0) {
        const fallbackSummary = await db.query(
          `SELECT 
            COUNT(DISTINCT r.id) as total_responses,
            COUNT(DISTINCT CASE WHEN r.completed_at IS NOT NULL THEN r.id END) as completed_responses,
            AVG(EXTRACT(EPOCH FROM (r.completed_at - r.started_at))/60)::numeric(10,2) as avg_completion_time_minutes
           FROM responses r
           WHERE 1=1 ${testsClause}`
        );
        const fb = fallbackSummary.rows[0];
        if (fb) {
          totalResponses = parseInt(fb.total_responses) || 0;
          completedResponses = parseInt(fb.completed_responses) || 0;
          avgCompletionTime = parseFloat(fb.avg_completion_time_minutes) || 0;
        }
      }

      // Demographics opt-in (b18 Yes)
      const demoQuery = `
        SELECT COUNT(*)::int as opt_in
        FROM answers a
        JOIN responses r ON r.id = a.response_id
        WHERE r.survey_id = $1
          ${testsClause}
          AND a.metadata->>'blockId' = 'b18'
          AND LOWER(COALESCE(a.answer_text, '')) IN ('yes','true')
      `;
      const demoRes = await db.query(demoQuery, [surveyId]);
      let demographicsOptInCount = (demoRes.rows[0] && demoRes.rows[0].opt_in) ? parseInt(demoRes.rows[0].opt_in, 10) : 0;
      if (totalResponses > 0 && demographicsOptInCount === 0) {
        // Fallback without survey filter
        const fbDemo = await db.query(
          `SELECT COUNT(*)::int as opt_in
           FROM answers a
           JOIN responses r ON r.id = a.response_id
           WHERE 1=1 ${testsClause}
             AND a.metadata->>'blockId' = 'b18'
             AND LOWER(COALESCE(a.answer_text, '')) IN ('yes','true')`
        );
        demographicsOptInCount = (fbDemo.rows[0] && fbDemo.rows[0].opt_in) ? parseInt(fbDemo.rows[0].opt_in, 10) : 0;
      }
      const demographicsOptInRate = completedResponses > 0 ? demographicsOptInCount / completedResponses : 0;

      // Average donation from giving level (b19.4). Values are stored as answer_text tokens
      // like 'under-100', '100-249', '5000-plus', or 'prefer-not'.
      const donationQuery = `
        SELECT COALESCE(a.answer_text, a.answer_choice_ids[1]) as giving_choice
        FROM answers a
        JOIN responses r ON r.id = a.response_id
        WHERE r.survey_id = $1
          ${testsClause}
          AND a.metadata->>'blockId' = 'b19.4'
      `;
      const donationRes = await db.query(donationQuery, [surveyId]);
      const parseDonation = (s: string | null): number | null => {
        if (!s) return null;
        const t = s.toLowerCase();
        if (t.includes('prefer-not')) return null;
        if (t.includes('under')) {
          // 'under-100' -> use midpoint 50
          const num = parseInt(t.replace(/[^0-9]/g, ''), 10);
          return isNaN(num) ? 50 : Math.max(1, Math.round(num / 2));
        }
        if (t.includes('plus')) {
          // '5000-plus' -> use lower bound
          const num = parseInt(t.replace(/[^0-9]/g, ''), 10);
          return isNaN(num) ? null : num;
        }
        const m = t.match(/([0-9][0-9,]*)-([0-9][0-9,]*)/);
        if (m) {
          const low = parseInt(m[1].replace(/,/g, ''), 10);
          const high = parseInt(m[2].replace(/,/g, ''), 10);
          if (!isNaN(low) && !isNaN(high)) return Math.round((low + high) / 2);
        }
        // Fallback: try to parse any number present
        const any = parseInt(t.replace(/[^0-9]/g, ''), 10);
        return isNaN(any) ? null : any;
      };
      let sum = 0; let cnt = 0;
      donationRes.rows.forEach((r: any) => {
        const val = parseDonation(r.giving_choice);
        if (val !== null && isFinite(val)) { sum += val; cnt += 1; }
      });
      if (cnt === 0) {
        // Fallback without survey filter
        const fbDonation = await db.query(
          `SELECT COALESCE(a.answer_text, a.answer_choice_ids[1]) as giving_choice
           FROM answers a
           JOIN responses r ON r.id = a.response_id
           WHERE 1=1 ${testsClause}
             AND a.metadata->>'blockId' = 'b19.4'`
        );
        sum = 0; cnt = 0;
        fbDonation.rows.forEach((r: any) => {
          const val = parseDonation(r.giving_choice);
          if (val !== null && isFinite(val)) { sum += val; cnt += 1; }
        });
      }
      const avgDonation = cnt > 0 ? Math.round(sum / cnt) : 0;

      res.json({
        totalResponses,
        completedResponses,
        avgCompletionTime,
        demographicsOptInCount,
        demographicsOptInRate,
        avgDonation
      });
    } catch (error) {
      next(error);
      return;
    }
  }

  
}

export const adminController = new AdminController();
