# VideoAsk Webhook Configuration for Production

## Overview
The GHAC Survey uses VideoAsk for two video response questions:
1. **Personal Story (b7)** - Form ID: `fcb71j5f2`
2. **Future Vision (b12)** - Form ID: `fdmk80eer`

## Production Webhook URL
```
https://ghac-survey-production.up.railway.app/api/webhooks/videoask
```

## Setup Instructions

### Step 1: Access VideoAsk Dashboard
1. Log in to your VideoAsk account at https://www.videoask.com
2. Navigate to your forms/videoasks

### Step 2: Configure Webhook for Personal Story (b7)
1. Find the form with ID `fcb71j5f2` (Personal Story question)
2. Go to **Settings** → **Integrations** → **Webhooks**
3. Add a new webhook:
   - **URL**: `https://ghac-survey-production.up.railway.app/api/webhooks/videoask`
   - **Events to trigger**: Select "New response" or "Form response"
   - **Method**: POST
   - **Headers** (optional but recommended):
     ```
     Content-Type: application/json
     X-VideoAsk-Form: fcb71j5f2
     ```
4. Save the webhook configuration

### Step 3: Configure Webhook for Future Vision (b12)
1. Find the form with ID `fdmk80eer` (Future Vision question)
2. Go to **Settings** → **Integrations** → **Webhooks**
3. Add a new webhook:
   - **URL**: `https://ghac-survey-production.up.railway.app/api/webhooks/videoask`
   - **Events to trigger**: Select "New response" or "Form response"
   - **Method**: POST
   - **Headers** (optional but recommended):
     ```
     Content-Type: application/json
     X-VideoAsk-Form: fdmk80eer
     ```
4. Save the webhook configuration

### Step 4: Test the Webhooks
1. In VideoAsk, use the "Test webhook" feature if available
2. Or submit a test response through the actual form
3. Check Railway logs to confirm webhook receipt:
   ```bash
   # View Railway logs
   railway logs --service=ghac-survey-backend
   ```

## Webhook Payload Structure
The backend expects VideoAsk webhooks with this structure:
```json
{
  "event_type": "form_response",
  "event_id": "unique-event-id",
  "interaction_id": "unique-interaction-id",
  "form": {
    "form_id": "form-uuid",
    "share_id": "fcb71j5f2"  // This maps to our question IDs
  },
  "contact": {
    "contact_id": "contact-uuid",
    "answers": [
      {
        "media_url": "https://videoask.com/media/...",
        "media_type": "video",
        "transcript": "Optional transcript text",
        "duration": 45
      }
    ]
  }
}
```

## Backend Processing
The webhook endpoint (`/api/webhooks/videoask`) will:
1. Receive the VideoAsk response
2. Map the form share_id to the correct question block (b7 or b12)
3. Store the video URL in the database
4. Update the answer record with webhook metadata

## Monitoring & Debugging

### Check Webhook Status
```bash
# Test webhook endpoint health
curl https://ghac-survey-production.up.railway.app/api/webhooks/health
```

### View Webhook Logs
In Railway dashboard:
1. Go to your backend service
2. Click on "Logs" tab
3. Search for "VideoAsk webhook" to see incoming webhooks

### Test Webhook Manually
```bash
# Send a test webhook
curl -X POST https://ghac-survey-production.up.railway.app/api/webhooks/videoask/test \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "form_response",
    "form": {"share_id": "fcb71j5f2"},
    "contact": {
      "answers": [{
        "media_url": "https://test.com/video.mp4",
        "media_type": "video"
      }]
    }
  }'
```

## Troubleshooting

### Webhooks Not Being Received
1. Verify the webhook URL is exactly: `https://ghac-survey-production.up.railway.app/api/webhooks/videoask`
2. Check that Railway backend is running
3. Ensure VideoAsk webhook is enabled and saved
4. Check Railway logs for any error messages

### Video URLs Not Saving
1. Check that the form share_id matches (`fcb71j5f2` or `fdmk80eer`)
2. Verify database connection is working
3. Check Railway logs for database errors

### CORS Issues
VideoAsk webhooks are server-to-server, so CORS shouldn't be an issue. If you see CORS errors, they're likely from the frontend iframe, not the webhook.

## Security Considerations
1. The webhook endpoint is public but only processes VideoAsk-formatted data
2. Video URLs are stored but actual video files remain on VideoAsk servers
3. Consider adding webhook signature verification if VideoAsk supports it

## Next Steps
After configuring webhooks:
1. Submit a test video response for each question
2. Verify the video URL appears in the database
3. Check that the admin panel displays the video responses correctly
4. Test the full survey flow end-to-end

## Support
- VideoAsk Documentation: https://help.videoask.com/en/articles/5093864-webhooks
- Railway Logs: https://railway.app (your project dashboard)
- Backend webhook code: `/backend/src/routes/webhook.routes.ts`