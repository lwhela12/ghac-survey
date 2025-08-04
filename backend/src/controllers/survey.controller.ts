import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { surveyService } from '../services/survey.service';
import { surveyEngine } from '../services/surveyEngine';
import { AppError } from '../middleware/errorHandler';

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
      

      // Validate session exists
      const surveyState = await surveyEngine.getState(sessionId);
      if (!surveyState) {
        throw new AppError('Invalid session ID', 400);
      }

      // Save answer
      await surveyService.saveAnswer({
        responseId: surveyState.responseId,
        questionId,
        answer
      });

      // Update state with answer
      await surveyEngine.updateState(sessionId, questionId, answer);

      // Get updated state with new variables
      const updatedState = await surveyEngine.getState(sessionId);
      if (!updatedState) {
        throw new AppError('Failed to get updated state', 500);
      }

      // Get next question based on branching logic
      const nextQuestion = await surveyEngine.getNextQuestion(
        sessionId,
        questionId,
        answer
      );

      // Calculate progress
      const progress = await surveyEngine.calculateProgress(sessionId);

      // Check if the next question is the final message (b20)
      // If so, mark the survey as complete
      if (nextQuestion && nextQuestion.id === 'b20') {
        await surveyService.completeResponse(surveyState.responseId);
      }

      res.json({
        nextQuestion: nextQuestion ? 
          surveyEngine.formatQuestionForClient(nextQuestion, updatedState.variables) : 
          null,
        progress
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