import { getDb } from '../database/initialize';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

interface CreateResponseData {
  surveyId: string;
  sessionId: string;
  respondentName: string | null;
}

interface SaveAnswerData {
  responseId: string;
  questionId: string;
  answer: any;
}

class SurveyService {
  private mockResponses = new Map<string, any>();
  private mockAnswers = new Map<string, any[]>();
  async createResponse(data: CreateResponseData) {
    const db = getDb();
    
    try {
      if (!db) {
        throw new Error('Database not available');
      }
      
      const query = `
        INSERT INTO responses (survey_id, session_id, respondent_name)
        VALUES ($1, $2, $3)
        RETURNING id, survey_id, session_id, started_at
      `;
      
      const result = await db.query(query, [
        data.surveyId,
        data.sessionId,
        data.respondentName
      ]);
      
      logger.info(`Created new survey response: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error: any) {
      // If database is not available, use mock data
      if (!db || error.code === '42P01' || error.message?.includes('Cannot read properties of null') || error.message?.includes('Database not available')) {
        logger.warn('Database not available, using mock response');
        const mockResponse = {
          id: `mock-${data.sessionId}`,
          survey_id: data.surveyId,
          session_id: data.sessionId,
          started_at: new Date()
        };
        this.mockResponses.set(mockResponse.id, mockResponse);
        this.mockAnswers.set(mockResponse.id, []);
        return mockResponse;
      }
      logger.error('Failed to create survey response:', error);
      throw error;
    }
  }

  async saveAnswer(data: SaveAnswerData) {
    const db = getDb();
    
    // Debug logging for semantic differential
    if (data.questionId === 'b9') {
      logger.info('Saving b9 semantic differential answer:', {
        questionId: data.questionId,
        answer: data.answer,
        answerType: typeof data.answer,
        answerKeys: data.answer && typeof data.answer === 'object' ? Object.keys(data.answer) : []
      });
    }
    
    try {
      if (!db) {
        throw new Error('Database not available');
      }
      // Determine answer type and format
      let answerText = null;
      let answerChoiceIds = null;
      let videoUrl = null;
      let metadata = {};

      if (typeof data.answer === 'string') {
        answerText = data.answer;
      } else if (Array.isArray(data.answer)) {
        answerChoiceIds = data.answer;
      } else if (typeof data.answer === 'object') {
        if (data.answer.videoUrl || data.answer.responseUrl) {
          videoUrl = data.answer.videoUrl || data.answer.responseUrl;
          // Also store the full VideoAsk response data in metadata
          metadata = { ...data.answer };
        } else if (data.answer.text) {
          answerText = data.answer.text;
        } else {
          // For complex answers (scales, semantic differential, etc)
          // Store the answer data in metadata
          metadata = { ...data.answer };
        }
      } else if (typeof data.answer === 'number') {
        answerText = data.answer.toString();
      }

      // Always include block ID in metadata
      const metadataWithBlockId = {
        ...metadata,
        blockId: data.questionId
      };
      
      // Debug logging for semantic differential and VideoAsk after processing
      if (data.questionId === 'b9' || data.questionId === 'b7') {
        logger.info(`${data.questionId} processed data:`, {
          answerText,
          answerChoiceIds,
          videoUrl,
          metadata,
          metadataWithBlockId
        });
      }
      
      // Use a deterministic UUID based on survey and block ID
      // This ensures the same block always gets the same UUID
      const questionUuid = crypto
        .createHash('sha256')
        .update(`${data.responseId}-${data.questionId}`)
        .digest('hex')
        .substring(0, 32);
      const formattedUuid = `${questionUuid.substring(0,8)}-${questionUuid.substring(8,12)}-${questionUuid.substring(12,16)}-${questionUuid.substring(16,20)}-${questionUuid.substring(20,32)}`;
      
      const query = `
        INSERT INTO answers (
          response_id, question_id, answer_text, 
          answer_choice_ids, video_url, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (response_id, question_id) 
        DO UPDATE SET
          answer_text = EXCLUDED.answer_text,
          answer_choice_ids = EXCLUDED.answer_choice_ids,
          video_url = EXCLUDED.video_url,
          metadata = EXCLUDED.metadata,
          answered_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      
      const result = await db.query(query, [
        data.responseId,
        formattedUuid,
        answerText,
        answerChoiceIds,
        videoUrl,
        JSON.stringify(metadataWithBlockId)
      ]);
      
      logger.debug(`Saved answer for question ${data.questionId}`);
      return result.rows[0];
    } catch (error: any) {
      // If database is not available, use mock data
      if (!db || error.code === '42P01' || error.message?.includes('Cannot read properties of null') || error.message?.includes('Database not available')) {
        logger.warn('Database not available, using mock answer storage');
        const mockAnswer = {
          id: `mock-answer-${Date.now()}`,
          response_id: data.responseId,
          question_id: data.questionId,
          answer: data.answer,
          answered_at: new Date()
        };
        const answers = this.mockAnswers.get(data.responseId) || [];
        answers.push(mockAnswer);
        this.mockAnswers.set(data.responseId, answers);
        return mockAnswer;
      }
      logger.error('Failed to save answer:', error);
      throw error;
    }
  }

  async completeResponse(responseId: string) {
    const db = getDb();
    
    try {
      if (!db) {
        throw new Error('Database not available');
      }
      const query = `
        UPDATE responses 
        SET completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, completed_at
      `;
      
      const result = await db!.query(query, [responseId]);
      
      logger.info(`Completed survey response: ${responseId}`);
      return result.rows[0];
    } catch (error: any) {
      // If database is not available, use mock data
      if (!db || error.code === '42P01' || error.message?.includes('Cannot read properties of null') || error.message?.includes('Database not available')) {
        logger.warn('Database not available, using mock completion');
        const mockResponse = this.mockResponses.get(responseId);
        if (mockResponse) {
          mockResponse.completed_at = new Date();
          return mockResponse;
        }
        return { id: responseId, completed_at: new Date() };
      }
      logger.error('Failed to complete survey response:', error);
      throw error;
    }
  }

  async getResponseById(responseId: string) {
    const db = getDb();
    
    try {
      if (!db) {
        throw new Error('Database not available');
      }
      const query = `
        SELECT 
          r.*,
          s.name as survey_name,
          COUNT(DISTINCT a.id) as answer_count
        FROM responses r
        JOIN surveys s ON r.survey_id = s.id
        LEFT JOIN answers a ON r.id = a.response_id
        WHERE r.id = $1
        GROUP BY r.id, s.name
      `;
      
      const result = await db!.query(query, [responseId]);
      return result.rows[0] || null;
    } catch (error: any) {
      if (!db || error.message?.includes('Database not available')) {
        logger.warn('Database not available, returning null');
        return null;
      }
      logger.error('Failed to get response:', error);
      throw error;
    }
  }

  async getResponseAnswers(responseId: string) {
    const db = getDb();
    
    try {
      if (!db) {
        throw new Error('Database not available');
      }
      const query = `
        SELECT 
          a.*,
          q.question_text,
          q.question_type
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.response_id = $1
        ORDER BY a.answered_at ASC
      `;
      
      const result = await db!.query(query, [responseId]);
      return result.rows;
    } catch (error: any) {
      if (!db || error.message?.includes('Database not available')) {
        logger.warn('Database not available, returning empty array');
        return [];
      }
      logger.error('Failed to get response answers:', error);
      throw error;
    }
  }
}

export const surveyService = new SurveyService();