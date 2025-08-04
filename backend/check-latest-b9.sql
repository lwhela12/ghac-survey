-- Get the most recent b9 answer to see if the fix worked
SELECT 
  a.id,
  a.response_id,
  a.answer_text,
  a.answer_choice_ids,
  jsonb_pretty(a.metadata) as metadata,
  a.answered_at,
  NOW() - a.answered_at as time_ago
FROM answers a
WHERE a.metadata->>'blockId' = 'b9'
ORDER BY a.answered_at DESC
LIMIT 1;

-- Also check the response details to confirm it's recent
SELECT 
  r.id,
  r.respondent_name,
  r.started_at,
  r.completed_at,
  COUNT(a.id) as total_answers
FROM responses r
JOIN answers a ON r.id = a.response_id
WHERE r.id = (
  SELECT response_id 
  FROM answers 
  WHERE metadata->>'blockId' = 'b9' 
  ORDER BY answered_at DESC 
  LIMIT 1
)
GROUP BY r.id, r.respondent_name, r.started_at, r.completed_at;