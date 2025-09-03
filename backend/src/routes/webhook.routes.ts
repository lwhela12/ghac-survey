import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getDb } from '../database/initialize';
import { surveyEngine } from '../services/surveyEngine';

const router = Router();

// VideoAsk webhook endpoint
router.post('/videoask', async (req: Request, res: Response) => {
  try {
    // Log the webhook payload at debug level (avoid PII at info)
    logger.debug('VideoAsk webhook received:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Extract the webhook data - VideoAsk has a specific structure
    const {
      event_type,
      event_id,
      interaction_id,
      contact,
      form
    } = req.body;
    // Hidden variables passed via VideoAsk URL (if configured)
    const hiddenVars = (contact?.variables || req.body?.variables || {}) as Record<string, any>;
    const sessionIdVar: string | undefined = hiddenVars.sid || hiddenVars.sessionId || hiddenVars.session_id;
    const responseIdVar: string | undefined = hiddenVars.rid || hiddenVars.responseId || hiddenVars.response_id;
    // VideoAsk nests answers under contact
    const answers = Array.isArray(contact?.answers) ? contact.answers : [];

    // Log specific event details
    logger.debug('VideoAsk webhook event:', {
      event_type,
      event_id,
      interaction_id,
      form_id: form?.form_id,
      form_share_id: form?.share_id,
      has_answers: !!answers,
      answers_count: answers?.length || 0
    });
    
    // Log the answers structure to understand it better
    if (answers && answers.length > 0) {
      logger.debug('VideoAsk answers:', JSON.stringify(answers, null, 2));
    }

    // VideoAsk form share IDs map to our survey-engine block IDs
    const questionIdMap: { [key: string]: string } = {
      'fcb71j5f2': 'b7',  // Personal story
      'fdmk80eer': 'b12'  // Magic wand
    };
    logger.debug('VideoAsk share-to-block mapping', { shareId: form?.share_id, mapping: questionIdMap });

    // Process the webhook only for form_response events
    if (event_type === 'form_response' && answers && answers.length > 0) {
      const videoAnswer = answers[0]; // Get the first answer
      
      // Extract response details based on type
      // Text responses have 'input_text', video/audio have 'media_url'
      const responseType = videoAnswer?.type || videoAnswer?.media_type;
      const inputText = videoAnswer?.input_text; // For text responses
      const mediaUrl = videoAnswer?.answer?.media_url || videoAnswer?.media_url; // For video/audio
      const mediaType = responseType;
      const transcript = videoAnswer?.answer?.transcript || videoAnswer?.transcript; // For video/audio transcriptions
      const duration = videoAnswer?.answer?.duration || videoAnswer?.media_duration;
      
      logger.debug('Processing VideoAsk response:', {
        formId: form?.form_id,
        formShareId: form?.share_id,
        questionId: questionIdMap[form?.share_id] || 'unknown',
        mediaUrl,
        mediaType,
        inputText,
        hasTranscript: !!transcript,
        hasInputText: !!inputText,
        duration,
        hiddenVars
      });
      
      // Get database connection
      const db = getDb();
      
      // Process if we have either text or media content
      if (db && (mediaUrl || inputText)) {
        // Determine which block to update based on form share ID
        const shareId = form?.share_id;
        const questionId = questionIdMap[shareId as string];
        if (!questionId) {
          logger.warn('Unknown VideoAsk share_id received; skipping update to avoid wrong block mapping', { shareId });
          res.status(200).json({ status: 'ignored', reason: 'unknown_share_id' });
          return;
        }

        // Try to scope to a specific respondent using hidden variables
        let scopedResponseId: string | null = null;
        if (responseIdVar && typeof responseIdVar === 'string') {
          scopedResponseId = responseIdVar;
        } else if (sessionIdVar && typeof sessionIdVar === 'string') {
          try {
            const state = await surveyEngine.getState(sessionIdVar);
            if (state?.responseId) scopedResponseId = state.responseId;
          } catch (e) {
            logger.warn('Failed to resolve responseId from sessionId for webhook', { sessionIdVar, error: (e as any)?.message });
          }
        }
        logger.debug('VideoAsk will update answer block', { 
          formShareId: form?.share_id, 
          questionId, 
          mediaUrl,
          inputText,
          mediaType,
          scopedResponseId
        });
        
        // Different update query based on response type
        let updateQuery: string;
        const webhookData = {
          mediaUrl,
          mediaType,
          inputText,
          transcript,
          duration,
          interactionId: interaction_id,
          contactId: contact?.contact_id,
          receivedAt: new Date().toISOString()
        };
        
        if (mediaType === 'text' && inputText) {
          // For text responses, update answer_text field
          if (scopedResponseId) {
            updateQuery = `
              UPDATE answers
              SET
                answer_text = $1,
                metadata = jsonb_set(
                  COALESCE(metadata, '{}')::jsonb,
                  '{webhookData}',
                  $2::jsonb
                )
              WHERE metadata->>'blockId' = $3
                AND response_id = $4
              RETURNING *
            `;
          } else {
            // Fallback: only update the most recent empty text row for this block
            updateQuery = `
              WITH target AS (
                SELECT id FROM answers
                WHERE metadata->>'blockId' = $3
                  AND answer_text IS NULL
                ORDER BY answered_at DESC
                LIMIT 1
              )
              UPDATE answers
              SET
                answer_text = $1,
                metadata = jsonb_set(
                  COALESCE(metadata, '{}')::jsonb,
                  '{webhookData}',
                  $2::jsonb
                )
              WHERE id IN (SELECT id FROM target)
              RETURNING *
            `;
          }
        } else {
          // For video/audio responses, update video_url field
          if (scopedResponseId) {
            updateQuery = `
              UPDATE answers
              SET
                video_url = $1,
                metadata = jsonb_set(
                  COALESCE(metadata, '{}')::jsonb,
                  '{webhookData}',
                  $2::jsonb
                )
              WHERE metadata->>'blockId' = $3
                AND response_id = $4
              RETURNING *
            `;
          } else {
            // Fallback: only update the most recent empty media row for this block
            updateQuery = `
              WITH target AS (
                SELECT id FROM answers
                WHERE metadata->>'blockId' = $3
                  AND video_url IS NULL
                ORDER BY answered_at DESC
                LIMIT 1
              )
              UPDATE answers
              SET
                video_url = $1,
                metadata = jsonb_set(
                  COALESCE(metadata, '{}')::jsonb,
                  '{webhookData}',
                  $2::jsonb
                )
              WHERE id IN (SELECT id FROM target)
              RETURNING *
            `;
          }
        }
        
        try {
          logger.debug('VideoAsk updateQuery params', { 
            questionId,
            mediaType,
            contentValue: mediaType === 'text' ? inputText : mediaUrl
          });
          const baseParams = (mediaType === 'text' && inputText)
            ? [inputText, JSON.stringify(webhookData), questionId]
            : [mediaUrl, JSON.stringify(webhookData), questionId];
          const params = scopedResponseId ? [...baseParams, scopedResponseId] : baseParams;
          const result = await db.query(updateQuery, params);
          
          if (result.rows.length > 0) {
            logger.info('Successfully updated answer with VideoAsk webhook data:', {
              answerId: result.rows[0].id,
              questionId,
              mediaType,
              videoUrl: mediaUrl,
              textContent: inputText
            });
          } else {
            logger.warn('No matching answer found to update with VideoAsk webhook data', { 
              questionId, 
              mediaType,
              contentAvailable: !!(mediaUrl || inputText),
              scopedResponseIdPresent: !!scopedResponseId
            });
          }
        } catch (updateError) {
          logger.error('Failed to update answer with VideoAsk webhook data:', updateError);
        }
      } else {
        if (!db) {
          logger.warn('No database connection available to store VideoAsk webhook data');
        } else if (!mediaUrl && !inputText) {
          logger.warn('No content (media URL or text) in VideoAsk response', {
            mediaType,
            hasMediaUrl: !!mediaUrl,
            hasInputText: !!inputText
          });
        }
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ 
      status: 'received',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error processing VideoAsk webhook:', error);
    
    // Still return 200 to prevent VideoAsk from retrying
    res.status(200).json({ 
      status: 'error',
      message: 'Webhook received but processing failed'
    });
  }
});

// Test webhook endpoint
router.post('/videoask/test', (req: Request, res: Response) => {
  logger.info('Test webhook received:', {
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  // Log nested answers for test clarity
  if (req.body.contact?.answers) {
    logger.info('Test webhook contact.answers:', JSON.stringify(req.body.contact.answers, null, 2));
  }
  
  res.status(200).json({ 
    status: 'test received',
    timestamp: new Date().toISOString(),
    receivedData: req.body
  });
});

// Generic webhook health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    endpoints: ['/api/webhooks/videoask', '/api/webhooks/videoask/test'],
    timestamp: new Date().toISOString()
  });
});

export default router;
