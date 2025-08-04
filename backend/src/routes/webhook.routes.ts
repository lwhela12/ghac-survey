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
      form,
      answers
    } = req.body;

    // Log specific event details
    logger.info('VideoAsk webhook event:', {
      event_type,
      event_id,
      interaction_id,
      form_id: form?.form_id,
      has_answers: !!answers,
      answers_count: answers?.length || 0
    });
    
    // Log the answers structure to understand it better
    if (answers && answers.length > 0) {
      logger.info('VideoAsk answers:', JSON.stringify(answers, null, 2));
    }

    // VideoAsk form IDs map to our question IDs
    const questionIdMap: { [key: string]: string } = {
      'fcb71j5f2': 'b7',  // Personal story
      'fdmk80eer': 'b12'  // Magic wand
    };

    // Process the webhook only for form_response events
    if (event_type === 'form_response' && answers && answers.length > 0) {
      const videoAnswer = answers[0]; // Get the first answer
      
      // Extract video/audio response details
      const mediaUrl = videoAnswer?.answer?.media_url;
      const mediaType = videoAnswer?.answer?.media_type || videoAnswer?.type;
      const transcript = videoAnswer?.answer?.transcript;
      const duration = videoAnswer?.answer?.duration;
      
      logger.info('Processing VideoAsk response:', {
        formId: form?.form_id,
        questionId: questionIdMap[form?.form_id] || 'unknown',
        mediaUrl,
        mediaType,
        hasTranscript: !!transcript,
        duration
      });
      
      // Get database connection
      const db = getDb();
      
      if (db && mediaUrl) {
        // Update the most recent b7 or b12 answer with the video URL
        const questionId = questionIdMap[form?.form_id] || 'b7'; // Default to b7 if unknown
        
        const updateQuery = `
          UPDATE answers 
          SET 
            video_url = $1,
            metadata = jsonb_set(
              COALESCE(metadata, '{}')::jsonb,
              '{webhookData}',
              $2::jsonb
            )
          WHERE question_id IN (
            SELECT id FROM questions WHERE block_id = $3
          )
          AND response_id = (
            SELECT id FROM responses 
            ORDER BY created_at DESC 
            LIMIT 1
          )
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
            logger.warn('No matching answer found to update with VideoAsk webhook data');
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