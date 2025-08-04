-- Get the most recent b9 response to check the actual data
SELECT 
  a.id,
  a.response_id,
  a.question_id,
  a.answer_text,
  a.answer_choice_ids,
  a.video_url,
  jsonb_pretty(a.metadata) as metadata,
  a.answered_at
FROM answers a
WHERE a.metadata->>'blockId' = 'b9'
ORDER BY a.answered_at DESC
LIMIT 3;