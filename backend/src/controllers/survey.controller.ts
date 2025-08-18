import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { surveyService } from '../services/survey.service';
import { surveyEngine } from '../services/surveyEngine';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

class SurveyController {
  async startSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, surveyId } = req.body;
      const sessionId = uuidv4();

      // Initialize survey response
      const surveyResponse = await surveyService.createResponse({
        surveyId,
        sessionId,
        respondentName: name || null
      });

      // Get first question
      const firstQuestion = await surveyEngine.getFirstQuestion(surveyId);

      // Initialize survey state
      await surveyEngine.initializeState(sessionId, {
        surveyId,
        responseId: surveyResponse.id,
        currentBlockId: firstQuestion.id,
        variables: {
          user_name: name || ''
        }
      });

      res.json({
        sessionId,
        firstQuestion: surveyEngine.formatQuestionForClient(firstQuestion, { user_name: name })
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, questionId, answer } = req.body;
      
      // Debug logging
      logger.debug(`Answer submission received: questionId=${questionId}, sessionId=${sessionId}`);
      

      // Validate session exists
      const surveyState = await surveyEngine.getState(sessionId);
      if (!surveyState) {
        throw new AppError('Invalid session ID', 400);
      }

      // FAST-PATH: Update in-memory state and compute next before DB
      await surveyEngine.updateState(sessionId, questionId, answer);

      const updatedState = await surveyEngine.getState(sessionId);
      if (!updatedState) {
        throw new AppError('Failed to get updated state', 500);
      }

      const nextQuestion = await surveyEngine.getNextQuestion(sessionId, questionId, answer);

      // Calculate progress from in-memory state
      const progress = await surveyEngine.calculateProgress(sessionId);

      // Respond immediately using in-memory computation
      res.json({
        nextQuestion: nextQuestion ? 
          surveyEngine.formatQuestionForClient(nextQuestion, updatedState.variables) : 
          null,
        progress
      });

      // Persist to DB asynchronously (fire-and-forget)
      setImmediate(async () => {
        try {
          await surveyService.saveAnswer({
            responseId: updatedState.responseId,
            questionId,
            answer
          });

          // If this was effectively the last step (final message next), mark complete
          if (nextQuestion && (nextQuestion.id === 'b20' || nextQuestion.id === 'b20-no-share')) {
            await surveyService.completeResponse(updatedState.responseId);
          }
        } catch (persistError) {
          logger.error('Async persistence failed for answer', {
            sessionId,
            questionId,
            error: persistError
          });
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async completeSurvey(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;

      const surveyState = await surveyEngine.getState(sessionId);
      if (!surveyState) {
        throw new AppError('Invalid session ID', 400);
      }

      // Mark survey as completed
      await surveyService.completeResponse(surveyState.responseId);

      // Clear session state
      await surveyEngine.clearState(sessionId);

      res.json({
        success: true,
        completionMessage: "Thank you for completing the survey!"
      });
    } catch (error) {
      next(error);
    }
  }

  async getSurveyState(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      const surveyState = await surveyEngine.getState(sessionId);
      if (!surveyState) {
        throw new AppError('Session not found', 404);
      }

      const currentQuestion = await surveyEngine.getCurrentQuestion(sessionId);
      const progress = await surveyEngine.calculateProgress(sessionId);

      res.json({
        currentQuestion: currentQuestion ? 
          surveyEngine.formatQuestionForClient(currentQuestion, surveyState.variables) :
          null,
        progress,
        isComplete: !currentQuestion
      });
    } catch (error) {
      next(error);
    }
  }
}

export const surveyController = new SurveyController();
