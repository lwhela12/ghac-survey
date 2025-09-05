import Joi from 'joi';

export const startSurveySchema = Joi.object({
  name: Joi.string().optional().allow('').max(255),
  surveyId: Joi.string().required(),
  tracking: Joi.object({
    cohort: Joi.string().optional().allow(''),
    referrer: Joi.string().optional().allow(''),
    landingUrl: Joi.string().optional().allow(''),
    landingPath: Joi.string().optional().allow(''),
    capturedAt: Joi.string().optional().allow(''),
    utm: Joi.object({
      source: Joi.string().optional().allow(''),
      medium: Joi.string().optional().allow(''),
      campaign: Joi.string().optional().allow(''),
      term: Joi.string().optional().allow(''),
      content: Joi.string().optional().allow(''),
    }).unknown(true).optional(),
  }).unknown(true).optional()
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
    // Semantic differential schema for b9 - must have all 5 properties
    Joi.object({
      traditional_innovative: Joi.number().min(1).max(5).required(),
      corporate_community: Joi.number().min(1).max(5).required(),
      transactional_relationship: Joi.number().min(1).max(5).required(),
      behind_visible: Joi.number().min(1).max(5).required(),
      exclusive_inclusive: Joi.number().min(1).max(5).required()
    }).length(5), // Ensure exactly 5 properties
    // For other complex answers - allow unknown properties
    Joi.object().unknown(true)
  ).required()
});

export const completeSurveySchema = Joi.object({
  sessionId: Joi.string().required()
});
