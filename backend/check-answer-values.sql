-- Check what's in the answer_value column for existing responses
SELECT 
  a.id,
  a.question_id,
  a.answer_text,
  a.answer_value,
  a.answer_value::text as answer_value_text
FROM answers a
WHERE a.answer_value IS NOT NULL
LIMIT 20;

-- Check a specific response to see all its answers
SELECT 
  a.question_id,
  a.answer_text,
  a.answer_value,
  CASE 
    WHEN a.answer_value IS NOT NULL THEN jsonb_typeof(a.answer_value)
    ELSE 'null'
  END as value_type
FROM answers a
WHERE a.response_id = (
  SELECT id FROM responses ORDER BY created_at DESC LIMIT 1
)
ORDER BY a.answered_at;