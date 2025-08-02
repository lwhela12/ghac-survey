import Joi from 'joi';

export const startSurveySchema = Joi.object({
  name: Joi.string().optional().allow('').max(255),
  surveyId: Joi.string().required()
});

export const submitAnswerSchema = Joi.object({
  sessionId: Joi.string().required(),
  questionId: Joi.string().required(),
  answer: Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.boolean(),
    Joi.array().items(Joi.string()),
    Joi.object({
      videoUrl: Joi.string().uri()
    }),
    Joi.object({
      text: Joi.string()
    }),
    Joi.number(),
    Joi.object() // For complex answers like scales
  ).required()
});

export const completeSurveySchema = Joi.object({
  sessionId: Joi.string().required()
});