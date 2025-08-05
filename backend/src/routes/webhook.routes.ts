import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getDb } from '../database/initialize';

const router = Router();

// VideoAsk webhook endpoint
router.post('/videoask', async (req: Request, res: Response) => {
  try {
    // Log the entire webhook payload for debugging
    logger.info('VideoAsk webhook received:', {
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
    // VideoAsk nests answers under contact
    const answers = Array.isArray(contact?.answers) ? contact.answers : [];

    // Log specific event details
    logger.info('VideoAsk webhook event:', {
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
      logger.info('VideoAsk answers:', JSON.stringify(answers, null, 2));
    }

    // VideoAsk form share IDs map to our survey-engine block IDs
    const questionIdMap: { [key: string]: string } = {
      'fcb71j5f2': 'b7',  // Personal story
      'fdmk80eer': 'b12'  // Magic wand
    };
    logger.info('VideoAsk share-to-block mapping', { shareId: form?.share_id, mapping: questionIdMap });

    // Process the webhook only for form_response events
    if (event_type === 'form_response' && answers && answers.length > 0) {
      const videoAnswer = answers[0]; // Get the first answer
      
      // Extract video/audio response details
      // VideoAsk may nest media info under answer or at top-level
      const mediaUrl = videoAnswer?.answer?.media_url || videoAnswer?.media_url;
      const mediaType = videoAnswer?.answer?.media_type || videoAnswer?.media_type || videoAnswer?.type;
      const transcript = videoAnswer?.answer?.transcript || videoAnswer?.transcript;
      const duration = videoAnswer?.answer?.duration || videoAnswer?.media_duration;
      
      logger.info('Processing VideoAsk response:', {
        formId: form?.form_id,
        formShareId: form?.share_id,
        questionId: questionIdMap[form?.share_id] || 'unknown',
        mediaUrl,
        mediaType,
        hasTranscript: !!transcript,
        duration
      });
      
      // Get database connection
      const db = getDb();
      
      if (db && mediaUrl) {
        // Determine which block to update based on form share ID
        const questionId = questionIdMap[form?.share_id] || 'b7';
        logger.info('VideoAsk will update answer block', { formShareId: form?.share_id, questionId, mediaUrl });
        
        const updateQuery = `
          UPDATE answers
          SET
            video_url = $1,
            metadata = jsonb_set(
              COALESCE(metadata, '{}')::jsonb,
              '{webhookData}',
              $2::jsonb
            )
          WHERE metadata->>'blockId' = $3
          RETURNING *
        `;
        
        const webhookData = {
          mediaUrl,
          mediaType,
          transcript,
          duration,
          interactionId: interaction_id,
          contactId: contact?.contact_id,
          receivedAt: new Date().toISOString()
        };
        
        try {
          logger.debug('VideoAsk updateQuery params', { mediaUrl, webhookData, questionId });
          const result = await db.query(updateQuery, [
            mediaUrl,
            JSON.stringify(webhookData),
            questionId
          ]);
          
          if (result.rows.length > 0) {
            logger.info('Successfully updated answer with VideoAsk webhook data:', {
              answerId: result.rows[0].id,
              videoUrl: mediaUrl
            });
          } else {
            logger.warn('No matching answer found to update with VideoAsk webhook data', { questionId, mediaUrl });
          }
        } catch (updateError) {
          logger.error('Failed to update answer with VideoAsk webhook data:', updateError);
        }
      } else {
        if (!db) {
          logger.warn('No database connection available to store VideoAsk webhook data');
        } else if (!mediaUrl) {
          logger.warn('No media URL in VideoAsk response');
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
