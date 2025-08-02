import { Router } from 'express';
import { surveyController } from '../controllers/survey.controller';
import { validateRequest } from '../middleware/validateRequest';
import { 
  startSurveySchema, 
  submitAnswerSchema, 
  completeSurveySchema 
} from '../validators/survey.validators';

const router = Router();

// Start a new survey session
router.post(
  '/start',
  validateRequest(startSurveySchema),
  surveyController.startSurvey
);

// Submit an answer and get next question
router.post(
  '/answer',
  validateRequest(submitAnswerSchema),
  surveyController.submitAnswer
);

// Complete the survey
router.post(
  '/complete',
  validateRequest(completeSurveySchema),
  surveyController.completeSurvey
);

// Get survey state (for resuming)
router.get(
  '/state/:sessionId',
  surveyController.getSurveyState
);

export default router;