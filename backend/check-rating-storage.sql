-- Check how semantic differential answers are stored
-- Look for answers where answer_text might contain JSON or structured data
SELECT 
  question_id,
  answer_text,
  answer_choice_ids,
  metadata,
  LENGTH(answer_text) as text_length
FROM answers
WHERE answer_text IS NOT NULL
  AND LENGTH(answer_text) > 50
ORDER BY answered_at DESC
LIMIT 10;

-- Check if ratings might be stored as JSON in answer_text
SELECT 
  question_id,
  answer_text,
  CASE 
    WHEN answer_text LIKE '{%' THEN 'JSON-like'
    WHEN answer_text LIKE '[%' THEN 'Array-like'
    ELSE 'Plain text'
  END as text_type
FROM answers
WHERE answer_text IS NOT NULL
  AND answer_text NOT IN ('Yes', 'No', 'acknowledged', 'watched', 'skipped', 'start', 'continue', 'more-info')
  AND answer_text NOT LIKE '%supporter%'
  AND answer_text NOT LIKE '%donor%'
ORDER BY answered_at DESC
LIMIT 20;